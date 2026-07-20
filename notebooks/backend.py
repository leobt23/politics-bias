"""API local para conversar com os programas eleitorais indexados.

Executar a partir de ``notebooks`` com ``uvicorn backend:app --reload``.
"""

from functools import lru_cache
import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.prompts import PromptTemplate
from langchain.retrievers import ContextualCompressionRetriever, EnsembleRetriever
from langchain.retrievers.document_compressors import EmbeddingsFilter
from langchain.schema import Document
from langchain_community.chat_models import ChatOllama
from langchain_community.embeddings import FastEmbedEmbeddings
from langchain_community.retrievers import BM25Retriever
from langchain_community.vectorstores import Chroma


BASE_DIR = Path(__file__).resolve().parent
DB_DIR = Path(os.getenv("RAG_DB_DIR", Path(__file__).resolve().parent / "sql_chroma_db"))
LLM_MODEL = os.getenv("RAG_LLM_MODEL", "qwen3:8b")
NOT_FOUND_MESSAGE = "Não encontrei essa informação nos programas eleitorais disponíveis."

RAG_SYSTEM_PROMPT = """
És o assistente eleitoral do 115 e meio. Responde em português europeu.

REGRAS OBRIGATÓRIAS:
1. Usa exclusivamente a informação presente no CONTEXTO. Não uses conhecimento externo,
   memória, inferências políticas ou factos não citados.
2. Se o contexto não responder claramente à pergunta, responde exatamente:
   "Não encontrei essa informação nos programas eleitorais disponíveis."
3. Não atribuas uma proposta a um partido sem uma fonte que o identifique.
4. Se a pergunta pedir uma comparação, separa os partidos e indica quando não existe
   informação para algum deles.
5. Responde de forma clara e curta. Depois de cada afirmação factual, inclui a referência
   no formato [Partido, p. X].
6. Nunca inventes partido, página, percentagem, citação ou proposta.

PERGUNTA:
{input}

CONTEXTO:
{context}

RESPOSTA:
"""

DOCUMENT_PROMPT = PromptTemplate.from_template(
    "[Partido: {party} | Ano: {year} | Página: {page_number} | Secção: {section}]\n{page_content}"
)


class ChatRequest(BaseModel):
    question: str = Field(min_length=3, max_length=2000)


class CompareRequest(BaseModel):
    tema: str = Field(min_length=2, max_length=300)
    partidos: list[str] = Field(min_length=2, max_length=8)


app = FastAPI(
    title="115 e meio · RAG eleitoral",
    version="1.0.0",
    description="Pesquisa fundamentada nos programas eleitorais portugueses indexados.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def _value(metadata: dict[str, Any], *keys: str, fallback: str = "—") -> Any:
    for key in keys:
        value = metadata.get(key)
        if value not in (None, ""):
            return value
    return fallback


def _normalise_document(text: str, metadata: dict[str, Any] | None) -> Document:
    metadata = metadata or {}
    filename = str(_value(metadata, "filename", "source", fallback="programa-eleitoral"))
    party = _value(metadata, "party", "partido", "political_party", fallback="")
    if not party:
        party = _party_from_filename(filename)
    page = _value(metadata, "page_number", "page", "pagina", fallback="—")
    section = _value(metadata, "section", "secção", "section_title", fallback="Não identificada")
    year = _value(metadata, "year", "ano", fallback="2025")
    return Document(
        page_content=text,
        metadata={
            **metadata,
            "filename": filename,
            "party": str(party),
            "page_number": str(page),
            "section": str(section),
            "year": str(year),
        },
    )


def _party_from_filename(filename: str) -> str:
    """Infer a readable party label when older chunks only contain filenames."""
    normalized = filename.lower().replace("-", "_").replace(" ", "_")
    aliases = (
        ("chega", "Chega"),
        ("iniciativa_liberal", "IL"),
        ("livre", "Livre"),
        ("bloco", "BE"),
        ("be_", "BE"),
        ("pan", "PAN"),
        ("pcp", "CDU"),
        ("cdu", "CDU"),
        ("ps_", "PS"),
        ("ps-", "PS"),
        ("ad_", "AD"),
        ("ad-", "AD"),
    )
    for alias, label in aliases:
        if alias in normalized:
            return label
    return Path(filename).stem or "Programa eleitoral"


@lru_cache(maxsize=1)
def vector_store() -> Chroma:
    if not DB_DIR.exists():
        raise RuntimeError(f"Base Chroma não encontrada em {DB_DIR}")
    embeddings = FastEmbedEmbeddings()
    return Chroma(persist_directory=str(DB_DIR), embedding_function=embeddings)


def indexed_documents() -> list[Document]:
    store = vector_store()
    data = store.get(include=["documents", "metadatas"])
    return [
        _normalise_document(text, metadata)
        for text, metadata in zip(data.get("documents", []), data.get("metadatas", []))
    ]


@lru_cache(maxsize=1)
def rag_chain():
    documents = indexed_documents()
    if not documents:
        raise RuntimeError("A coleção Chroma não contém documentos.")

    model = ChatOllama(
        model=LLM_MODEL,
        temperature=0.0,
        num_predict=1200,
    )
    embeddings = FastEmbedEmbeddings()
    store = vector_store()
    dense = store.as_retriever(search_type="mmr", search_kwargs={"k": 20, "fetch_k": 40})
    lexical = BM25Retriever.from_documents(documents)
    lexical.k = 20
    hybrid = EnsembleRetriever(retrievers=[dense, lexical], weights=[0.5, 0.5])
    compressor = EmbeddingsFilter(embeddings=embeddings, k=5)
    retriever = ContextualCompressionRetriever(base_compressor=compressor, base_retriever=hybrid)
    prompt = PromptTemplate.from_template(RAG_SYSTEM_PROMPT)
    document_chain = create_stuff_documents_chain(
        model,
        prompt,
        document_prompt=DOCUMENT_PROMPT,
    )
    return create_retrieval_chain(retriever, document_chain)


def references(documents: list[Document]) -> list[dict[str, str]]:
    result = []
    seen = set()
    for document in documents:
        metadata = document.metadata or {}
        key = (metadata.get("party"), metadata.get("page_number"), metadata.get("filename"))
        if key in seen:
            continue
        seen.add(key)
        result.append(
            {
                "party": str(metadata.get("party", "Programa eleitoral")),
                "page": str(metadata.get("page_number", "—")),
                "section": str(metadata.get("section", "Não identificada")),
                "filename": str(metadata.get("filename", "programa-eleitoral")),
                "excerpt": document.page_content[:480].strip(),
            }
        )
    return result


def answer_question(question: str) -> dict[str, Any]:
    chain = rag_chain()
    result = chain.invoke({"input": question})
    context = result.get("context", [])
    return {
        "answer": result.get("answer", NOT_FOUND_MESSAGE),
        "references": references(context),
        "chunks_used": len(context),
    }


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "rag-eleitoral", "index": "chroma" if DB_DIR.exists() else "missing"}


@app.get("/partidos")
async def parties() -> dict[str, list[str]]:
    try:
        names = sorted({reference["party"] for reference in references(indexed_documents())})
        return {"partidos": names}
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/chat")
async def chat(request: ChatRequest) -> dict[str, Any]:
    try:
        return answer_question(request.question)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.post("/ask")
async def ask(request: ChatRequest) -> dict[str, Any]:
    return await chat(request)


@app.post("/compare")
async def compare(request: CompareRequest) -> dict[str, Any]:
    rows = []
    for party in request.partidos:
        result = answer_question(
            f"Analisa exclusivamente o partido {party} sobre o tema {request.tema}. "
            "Se não houver informação específica, usa a mensagem de ausência prevista."
        )
        rows.append(
            {
                "partido": party,
                "resposta": result["answer"],
                "fontes": result["references"],
            }
        )
    return {"tema": request.tema, "partidos": request.partidos, "rows": rows}


@app.post("/index")
async def index() -> dict[str, str]:
    raise HTTPException(
        status_code=501,
        detail="A ingestão é executada pelo notebook rag_electoral_programs antes de iniciar a API.",
    )
