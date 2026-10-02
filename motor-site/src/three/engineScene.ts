import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildEngine, HL_KEYS, type HL } from "./engineModel";
import { KEY_T, POSES, type Pose } from "./poses";

/**
 * Сцена «Капиталка за один прокрут». Снаружи задаётся шкала T (0 — первый экран,
 * 1…7 — этапы) и раскладка (где на экране стоит мотор). Камера идёт по сплайну
 * и догоняет цель с инерцией (lerp 0.08), детали разбираются/собираются,
 * активный узел подсвечивается красным. Рисует только между start() и stop().
 */

export interface Layout {
  /** центр мотора на экране, доли ширины/высоты (0.5 — середина) */
  x: number;
  y: number;
  /** множитель дистанции камеры (>1 — дальше) */
  zoom: number;
}

export interface Hud {
  x: number;
  y: number;
  z: number;
  quality: number;
}

export interface EngineScene {
  setTimeline: (T: number) => void;
  setLayout: (hero: Layout, stage: Layout) => void;
  setPointer: (x: number, y: number) => void;
  resize: (w: number, h: number) => void;
  start: () => void;
  stop: () => void;
  /** Мгновенно поставить позу (без инерции) и отрисовать кадр — для готовых рендеров */
  still: (T: number) => void;
  hud: () => Hud;
  dispose: () => void;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const UP4 = new THREE.Vector3(0, 4, 0);

type Params = Omit<Pose, "cam" | "look" | "hl"> & { hl: Record<HL, number> };

function emptyParams(): Params {
  return { lift: 0, attach: 0, heads: 0, pistons: 0, pan: 0, frame: 1, floor: 1, run: 0, xray: 0, hl: { block: 0, heads: 0, pistons: 0, crank: 0, attach: 0, indicator: 0 } };
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, "rgba(255,70,80,0.9)");
  grd.addColorStop(0.25, "rgba(211,32,43,0.45)");
  grd.addColorStop(1, "rgba(211,32,43,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createEngineScene(
  canvas: HTMLCanvasElement,
  opts: { mobile: boolean; still?: boolean; onQuality?: (level: number) => void },
): EngineScene | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: !!opts.still,
    });
  } catch {
    return null;
  }
  const dprMax = opts.still ? 1 : Math.min(window.devicePixelRatio || 1, opts.mobile ? 1.6 : 2);
  let dpr = dprMax;
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const fog = new THREE.Fog(0x0a0b0d, 18, 40);
  scene.fog = fog;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.environment = env;
  scene.environmentIntensity = 1.15;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 140);

  /* ---- свет: верхний тёплый, холодная заливка, красный контровой у активного узла ---- */
  scene.add(new THREE.HemisphereLight(0x8a93a3, 0x0b0b0c, 0.45));
  const key = new THREE.DirectionalLight(0xfff1e2, 2.8);
  key.position.set(6, 11, 7);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x9fb2d0, 0.55);
  fill.position.set(-9, 4, 6);
  scene.add(fill);
  // Холодный контровой сверху-сзади: стальные грани читаются на тёмном фоне
  const back = new THREE.DirectionalLight(0xc9d6ea, 1.1);
  back.position.set(-6, 9, -9);
  scene.add(back);
  const rim = new THREE.DirectionalLight(0xff2533, 0);
  scene.add(rim);
  scene.add(rim.target);

  const model = buildEngine({ lowDetail: false });
  scene.add(model.root);
  const P = model.parts;

  const glowMat = new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffffff, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const glow = new THREE.Sprite(glowMat);
  glow.renderOrder = 10;
  glow.scale.setScalar(5);
  scene.add(glow);
  const lampMat = glowMat.clone();
  const lamp = new THREE.Sprite(lampMat);
  lamp.renderOrder = 11;
  lamp.scale.setScalar(1.6);
  scene.add(lamp);

  /* ---- сплайн камеры ---- */
  const camCurve = new THREE.CatmullRomCurve3(
    POSES.map((p) => new THREE.Vector3(...p.cam)),
    false,
    "centripetal",
  );
  const lookCurve = new THREE.CatmullRomCurve3(
    POSES.map((p) => new THREE.Vector3(...p.look)),
    false,
    "centripetal",
  );

  /* ---- состояние ---- */
  let T = 0;
  const ptr = { tx: 0, ty: 0, x: 0, y: 0 };
  let heroL: Layout = { x: 0.5, y: 0.5, zoom: 1 };
  let stageL: Layout = { x: 0.5, y: 0.5, zoom: 1 };
  let width = 1;
  let height = 1;
  let running = false;
  let raf = 0;
  let last = 0;
  let theta = 0;
  let time = 0;
  let first = true;
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();
  const tPos = new THREE.Vector3();
  const tLook = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const cur = emptyParams();
  const tgt = emptyParams();
  let viewX = 0.5;
  let viewY = 0.5;
  let zoom = 1;

  function evaluate(t: number) {
    let i = 0;
    while (i < KEY_T.length - 2 && t > KEY_T[i + 1]) i++;
    const a = KEY_T[i];
    const b = KEY_T[i + 1];
    const e = smooth(0.12, 0.88, (t - a) / (b - a));
    const u = Math.min(1, (i + e) / (POSES.length - 1));
    camCurve.getPoint(u, tPos);
    lookCurve.getPoint(u, tLook);
    const A = POSES[i];
    const B = POSES[i + 1];
    tgt.lift = lerp(A.lift, B.lift, e);
    tgt.attach = lerp(A.attach, B.attach, e);
    tgt.heads = lerp(A.heads, B.heads, e);
    tgt.pistons = lerp(A.pistons, B.pistons, e);
    tgt.pan = lerp(A.pan, B.pan, e);
    tgt.frame = lerp(A.frame, B.frame, e);
    tgt.floor = lerp(A.floor, B.floor, e);
    tgt.run = lerp(A.run, B.run, e);
    tgt.xray = lerp(A.xray, B.xray, e);
    for (const k of HL_KEYS) tgt.hl[k] = lerp(A.hl[k] ?? 0, B.hl[k] ?? 0, e);
    // раскладка: от первого экрана к этапам
    const h = smooth(0, 1.2, t);
    viewX = lerp(heroL.x, stageL.x, h);
    viewY = lerp(heroL.y, stageL.y, h);
    zoom = lerp(heroL.zoom, stageL.zoom, h);
  }

  function applyView() {
    camera.setViewOffset(width, height, -(viewX - 0.5) * width, -(viewY - 0.5) * height, width, height);
    camera.updateProjectionMatrix();
  }

  function aspectFactor() {
    const asp = width / Math.max(1, height);
    // узкий экран — камера дальше, чтобы мотор помещался по ширине
    return asp >= 1.25 ? 1 : 1 + (1.25 - asp) * 0.95;
  }

  function step(dt: number, instant: boolean) {
    time += dt;
    evaluate(T);
    const k = instant ? 1 : 1 - Math.pow(1 - 0.08, dt * 60);
    const kp = instant ? 1 : 1 - Math.pow(1 - 0.1, dt * 60);

    // параметры деталей
    (Object.keys(tgt) as (keyof Params)[]).forEach((key) => {
      if (key === "hl") return;
      (cur[key] as number) = lerp(cur[key] as number, tgt[key] as number, kp);
    });
    for (const h of HL_KEYS) cur.hl[h] = lerp(cur.hl[h], tgt.hl[h], kp);

    // камера: цель + облёт за курсором + лёгкое покачивание на первом экране
    ptr.x = lerp(ptr.x, ptr.tx, instant ? 1 : 1 - Math.pow(1 - 0.06, dt * 60));
    ptr.y = lerp(ptr.y, ptr.ty, instant ? 1 : 1 - Math.pow(1 - 0.06, dt * 60));
    const heroW = 1 - smooth(0, 1.1, T);
    const sway = instant ? 0 : Math.sin(time * 0.32) * 0.22 * heroW;
    const yaw = ptr.x * 0.2 + sway;
    tmp.copy(tPos).sub(tLook).multiplyScalar(aspectFactor() * zoom);
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    const x = tmp.x * c - tmp.z * s;
    const z = tmp.x * s + tmp.z * c;
    tmp.set(x, tmp.y + ptr.y * -1.2, z).add(tLook);
    if (first || instant) {
      camPos.copy(tmp);
      camLook.copy(tLook);
      first = false;
    } else {
      camPos.lerp(tmp, k);
      camLook.lerp(tLook, k);
    }
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    const dist = camPos.distanceTo(camLook);
    fog.near = dist * 0.9;
    fog.far = dist * 2.3;
    applyView();

    // мотор «дышит» (2 мм) и снимается с рамы
    const breathe = instant ? 0 : Math.sin(time * 1.8) * 0.02;
    model.engine.position.y = cur.lift * 2.5 + breathe;
    model.engine.rotation.z = cur.lift * 0.04;
    P.heads.forEach((h) => (h.position.y = cur.heads * 2.2));
    P.turbos.forEach((t, i) => {
      const b = t.userData.base as THREE.Vector3;
      const sx = i === 0 ? 1 : -1;
      t.position.set(b.x + sx * cur.attach * 1.9, b.y + cur.attach * 1.05, b.z + (i === 0 ? 1 : -1) * cur.attach * 0.7);
      t.rotation.y = cur.attach * 0.5 * sx;
    });
    P.intake.position.y = cur.attach * 2.3;
    P.intake.rotation.x = cur.attach * 0.06;
    P.front.position.x = cur.attach * 2.3;
    P.pan.position.y = -cur.pan * 1.7;

    // вращение коленвала, шкивов, поршней
    const speed = cur.run * 9 + (instant ? 0 : 0);
    theta += dt * speed;
    P.crank.rotation.x = theta;
    P.pulleys.forEach((p) => (p.obj.rotation.x = theta * p.ratio));
    model.pose(theta, cur.pistons);
    model.setXray(cur.xray);

    // рама и пол
    for (const m of model.frameMaterials) {
      m.opacity = (m instanceof THREE.LineBasicMaterial ? 0.32 : 1) * cur.frame;
      m.transparent = true;
    }
    P.frame.visible = cur.frame > 0.02;
    model.floorMaterials.forEach((m, i) => (m.opacity = [0.35, 0.6, 1][i] * cur.floor));

    // подсветка
    let best: HL = "block";
    let bw = 0;
    for (const h of HL_KEYS) {
      let w = cur.hl[h];
      if (h === "indicator") w *= 0.55 + 0.45 * Math.sin(time * 5.2);
      model.setHighlight(h, w);
      if (h !== "indicator" && cur.hl[h] > bw) {
        bw = cur.hl[h];
        best = h;
      }
    }
    model.anchors[best].getWorldPosition(glow.position);
    glowMat.opacity = bw * 0.3;
    glow.scale.setScalar(best === "crank" ? 5.5 : 4.2);
    model.anchors.indicator.getWorldPosition(lamp.position);
    lampMat.opacity = cur.hl.indicator * (0.55 + 0.45 * Math.sin(time * 5.2));
    // контровой красный — из-за мотора, напротив камеры
    rim.intensity = (bw + cur.hl.indicator * 0.6) * 1.9;
    rim.target.position.copy(camLook);
    rim.position.copy(camLook).sub(tmp.copy(camPos).sub(camLook).normalize().multiplyScalar(10)).add(UP4);

    renderer.render(scene, camera);
  }

  /* ---- адаптация качества: <40 fps за 2 с → ниже pixelRatio и детализация ---- */
  let quality = 2;
  let acc = 0;
  let frames = 0;
  // Только для автоматических скриншотов: без адаптации качества и без инерции камеры
  const noAdapt = typeof location !== "undefined" && location.search.includes("noadapt");
  const snap = typeof location !== "undefined" && location.search.includes("snap");
  function watchFps(dt: number) {
    if (noAdapt) return;
    acc += dt;
    frames++;
    if (acc < 2) return;
    const fps = frames / acc;
    acc = 0;
    frames = 0;
    if (fps >= 40 || quality === 0) return;
    quality--;
    if (quality === 1) {
      dpr = Math.min(dpr, 1.25);
      model.details.forEach((d) => (d.visible = false));
    } else {
      dpr = 1;
      model.edges.forEach((e, i) => (e.visible = i % 2 === 0));
      P.floor.children[0].visible = false;
    }
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    opts.onQuality?.(quality);
  }

  function loop(now: number) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 1 / 60);
    last = now;
    step(dt, snap);
    watchFps(dt);
  }

  return {
    setTimeline: (t) => {
      T = Math.max(0, Math.min(7, t));
    },
    setLayout: (hero, stage) => {
      heroL = hero;
      stageL = stage;
    },
    setPointer: (x, y) => {
      ptr.tx = x;
      ptr.ty = y;
    },
    resize: (w, h) => {
      width = Math.max(1, w);
      height = Math.max(1, h);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      applyView();
    },
    start: () => {
      if (running) return;
      running = true;
      last = 0;
      acc = 0;
      frames = 0;
      raf = requestAnimationFrame(loop);
    },
    stop: () => {
      running = false;
      cancelAnimationFrame(raf);
    },
    still: (t) => {
      T = t;
      step(1 / 60, true);
    },
    hud: () => ({ x: camPos.x, y: camPos.y, z: camPos.z, quality }),
    dispose: () => {
      running = false;
      cancelAnimationFrame(raf);
      model.dispose();
      env.dispose();
      glowMat.map?.dispose();
      glowMat.dispose();
      lampMat.dispose();
      renderer.dispose();
    },
  };
}
