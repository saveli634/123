import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { createBee } from "./bee";

/**
 * «Пчела ведёт по резиденции».
 * Золотая винтовая нить вокруг центральной оси, на ней 8 вертикальных окон-кадров интерьера
 * (этапы 5 и 6 — по два кадра). Камера поднимается по спирали (плавное доведение ≈ lerp 0,07 за кадр),
 * окно в фокусе крупнее, остальные уходят в туман цвета фона. На этапе «Лестница» камера смотрит
 * сверху в спираль. В финале камера отъезжает, пчела садится на кнопку «Записаться».
 */

export const CARD_IMAGES = [
  "lobby_chandelier",
  "lounge_burgundy",
  "lounge_green",
  "staircase_spiral",
  "fireplace_wood",
  "reception_desk",
  "shelves_products",
  "gift_boxes_monogram",
];

/** Окна этапов по прогрессу прокрутки p ∈ [0, 1] */
export const STAGES = [
  { from: 0.05, to: 0.175 },
  { from: 0.175, to: 0.295 },
  { from: 0.295, to: 0.415 },
  { from: 0.415, to: 0.555 },
  { from: 0.555, to: 0.695 },
  { from: 0.695, to: 0.835 },
  { from: 0.835, to: 1.01 },
];
/** Куда прокручивать при переходе по шкале 01–07 (и где делать рендеры) */
export const STAGE_CENTER = [0.115, 0.235, 0.355, 0.485, 0.625, 0.765, 0.97];

// Ключевые точки пути камеры: u — параметр спирали (номер окна), pull — отъезд, top — вид сверху
const KEYS: { p: number; u: number; pull: number; top: number; pair?: number }[] = [
  { p: 0.0, u: 1.2, pull: 2.75, top: 0 },
  { p: 0.065, u: -0.45, pull: 1.3, top: 0 },
  { p: 0.105, u: 0, pull: 1, top: 0 },
  { p: 0.15, u: 0, pull: 1, top: 0 },
  { p: 0.225, u: 1, pull: 1, top: 0 },
  { p: 0.27, u: 1, pull: 1, top: 0 },
  { p: 0.345, u: 2, pull: 1, top: 0 },
  { p: 0.39, u: 2, pull: 1, top: 0 },
  { p: 0.47, u: 3, pull: 1, top: 1 },
  { p: 0.515, u: 3, pull: 1, top: 1 },
  { p: 0.605, u: 4.5, pull: 1.62, top: 0, pair: 1 },
  { p: 0.655, u: 4.5, pull: 1.62, top: 0, pair: 1 },
  { p: 0.745, u: 6.5, pull: 1.62, top: 0, pair: 1 },
  { p: 0.795, u: 6.5, pull: 1.62, top: 0, pair: 1 },
  { p: 0.91, u: 4.4, pull: 3.0, top: 0 },
  { p: 1.0, u: 4.2, pull: 3.15, top: 0 },
];

const R = 2.6; // радиус спирали
const DTH = 0.92; // шаг по углу между окнами
const DY = 1.18; // шаг по высоте
const CARD_W = 0.9;
const CARD_H = 1.6;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const win = (p: number, a: number, b: number, e = 0.035) => smooth(a - e * 0.4, a + e, p) * (1 - smooth(b - e, b + e * 0.4, p));
export const stageWeight = (p: number, i: number) => win(p, STAGES[i].from, STAGES[i].to);

const theta = (u: number) => u * DTH;
const helix = (u: number, r = R, out = new THREE.Vector3()) => out.set(r * Math.cos(theta(u)), u * DY, r * Math.sin(theta(u)));

export interface FrameInfo {
  p: number;
  weights: number[];
  final: number;
  intro: number;
}

export interface SceneOptions {
  mobile: boolean;
  /** Снимок для рендеров: время заморожено, без шлейфа, всё сразу на местах */
  capture?: boolean;
  /** Только для отладки модели пчелы: камера вплотную к пчеле */
  beeCloseup?: boolean;
  /** Рендер «общий вид»: вся спираль в три четверти сверху */
  overview?: boolean;
  /** Где на экране кнопка «Записаться» (для посадки пчелы в финале), в px окна сцены */
  landing?: () => { x: number; y: number } | null;
  urls: string[];
}

export interface SpiralScene {
  ready: Promise<void>;
  setProgress: (p: number, instant?: boolean) => void;
  setPointer: (x: number, y: number) => void;
  resize: (w: number, h: number) => void;
  start: () => void;
  stop: () => void;
  renderOnce: () => void;
  dispose: () => void;
}

function softShadowTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 192;
  const g = c.getContext("2d")!;
  g.filter = "blur(14px)";
  g.fillStyle = "rgba(60,40,30,0.55)";
  g.fillRect(28, 30, 72, 132);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function dotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  rg.addColorStop(0, "rgba(255,240,200,1)");
  rg.addColorStop(0.25, "rgba(226,196,128,0.9)");
  rg.addColorStop(1, "rgba(200,160,90,0)");
  g.fillStyle = rg;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Точки с per-vertex прозрачностью и размером — шлейф пылинок и плавающие блики */
function dustMaterial(map: THREE.Texture, pixelRatio: number) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    fog: true,
    uniforms: {
      map: { value: map },
      scale: { value: 260 * pixelRatio },
      ...THREE.UniformsLib.fog,
    },
    vertexShader: /* glsl */ `
      attribute float alpha;
      attribute float size;
      varying float vAlpha;
      uniform float scale;
      #include <fog_pars_vertex>
      void main() {
        vAlpha = alpha;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * scale / -mvPosition.z;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D map;
      varying float vAlpha;
      #include <fog_pars_fragment>
      void main() {
        vec4 c = texture2D(map, gl_PointCoord);
        gl_FragColor = vec4(c.rgb, c.a * vAlpha);
        #include <fog_fragment>
      }`,
  });
}

export function createSpiralScene(canvas: HTMLCanvasElement, onFrame: (f: FrameInfo) => void, opts: SceneOptions): SpiralScene | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: !!opts.capture });
  } catch {
    return null;
  }
  const MILK = new THREE.Color(0xf4efe6);
  let dpr = Math.min(window.devicePixelRatio || 1, opts.mobile ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(MILK, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  const fog = new THREE.Fog(MILK, 4, 12);
  scene.fog = fog;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.9;

  const camera = new THREE.PerspectiveCamera(opts.mobile ? 50 : 36, 1, 0.05, 80);
  scene.add(new THREE.HemisphereLight(0xfff6e8, 0xe6d8c0, 1.4));
  const key = new THREE.DirectionalLight(0xfff1dc, 1.6);
  key.position.set(4, 9, 6);
  scene.add(key);

  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x);

  const goldMat = track(new THREE.MeshStandardMaterial({ color: 0xd2b072, metalness: 0.88, roughness: 0.32 }));
  // Клип-плоскость: на виде сверху прячем верхние витки нити, чтобы не загораживали колодец
  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e4);
  const threadMat = track(new THREE.MeshStandardMaterial({ color: 0xc49a52, metalness: 0.9, roughness: 0.28, clippingPlanes: [clip] }));

  /* ---------- Нить-спираль ---------- */
  const pts: THREE.Vector3[] = [];
  for (let u = -1.6; u <= 8.6; u += 0.08) pts.push(helix(u));
  const curve = new THREE.CatmullRomCurve3(pts);
  const tube = new THREE.Mesh(track(new THREE.TubeGeometry(curve, 900, 0.011, 8, false)), threadMat);
  scene.add(tube);
  // Вторая, едва заметная внутренняя нить — объём «лестницы»
  const pts2: THREE.Vector3[] = [];
  for (let u = -1.6; u <= 8.6; u += 0.08) pts2.push(helix(u, R - 0.34).add(new THREE.Vector3(0, -0.12, 0)));
  const innerMat = track(new THREE.MeshStandardMaterial({ color: 0xd2b47a, metalness: 0.7, roughness: 0.45, transparent: true, opacity: 0.55, clippingPlanes: [clip] }));
  const tube2 = new THREE.Mesh(track(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts2), 900, 0.007, 6, false)), innerMat);
  scene.add(tube2);
  // Ступени-штрихи между нитями
  const stepPos: number[] = [];
  for (let u = -1.4; u <= 8.4; u += 0.16) {
    const a = helix(u, R - 0.34).add(new THREE.Vector3(0, -0.12, 0));
    const b = helix(u);
    stepPos.push(a.x, a.y, a.z, b.x, b.y, b.z);
  }
  const stepGeo = track(new THREE.BufferGeometry());
  stepGeo.setAttribute("position", new THREE.Float32BufferAttribute(stepPos, 3));
  const stepMat = track(new THREE.LineBasicMaterial({ color: 0xb9944f, transparent: true, opacity: 0.32, clippingPlanes: [clip] }));
  scene.add(new THREE.LineSegments(stepGeo, stepMat));
  // Центральная ось
  const axisGeo = track(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -3, 0), new THREE.Vector3(0, 11, 0)]));
  const axisMat = track(new THREE.LineBasicMaterial({ color: 0xb9944f, transparent: true, opacity: 0.22, clippingPlanes: [clip] }));
  scene.add(new THREE.Line(axisGeo, axisMat));

  /* ---------- Соты в основании: из центральной ячейки вылетает пчела ---------- */
  const combBase = helix(-1.15).add(new THREE.Vector3(0, -0.95, 0));
  const comb = new THREE.Group();
  comb.position.copy(combBase);
  const hexPts = (r: number) => Array.from({ length: 7 }, (_, i) => new THREE.Vector3(r * Math.cos((i * Math.PI) / 3 + Math.PI / 6), 0, r * Math.sin((i * Math.PI) / 3 + Math.PI / 6)));
  const hexLineGeo = track(new THREE.BufferGeometry().setFromPoints(hexPts(0.26)));
  const hexLineMat = track(new THREE.LineBasicMaterial({ color: 0xb9944f, transparent: true, opacity: 0.8 }));
  const cellOffsets: [number, number][] = [[0, 0]];
  for (let i = 0; i < 6; i++) cellOffsets.push([0.47 * Math.cos((i * Math.PI) / 3), 0.47 * Math.sin((i * Math.PI) / 3)]);
  for (let i = 0; i < 6; i++) cellOffsets.push([0.814 * Math.cos((i * Math.PI) / 3 + Math.PI / 6), 0.814 * Math.sin((i * Math.PI) / 3 + Math.PI / 6)]);
  cellOffsets.forEach(([x, z]) => {
    const l = new THREE.LineLoop(hexLineGeo, hexLineMat);
    l.position.set(x, 0, z);
    comb.add(l);
  });
  // центральная ячейка — объёмная (шестигранная призма без крышек)
  const cell = new THREE.Mesh(track(new THREE.CylinderGeometry(0.26, 0.26, 0.22, 6, 1, true)), track(new THREE.MeshStandardMaterial({ color: 0xc9a25a, metalness: 0.85, roughness: 0.35, side: THREE.DoubleSide, transparent: true, opacity: 0.92 })));
  cell.rotation.y = Math.PI / 6;
  cell.position.y = 0.11;
  comb.add(cell);
  scene.add(comb);

  /* ---------- Окна-кадры ---------- */
  const loader = new THREE.TextureLoader();
  const shadowTex = track(softShadowTexture());
  const cardGeo = track(new THREE.PlaneGeometry(CARD_W, CARD_H));
  const frameGeo = track(new THREE.PlaneGeometry(CARD_W + 0.044, CARD_H + 0.044));
  const lineGeo = track(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-CARD_W / 2 - 0.085, -CARD_H / 2 - 0.085, 0.002),
      new THREE.Vector3(CARD_W / 2 + 0.085, -CARD_H / 2 - 0.085, 0.002),
      new THREE.Vector3(CARD_W / 2 + 0.085, CARD_H / 2 + 0.085, 0.002),
      new THREE.Vector3(-CARD_W / 2 - 0.085, CARD_H / 2 + 0.085, 0.002),
    ]),
  );
  const shadowGeo = track(new THREE.PlaneGeometry(CARD_W * 1.9, CARD_H * 1.45));
  type Card = { group: THREE.Group; photo: THREE.MeshBasicMaterial; frame: THREE.MeshStandardMaterial; line: THREE.LineBasicMaterial; shadow: THREE.MeshBasicMaterial; base: THREE.Vector3; yaw: number };
  const cards: Card[] = [];
  const loads: Promise<void>[] = [];
  CARD_IMAGES.forEach((_, i) => {
    const group = new THREE.Group();
    const photo = track(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, toneMapped: false }));
    const url = opts.urls[i];
    loads.push(
      new Promise<void>((res) => {
        if (!url) return res();
        loader.load(
          url,
          (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
            tex.generateMipmaps = true;
            photo.map = track(tex);
            photo.needsUpdate = true;
            res();
          },
          undefined,
          () => res(),
        );
      }),
    );
    const frame = track(goldMat.clone());
    frame.transparent = true;
    const line = track(new THREE.LineBasicMaterial({ color: 0xb9944f, transparent: true, opacity: 0.85 }));
    const shadow = track(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.55, toneMapped: false }));
    const sh = new THREE.Mesh(shadowGeo, shadow);
    sh.position.set(0.05, -0.1, -0.05);
    const fr = new THREE.Mesh(frameGeo, frame);
    fr.position.z = -0.004;
    const ph = new THREE.Mesh(cardGeo, photo);
    const ln = new THREE.LineLoop(lineGeo, line);
    group.add(sh, fr, ph, ln);
    // окно чуть снаружи нити — нить проходит за кадром, а не поперёк фото
    const base = helix(i, R + 0.18);
    group.position.copy(base);
    const yaw = Math.PI / 2 - theta(i) - 0.16;
    group.rotation.y = yaw;
    scene.add(group);
    cards.push({ group, photo, frame, line, shadow, base, yaw });
  });

  /* ---------- Пчела ---------- */
  const bee = createBee();
  const beeScale = opts.mobile ? 0.62 : 0.78;
  bee.root.scale.setScalar(beeScale);
  scene.add(bee.root);
  disposables.push(bee);

  /* ---------- Пылинки: шлейф за пчелой и плавающие блики ---------- */
  const dotTex = track(dotTexture());
  const TRAIL = opts.mobile ? 70 : 120;
  const trailPos = new Float32Array(TRAIL * 3);
  const trailVel = new Float32Array(TRAIL * 3);
  const trailAlpha = new Float32Array(TRAIL);
  const trailSize = new Float32Array(TRAIL);
  const trailLife = new Float32Array(TRAIL);
  const trailGeo = track(new THREE.BufferGeometry());
  trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
  trailGeo.setAttribute("alpha", new THREE.BufferAttribute(trailAlpha, 1));
  trailGeo.setAttribute("size", new THREE.BufferAttribute(trailSize, 1));
  const dustMat = track(dustMaterial(dotTex, dpr));
  const trail = new THREE.Points(trailGeo, dustMat);
  trail.frustumCulled = false;
  scene.add(trail);
  let trailHead = 0;

  const FLOAT = opts.mobile ? 90 : 160;
  const floatPos = new Float32Array(FLOAT * 3);
  const floatSeed = new Float32Array(FLOAT);
  const floatAlpha = new Float32Array(FLOAT);
  const floatSize = new Float32Array(FLOAT);
  for (let i = 0; i < FLOAT; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 0.6 + Math.random() * 4.2;
    floatPos.set([r * Math.cos(a), -2 + Math.random() * 12.5, r * Math.sin(a)], i * 3);
    floatSeed[i] = Math.random() * 100;
    floatAlpha[i] = 0.25 + Math.random() * 0.45;
    floatSize[i] = 0.035 + Math.random() * 0.06;
  }
  const floatGeo = track(new THREE.BufferGeometry());
  floatGeo.setAttribute("position", new THREE.BufferAttribute(floatPos, 3));
  floatGeo.setAttribute("alpha", new THREE.BufferAttribute(floatAlpha, 1));
  floatGeo.setAttribute("size", new THREE.BufferAttribute(floatSize, 1));
  const floats = new THREE.Points(floatGeo, dustMat);
  floats.frustumCulled = false;
  scene.add(floats);

  /* ---------- Состояние ---------- */
  let target = 0;
  let cur = 0;
  const ptr = { tx: 0, ty: 0, x: 0, y: 0 };
  let width = 1;
  let height = 1;
  let aspect = 1;
  let running = false;
  let raf = 0;
  let last = performance.now();
  const t0 = performance.now();
  const camPos = new THREE.Vector3();
  const camTarget = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const beePos = new THREE.Vector3();
  const beePrev = new THREE.Vector3();
  const beeTarget = new THREE.Vector3();
  const beeLook = new THREE.Vector3();
  const weights = STAGES.map(() => 0);
  let initialized = false;
  let low = false;

  // Сдвиг кадра: окно в фокусе чуть выше центра (снизу — фраза этапа);
  // на вступлении на широком экране спираль правее, заголовок слева
  let offX = 0;
  let offY = 0;
  function applyOffset(force = false) {
    if (opts.capture) {
      camera.clearViewOffset();
      camera.updateProjectionMatrix();
      return;
    }
    const introK = 1 - smooth(0.0, 0.075, cur);
    const x = aspect >= 1.1 ? -0.17 * width * introK : 0;
    const y = height * (aspect < 0.8 ? 0.1 : 0.07) * (1 - introK * 0.6);
    if (!force && Math.abs(x - offX) < 0.5 && Math.abs(y - offY) < 0.5) return;
    offX = x;
    offY = y;
    camera.setViewOffset(width, height, x, y, width, height);
    camera.updateProjectionMatrix();
  }

  function keyAt(p: number) {
    let i = 0;
    while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
    const a = KEYS[i];
    const b = KEYS[i + 1];
    const t = smooth(a.p, b.p, p);
    const pair = (a.pair ?? 0) + ((b.pair ?? 0) - (a.pair ?? 0)) * t;
    // на узком (портретном) экране пара окон не помещается — отъезжаем дальше
    const pull = a.pull + (b.pull - a.pull) * t + (aspect < 0.8 ? pair * 0.75 : 0);
    return { u: a.u + (b.u - a.u) * t, pull, top: a.top + (b.top - a.top) * t };
  }

  const dist = () => (opts.capture && !opts.overview ? 3.3 : aspect < 0.8 ? 4.3 : aspect < 1.2 ? 4.2 : 4.25);

  function update(time: number) {
    const p = cur;
    const k = keyAt(p);
    const t = opts.capture ? 1.7 : (time - t0) / 1000;
    for (let i = 0; i < STAGES.length; i++) weights[i] = stageWeight(p, i);
    const finalW = smooth(0.84, 0.93, p);
    const top = k.top;
    const d = dist();

    /* Окна: в фокусе — крупнее; на виде сверху лестница ложится «в колодец», верхние окна гаснут */
    cards.forEach((c, i) => {
      const focus = 1 - smooth(0.15, 1.05, Math.abs(k.u - i));
      let s = 0.86 + 0.16 * focus;
      c.group.position.copy(c.base);
      c.group.rotation.set(0, c.yaw, 0, "YXZ");
      let alpha = 1;
      if (i === 3 && top > 0) {
        tmp.set(0, c.base.y + 0.15, 0);
        c.group.position.lerp(tmp, top);
        // лёжа лицом вверх, «верх» кадра — к верху экрана (камера сверху развёрнута на тот же угол)
        c.group.rotation.set((-Math.PI / 2) * top, c.yaw, 0, "YXZ");
        s *= 1 + 0.25 * top;
      }
      if (i > 3) alpha = 1 - top * smooth(3, 4, i);
      if (i < 3) alpha = 1 - top * 0.35;
      if (!opts.overview) alpha *= 1 - 0.68 * smooth(0.84, 0.94, p);
      c.group.scale.setScalar(s);
      c.photo.opacity = alpha;
      c.frame.opacity = alpha;
      c.line.opacity = 0.85 * alpha;
      c.shadow.opacity = (low ? 0 : 0.5) * alpha * (1 - top * (i === 3 ? 1 : 0));
      c.group.visible = alpha > 0.01;
    });
    clip.constant = top > 0.01 ? 3 * DY + 0.75 + (1 - top) * 30 : 1e4;

    /* Камера */
    const thC = theta(k.u) + 0.24 + ptr.x * 0.12;
    const radial = R + d * k.pull;
    const lift = 0.22 + (k.pull - 1) * 1.05 + ptr.y * -0.25;
    camPos.set(radial * Math.cos(thC), k.u * DY + lift, radial * Math.sin(thC));
    helix(k.u, R, camTarget);
    // при отъезде взгляд смещается к оси — видна вся спираль
    camTarget.lerp(tmp.set(0, k.u * DY, 0), clamp01((k.pull - 1) * 0.55));
    // вид сверху на лестницу
    if (top > 0) {
      const y3 = 3 * DY + 0.15;
      tmp.set(0.02, y3 + (opts.mobile ? 5.6 : 4.4), 0.9);
      // ориентируем «верх» кадра лестницы к верху экрана
      tmp.applyAxisAngle(new THREE.Vector3(0, 1, 0), cards[3].yaw);
      camPos.lerp(tmp, top);
      camTarget.lerp(tmp2.set(0, y3, 0), top);
    }
    applyOffset();
    camera.position.copy(camPos);
    camera.lookAt(camTarget);
    camera.updateMatrixWorld();
    const cd = camPos.distanceTo(camTarget);
    fog.near = cd * (opts.overview ? 0.62 : 0.92);
    fog.far = opts.overview ? cd * 2.1 : cd * (2.4 + top * 0.8 + finalW * 0.5);

    /* Пчела */
    beePrev.copy(beePos);
    let flap = 1;
    const introW = 1 - smooth(0.0, 0.07, p);
    if (introW > 0) {
      // вылетает из центральной соты
      tmp.copy(combBase).add(tmp2.set(0, 0.12 + (1 - introW) * 1.2, 0));
      beeTarget.copy(tmp);
    } else beeTarget.set(0, 0, 0);
    // полёт по нити чуть впереди камеры
    // у правого верхнего угла окна в фокусе (в координатах окна), между окнами — по нити
    {
      const i0 = Math.max(0, Math.min(cards.length - 1, Math.floor(k.u)));
      const i1 = Math.max(0, Math.min(cards.length - 1, i0 + 1));
      const f = clamp01(k.u - Math.floor(k.u));
      const corner = (i: number, out: THREE.Vector3) => {
        cards[i].group.updateMatrixWorld();
        return cards[i].group.localToWorld(out.set(aspect < 0.8 ? 0.36 : 0.66, aspect < 0.8 ? 1.0 : 0.84, aspect < 0.8 ? 0.4 : 0.22));
      };
      corner(i0, tmp);
      if (f > 0 && i1 !== i0) tmp.lerp(corner(i1, tmp2), smooth(0, 1, f));
      if (k.u < 0) tmp.lerp(helix(k.u, R + 0.6, tmp2).add(new THREE.Vector3(0, 0.5, 0)), clamp01(-k.u));
      tmp.y += Math.sin(t * 1.9) * 0.05;
      tmp.x += Math.sin(t * 2.7) * 0.035;
      tmp.z += Math.cos(t * 2.3) * 0.035;
    }
    if (introW > 0) beeTarget.lerp(tmp, 1 - introW);
    else beeTarget.copy(tmp);
    if (opts.overview) {
      cards[4].group.updateMatrixWorld();
      cards[4].group.localToWorld(beeTarget.set(0.7, 1.0, 0.5));
    }
    if (top > 0) {
      const y3 = 3 * DY + 0.15;
      tmp.set(Math.cos(t * 0.9) * 1.3, y3 + 0.9 + Math.sin(t * 2.1) * 0.05, Math.sin(t * 0.9) * 1.3);
      beeTarget.lerp(tmp, top);
    }
    // финал: посадка на «Записаться»
    const land = finalW > 0 && opts.landing ? opts.landing() : null;
    if (land && finalW > 0) {
      const ndc = new THREE.Vector3((land.x / width) * 2 - 1, -(land.y / height) * 2 + 1, 0.5).unproject(camera);
      ndc.sub(camera.position).normalize();
      tmp.copy(camera.position).addScaledVector(ndc, 4.6);
      beeTarget.lerp(tmp, finalW);
      flap = 1 - 0.85 * smooth(0.93, 0.99, p);
    }
    const dt = Math.min(0.05, (time - last) / 1000);
    if (!initialized || opts.capture) {
      beePos.copy(beeTarget);
      beePrev.copy(beePos).add(tmp.set(-0.01, 0, 0));
      initialized = true;
    } else {
      // вблизи окна — зависает и подрагивает; в пути — плавно догоняет
      const kk = 1 - Math.exp(-dt * (finalW > 0.5 ? 6 : 3.4));
      beePos.lerp(beeTarget, kk);
      if (beePos.distanceTo(beeTarget) < 0.08) beePos.add(tmp.set(Math.sin(t * 31) * 0.004, Math.cos(t * 27) * 0.004, 0));
    }
    bee.root.position.copy(beePos);
    if (import.meta.env.DEV) (window as unknown as { __bee?: unknown }).__bee = { pos: beePos.toArray(), target: beeTarget.toArray(), land, finalW };
    // ориентация: по направлению полёта, при зависании — вполоборота к камере
    tmp.copy(beePos).sub(beePrev);
    const speed = tmp.length() / Math.max(dt, 0.001);
    if (speed > 0.25 && !opts.capture) beeLook.lerp(tmp.normalize(), 0.18);
    else beeLook.lerp(tmp2.copy(camera.position).sub(beePos).normalize().cross(camera.up).negate().add(tmp.set(0, 0.25, 0)).normalize(), 0.08);
    if (opts.capture) beeLook.copy(camera.position).sub(beePos).normalize().cross(camera.up).negate().add(tmp.set(0, 0.2, 0)).normalize();
    if (beeLook.lengthSq() > 1e-6) bee.root.lookAt(tmp.copy(beePos).add(beeLook));
    bee.root.rotateZ(Math.sin(t * 3.1) * 0.12);
    // на рендерах — крылья подняты (красивая фаза взмаха)
    bee.update(opts.capture ? Math.PI / 360 : t, flap);
    if (opts.beeCloseup) {
      camera.position.copy(beePos).add(tmp.set(0.55, 0.35, 0.75));
      camera.lookAt(beePos);
    }
    bee.root.scale.setScalar(beeScale * (1 - finalW * 0.25));

    /* Шлейф */
    if (!opts.capture) {
      const emit = speed > 0.15 ? 2 : Math.random() < 0.25 ? 1 : 0;
      for (let e = 0; e < emit; e++) {
        const i = trailHead;
        trailHead = (trailHead + 1) % TRAIL;
        trailPos[i * 3] = beePos.x + (Math.random() - 0.5) * 0.05;
        trailPos[i * 3 + 1] = beePos.y + (Math.random() - 0.5) * 0.05 - 0.03;
        trailPos[i * 3 + 2] = beePos.z + (Math.random() - 0.5) * 0.05;
        trailVel[i * 3] = (Math.random() - 0.5) * 0.06;
        trailVel[i * 3 + 1] = -0.05 - Math.random() * 0.06;
        trailVel[i * 3 + 2] = (Math.random() - 0.5) * 0.06;
        trailLife[i] = 1;
        trailSize[i] = 0.03 + Math.random() * 0.035;
      }
      for (let i = 0; i < TRAIL; i++) {
        if (trailLife[i] <= 0) {
          trailAlpha[i] = 0;
          continue;
        }
        trailLife[i] -= dt / 1.7;
        trailPos[i * 3] += trailVel[i * 3] * dt;
        trailPos[i * 3 + 1] += trailVel[i * 3 + 1] * dt;
        trailPos[i * 3 + 2] += trailVel[i * 3 + 2] * dt;
        trailAlpha[i] = Math.max(0, trailLife[i]) ** 1.6 * 0.95;
      }
      trailGeo.attributes.position.needsUpdate = true;
      trailGeo.attributes.alpha.needsUpdate = true;
      trailGeo.attributes.size.needsUpdate = true;
    }

    /* Плавающие блики */
    for (let i = 0; i < FLOAT; i++) {
      const s = floatSeed[i];
      floatPos[i * 3 + 1] += Math.sin(t * 0.3 + s) * 0.0009;
      floatAlpha[i] = (0.2 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.7 + s * 3))) * (low && i % 2 ? 0 : 1);
    }
    floatGeo.attributes.position.needsUpdate = true;
    floatGeo.attributes.alpha.needsUpdate = true;

    // соты основания уходят в туман при подъёме
    comb.visible = p < 0.085;
  }

  // Медленные кадры (< 40 fps за 2 с): снижаем pixelRatio, частицы и мягкие тени
  let frames = 0;
  let acc = 0;
  let checked = false;
  function adapt(rawDt: number) {
    if (checked || opts.capture) return;
    frames++;
    acc += rawDt;
    if (acc < 2) return;
    const fps = frames / acc;
    if (fps < 40) {
      low = true;
      dpr = 1;
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      trailGeo.setDrawRange(0, Math.floor(TRAIL / 2));
      floatGeo.setDrawRange(0, Math.floor(FLOAT / 2));
      dustMat.uniforms.scale.value = 260 * dpr;
    }
    checked = true;
  }

  function frame(now: number) {
    const rawDt = (now - last) / 1000;
    adapt(rawDt);
    const dt = Math.min(0.05, rawDt);
    // плавное доведение прогресса: эквивалент lerp 0,07 за кадр при 60 fps
    const k = 1 - Math.pow(1 - 0.07, dt * 60);
    cur += (target - cur) * k;
    ptr.x += (ptr.tx - ptr.x) * k;
    ptr.y += (ptr.ty - ptr.y) * k;
    update(now);
    last = now;
    renderer.render(scene, camera);
    onFrame({ p: cur, weights, final: smooth(0.86, 0.94, cur), intro: 1 - smooth(0.02, 0.06, cur) });
    if (running) raf = requestAnimationFrame(frame);
  }

  const ready = Promise.all(loads).then(() => undefined);

  return {
    ready,
    setProgress: (p, instant) => {
      target = clamp01(p);
      // __qbSnap — для автоматических скриншотов: без плавного доведения (программный WebGL медленный)
      if (instant || (window as unknown as { __qbSnap?: boolean }).__qbSnap) {
        cur = target;
        initialized = false;
      }
    },
    setPointer: (x, y) => {
      ptr.tx = x;
      ptr.ty = y;
    },
    resize: (w, h) => {
      width = Math.max(1, w);
      height = Math.max(1, h);
      aspect = width / height;
      renderer.setSize(width, height, false);
      camera.aspect = aspect;
      camera.fov = aspect < 0.8 ? 50 : aspect < 1.2 ? 44 : 36;
      applyOffset(true);
    },
    start: () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop: () => {
      running = false;
      cancelAnimationFrame(raf);
    },
    renderOnce: () => {
      const now = performance.now();
      update(now);
      last = now;
      renderer.render(scene, camera);
    },
    dispose: () => {
      running = false;
      cancelAnimationFrame(raf);
      disposables.forEach((d) => d.dispose());
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
