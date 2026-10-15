import { ArrowUp } from "lucide-react";

import "./motion-footer.css";

export function SiteFooter() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="site-footer" aria-label="Rodapé do BChat Copilot">
      <div className="site-footer__inner">
        <div className="site-footer__grid">
          <section className="site-footer__brand" aria-label="Sobre o BChat Copilot">
            <a className="site-footer__logo" href="/" aria-label="BChat Copilot, página inicial">
              <img src="/docs/logobchat.png" alt="BChat Copilot" width="76" height="76" loading="lazy" decoding="async" />
            </a>
            <p className="site-footer__subtitle">O BChat Copilot é um produto da Bolt 360 Assessoria e Consultoria.</p>
            <nav className="site-footer__social" aria-label="Redes sociais">
              <a href="https://www.instagram.com/bchat.ia/" target="_blank" rel="noreferrer" aria-label="Instagram do BChat">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a href="https://www.linkedin.com/company/bolt-360/" target="_blank" rel="noreferrer" aria-label="LinkedIn da Bolt 360">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M7 9v10M7 5.5v.01M11 19v-6a4 4 0 0 1 8 0v6M11 9v10" />
                </svg>
              </a>
            </nav>
          </section>

          <nav className="site-footer__explore" aria-label="Explore os serviços da Bolt 360">
            <p className="site-footer__label">Explore</p>
            <a href="https://bolt360.com.br/assessoria">Assessoria empresarial</a>
            <a href="https://bolt360.com.br/automacao">Automação e IA</a>
            <a href="https://bolt360.com.br/resultados">Resultados e dados</a>
          </nav>

          <section className="site-footer__contact" aria-labelledby="site-footer-contact-title">
            <p className="site-footer__label" id="site-footer-contact-title">Vamos conversar</p>
            <a href="mailto:contato@bchat.com.br">contato@bchat.com.br <span aria-hidden="true">↗</span></a>
            <a href="tel:+558431901700">+55 (84) 3190-1700</a>
            <address>Rua Tereza Bezerra Salustiano, 1902<br />Lagoa Nova, Natal — RN · 59075-225</address>
          </section>
        </div>

        <div className="site-footer__bottom">
          <p>Bolt 360 Assessoria · CNPJ 21.453.885/0001-54</p>
          <nav aria-label="Links legais e navegação">
            <a href="/privacidade">Privacidade</a>
            <a href="/termos">Termos de uso</a>
            <button type="button" onClick={scrollToTop}>Voltar ao topo <ArrowUp aria-hidden="true" /></button>
          </nav>
        </div>
      </div>
    </footer>
  );
}
