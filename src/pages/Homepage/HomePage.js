import React, { useState } from 'react';
import './HomePage.css';
import LatestPollsChart from '../../components/LatestPollsChart/LatestPollsChart';
import ElectoralChat from '../../components/ElectoralChat/ElectoralChat';

const featuredStories = [
  {
    number: '01',
    category: 'Legislativas',
    title: 'Um país dividido entre estabilidade e mudança',
    description: 'As linhas de força que estão a reorganizar o espaço político português.',
    meta: 'Análise · 6 min',
  },
  {
    number: '02',
    category: 'Presidenciais',
    title: 'A corrida a Belém começa muito antes da campanha',
    description: 'Perfis, alianças e sinais que ajudam a interpretar o próximo ciclo eleitoral.',
    meta: 'Dossier · 8 min',
  },
  {
    number: '03',
    category: 'Poder local',
    title: 'As autarquias onde a disputa será decidida ao detalhe',
    description: 'Municípios-chave, tendências regionais e o peso dos candidatos independentes.',
    meta: 'Mapa político · 5 min',
  },
  {
    number: '04',
    category: 'Programas',
    title: 'O que os partidos propõem — sem ruído',
    description: 'Comparamos medidas, prioridades e diferenças nos programas eleitorais.',
    meta: 'Comparador · atualizado',
    id: 'programas',
  },
];

const quickReads = [
  {
    tag: 'Leitura rápida',
    title: 'PS termina a série histórica 1,6 pontos à frente da AD',
    body: 'A vantagem cabe dentro da margem habitual de erro e confirma um cenário competitivo.',
  },
  {
    tag: 'Tendência',
    title: 'IL regista o valor mais alto entre os partidos médios',
    body: 'A última observação coloca o partido nos 9,2%, acima da sua média recente.',
  },
  {
    tag: 'Metodologia',
    title: 'Uma sondagem é um retrato, não uma previsão',
    body: 'A série temporal dá contexto às oscilações e evita conclusões a partir de um único estudo.',
  },
];

const suggestedQuestions = [
  'Quais são as propostas para a habitação?',
  'Compara as medidas fiscais do PS e da AD.',
  'O que propõem os partidos para a saúde?',
];

const HomePage = () => {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async (event) => {
    event?.preventDefault();
    const trimmedQuery = query.trim();

    if (!trimmedQuery || loading) return;

    setLoading(true);
    setAnswer('');

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmedQuery }),
      });

      if (!response.ok) throw new Error(`Pedido recusado: ${response.status}`);

      const data = await response.json();
      setAnswer(data.answer || 'Não foi encontrada uma resposta para esta pergunta.');
    } catch (error) {
      console.error(error);
      setAnswer('Não foi possível contactar o assistente. Confirma se o serviço local está ativo e tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="home-page" id="inicio">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__story">
          <div className="eyebrow"><span /> Política em contexto</div>
          <h1 id="hero-title">A política não cabe num <em>soundbite.</em></h1>
          <p className="hero__lead">
            Dados rigorosos, leitura independente e ferramentas para perceber as escolhas que moldam Portugal.
          </p>
          <div className="hero__actions">
            <a href="#sondagens" className="button button--primary">Ver sondagens</a>
            <a href="#assistente" className="text-link">Analisar programas <span aria-hidden="true">→</span></a>
          </div>
          <div className="hero__byline">
            <span className="byline-mark">115</span>
            <span><strong>Redação 115 e meio</strong><br />Dados disponíveis até março de 2025</span>
          </div>
        </div>

        <aside className="political-radar" aria-label="Radar eleitoral">
          <div className="radar__header">
            <span>Radar eleitoral</span>
            <span className="live-dot">Série histórica</span>
          </div>
          <div className="radar__main">
            <span className="radar__label">Última observação</span>
            <strong>PS mantém vantagem curta</strong>
            <p>A distância para a AD é de apenas 1,6 pontos percentuais.</p>
          </div>
          <div className="radar__stats">
            <div><span>PS</span><strong>27,8%</strong><small>— 0,2</small></div>
            <div><span>AD</span><strong>26,2%</strong><small>↓ 5,9</small></div>
            <div><span>CH</span><strong>18,5%</strong><small>↑ 2,0</small></div>
          </div>
          <a href="#sondagens" className="radar__link">Abrir análise completa <span aria-hidden="true">↘</span></a>
        </aside>
      </section>

      <section className="stories-section" id="analises" aria-labelledby="stories-title">
        <div className="section-heading">
          <div>
            <span className="section-kicker">Em profundidade</span>
            <h2 id="stories-title">Dossiers em destaque</h2>
          </div>
          <p>Contexto para lá do ciclo rápido das notícias.</p>
        </div>

        <div className="stories-grid">
          {featuredStories.map((story) => (
            <article className="story-card" key={story.number} id={story.id}>
              <div className="story-card__top">
                <span className="story-card__number">{story.number}</span>
                <span className="story-card__category">{story.category}</span>
              </div>
              <h3>{story.title}</h3>
              <p>{story.description}</p>
              <div className="story-card__meta">
                <span>{story.meta}</span>
                <span aria-hidden="true">↗</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="polls-section" id="sondagens" aria-labelledby="polls-title">
        <div className="polls-section__intro">
          <span className="section-kicker section-kicker--light">Barómetro</span>
          <h2 id="polls-title">O voto, em movimento.</h2>
          <p>
            Comparamos várias observações ao longo do tempo. Passe sobre as linhas para consultar cada valor.
          </p>
          <div className="polls-summary">
            <div><strong>43</strong><span>observações</span></div>
            <div><strong>8</strong><span>forças políticas</span></div>
            <div><strong>14</strong><span>meses analisados</span></div>
          </div>
        </div>
        <LatestPollsChart />
      </section>

      <section className="briefing-section" aria-labelledby="briefing-title">
        <div className="section-heading section-heading--briefing">
          <div>
            <span className="section-kicker">O essencial dos dados</span>
            <h2 id="briefing-title">Três notas para ler o momento</h2>
          </div>
          <span className="issue-number">N.º 01</span>
        </div>
        <div className="briefing-grid">
          {quickReads.map((item, index) => (
            <article className="briefing-item" key={item.title}>
              <span className="briefing-item__index">0{index + 1}</span>
              <span className="briefing-item__tag">{item.tag}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <ElectoralChat />
      <section className="assistant-section" aria-labelledby="assistant-title" style={{ display: 'none' }}>
        <div className="assistant-copy">
          <span className="section-kicker section-kicker--light">Inteligência editorial</span>
          <h2 id="assistant-title">Pergunte aos programas, não aos slogans.</h2>
          <p>
            O assistente consulta os documentos eleitorais disponíveis e constrói uma resposta baseada apenas nessas fontes.
          </p>
          <div className="assistant-note">
            <span aria-hidden="true">i</span>
            <p>As respostas automáticas podem conter imprecisões. Confirme sempre a fonte original.</p>
          </div>
        </div>

        <div className="assistant-panel">
          <div className="assistant-panel__top">
            <span>Assistente 115</span>
            <span className="status"><i /> Ligação local</span>
          </div>
          <form onSubmit={handleAsk}>
            <label htmlFor="political-question">O que quer compreender?</label>
            <textarea
              id="political-question"
              placeholder="Escreva uma pergunta sobre os programas eleitorais…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              maxLength="500"
              rows="4"
            />
            <div className="assistant-panel__actions">
              <span>{query.length}/500</span>
              <button type="submit" disabled={loading || !query.trim()}>
                {loading ? 'A consultar…' : 'Perguntar'} <span aria-hidden="true">→</span>
              </button>
            </div>
          </form>

          <div className="suggested-questions" aria-label="Perguntas sugeridas">
            <span>Experimente:</span>
            {suggestedQuestions.map((question) => (
              <button key={question} type="button" onClick={() => setQuery(question)}>{question}</button>
            ))}
          </div>

          {answer && (
            <div className="rag-answer" role="status" aria-live="polite">
              <span className="rag-answer__label">Resposta fundamentada</span>
              <p>{answer}</p>
            </div>
          )}
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-footer__brand">115 <span>e meio</span></div>
        <p>Política portuguesa com dados, contexto e independência.</p>
        <div className="site-footer__links">
          <a href="#inicio">Início</a>
          <a href="#sondagens">Sondagens</a>
          <a href="#assistente">Assistente</a>
        </div>
      </footer>
    </main>
  );
};

export default HomePage;
