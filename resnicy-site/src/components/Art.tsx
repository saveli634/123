import type { CSSProperties, ReactNode } from "react";

/**
 * Линейные иллюстрации (рисуются штрихом при появлении):
 * StepArt — шаги ламинирования: ресницы на валике → составы → окрашивание → ботокс;
 * ReasonArt — значки к причинам «Почему ко мне».
 */

type P = [number, number];
const q = (a: P, c: P, b: P, t: number): P => [
  (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
  (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
];
const f = (n: number) => n.toFixed(1);

// линия века (закрытый глаз) и валик над ней
const LID: [P, P, P] = [[26, 84], [110, 112], [194, 84]];
const ROLLER: [P, P, P] = [[20, 82], [110, -16], [200, 82]];
const ROLLER_IN: [P, P, P] = [[30, 80], [110, -2], [190, 80]];
const N = 13;
const TS = Array.from({ length: N }, (_, i) => 0.07 + (i / (N - 1)) * 0.86);

const lid = `M${LID[0].join(" ")} Q${LID[1].join(" ")} ${LID[2].join(" ")}`;
const roller = `M${ROLLER[0].join(" ")} Q${ROLLER[1].join(" ")} ${ROLLER[2].join(" ")} Q${LID[1].join(" ")} ${ROLLER[0].join(" ")}Z`;
// ресницы, выложенные на валик
const laid = TS.map((t) => {
  const a = q(...LID, t);
  const r = q(...ROLLER_IN, t);
  // длина разная: в центре длиннее, по краям короче — как у настоящих ресниц
  const k = 0.62 + 0.3 * Math.sin(Math.PI * t);
  const b: P = [a[0] + (r[0] - a[0]) * k, a[1] + (r[1] - a[1]) * k];
  const m: P = [(a[0] + b[0]) / 2 + (t - 0.5) * 8, (a[1] + b[1]) / 2];
  return `M${f(a[0])} ${f(a[1])} Q${f(m[0])} ${f(m[1])} ${f(b[0])} ${f(b[1])}`;
});
// ресницы после: подняты и подкручены
const lifted = TS.map((t) => {
  const a = q(...LID, t);
  const ang = (t - 0.5) * 1.5;
  const len = 40 + 16 * Math.sin(Math.PI * t);
  const dx = Math.sin(ang);
  const dy = -Math.cos(ang);
  const c: P = [a[0] + dx * len * 0.55 + dy * 6 * Math.sign(t - 0.5 || 1), a[1] + dy * len * 0.55 - Math.abs(dx) * 4];
  const b: P = [a[0] + dx * len * 0.95 - (t - 0.5) * 10, a[1] + dy * len * 0.92];
  return `M${f(a[0])} ${f(a[1])} Q${f(c[0])} ${f(c[1])} ${f(b[0])} ${f(b[1])}`;
});
const drop = (x: number, y: number, s = 1) =>
  `M${x} ${y} C${f(x + 6 * s)} ${f(y + 9 * s)} ${f(x + 10 * s)} ${f(y + 14 * s)} ${f(x + 10 * s)} ${f(y + 19 * s)} A${f(10 * s)} ${f(10 * s)} 0 0 1 ${f(x - 10 * s)} ${f(y + 19 * s)} C${f(x - 10 * s)} ${f(y + 14 * s)} ${f(x - 6 * s)} ${f(y + 9 * s)} ${x} ${y}Z`;
const star = (x: number, y: number, r: number) =>
  `M${x} ${f(y - r)} Q${x} ${y} ${f(x + r)} ${y} Q${x} ${y} ${x} ${f(y + r)} Q${x} ${y} ${f(x - r)} ${y} Q${x} ${y} ${x} ${f(y - r)}Z`;

function Draw({ d, k = 0, className = "art-line" }: { d: string; k?: number; className?: string }) {
  return <path className={className} d={d} pathLength={1} style={{ "--k": k } as CSSProperties} />;
}

export function StepArt({ step }: { step: number }) {
  const onRoller = step < 4;
  return (
    <svg className={`step-art step-art--${step + 1}`} viewBox="0 0 220 120" aria-hidden="true">
      {onRoller && <path className="art-fill" d={roller} />}
      {onRoller && <Draw d={roller} className="art-line art-soft" />}
      <Draw d={lid} />
      {(onRoller ? laid : lifted).map((d, i) => (
        <Draw d={d} k={i + 1} key={i} className={step === 3 ? "art-line art-dark" : "art-line"} />
      ))}
      {step === 1 && <path className="art-drop" d={drop(110, 6, 1.1)} />}
      {step === 2 && (
        <>
          <path className="art-drop" d={drop(96, 8)} />
          <path className="art-drop" d={drop(124, 4)} />
        </>
      )}
      {step === 4 && (
        <>
          <path className="art-star" d={star(54, 24, 9)} />
          <path className="art-star" d={star(172, 18, 7)} />
          <path className="art-star" d={star(118, 6, 5)} />
        </>
      )}
    </svg>
  );
}

const ICONS: Record<string, ReactNode> = {
  // меньше времени на сборы — часы со «скоростными» штрихами
  time: (
    <>
      <Draw d="M66 22a40 40 0 1 1 -0.1 0" />
      <Draw d="M66 62V36" k={3} />
      <Draw d="M66 62l18 10" k={4} />
      <Draw d="M8 46h16M4 62h18M8 78h16" k={6} />
    </>
  ),
  // можно тереть глаза и мицеллярной водой — капля
  drop: (
    <>
      <Draw d="M62 14C76 36 92 52 92 74a30 30 0 0 1 -60 0C32 52 48 36 62 14Z" />
      <Draw d="M46 76a16 16 0 0 0 16 16" k={4} />
      <Draw d="M98 30c4 6 7 10 7 14a7 7 0 0 1 -14 0c0-4 3-8 7-14Z" k={6} />
    </>
  ),
  // можно пользоваться тушью — щёточка туши
  mascara: (
    <>
      <Draw d="M18 104l40-40" />
      <Draw d="M58 64l42-42" k={2} />
      {Array.from({ length: 9 }, (_, i) => {
        const x = 62 + i * 4.4;
        const y = 60 - i * 4.4;
        const h = 6 + Math.sin((i / 8) * Math.PI) * 6;
        return <Draw key={i} d={`M${f(x - h * 0.71)} ${f(y - h * 0.71)}L${f(x + h * 0.71)} ${f(y + h * 0.71)}`} k={3 + i * 0.5} />;
      })}
    </>
  ),
  // посплетничать и поболтать — два «облачка»
  chat: (
    <>
      <Draw d="M14 30a14 14 0 0 1 14-14h40a14 14 0 0 1 14 14v18a14 14 0 0 1 -14 14H38L24 74V62a14 14 0 0 1 -10-14Z" />
      <Draw d="M90 50h6a14 14 0 0 1 14 14v14a14 14 0 0 1 -10 13v12L88 92H64a14 14 0 0 1 -14-14v-4" k={4} />
      <Draw d="M34 39h0M48 39h0M62 39h0" k={8} className="art-line art-dots" />
    </>
  ),
};

export function ReasonArt({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg className="reason-art" viewBox="0 0 120 120" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}
