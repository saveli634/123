/**
 * Режим «слабое устройство»: если кадры медленные (меньше ~45 fps две секунды подряд),
 * сцена «Подъём» рисует 24 ресницы вместо 40, а свечение за курсором отключается.
 */
type Listener = () => void;
let low = false;
const listeners = new Set<Listener>();
let acc = 0;
let frames = 0;
let slow = 0;

export const isLowPower = () => low;

export function onLowPower(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setLowPower() {
  if (low) return;
  low = true;
  document.documentElement.classList.add("low-power");
  listeners.forEach((f) => f());
}

/** Вызывать из rAF-цикла, пока идёт анимация: dt — время кадра, мс. */
export function reportFrame(dt: number) {
  if (low || dt <= 0 || dt > 250) return; // вкладка была скрыта — не считаем
  acc += dt;
  frames++;
  if (acc < 1000) return;
  const fps = (frames * 1000) / acc;
  slow = fps < 45 ? slow + 1 : 0;
  acc = 0;
  frames = 0;
  if (slow >= 2) setLowPower();
}
