import { getQuality, onQuality, reducedMotion, finePointer, lerp, type Quality } from "./motion";

/**
 * Живое небо на Canvas 2D: туманность из размытых радиальных градиентов,
 * три слоя звёзд с разной скоростью (параллакс от прокрутки и курсора),
 * редкие падающие звёзды (одна в 8–12 с).
 * Рисует только пока вкладка активна. В покое мерцание — 30 кадров/с, чтобы беречь батарею.
 */

interface Star {
  x: number; // 0..1
  y: number; // 0..1
  r: number;
  a: number;
  tw: number;
  ph: number;
  warm: boolean;
}

interface Layer {
  share: number;
  speed: number;
  depth: number;
  size: [number, number];
  alpha: [number, number];
  stars: Star[];
}

interface Shooting {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
  life: number;
}

const QUALITY_SCALE: Record<Quality, number> = { 0: 0.35, 1: 0.6, 2: 1 };

/**
 * Орбиты четырёх сфер на фоне («музыка небесных сфер»): Карта, Число, Слово, Песня.
 * r — радиус в долях большей стороны экрана, period — секунды на оборот.
 */
const SPHERE_ORBITS = [
  { r: 0.3, a: 0.1, period: 80, phase: 0.6, core: "rgba(230,207,154,0.95)", glow: "rgba(230,207,154,0.22)" },
  { r: 0.45, a: 0.085, period: 120, phase: 2.4, core: "rgba(196,176,255,0.95)", glow: "rgba(167,139,250,0.25)" },
  { r: 0.62, a: 0.07, period: 170, phase: 4.1, core: "rgba(246,241,255,0.95)", glow: "rgba(237,228,255,0.2)" },
  { r: 0.8, a: 0.06, period: 240, phase: 5.3, core: "rgba(178,140,255,0.95)", glow: "rgba(123,77,243,0.28)" },
];
const rand = (a: number, b: number) => a + Math.random() * (b - a);

function sprite(core: string, glow: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.1, core);
  grd.addColorStop(0.28, glow);
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  return c;
}

export class Starfield {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private layers: Layer[] = [
    { share: 0.62, speed: 0.02, depth: 5, size: [0.45, 1], alpha: [0.3, 0.7], stars: [] },
    { share: 0.28, speed: 0.06, depth: 11, size: [0.8, 1.5], alpha: [0.45, 0.85], stars: [] },
    { share: 0.1, speed: 0.14, depth: 22, size: [1.2, 2.1], alpha: [0.65, 1], stars: [] },
  ];
  private nebula: HTMLCanvasElement | null = null;
  private cool: HTMLCanvasElement;
  private warm: HTMLCanvasElement;
  private planets: HTMLCanvasElement[];
  private raf = 0;
  private running = false;
  private frame = 0;
  private lastT = 0;
  private lastScroll = -1;
  private px = 0;
  private py = 0;
  private tx = 0;
  private ty = 0;
  private shooting: Shooting | null = null;
  private nextShot = 0;
  private reduced = reducedMotion();
  private quality: Quality = getQuality();
  private offQuality: () => void;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d", { alpha: true })!;
    this.cool = sprite("rgba(237,228,255,0.95)", "rgba(167,139,250,0.22)");
    this.warm = sprite("rgba(230,207,154,0.95)", "rgba(230,207,154,0.18)");
    this.planets = SPHERE_ORBITS.map((o) => sprite(o.core, o.glow));
    this.resize();
    this.offQuality = onQuality((q) => {
      this.quality = q;
      this.populate();
    });
    window.addEventListener("resize", this.onResize);
    document.addEventListener("visibilitychange", this.onVisibility);
    if (finePointer() && !this.reduced) window.addEventListener("pointermove", this.onPointer, { passive: true });
    this.nextShot = performance.now() + rand(3000, 6000);
    if (this.reduced) this.draw(0);
    else this.start();
  }

  destroy() {
    this.stop();
    this.offQuality();
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("visibilitychange", this.onVisibility);
    window.removeEventListener("pointermove", this.onPointer);
  }

  private onPointer = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    this.tx = (e.clientX / this.w) * 2 - 1;
    this.ty = (e.clientY / this.h) * 2 - 1;
  };

  private onVisibility = () => {
    if (document.hidden) this.stop();
    else if (!this.reduced) this.start();
  };

  private resizeTimer = 0;
  private onResize = () => {
    clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      this.resize();
      if (this.reduced) this.draw(0);
    }, 120);
  };

  private resize() {
    const w = window.innerWidth;
    // высота — «большой» вьюпорт (100lvh в CSS), чтобы не перерисовывать при скрытии адресной строки
    const h = Math.max(this.canvas.clientHeight || window.innerHeight, window.innerHeight);
    const mobile = w < 768;
    const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
    const widthChanged = w !== this.w;
    if (!widthChanged && Math.abs(h - this.h) < 2 && dpr === this.dpr) return;
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.buildNebula();
    if (widthChanged) this.populate();
  }

  private populate() {
    const area = this.w * this.h;
    const per = this.w < 768 ? 2300 : 3000;
    const total = Math.round((area / per) * QUALITY_SCALE[this.quality]);
    for (const L of this.layers) {
      const n = Math.max(8, Math.round(total * L.share));
      L.stars = Array.from({ length: n }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: rand(L.size[0], L.size[1]),
        a: rand(L.alpha[0], L.alpha[1]),
        tw: rand(0.6, 2.2),
        ph: rand(0, Math.PI * 2),
        warm: Math.random() < 0.16,
      }));
    }
  }

  private buildNebula() {
    const s = 0.25;
    const W = Math.max(64, Math.ceil(this.w * s));
    const H = Math.max(64, Math.ceil(this.h * 1.4 * s));
    const c = this.nebula ?? document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d")!;
    g.clearRect(0, 0, W, H);
    const big = Math.max(W, H * 0.7);
    const blob = (x: number, y: number, r: number, rgb: string, a: number) => {
      const grd = g.createRadialGradient(x * W, y * H, 0, x * W, y * H, r * big);
      grd.addColorStop(0, `rgba(${rgb},${a})`);
      grd.addColorStop(0.55, `rgba(${rgb},${a * 0.35})`);
      grd.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = grd;
      g.fillRect(0, 0, W, H);
    };
    blob(0.2, 0.5, 0.75, "27,11,58", 0.9); // --nebula
    blob(0.86, 0.14, 0.55, "91,43,224", 0.3); // --cosmic
    blob(0.1, 0.06, 0.38, "167,139,250", 0.07); // --lilac
    blob(0.72, 0.8, 0.45, "192,38,211", 0.08); // --magenta, не больше 8 %
    blob(0.5, 0.98, 0.5, "91,43,224", 0.16);
    this.nebula = c;
  }

  private start() {
    if (this.running) return;
    this.running = true;
    this.lastT = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  private stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private loop = (t: number) => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(64, t - this.lastT) / 1000;
    this.lastT = t;
    this.frame++;

    const scroll = window.scrollY;
    const scrolled = scroll !== this.lastScroll;
    this.lastScroll = scroll;
    this.px = lerp(this.px, this.tx, 0.05);
    this.py = lerp(this.py, this.ty, 0.05);
    const pointerMoving = Math.abs(this.px - this.tx) + Math.abs(this.py - this.ty) > 0.002;

    if (t > this.nextShot && !this.shooting) this.spawnShot(t);
    if (this.shooting) {
      const s = this.shooting;
      s.t += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.t > s.life) {
        this.shooting = null;
        this.nextShot = t + rand(8000, 12000);
      }
    }

    // в покое — каждый второй кадр
    if (!scrolled && !pointerMoving && !this.shooting && this.frame % 2) return;
    this.draw(t / 1000);
  };

  private spawnShot(t: number) {
    const left = Math.random() < 0.5;
    const speed = Math.min(1300, Math.max(650, this.w * 0.9));
    const ang = (left ? rand(200, 220) : rand(-40, -20)) * (Math.PI / 180);
    this.shooting = {
      x: rand(0.25, 0.85) * this.w,
      y: rand(0.02, 0.35) * this.h,
      vx: Math.cos(ang) * speed,
      vy: Math.abs(Math.sin(ang)) * speed,
      t: 0,
      life: rand(0.7, 1.1),
    };
    this.nextShot = t + 100000;
  }

  private drawOrbits(time: number, prog: number) {
    const { ctx, w, h } = this;
    const base = Math.max(w, h);
    ctx.save();
    ctx.translate(w * 0.5 + this.px * 16, h * (0.66 - prog * 0.32) + this.py * 12);
    ctx.rotate(-0.2);
    ctx.lineWidth = 1;
    SPHERE_ORBITS.forEach((o, i) => {
      const rx = base * o.r;
      const ry = rx * 0.3;
      ctx.globalAlpha = 1;
      ctx.strokeStyle = `rgba(167,139,250,${o.a})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      const th = o.phase + (this.reduced ? 0 : (time * Math.PI * 2) / o.period);
      const s = (this.w < 768 ? 16 : 22) * (0.75 + 0.25 * Math.sin(th));
      ctx.globalAlpha = 0.5 + 0.35 * Math.sin(th);
      ctx.drawImage(this.planets[i], Math.cos(th) * rx - s / 2, Math.sin(th) * ry - s / 2, s, s);
    });
    ctx.restore();
  }

  draw(time: number) {
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);
    const scroll = this.reduced ? 0 : window.scrollY;
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const prog = Math.min(1, scroll / max);

    if (this.nebula) {
      const nh = h * 1.4;
      ctx.globalAlpha = 1;
      ctx.drawImage(this.nebula, -this.px * 12 - 14, -prog * (nh - h) - this.py * 10, w + 28, nh);
    }

    this.drawOrbits(time, prog);

    const twinkle = !this.reduced;
    for (const L of this.layers) {
      const oy = scroll * L.speed;
      const ox = this.px * L.depth;
      const oyP = this.py * L.depth;
      for (const s of L.stars) {
        let y = (s.y * h - oy - oyP) % h;
        if (y < 0) y += h;
        let x = (s.x * w - ox) % w;
        if (x < 0) x += w;
        const a = twinkle ? s.a * (0.62 + 0.38 * Math.sin(time * s.tw + s.ph)) : s.a;
        ctx.globalAlpha = a;
        if (s.r < 0.95) {
          ctx.fillStyle = s.warm ? "#E6CF9A" : "#EDE4FF";
          ctx.fillRect(x, y, s.r * 1.4, s.r * 1.4);
        } else {
          const size = s.r * 7;
          ctx.drawImage(s.warm ? this.warm : this.cool, x - size / 2, y - size / 2, size, size);
        }
      }
    }

    const sh = this.shooting;
    if (sh) {
      const k = sh.t / sh.life;
      const fade = k < 0.15 ? k / 0.15 : 1 - Math.max(0, (k - 0.55) / 0.45);
      const len = 150;
      const sp = Math.hypot(sh.vx, sh.vy);
      const tx = sh.x - (sh.vx / sp) * len;
      const ty = sh.y - (sh.vy / sp) * len;
      const grd = ctx.createLinearGradient(sh.x, sh.y, tx, ty);
      grd.addColorStop(0, "rgba(255,250,240,0.95)");
      grd.addColorStop(0.3, "rgba(230,207,154,0.45)");
      grd.addColorStop(1, "rgba(167,139,250,0)");
      ctx.globalAlpha = Math.max(0, fade);
      ctx.strokeStyle = grd;
      ctx.lineWidth = 1.3;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(sh.x, sh.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.drawImage(this.warm, sh.x - 7, sh.y - 7, 14, 14);
    }
    ctx.globalAlpha = 1;
  }
}
