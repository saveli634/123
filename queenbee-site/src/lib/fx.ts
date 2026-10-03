import { finePointer, motionAllowed } from "./env";
import { onTick } from "./scroll";

/**
 * Мелкие эффекты страницы, подключаются один раз после гидрации:
 * проявление по прокрутке, построчные заголовки, магнитные кнопки, 3D-наклон,
 * курсор-кольцо, золотая нить-прогресс, слова манифеста, скорость бегущей ленты.
 */
export function initFx() {
  const cleanups: (() => void)[] = [];
  const motion = motionAllowed();
  const fine = finePointer();

  /* ---- построчные заголовки: номер строки каждому слову ---- */
  const numberLines = () => {
    document.querySelectorAll<HTMLElement>("[data-lines]").forEach((el) => {
      let line = -1;
      let top = -Infinity;
      el.querySelectorAll<HTMLElement>(".lw").forEach((w) => {
        if (w.offsetTop > top + 4) {
          line++;
          top = w.offsetTop;
        }
        w.style.setProperty("--l", String(line));
      });
    });
  };
  numberLines();
  document.fonts?.ready.then(numberLines).catch(() => {});
  let rz = 0;
  const onResize = () => {
    clearTimeout(rz);
    rz = window.setTimeout(numberLines, 150);
  };
  window.addEventListener("resize", onResize);
  cleanups.push(() => window.removeEventListener("resize", onResize));

  /* ---- проявление по прокрутке ---- */
  const io = new IntersectionObserver(
    (ents) =>
      ents.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      }),
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );
  const observeAll = () => document.querySelectorAll("[data-reveal]:not(.is-in)").forEach((el) => io.observe(el));
  observeAll();
  const mo = new MutationObserver(observeAll);
  mo.observe(document.getElementById("root")!, { childList: true, subtree: true });
  cleanups.push(() => {
    io.disconnect();
    mo.disconnect();
  });

  /* ---- золотая нить-прогресс + слова манифеста + бегущая лента ---- */
  const thread = document.querySelector<HTMLElement>(".thread__line");
  const manifest = document.querySelector<HTMLElement>("[data-manifest]");
  const manifestSec = manifest?.closest<HTMLElement>(".manifest") ?? manifest;
  const words = manifest ? Array.from(manifest.querySelectorAll<HTMLElement>(".mw")) : [];
  const marquees = Array.from(document.querySelectorAll<HTMLElement>("[data-marquee]"));
  const anims = motion
    ? marquees.map((m) =>
        m.animate([{ transform: "translate3d(0,0,0)" }, { transform: "translate3d(-50%,0,0)" }], { duration: 38000, iterations: Infinity }),
      )
    : [];
  // скорость ленты = 1 + разгон от прокрутки, разгон плавно гаснет
  let boost = 0;
  let dir = 1;
  let mraf = 0;
  const decay = () => {
    boost *= 0.92;
    anims.forEach((a) => (a.playbackRate = dir * (1 + boost)));
    mraf = boost > 0.01 ? requestAnimationFrame(decay) : 0;
  };
  let lastWord = -2;
  cleanups.push(
    onTick((y, v) => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (thread) thread.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      if (manifest && words.length) {
        // слова загораются, пока секция проходит через экран (текст в ней закреплён)
        const r = manifestSec!.getBoundingClientRect();
        const H = window.innerHeight;
        const k = Math.min(1, Math.max(0, (H * 0.6 - r.top) / Math.max(1, r.height - H * 0.7)));
        const n = motion ? Math.floor(k * (words.length + 1)) - 1 : words.length;
        if (n !== lastWord) {
          lastWord = n;
          words.forEach((w, i) => w.classList.toggle("on", i <= n));
        }
      }
      if (anims.length) {
        boost = Math.max(boost, Math.min(5, Math.abs(v) * 0.12));
        dir = v < -2 ? -1 : v > 2 ? 1 : dir;
        if (!mraf) mraf = requestAnimationFrame(decay);
      }
    }),
  );
  cleanups.push(() => anims.forEach((a) => a.cancel()));

  if (!fine || !motion) return () => cleanups.forEach((f) => f());

  /* ---- курсор-кольцо ---- */
  const ring = document.createElement("div");
  ring.className = "cursor";
  ring.setAttribute("aria-hidden", "true");
  ring.innerHTML = '<span class="cursor__ring"></span><span class="cursor__dot"></span><span class="cursor__label"></span>';
  document.body.appendChild(ring);
  document.documentElement.classList.add("has-cursor");
  const label = ring.querySelector<HTMLElement>(".cursor__label")!;
  let mx = -100, my = -100, rx = -100, ry = -100;
  let craf = 0;
  const loop = () => {
    rx += (mx - rx) * 0.2;
    ry += (my - ry) * 0.2;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    craf = Math.abs(mx - rx) + Math.abs(my - ry) > 0.2 ? requestAnimationFrame(loop) : 0;
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    mx = e.clientX;
    my = e.clientY;
    ring.classList.add("on");
    if (!craf) craf = requestAnimationFrame(loop);
    const t = (e.target as HTMLElement).closest?.("a, button, [data-cursor], input, textarea, label");
    ring.classList.toggle("hover", !!t);
    const txt = t?.getAttribute("data-cursor") || "";
    ring.classList.toggle("text", !!txt);
    if (label.textContent !== txt) label.textContent = txt;
  };
  const onLeave = () => ring.classList.remove("on");
  const onDown = () => ring.classList.add("down");
  const onUp = () => ring.classList.remove("down");
  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerleave", onLeave);
  window.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", onUp);
  cleanups.push(() => {
    window.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
    ring.remove();
    document.documentElement.classList.remove("has-cursor");
  });

  /* ---- магнитные кнопки и 3D-наклон (делегирование) ---- */
  let magnet: HTMLElement | null = null;
  let tilt: HTMLElement | null = null;
  const onMagnet = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const target = (e.target as HTMLElement).closest?.<HTMLElement>("[data-magnetic]") ?? null;
    if (magnet && magnet !== target) magnet.style.transform = "";
    magnet = target;
    if (magnet) {
      const r = magnet.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      magnet.style.transform = `translate3d(${dx * 0.22}px, ${dy * 0.3}px, 0)`;
    }
    const tt = (e.target as HTMLElement).closest?.<HTMLElement>("[data-tilt]") ?? null;
    if (tilt && tilt !== tt) tilt.style.transform = "";
    tilt = tt;
    if (tilt) {
      const r = tilt.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = `perspective(900px) rotateX(${-py * 7}deg) rotateY(${px * 8}deg)`;
      tilt.style.setProperty("--gx", `${(px + 0.5) * 100}%`);
      tilt.style.setProperty("--gy", `${(py + 0.5) * 100}%`);
    }
  };
  window.addEventListener("pointermove", onMagnet, { passive: true });
  cleanups.push(() => window.removeEventListener("pointermove", onMagnet));

  return () => cleanups.forEach((f) => f());
}
