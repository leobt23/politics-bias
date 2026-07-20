import React, { useState } from 'react';
import './ElectoralChat.css';

const PARTY_OPTIONS = ['PS', 'AD', 'Chega', 'IL', 'Livre', 'BE', 'CDU', 'PAN'];

const SUGGESTIONS = [
  'O que propõe o PSD sobre habitação?',
  'Compara PS, IL e Livre sobre impostos.',
  'Que partidos defendem energia nuclear?',
];

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const readSources = (payload) => payload?.references || payload?.citations || payload?.sources || [];

const sourceName = (source) => source.party || source.partido || source.filename || source.file || 'Programa eleitoral';

const sourcePage = (source) => source.page || source.page_number || source.pagina || source.pageNumber || '—';

const ElectoralChat = () => {
  const [mode, setMode] = useState('chat');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Olá. Sou o teu assistente para programas eleitorais. Pergunta, compara propostas e recebe respostas fundamentadas nas fontes disponíveis.',
      sources: [],
    },
  ]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('');
  const [selectedParties, setSelectedParties] = useState(['PS', 'AD', 'IL', 'Livre']);
  const [comparison, setComparison] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const ask = async (question) => {
    const response = await fetch(`${apiUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });

    if (response.status === 404) {
      return fetch(`${apiUrl}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
    }

    return response;
  };

  const handleSend = async (event) => {
    event?.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery || loading) return;

    const userMessage = { id: createId(), role: 'user', content: trimmedQuery };
    const pendingId = createId();
    setMessages((current) => [
      ...current,
      userMessage,
      { id: pendingId, role: 'assistant', content: '', loading: true, sources: [] },
    ]);
    setQuery('');
    setLoading(true);

    try {
      const response = await ask(trimmedQuery);
      if (!response.ok) throw new Error(`Pedido recusado: ${response.status}`);
      const data = await response.json();
      setMessages((current) => current.map((message) => (
        message.id === pendingId
          ? {
            ...message,
            loading: false,
            content: data.answer || 'Não encontrei essa informação nos programas eleitorais disponíveis.',
            sources: readSources(data),
          }
          : message
      )));
    } catch (error) {
      console.error(error);
      setMessages((current) => current.map((message) => (
        message.id === pendingId
          ? {
            ...message,
            loading: false,
            error: true,
            content: 'Não consegui ligar ao assistente. Confirma se o backend RAG está ativo e tenta novamente.',
            sources: [],
          }
          : message
      )));
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async (event) => {
    event.preventDefault();
    if (!theme.trim() || selectedParties.length < 2 || loading) return;

    setLoading(true);
    setComparison({ loading: true });
    try {
      const response = await fetch(`${apiUrl}/compare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema: theme.trim(), partidos: selectedParties }),
      });
      if (!response.ok) throw new Error(`Pedido recusado: ${response.status}`);
      setComparison(await response.json());
    } catch (error) {
      console.error(error);
      setComparison({ error: 'A comparação precisa do endpoint /compare no backend RAG.' });
    } finally {
      setLoading(false);
    }
  };

  const toggleParty = (party) => {
    setSelectedParties((current) => current.includes(party)
      ? current.filter((item) => item !== party)
      : [...current, party]);
  };

  const resetChat = () => {
    setMode('chat');
    setComparison(null);
    setQuery('');
    setMessages([{ id: createId(), role: 'assistant', content: 'Conversa reiniciada. O que queres investigar nos programas eleitorais?', sources: [] }]);
  };

  const comparisonRows = comparison?.rows || comparison?.comparison || comparison?.results || [];

  return (
    <section className="electoral-chat" id="assistente" aria-labelledby="electoral-chat-title">
      <aside className="electoral-chat__sidebar">
        <div className="chat-sidebar__label">Arquivo eleitoral</div>
        <h2 id="electoral-chat-title">Programas<br /><em>em conversa.</em></h2>
        <p className="chat-sidebar__intro">Pesquisa os documentos, pede contexto e compara posições políticas.</p>
        <button type="button" className="chat-new" onClick={resetChat}><span>+</span> Nova conversa</button>

        <div className="chat-sidebar__group">
          <span className="chat-sidebar__heading">Coleção ativa</span>
          <div className="chat-collection"><span className="chat-collection__icon">PDF</span><span><strong>Programas 2025</strong><small>8 documentos indexados</small></span><i /></div>
        </div>

        <div className="chat-sidebar__group">
          <span className="chat-sidebar__heading">Partidos disponíveis</span>
          <div className="chat-party-list">
            {PARTY_OPTIONS.slice(0, 6).map((party) => <span key={party}><i className={`party-dot party-dot--${party.toLowerCase()}`} />{party}</span>)}
          </div>
        </div>

        <div className="chat-sidebar__trust"><span>i</span><p>Respostas baseadas apenas nos documentos indexados. Sem informação, sem invenção.</p></div>
      </aside>

      <div className="electoral-chat__main">
        <div className="chat-toolbar">
          <div className="chat-tabs" role="tablist" aria-label="Ferramentas eleitorais">
            <button type="button" className={mode === 'chat' ? 'is-active' : ''} onClick={() => setMode('chat')} role="tab" aria-selected={mode === 'chat'}>Conversa</button>
            <button type="button" className={mode === 'compare' ? 'is-active' : ''} onClick={() => setMode('compare')} role="tab" aria-selected={mode === 'compare'}>Comparar partidos</button>
          </div>
          <span className="chat-status"><i /> RAG local · fontes ativas</span>
        </div>

        {mode === 'chat' ? (
          <>
            <div className="chat-messages" aria-live="polite">
              {messages.map((message) => (
                <article key={message.id} className={`chat-message chat-message--${message.role}`}>
                  <div className="chat-message__avatar" aria-hidden="true">{message.role === 'assistant' ? '115' : 'TU'}</div>
                  <div className="chat-message__body">
                    <div className="chat-message__meta"><strong>{message.role === 'assistant' ? 'Assistente eleitoral' : 'A tua pergunta'}</strong>{message.loading && <span>A pesquisar fontes…</span>}</div>
                    {message.loading ? <div className="typing-indicator"><i /><i /><i /></div> : <p>{message.content}</p>}
                    {message.sources?.length > 0 && (
                      <div className="chat-sources">
                        <span className="chat-sources__title">Fontes consultadas · {message.sources.length}</span>
                        {message.sources.map((source, index) => (
                          <details className="chat-source" key={`${sourceName(source)}-${index}`}>
                            <summary><span className="chat-source__number">{index + 1}</span><span><strong>{sourceName(source)}</strong><small>Página {sourcePage(source)}{source.section || source.seccao ? ` · ${source.section || source.seccao}` : ''}</small></span><b>⌄</b></summary>
                            {(source.excerpt || source.quote || source.text || source.page_content) && <blockquote>“{source.excerpt || source.quote || source.text || source.page_content}”</blockquote>}
                          </details>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
            <div className="chat-suggestions">
              <span>Começa por perguntar</span>
              {SUGGESTIONS.map((suggestion) => <button key={suggestion} type="button" onClick={() => setQuery(suggestion)}>{suggestion} <span>↗</span></button>)}
            </div>
            <form className="chat-composer" onSubmit={handleSend}>
              <textarea value={query} maxLength="600" rows="2" onChange={(event) => setQuery(event.target.value)} placeholder="Pergunta sobre um partido, tema ou proposta…" aria-label="Pergunta ao assistente eleitoral" />
              <div className="chat-composer__bottom"><span>{query.length}/600 · Enter para enviar</span><button type="submit" disabled={!query.trim() || loading} aria-label="Enviar pergunta">{loading ? '…' : 'Enviar'} <b>↗</b></button></div>
            </form>
          </>
        ) : (
          <div className="compare-view">
            <div className="compare-view__intro"><span className="chat-sidebar__label">Leitura lado a lado</span><h3>Compara posições, não slogans.</h3><p>Escolhe um tema e pelo menos dois partidos. A tabela será construída a partir dos excertos encontrados nos programas.</p></div>
            <form className="compare-form" onSubmit={handleCompare}>
              <label htmlFor="compare-theme">Tema a comparar</label>
              <input id="compare-theme" value={theme} onChange={(event) => setTheme(event.target.value)} placeholder="Ex.: habitação, impostos, energia…" />
              <span className="compare-form__label">Partidos selecionados</span>
              <div className="compare-parties">{PARTY_OPTIONS.map((party) => <button type="button" key={party} className={selectedParties.includes(party) ? 'is-selected' : ''} onClick={() => toggleParty(party)}><i className={`party-dot party-dot--${party.toLowerCase()}`} />{party}<span>{selectedParties.includes(party) ? '✓' : '+'}</span></button>)}</div>
              <button className="compare-submit" type="submit" disabled={!theme.trim() || selectedParties.length < 2 || loading}>{loading ? 'A comparar documentos…' : 'Gerar comparação'} <span>↗</span></button>
            </form>
            {comparison?.error && <p className="compare-error">{comparison.error}</p>}
            {Array.isArray(comparisonRows) && comparisonRows.length > 0 && <div className="comparison-table-wrap"><table className="comparison-table"><thead><tr>{Object.keys(comparisonRows[0]).map((key) => <th key={key}>{key}</th>)}</tr></thead><tbody>{comparisonRows.map((row, index) => <tr key={index}>{Object.keys(comparisonRows[0]).map((key) => <td key={key}>{String(row[key] || '—')}</td>)}</tr>)}</tbody></table></div>}
          </div>
        )}
      </div>
    </section>
  );
};

export default ElectoralChat;
