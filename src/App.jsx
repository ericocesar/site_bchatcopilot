import { useEffect } from "react";

import "./react-shell.css";

function BlogPlaceholder() {
  return (
    <main className="blog-placeholder" aria-labelledby="blog-title">
      <div className="blog-placeholder-orbit" aria-hidden="true" />
      <p className="blog-kicker">BCHAT JOURNAL</p>
      <h1 id="blog-title">Conteúdo para conversas que importam.</h1>
      <p>
        O blog do BChat está sendo preparado. Em breve, você encontrará ideias,
        guias e novidades sobre atendimento, conhecimento e inteligência aplicada.
      </p>
      <a href="/" className="blog-back-link">Voltar para o BChat Copilot <span aria-hidden="true">↗</span></a>
    </main>
  );
}

export default function App() {
  const isBlogRoute = window.location.pathname.replace(/\/$/, "") === "/blog";

  useEffect(() => {
    document.body.classList.toggle("is-blog-route", isBlogRoute);

    if (isBlogRoute) return undefined;

    // The current landing is intentionally kept as a stable HTML composition;
    // React owns the application shell while the blog is introduced incrementally.
    return undefined;
  }, [isBlogRoute]);

  return isBlogRoute ? <BlogPlaceholder /> : null;
}
