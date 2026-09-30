import { renderToString } from "react-dom/server";
import App from "./App";

/** Пререндер: готовая HTML-разметка страницы, чтобы сайт был виден даже без JavaScript. */
export function render() {
  return renderToString(<App />);
}
