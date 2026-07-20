from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from sentence_transformers import CrossEncoder
from langchain.retrievers.document_compressors import EmbeddingsFilter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import FastEmbedEmbeddings
from langchain_community.chat_models import ChatOllama
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import ContextualCompressionRetriever, EnsembleRetriever
from langchain.prompts import PromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain.schema import Document

# ============================
# FastAPI setup
# ============================

app = FastAPI()

# Permitir pedidos vindos do React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Se quiseres, restringe para ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    question: str


# ============================
# RAG Chain
# ============================

def rag_chain():
    model = ChatOllama(
        model="llama3",
        temperature=0.0,
        max_tokens=6000,
        top_p=0.95,
    )

    prompt = PromptTemplate.from_template(
        """
        És um assistente útil. Escreve em tópicos e só ao que é pedido em texto. Usa apenas as informações no contexto abaixo para responder à pergunta.

        Se o contexto não tiver informação suficiente, diz:
        "Não existe contexto relevante para responder a esta pergunta."

        Pergunta: {input}

        Contexto:
        {context}

        Resposta:
        """
    )

    # Carregar ChromaDB
    embedding = FastEmbedEmbeddings()
    vector_store = Chroma(persist_directory="./sql_chroma_db", embedding_function=embedding)

    # Dense retriever
    dense_retriever = vector_store.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 20, "fetch_k": 40},
    )

    # Obter documentos do Chroma
    all_docs_data = vector_store.get(include=["documents", "metadatas"])
    documents = [
        Document(page_content=txt, metadata=meta)
        for txt, meta in zip(all_docs_data["documents"], all_docs_data["metadatas"])
    ]

    # BM25 retriever
    bm25_retriever = BM25Retriever.from_documents(documents)
    bm25_retriever.k = 20

    # Ensemble (BM25 + Dense)
    hybrid_retriever = EnsembleRetriever(
        retrievers=[dense_retriever, bm25_retriever],
        weights=[0.5, 0.5]
    )

    # Compressor (CPU-friendly)
    reranker = EmbeddingsFilter(
        embeddings=FastEmbedEmbeddings(),
        top_n=10
    )

    final_retriever = ContextualCompressionRetriever(
        base_compressor=reranker,
        base_retriever=hybrid_retriever
    )

    document_chain = create_stuff_documents_chain(model, prompt)
    chain = create_retrieval_chain(final_retriever, document_chain)

    return chain


# ============================
# API Endpoints
# ============================

@app.post("/ask")
async def ask(query: Query):
    chain = rag_chain()
    result = chain.invoke({"input": query.question})

    return {
        "answer": result["answer"],
        "chunks_used": len(result["context"])
    }
