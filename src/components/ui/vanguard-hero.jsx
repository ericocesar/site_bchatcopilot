import "./hero.css";

const CAPSULES = [
  {
    icon: "✦",
    iconClass: "vanguard-capsule__icon--lime",
    title: "Sugestão contextual",
    desc: "Resposta sugerida com fonte citada em cada parágrafo.",
    metric: "92% confiança",
  },
  {
    icon: "↻",
    iconClass: "vanguard-capsule__icon--cyan",
    title: "Resumo da conversa",
    desc: "Histórico, sentimento e próximos passos em uma linha do tempo.",
    metric: "Atualiza em tempo real",
  },
  {
    icon: "✱",
    iconClass: "vanguard-capsule__icon--blue",
    title: "Ações no fluxo",
    desc: "Aciona automações sem trocar de aba, com auditoria visível.",
    metric: "Humano no controle",
  },
];

function Capsule({ icon, iconClass, title, desc, metric }) {
  return (
    <article className="vanguard-capsule">
      <div className="vanguard-capsule__core">
        <span className={`vanguard-capsule__icon ${iconClass}`} aria-hidden="true">
          {icon}
        </span>
        <div className="vanguard-capsule__body">
          <strong className="vanguard-capsule__title">{title}</strong>
          <span className="vanguard-capsule__desc">{desc}</span>
        </div>
        <span className="vanguard-capsule__metric">
          <span className="vanguard-capsule__metric-dot" aria-hidden="true" />
          {metric}
        </span>
      </div>
    </article>
  );
}

export default function VanguardHero() {
  return (
    <section className="vanguard-hero" id="topo" aria-labelledby="vanguard-hero-title">
      <div className="vanguard-hero__mesh" aria-hidden="true">
        <span />
      </div>
      <div className="vanguard-hero__grain" aria-hidden="true" />

      <div className="vanguard-hero__split">
        <div className="vanguard-hero__copy">
          <span className="vanguard-hero__eyebrow">
            <span className="vanguard-hero__eyebrow-dot" aria-hidden="true">✦</span>
            Copiloto de IA · BChat
          </span>

          <h1 id="vanguard-hero-title" className="vanguard-hero__title">
            Sua equipe conversa.<br />
            <em>Seus agentes de IA fazem acontecer.</em>
          </h1>

          <p className="vanguard-hero__sub">
            O BChat Copilot entende o contexto, consulta conhecimento, sugere respostas e
            aciona automações para conduzir as próximas etapas de cada conversa.
          </p>

          <div className="vanguard-hero__cta-row">
            <a
              className="vanguard-cta"
              href="#contato"
              data-analytics="landing_primary_cta_click"
              data-placement="hero"
            >
              <span className="vanguard-cta__inner">
                Solicitar demonstração
                <span className="vanguard-cta__icon" aria-hidden="true">↗</span>
              </span>
            </a>
            <a
              className="vanguard-cta--ghost"
              href="#processo"
              data-analytics="landing_secondary_cta_click"
              data-placement="hero"
            >
              Ver como funciona <span aria-hidden="true">↓</span>
            </a>
          </div>

          <p className="vanguard-hero__status">
            <span className="vanguard-hero__status-dot" aria-hidden="true" />
            Humano no controle · fontes visíveis em cada sugestão
          </p>
        </div>

        <div className="vanguard-hero__stage" aria-label="Capacidades do BChat Copilot">
          {CAPSULES.map((capsule) => (
            <Capsule key={capsule.title} {...capsule} />
          ))}
        </div>
      </div>

      <div className="vanguard-hero__cue" aria-hidden="true">
        Role para descobrir
        <span className="vanguard-hero__cue-line" />
      </div>
    </section>
  );
}
