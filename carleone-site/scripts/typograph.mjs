// Русская типографика при сборке: неразрывные пробелы после коротких слов (предлоги, союзы,
// частицы) и перед длинным тире, чтобы «в», «на», «и» не висели в конце строки,
// а тире не начинало строку. Используется плагином в vite.config.ts для src/content/*.ts.
const NBSP = " ";
const SHORT =
  "в|во|и|с|со|к|ко|о|об|обо|у|а|но|на|не|ни|по|за|до|от|из|для|без|при|про|под|над|что|как|же|ли|бы|я|мы|вы|он|её|их|наш|ваш|это|все|всё|вас|нам|вам";
const SHORT_RE = new RegExp(`(^|[\\s(«„"—])(${SHORT})\\s+(?=\\S)`, "giu");
const EN_SHORT_RE =
  /(^|[\s("“])(a|an|the|of|to|in|on|at|by|for|and|or|we|you|our|your|is|are|with|from|no|so)\s+(?=\S)/gu;

/** Типографирует строку: дважды, чтобы «и в» тоже склеились. */
export function typograph(text, lang = "ru") {
  let s = text;
  const re = lang === "en" ? EN_SHORT_RE : SHORT_RE;
  s = s.replace(re, `$1$2${NBSP}`).replace(re, `$1$2${NBSP}`);
  // тире не начинает строку
  s = s.replace(/ +—/g, `${NBSP}—`);
  // короткие части через дефис («из-за», «по-моему») не разрываются: неразрывный дефис
  if (lang !== "en") {
    s = s.replace(/(^|[^\p{L}])(\p{L}{1,3})-(?=\p{L})/gu, "$1$2\u2011");
    s = s.replace(/(\p{L})-(\p{L}{1,3})(?=$|[^\p{L}])/gu, "$1\u2011$2");
  }
  // число + единица / «№ 1»
  s = s.replace(/(\d) (?=[a-zа-яё%])/giu, `$1${NBSP}`);
  return s;
}

/**
 * Типографирует все строковые литералы в исходнике модуля с текстами.
 * Ключи объекта (без пробелов) не меняются: в них нечего заменять.
 * Для блока en (const en = … или en: { … }) и для пар { ru: "…", en: "…" } — английские правила.
 */
export function typographSource(code) {
  const enStart = code.search(/\n(?:const|let|var)\s+en\b|\n\s*en:\s*{/);
  return code.replace(/"((?:[^"\\\n]|\\.)*)"/g, (m, body, offset) => {
    if (!/\s/.test(body)) return m;
    const before = code.slice(Math.max(0, offset - 12), offset);
    const inline = /\ben:\s*$/.test(before) ? "en" : /\bru:\s*$/.test(before) ? "ru" : null;
    const lang = inline ?? (enStart !== -1 && offset > enStart ? "en" : "ru");
    return `"${typograph(body, lang)}"`;
  });
}
