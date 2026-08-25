import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import VanguardHero from "./components/ui/vanguard-hero.jsx";
import "../tokens.css";
import "./landing.css";
import "./landing.js";

const heroEl = document.getElementById("hero-root");
if (heroEl) {
  createRoot(heroEl).render(
    <StrictMode>
      <VanguardHero />
    </StrictMode>,
  );
}

createRoot(document.getElementById("react-root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
