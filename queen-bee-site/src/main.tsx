import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

const root = document.getElementById("root")!;
const capture = import.meta.env.DEV && /[?&]capture=/.test(location.search);

if (capture) {
  // Служебный режим для рендеров спирали (npm run renders) — только на dev-сервере
  void import("./Capture").then(({ mountCapture }) => mountCapture(root));
} else {
  const app = (
    <StrictMode>
      <App />
    </StrictMode>
  );
  if (root.hasChildNodes()) hydrateRoot(root, app);
  else createRoot(root).render(app);
}

(window as unknown as { __qbReady?: boolean }).__qbReady = true;
