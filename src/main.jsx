import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./landing.css";
import "./landing.js";

createRoot(document.getElementById("react-root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
