import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

const root = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// Если разметка уже отрисована заранее (пререндер) — «оживляем» её, иначе рендерим с нуля.
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);

(window as unknown as { __slReady?: boolean }).__slReady = true;
