import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";

/*
 * Технические схемы тонкой золотой линией — там, где своих кадров пока нет (двигатель, турбонаддув,
 * проект «Волга»). Подписаны как схема, не как фото работы. Линии прорисовываются: у каждой
 * pathLength=1, CSS двигает stroke-dashoffset (.scheme[data-on] или переменная --draw).
 */

type P = { className?: string; on?: boolean; label?: string; style?: CSSProperties };

function Svg({
  viewBox,
  className,
  on,
  label,
  style,
  children,
}: P & { viewBox: string; children: ReactNode }) {
  return (
    <svg
      viewBox={viewBox}
      className={cn("scheme", className)}
      data-on={on ? "" : undefined}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      style={style}
    >
      {children}
    </svg>
  );
}

const L = (d: string, i = 0, cls?: string) => (
  <path d={d} pathLength={1} className={cls} style={{ "--i": i } as CSSProperties} />
);

/** Один ряд цилиндров V-образного двигателя (рисуется вертикально, поворачивается вокруг коленвала). */
function Bank({ angle, i0 }: { angle: number; i0: number }) {
  return (
    <g transform={`rotate(${angle} 200 222)`}>
      {L("M172 92h56v108h-56z", i0)}
      {L("M178 118h44v30h-44z", i0 + 1, "hot")}
      {L("M184 126h32M184 134h32", i0 + 2, "thin")}
      {L("M200 148L200 222", i0 + 2)}
      {L("M164 66h72v26h-72z", i0 + 3)}
      {L("M168 40h64q8 0 8 8v14q0 4-4 4h-72q-4 0-4-4v-14q0-8 8-8z", i0 + 4)}
      {L("M186 53m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0M214 53m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0", i0 + 5, "thin")}
      {L("M190 92v-12M210 92v-12", i0 + 5, "thin")}
    </g>
  );
}

/** V8, вид спереди: два ряда под 90°, коленвал, поддон, впуск в развале. */
export function EngineScheme(p: P) {
  return (
    <Svg viewBox="0 0 400 330" {...p}>
      <g className="grid-lines">
        {L("M20 222H380M200 20V310", 0, "axis")}
      </g>
      <Bank angle={-45} i0={1} />
      <Bank angle={45} i0={2} />
      {L("M126 196L148 252H252L274 196", 3)}
      {L("M148 252L140 290H260L252 252", 4)}
      {L("M200 222m-30 0a30 30 0 1 0 60 0a30 30 0 1 0-60 0", 4)}
      {L("M200 222m-44 0a44 44 0 1 0 88 0a44 44 0 1 0-88 0", 5, "dash")}
      {L("M200 222m-6 0a6 6 0 1 0 12 0a6 6 0 1 0-12 0", 5, "hot")}
      {L("M174 150q26-34 52 0", 6)}
      {L("M184 132h32v-28h-32z", 6)}
      {L("M200 104V84", 7, "thin")}
      <text x="22" y="40" className="lbl">
        V8
      </text>
      <text x="378" y="316" className="lbl" textAnchor="end">
        90°
      </text>
    </Svg>
  );
}

/** Спираль улитки компрессора (архимедова), точки считаются один раз. */
function volute(cx: number, cy: number, r0: number, r1: number, turns: number) {
  const pts: string[] = [];
  const n = 72;
  for (let k = 0; k <= n; k++) {
    const a = (k / n) * turns * Math.PI * 2 - Math.PI / 2;
    const r = r0 + ((r1 - r0) * k) / n;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`);
  }
  return `M${pts.join("L")}`;
}
const VOLUTE = volute(150, 180, 52, 112, 0.92);
const VOLUTE_IN = volute(150, 180, 44, 90, 0.92);
const TURB = volute(322, 180, 34, 64, 0.85);
const BLADES = Array.from({ length: 9 }, (_, k) => {
  const a = (k / 9) * Math.PI * 2;
  const p = (r: number, da: number) =>
    `${(150 + Math.cos(a + da) * r).toFixed(1)} ${(180 + Math.sin(a + da) * r).toFixed(1)}`;
  return `M${p(10, 0)}Q${p(26, 0.42)} ${p(38, 0.78)}`;
}).join("");

/** Турбокомпрессор: улитка компрессора, крыльчатка, корпус подшипников, турбина. */
export function TurboScheme(p: P) {
  return (
    <Svg viewBox="0 0 400 330" {...p}>
      {L("M20 180H380M150 30V310", 0, "axis")}
      {L(VOLUTE, 1)}
      {L(`${VOLUTE_IN}`, 2, "thin")}
      {L("M150 68L150 30H206L206 76", 2)}
      {L("M150 180m-40 0a40 40 0 1 0 80 0a40 40 0 1 0-80 0", 3)}
      {L(BLADES, 4, "hot")}
      {L("M150 180m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0", 5)}
      {L("M214 160h46v40h-46z", 5)}
      {L("M222 168h30M222 192h30", 6, "thin")}
      {L(TURB, 6)}
      {L("M322 180m-24 0a24 24 0 1 0 48 0a24 24 0 1 0-48 0", 7, "dash")}
      {L("M322 116L322 86H364L364 128", 7)}
      {L("M92 300l22-22M108 278h6v6", 8, "hot")}
      {L("M178 52v-30M172 28l6-8 6 8", 8, "hot")}
      <text x="22" y="40" className="lbl">
        TURBO
      </text>
    </Svg>
  );
}

/**
 * Седан сбоку — схема проекта «Волга»: кузов, колёса, база, двигатель в моторном отсеке.
 * Группы: 0 — основа W124 (колёса, база), 1 — кузов «Волги», 2 — двигатель 3UZ‑FE V8.
 * focus — подсветить группу (наведение на строку досье). Без размеров — их нет в подтверждённых фактах.
 */
export function CarScheme({ callouts, focus, ...p }: P & { callouts: string[]; focus?: number | null }) {
  return (
    <Svg viewBox="0 0 1000 430" {...p}>
      <g data-focus={focus ?? undefined} className="car-groups">
        {L("M30 362H970", 0, "axis")}
        {L("M232 120V392M768 120V392", 0, "axis")}
        <g className="grp grp-1">
          {L(
            "M64 320C60 294 62 268 76 254C96 236 150 232 232 226L358 218C386 192 430 152 470 142C540 132 640 132 690 142C722 150 760 188 790 216L902 224C930 228 944 242 944 268L946 318C946 328 940 332 930 332H858C852 280 812 246 768 246C724 246 684 280 678 332H322C316 280 276 246 232 246C188 246 148 280 142 332H80C70 332 65 328 64 320Z",
            1,
          )}
          {L("M380 218C404 192 438 162 476 154C520 148 560 148 568 150L572 218Z", 2, "thin")}
          {L("M592 218L590 150C632 150 672 154 694 162C716 172 744 196 764 218Z", 2, "thin")}
          {L("M352 224V324M582 220V328M770 228V246", 3, "thin")}
          {L("M330 332H676", 3, "thin")}
          {L("M400 246h34M620 246h34", 4, "thin")}
          {L("M70 264h40v18H68M946 264h-36v18h36", 4)}
          {L("M58 304h58M944 304h-60", 5, "thin")}
          {L("M520 144L560 72H640", 9, "thin")}
          <text x="648" y="76" className="lbl">
            {callouts[1]}
          </text>
        </g>
        <g className="grp grp-0">
          {L("M232 332m-62 0a62 62 0 1 0 124 0a62 62 0 1 0-124 0", 5)}
          {L("M232 332m-38 0a38 38 0 1 0 76 0a38 38 0 1 0-76 0", 6, "thin")}
          {L("M768 332m-62 0a62 62 0 1 0 124 0a62 62 0 1 0-124 0", 5)}
          {L("M768 332m-38 0a38 38 0 1 0 76 0a38 38 0 1 0-76 0", 6, "thin")}
          {L("M232 332m-8 0a8 8 0 1 0 16 0a8 8 0 1 0-16 0M768 332m-8 0a8 8 0 1 0 16 0a8 8 0 1 0-16 0", 6)}
          {L("M232 404H768M232 394V414M768 394V414", 8, "thin")}
          {L("M244 398l-12 6 12 6M756 398l12 6-12 6", 8, "thin")}
          <text x="500" y="396" className="lbl" textAnchor="middle">
            {callouts[0]}
          </text>
        </g>
        <g className="grp grp-2">
          {L("M124 290L124 258L152 246H298L322 258V290L300 302H144Z", 7, "dash hot")}
          {L("M168 246V238H282V246", 7, "dash hot")}
          {L("M226 238L190 92H110", 9, "thin hot")}
          <text x="102" y="96" className="lbl hot" textAnchor="end">
            {callouts[2]}
          </text>
        </g>
      </g>
    </Svg>
  );
}
