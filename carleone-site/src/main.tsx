import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./index.css";
import "./generated/renders.css";
import App from "./App";
import type { Lang } from "./content/i18n";

const root = document.getElementById("root")!;
const lang: Lang = document.documentElement.lang === "en" ? "en" : "ru";
const app = (
  <StrictMode>
    <App lang={lang} />
  </StrictMode>
);
// Разметка уже есть (пререндер) — «оживляем» её; в режиме разработки рисуем с нуля
if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);
