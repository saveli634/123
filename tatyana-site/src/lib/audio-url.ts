const cache = new Map<string, string>();

export const isInline = (url: string) => url.startsWith("inline:");

/**
 * Адрес для <audio>. В sait.html песни встроены в конец файла текстом base64: при первом
 * нажатии он превращается в Blob (дальше берётся из памяти), а сам текст убирается со страницы.
 */
export function audioUrl(url: string): string {
  if (!isInline(url)) return url;
  const ready = cache.get(url);
  if (ready) return ready;
  const el = document.getElementById(`a-${url.slice(7)}`);
  if (!el) return "";
  const bin = atob((el.textContent || "").trim());
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const blob = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
  cache.set(url, blob);
  el.remove();
  return blob;
}
