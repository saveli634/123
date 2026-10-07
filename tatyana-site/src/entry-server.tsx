import { renderToString } from "react-dom/server";
import App from "./App";
import type { PageId } from "./data/pages";

export function render(page: PageId | "spa") {
  return renderToString(<App page={page} />);
}
