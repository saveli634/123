/** Отрисовка сцены «Подъём» в canvas 2D. Пространство глаза — см. lashes.ts. */
import {
  BOUNDS,
  IRIS,
  LASHES_FULL,
  LASHES_LOW,
  LOWER,
  bez,
  bezTangent,
  lashOutline,
  lashPoint,
  lashPose,
  lids,
  makeLashes,
  rollerOutline,
  sceneState,
  type Bezier,
  type Lash,
  type SceneState,
} from "./lashes";
import { mix } from "./env";

const PEARL = [247, 243, 250];
const LILAC = [217, 201, 255];

function tint(t: number, a: number) {
  const c = PEARL.map((v, i) => Math.round(mix(v, LILAC[i], t)));
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

function curve(ctx: CanvasRenderingContext2D, b: Bezier, move = true) {
  if (move) ctx.moveTo(b[0][0], b[0][1]);
  ctx.bezierCurveTo(b[1][0], b[1][1], b[2][0], b[2][1], b[3][0], b[3][1]);
}

export class LiftRenderer {
  private ctx: CanvasRenderingContext2D;
  private lashes: Lash[] = makeLashes(LASHES_FULL);
  private fills: string[] = [];
  private iris: HTMLCanvasElement | null = null;
  private glow: HTMLCanvasElement;
  private scale = 1;
  private ox = 0;
  private oy = 0;
  private dpr = 1;
  private low = false;
  private roller = rollerOutline();

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.glow = this.makeGlow();
    this.setLashes(LASHES_FULL);
  }

  /** Слабое устройство: 24 ресницы и меньше пикселей. */
  setLow() {
    if (this.low) return;
    this.low = true;
    this.setLashes(LASHES_LOW);
    this.resize();
  }

  private setLashes(n: number) {
    this.lashes = makeLashes(n);
    this.fills = this.lashes.map((l) => tint(l.tone * 0.75, 0.94));
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const W = Math.max(1, r.width);
    const H = Math.max(1, r.height);
    this.dpr = Math.min(window.devicePixelRatio || 1, this.low ? 1.25 : 2);
    this.canvas.width = Math.round(W * this.dpr);
    this.canvas.height = Math.round(H * this.dpr);

    // Куда вписать глаз: телефон горизонтально — справа от текста; вертикально — между текстом и подписью
    // на узком экране самые крайние кончики могут чуть выйти за край — зато глаз крупнее
    let box: [number, number, number, number];
    let bw = BOUNDS.right - BOUNDS.left;
    if (W > H * 1.25 && H < 560) box = [W * 0.4, H * 0.06, W * 0.98, H * 0.96];
    else if (W >= 900) box = [W * 0.3, H * 0.12, W * 0.94, H * 0.92];
    else {
      box = [0, H * 0.2, W, H * 0.76];
      bw = 1180;
    }
    const bh = BOUNDS.bottom - BOUNDS.top;
    this.scale = Math.min((box[2] - box[0]) / bw, (box[3] - box[1]) / bh);
    this.ox = (box[0] + box[2]) / 2;
    this.oy = (box[1] + box[3]) / 2 - ((BOUNDS.top + BOUNDS.bottom) / 2) * this.scale;
    this.iris = this.makeIris();
  }

  private makeGlow() {
    const c = document.createElement("canvas");
    c.width = c.height = 96;
    const g = c.getContext("2d")!;
    const gr = g.createRadialGradient(48, 48, 0, 48, 48, 48);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.12, "rgba(222,206,255,0.95)");
    gr.addColorStop(0.34, "rgba(142,91,255,0.45)");
    gr.addColorStop(1, "rgba(142,91,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 96, 96);
    return c;
  }

  /** Радужка рисуется один раз (на каждый размер экрана), дальше — готовой картинкой. */
  private makeIris() {
    const k = this.scale * this.dpr;
    const size = Math.max(8, Math.ceil(IRIS.r * 2 * k));
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const g = c.getContext("2d")!;
    g.scale(size / (IRIS.r * 2), size / (IRIS.r * 2));
    g.translate(IRIS.r, IRIS.r);
    const gr = g.createRadialGradient(0, 0, IRIS.pupil * 0.8, 0, 0, IRIS.r);
    gr.addColorStop(0, "#241238");
    gr.addColorStop(0.32, "#5B34B8");
    gr.addColorStop(0.62, "#9D74FF");
    gr.addColorStop(0.86, "#6A45C9");
    gr.addColorStop(1, "#1A1026");
    g.fillStyle = gr;
    g.beginPath();
    g.arc(0, 0, IRIS.r, 0, Math.PI * 2);
    g.fill();
    // волокна радужки
    g.lineCap = "round";
    for (let i = 0; i < 96; i++) {
      const a = (i / 96) * Math.PI * 2 + Math.sin(i * 12.9898) * 0.04;
      const r0 = IRIS.pupil + 6 + (i % 3) * 4;
      const r1 = IRIS.r * (0.78 + ((i * 37) % 17) / 100);
      g.strokeStyle = `rgba(226,214,255,${0.12 + ((i * 53) % 10) / 45})`;
      g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
      g.lineTo(Math.cos(a + 0.05) * r1, Math.sin(a + 0.05) * r1);
      g.stroke();
    }
    g.fillStyle = "#07040B";
    g.beginPath();
    g.arc(0, 0, IRIS.pupil, 0, Math.PI * 2);
    g.fill();
    // блики
    g.fillStyle = "rgba(255,255,255,0.9)";
    g.beginPath();
    g.ellipse(-58, -62, 24, 18, -0.5, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "rgba(255,255,255,0.45)";
    g.beginPath();
    g.arc(46, 52, 9, 0, Math.PI * 2);
    g.fill();
    return c;
  }

  draw(p: number) {
    const ctx = this.ctx;
    const s = sceneState(p);
    const { upper, lower } = lids(s.open);
    const px = 1 / this.scale; // 1 экранный пиксель в единицах глаза

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const k = this.dpr * this.scale;
    ctx.setTransform(k, 0, 0, k, this.ox * this.dpr, this.oy * this.dpr);

    if (s.roller > 0.005) this.drawRoller(s, px);
    if (s.open > 0.01) this.drawEye(s, upper, lower);

    // нижнее веко и нижние реснички
    ctx.lineCap = "round";
    ctx.strokeStyle = `rgba(217,201,255,${0.22 + 0.38 * s.open})`;
    ctx.lineWidth = Math.max(1.1 * px, 2.2);
    ctx.beginPath();
    curve(ctx, lower);
    ctx.stroke();
    if (s.open > 0.02) {
      ctx.strokeStyle = `rgba(217,201,255,${0.55 * s.open})`;
      ctx.lineWidth = Math.max(0.8 * px, 1.6);
      ctx.beginPath();
      for (const l of LOWER) {
        const [x, y] = bez(lower, l.u);
        const a = bezTangent(lower, l.u) + Math.PI / 2 + l.lean * 0.6;
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(
          x + Math.cos(a) * l.len * 0.6,
          y + Math.sin(a) * l.len * 0.6,
          x + Math.cos(a + l.lean * 0.5) * l.len * s.open,
          y + Math.sin(a + l.lean * 0.5) * l.len * s.open,
        );
      }
      ctx.stroke();
    }

    // складка века
    const crease: Bezier = [
      [upper[0][0] + 40, upper[0][1] - 40],
      [upper[1][0], upper[1][1] - 120 - 40 * s.open],
      [upper[2][0], upper[2][1] - 125 - 40 * s.open],
      [upper[3][0] - 10, upper[3][1] - 70],
    ];
    ctx.strokeStyle = `rgba(217,201,255,${0.16 + 0.14 * s.open})`;
    ctx.lineWidth = Math.max(1 * px, 1.8);
    ctx.beginPath();
    curve(ctx, crease);
    ctx.stroke();

    // верхнее веко: мягкое свечение + тонкая линия
    ctx.strokeStyle = "rgba(142,91,255,0.22)";
    ctx.lineWidth = 16;
    ctx.beginPath();
    curve(ctx, upper);
    ctx.stroke();
    ctx.strokeStyle = "rgba(247,243,250,0.95)";
    ctx.lineWidth = Math.max(1.6 * px, 3.4);
    ctx.stroke();

    // ресницы
    const poses = this.lashes.map((l) => lashPose(l, s, upper));
    for (let i = 0; i < poses.length; i++) {
      const pts = lashOutline(poses[i], this.low ? 9 : 12);
      ctx.fillStyle = this.fills[i];
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      for (let j = 2; j < pts.length; j += 2) ctx.lineTo(pts[j], pts[j + 1]);
      ctx.closePath();
      ctx.fill();
    }

    // блики на кончиках
    ctx.globalCompositeOperation = "lighter";
    const gs = 64;
    for (const q of poses) {
      if (q.glint < 0.02) continue;
      const [x, y] = lashPoint(q, 1);
      ctx.globalAlpha = q.glint;
      const r = gs * (0.7 + q.glint * 0.5);
      ctx.drawImage(this.glow, x - r / 2, y - r / 2, r, r);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    return s;
  }

  private drawRoller(s: SceneState, px: number) {
    const ctx = this.ctx;
    const { inner, outer } = this.roller;
    ctx.save();
    ctx.globalAlpha = s.roller;
    ctx.translate(0, (1 - s.roller) * 40);
    ctx.beginPath();
    ctx.moveTo(inner[0][0], inner[0][1]);
    for (const p of inner) ctx.lineTo(p[0], p[1]);
    for (let i = outer.length - 1; i >= 0; i--) ctx.lineTo(outer[i][0], outer[i][1]);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 120, 0, -260);
    g.addColorStop(0, "rgba(217,201,255,0.30)");
    g.addColorStop(0.55, "rgba(142,91,255,0.14)");
    g.addColorStop(1, "rgba(244,214,223,0.10)");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(217,201,255,0.55)";
    ctx.lineWidth = Math.max(1 * px, 2);
    ctx.stroke();
    // глянцевый блик по краю валика
    ctx.strokeStyle = "rgba(247,243,250,0.45)";
    ctx.lineWidth = Math.max(1.2 * px, 3);
    ctx.beginPath();
    const a = Math.floor(outer.length * 0.22);
    const b = Math.floor(outer.length * 0.62);
    ctx.moveTo(outer[a][0], outer[a][1] + 18);
    for (let i = a; i <= b; i++) ctx.lineTo(outer[i][0], outer[i][1] + 18);
    ctx.stroke();
    ctx.restore();
  }

  private drawEye(s: SceneState, upper: Bezier, lower: Bezier) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    curve(ctx, upper);
    ctx.bezierCurveTo(lower[2][0], lower[2][1], lower[1][0], lower[1][1], lower[0][0], lower[0][1]);
    ctx.closePath();
    ctx.clip();
    // белок: перламутровый, светлее у радужки и темнее к уголкам
    const sc = ctx.createRadialGradient(IRIS.cx, IRIS.cy, IRIS.r * 0.6, IRIS.cx, IRIS.cy, 560);
    sc.addColorStop(0, `rgba(247,243,250,${0.2 * s.open})`);
    sc.addColorStop(0.55, `rgba(217,201,255,${0.09 * s.open})`);
    sc.addColorStop(1, `rgba(217,201,255,${0.02 * s.open})`);
    ctx.fillStyle = sc;
    ctx.fill();
    if (this.iris) {
      ctx.globalAlpha = s.open;
      ctx.drawImage(this.iris, IRIS.cx - IRIS.r, IRIS.cy - IRIS.r, IRIS.r * 2, IRIS.r * 2);
      ctx.globalAlpha = 1;
    }
    // тень от верхнего века на глазном яблоке
    const sh = ctx.createLinearGradient(0, upper[1][1] * 0.75 - 10, 0, upper[1][1] * 0.75 + 90);
    sh.addColorStop(0, "rgba(12,8,18,0.6)");
    sh.addColorStop(1, "rgba(12,8,18,0)");
    ctx.fillStyle = sh;
    ctx.fillRect(-520, -400, 1040, 700);
    ctx.restore();
    ctx.strokeStyle = `rgba(255,255,255,${0.28 * s.open})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    const wet: Bezier = [lower[0], [lower[1][0], lower[1][1] - 14], [lower[2][0], lower[2][1] - 14], lower[3]];
    curve(ctx, wet);
    ctx.stroke();
  }
}
