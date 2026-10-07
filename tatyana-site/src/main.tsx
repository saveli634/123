import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { SPA, isPage } from "./data/pages";

const root = document.getElementById("root")!;
const p = root.dataset.page || "home";
const app = (
  <StrictMode>
    <App page={SPA ? "spa" : isPage(p) ? p : "home"} />
  </StrictMode>
);
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);

(window as unknown as { __tvReady?: boolean }).__tvReady = true;
