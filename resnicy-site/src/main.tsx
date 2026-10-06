import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { startMotion } from "./lib/motion";

// До гидрации: компоненты в своих эффектах уже видят, включено ли движение
startMotion();

const root = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);

// Скрипты запустились: запасной таймер в index.html больше не снимет класс .js
(window as unknown as { __ready?: boolean }).__ready = true;
