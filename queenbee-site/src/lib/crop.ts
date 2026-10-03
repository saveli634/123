/**
 * Кадрирование фото в круглое стекло по точке лица (focusX/focusY из manifest.csv).
 * Одна и та же математика у CSS-зеркала (первый экран без WebGL) и у шейдера стекла,
 * поэтому подмена CSS-зеркала на 3D проходит без скачка.
 */
export interface Crop {
  /** центр кадра в долях ширины/высоты фото (y — сверху вниз) */
  cx: number;
  cy: number;
  /** половина стороны квадратного кадра в долях ширины / высоты фото */
  hx: number;
  hy: number;
}

export function mirrorCrop(w: number, h: number, fx: number, fy: number, zoom = 0.84): Crop {
  const aspect = w / h;
  let hx = zoom / 2;
  let hy = (zoom / 2) * aspect;
  if (aspect > 1) {
    hy = zoom / 2;
    hx = zoom / 2 / aspect;
  }
  const clamp = (v: number, a: number) => Math.min(1 - a, Math.max(a, v));
  // лицо — чуть выше центра круга, чтобы в кадр попадали причёска и плечи
  return { cx: clamp(fx, hx), cy: clamp(fy + hy * 0.3, hy), hx, hy };
}

/** Стили для <img>/<span> внутри квадратного круглого окна. */
export function cropStyle(c: Crop) {
  return {
    width: `${100 / (2 * c.hx)}%`,
    height: `${100 / (2 * c.hy)}%`,
    left: `${(-(c.cx - c.hx) / (2 * c.hx)) * 100}%`,
    top: `${(-(c.cy - c.hy) / (2 * c.hy)) * 100}%`,
  };
}
