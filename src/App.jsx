import { lazy, Suspense, useEffect } from "react";

import "./react-shell.css";

const CinematicFooter = lazy(() => import("./components/ui/motion-footer.jsx").then((module) => ({ default: module.CinematicFooter })));

const KNOWN_ROUTES = new Set(["/", "/blog", "/hero1", "/hero1/", "/hero2", "/hero2/", "/hero3", "/hero3/"]);

function normalize(path) {
  return path.replace(/\/$/, "") || "/";
}

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

function NotFound() {
  // Use the path that was actually requested (Vite SPA fallback keeps the
  // original URL in window.location, so this reads the bad path back to the
  // user).
  const requested = typeof window !== "undefined" ? window.location.pathname : "/";

  return (
    <main className="blog-placeholder not-found" aria-labelledby="not-found-title">
      <div className="blog-placeholder-orbit" aria-hidden="true" />
      <p className="blog-kicker">404 · ROTA NÃO ENCONTRADA</p>
      <h1 id="not-found-title">Esta página não existe.</h1>
      <p>
        O caminho <code>{requested}</code> não corresponde a nenhuma rota do
        BChat Copilot. Você pode voltar para a home ou explorar uma das
        variações da hero.
      </p>
      <nav className="not-found__nav" aria-label="Atalhos">
        <a href="/" className="blog-back-link">Página inicial <span aria-hidden="true">↗</span></a>
        <a href="/hero1/">Hero 1 · Robô + Kanban</a>
        <a href="/hero2/">Hero 2 · Conversa → IA</a>
        <a href="/hero3/">Hero 3 · Command Center</a>
      </nav>
    </main>
  );
}

export default function App() {
  const path = normalize(window.location.pathname);
  const isBlogRoute = path === "/blog";
  const isUnknownRoute = !KNOWN_ROUTES.has(path) && !KNOWN_ROUTES.has(window.location.pathname);

  useEffect(() => {
    document.body.classList.toggle("is-blog-route", isBlogRoute);
    document.body.classList.toggle("is-not-found", isUnknownRoute);
    return undefined;
  }, [isBlogRoute, isUnknownRoute]);

  if (isBlogRoute) return <BlogPlaceholder />;
  if (isUnknownRoute) return <NotFound />;

  return (
    <Suspense fallback={<div className="cinematic-footer-skeleton" aria-hidden="true" />}>
      <CinematicFooter />
    </Suspense>
  );
}
