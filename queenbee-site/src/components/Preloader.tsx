/**
 * Прелоадер ≤1,2 с: шестиугольник рисуется золотой линией, внутри по кругу зажигается кольцо света,
 * затем шторка. Целиком на CSS — не ждёт скриптов. Показывается только при первом заходе
 * (класс .pl ставит скрипт в <head>) и не показывается при reduced motion и без JS.
 */
const DOTS = Array.from({ length: 32 }, (_, i) => {
  const a = -Math.PI / 2 + (i / 32) * Math.PI * 2;
  return [50 + Math.cos(a) * 21, 50 + Math.sin(a) * 21];
});

export function Preloader() {
  return (
    <div className="pre" aria-hidden="true">
      <svg viewBox="0 0 100 100" className="pre__svg">
        <path className="pre__hex" d="M50 10 84.6 30v40L50 90 15.4 70V30Z" pathLength={1} />
        {DOTS.map(([x, y], i) => (
          <circle key={i} cx={x.toFixed(2)} cy={y.toFixed(2)} r="1.25" className="pre__dot" style={{ animationDelay: `${0.38 + i * 0.012}s` }} />
        ))}
      </svg>
      <p className="pre__word">
        Queen <em>Bee</em>
      </p>
    </div>
  );
}
