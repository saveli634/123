import { getQuality, onQuality } from "./motion";

/**
 * Короткий звёздный след за курсором (только мышь/тачпад).
 * Рисует, только пока есть живые частицы; выключается при низком качестве.
 */

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  r: number;
  warm: boolean;
}

export class CursorTrail {
  private ctx: CanvasRenderingContext2D;
  private ps: P[] = [];
  private raf = 0;
  private lx = -1;
  private ly = -1;
  private last = 0;
  private enabled = getQuality() === 2;
  private off: () => void;
  private dpr = Math.min(window.devicePixelRatio || 1, 2);

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.resize();
    window.addEventListener("resize", this.resize);
    window.addEventListener("pointermove", this.move, { passive: true });
    this.off = onQuality((q) => {
      this.enabled = q === 2;
      if (!this.enabled) {
        this.ps = [];
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("pointermove", this.move);
    this.off();
  }

  private resize = () => {
    this.canvas.width = Math.round(window.innerWidth * this.dpr);
    this.canvas.height = Math.round(window.innerHeight * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  private move = (e: PointerEvent) => {
    if (!this.enabled || e.pointerType !== "mouse") return;
    const x = e.clientX;
    const y = e.clientY;
    if (this.lx < 0) {
      this.lx = x;
      this.ly = y;
    }
    const dist = Math.hypot(x - this.lx, y - this.ly);
    const steps = Math.min(6, Math.floor(dist / 9));
    for (let i = 1; i <= steps; i++) {
      const k = i / steps;
      this.spawn(this.lx + (x - this.lx) * k, this.ly + (y - this.ly) * k);
    }
    if (steps > 0) {
      this.lx = x;
      this.ly = y;
    }
    if (!this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.loop);
    }
  };

  private spawn(x: number, y: number) {
    if (this.ps.length > 90) this.ps.shift();
    const max = 0.45 + Math.random() * 0.35;
    this.ps.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 6,
      vx: (Math.random() - 0.5) * 14,
      vy: 6 + Math.random() * 16,
      life: max,
      max,
      r: 0.6 + Math.random() * 1.3,
      warm: Math.random() < 0.55,
    });
  }

  private loop = (t: number) => {
    const dt = Math.min(48, t - this.last) / 1000;
    this.last = t;
    const { ctx } = this;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.globalCompositeOperation = "lighter";
    for (const p of this.ps) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const k = Math.max(0, p.life / p.max);
      ctx.globalAlpha = k * 0.9;
      ctx.fillStyle = p.warm ? "#E6CF9A" : "#C9B6FF";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (0.4 + k * 0.6), 0, Math.PI * 2);
      ctx.fill();
      if (p.r > 1.4) {
        ctx.globalAlpha = k * 0.18;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    this.ps = this.ps.filter((p) => p.life > 0);
    this.raf = this.ps.length ? requestAnimationFrame(this.loop) : 0;
    if (!this.raf) ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  };
}
