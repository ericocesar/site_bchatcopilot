import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "../tokens.css";
import "./landing.css";
import "./landing.js";
import { initSeamFlow } from "./seam-flow.js";
import { initSeamHero } from "./seam-hero.js";
import { initSeamDemo } from "./seam-demo.js";
import { initVideoDialog } from "./video-dialog.js";
import "./seam-hero.css";

// The flow layer listens for "seam:ready", so it must be set up before the hero starts.
const disposeSeamFlow = initSeamFlow();
const disposeSeamHero = initSeamHero();
const disposeSeamDemo = initSeamDemo();
const disposeVideoDialog = initVideoDialog();
if (import.meta.hot) import.meta.hot.dispose(() => {
  disposeVideoDialog();
  disposeSeamDemo();
  disposeSeamHero();
  disposeSeamFlow();
});

createRoot(document.getElementById("react-root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
