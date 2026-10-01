import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { buildCar, STAGE_IDS, type StageId } from "./buildCar";

/**
 * 3D-сцена «Внедорожник по деталям».
 * Прогресс прокрутки p ∈ [0, 1] управляет разборкой машины и полётом камеры.
 * Отрисовка идёт только пока сцена на экране (start/stop снаружи).
 */

export const STAGES: { id: StageId; from: number; to: number }[] = [
  { id: "obves", from: 0.1, to: 0.27 },
  { id: "ac", from: 0.27, to: 0.44 },
  { id: "engine", from: 0.44, to: 0.61 },
  { id: "heater", from: 0.61, to: 0.78 },
  { id: "chassis", from: 0.78, to: 0.93 },
];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const windowW = (p: number, a: number, b: number, edge = 0.045) => smooth(a, a + edge, p) * (1 - smooth(b - edge, b, p));
export const stageWeight = (p: number, s: { from: number; to: number }) => windowW(p, s.from, s.to);

type V3 = [number, number, number];
const KEYS: { p: number; pos: V3; target: V3 }[] = [
  { p: 0.0, pos: [6.5, 2.35, 6.5], target: [0.1, 0.95, 0] },
  { p: 0.08, pos: [5.6, 2.0, 5.5], target: [0.25, 0.95, 0] },
  { p: 0.185, pos: [6.9, 2.6, 4.6], target: [0.9, 1.15, 0] }, // обвес
  { p: 0.355, pos: [6.0, 4.2, 3.0], target: [1.6, 1.35, 0] }, // кондиционер
  { p: 0.525, pos: [5.2, 2.9, 5.0], target: [1.3, 1.55, 0] }, // двигатель
  { p: 0.695, pos: [5.0, 3.0, 5.6], target: [0.15, 1.3, 0] }, // печка
  { p: 0.855, pos: [1.4, 1.6, 8.4], target: [-0.1, 1.2, 0] }, // ходовая
  { p: 1.0, pos: [7.9, 2.9, 6.5], target: [0.0, 0.95, 0] },
];

export interface FrameInfo {
  p: number;
  weights: Record<StageId, number>;
  active: StageId | null;
  hotspot: { x: number; y: number } | null;
}

export interface CarScene {
  /** instant — без плавного доведения (для переходов по шагам и тестов) */
  setProgress: (p: number, instant?: boolean) => void;
  setPointer: (x: number, y: number) => void;
  resize: (w: number, h: number) => void;
  start: () => void;
  stop: () => void;
  dispose: () => void;
}

export function createCarScene(canvas: HTMLCanvasElement, onFrame: (f: FrameInfo) => void, opts: { mobile: boolean }): CarScene | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.mobile ? 1.5 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0x0f0f10, 1);

  const scene = new THREE.Scene();
  const fog = new THREE.Fog(0x0f0f10, 9, 17);
  scene.fog = fog;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.42;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);

  /* ---------- Свет: «ночная смена» ---------- */
  scene.add(new THREE.HemisphereLight(0x7d8798, 0x0b0b0c, 0.32));
  const key = new THREE.DirectionalLight(0xfff4e6, 2.6);
  key.position.set(4.5, 7.5, 5.5);
  key.castShadow = true;
  key.shadow.mapSize.set(opts.mobile ? 1024 : 2048, opts.mobile ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -4.5, right: 4.5, top: 4.5, bottom: -4.5, near: 1, far: 22 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6f8cff, 1.25);
  rim.position.set(-6, 5.5, -5);
  scene.add(rim);
  const warm = new THREE.PointLight(0xf6b400, 7, 9, 2);
  warm.position.set(4.2, 0.6, 2.4);
  scene.add(warm);

  /* ---------- Пол бокса: сетка, разметка подъёмника ---------- */
  const floor = new THREE.Mesh(new THREE.CircleGeometry(12, 72), new THREE.MeshStandardMaterial({ color: 0x0e0f11, roughness: 1, metalness: 0 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const grid = new THREE.GridHelper(18, 36, 0x3a3d42, 0x24262a);
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.55;
  grid.position.y = 0.002;
  scene.add(grid);
  const lineMat = new THREE.LineBasicMaterial({ color: 0xf6b400, transparent: true, opacity: 0.85 });
  const W = 3.1;
  const L = 3.2;
  const c = 0.45;
  const corners: [number, number, number, number][] = [
    [L, W, -1, -1],
    [L, -W, -1, 1],
    [-L, W, 1, -1],
    [-L, -W, 1, 1],
  ];
  for (const [x, z, dx, dz] of corners) {
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x + dx * c, 0.004, z),
      new THREE.Vector3(x, 0.004, z),
      new THREE.Vector3(x, 0.004, z + dz * c),
    ]);
    scene.add(new THREE.Line(g, lineMat));
  }
  const outline = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(L, 0.003, W), new THREE.Vector3(L, 0.003, -W), new THREE.Vector3(-L, 0.003, -W), new THREE.Vector3(-L, 0.003, W)]),
    new THREE.LineBasicMaterial({ color: 0xf6b400, transparent: true, opacity: 0.18 }),
  );
  scene.add(outline);

  /* ---------- Машина ---------- */
  const car = buildCar();
  scene.add(car.root);
  const G = car.groups;
  const base = new Map<THREE.Object3D, THREE.Vector3>();
  const remember = (o: THREE.Object3D) => base.set(o, o.position.clone());
  [G.frontBumper, G.winch, G.lightbar, G.stepL, G.stepR, G.rack, G.snorkel, G.rearBumper, G.carrier, G.body, G.frontClip, G.engine, G.compressor, G.condenser, G.heater, ...G.wheels].forEach(remember);
  const off = (o: THREE.Object3D, x: number, y: number, z: number) => {
    const b = base.get(o)!;
    o.position.set(b.x + x, b.y + y, b.z + z);
  };

  /* ---------- Состояние ---------- */
  let target = 0;
  let cur = 0;
  const ptr = { tx: 0, ty: 0, x: 0, y: 0 };
  let aspect = 1;
  let width = 1;
  let height = 1;
  let running = false;
  let raf = 0;
  let last = 0;
  const t0 = performance.now();
  const camPos = new THREE.Vector3();
  const camTarget = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const weights = Object.fromEntries(STAGE_IDS.map((id) => [id, 0])) as Record<StageId, number>;

  // Сдвиг кадра: на широком экране — по горизонтали (текст слева, машина правее),
  // на узком — по вертикали (на вступлении текст сверху, машина ниже; дальше карточки снизу — машина выше)
  let shift = -0.15;
  let lift = 0.14;
  function applyOffset() {
    if (aspect >= 1.1) camera.setViewOffset(width, height, width * shift, 0, width, height);
    else camera.setViewOffset(width, height, 0, height * lift, width, height);
    camera.updateProjectionMatrix();
  }

  function cameraAt(p: number) {
    let i = 0;
    while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
    const a = KEYS[i];
    const b = KEYS[i + 1];
    const t = smooth(a.p, b.p, p);
    camPos.set(...a.pos).lerp(tmp.set(...b.pos), t);
    camTarget.set(...a.target).lerp(tmp.set(...b.target), t);
    // Узкий экран: отодвигаем камеру умеренно — машина занимает ширину телефона
    let f = aspect >= 1.25 ? 1 : aspect <= 0.75 ? 1.68 : 1 + (1.25 - aspect) * 1.36;
    // На вступлении у телефона машина целиком, с запасом по бокам
    if (aspect < 1.1) f *= 1 + 0.06 * (1 - smooth(0, 0.1, p));
    camPos.sub(camTarget).multiplyScalar(f);
    // Туман считаем от реальной дистанции — иначе издалека машина «тонет»
    const d = camPos.length();
    fog.near = d * 0.95;
    fog.far = d * 1.85;
    // Лёгкий облёт за курсором
    const yaw = ptr.x * 0.22;
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const x = camPos.x * cos - camPos.z * sin;
    const z = camPos.x * sin + camPos.z * cos;
    camPos.set(x, camPos.y + ptr.y * -0.6, z).add(camTarget);
    camera.position.copy(camPos);
    camera.lookAt(camTarget);
  }

  function update(time: number) {
    const p = cur;
    for (const s of STAGES) weights[s.id] = stageWeight(p, s);
    const w = weights;
    const hoodW = windowW(p, 0.27, 0.61);
    const bodyW = windowW(p, 0.61, 0.93);

    // Обвес
    off(G.frontBumper, 0.55 * w.obves, 0, 0);
    off(G.winch, 1.0 * w.obves, 0, 0);
    off(G.lightbar, 0.62 * w.obves, 0.32 * w.obves, 0);
    off(G.stepL, 0, -0.04 * w.obves, -0.6 * w.obves);
    off(G.stepR, 0, -0.04 * w.obves, 0.6 * w.obves);
    off(G.rack, 0, 0.75 * w.obves, 0);
    off(G.snorkel, 0.1 * w.obves, 0.12 * w.obves, 0.55 * w.obves);
    off(G.rearBumper, -0.55 * w.obves, 0, 0);
    off(G.carrier, -1.0 * w.obves, 0.08 * w.obves, 0);
    // Кондиционер и двигатель: капот открыт на обоих этапах
    G.hood.rotation.z = 1.12 * hoodW;
    off(G.condenser, 0.2 * w.ac, 1.0 * w.ac, 0);
    G.condenser.rotation.y = 0.35 * w.ac;
    off(G.compressor, 0.25 * w.ac, 0.55 * w.ac, 0.35 * w.ac);
    off(G.engine, 0, 1.05 * w.engine, 0);
    G.engine.rotation.y = 0.5 * w.engine;
    // Печка и ходовая: кузов поднят
    off(G.body, -0.75 * w.heater - 0.1 * bodyW, 1.35 * bodyW + 0.3 * w.chassis, 0);
    off(G.heater, 0.05 * w.heater, 0.6 * w.heater, 0);
    G.heater.rotation.y = -0.6 * w.heater;
    off(G.frontClip, 0, 1.55 * w.chassis, 0);
    G.wheels.forEach((wh, i) => off(wh, 0, 0, (i % 2 === 0 ? -1 : 1) * 0.6 * w.chassis));
    G.tires.forEach((t) => (t.rotation.z = -w.chassis * 2.4));

    for (const id of STAGE_IDS) car.setHighlight(id, w[id]);

    // Вступление и финал: текст слева — машина правее
    const intro = 1 - smooth(0, 0.1, p);
    const edge = Math.max(intro, smooth(0.92, 0.99, p));
    const nextShift = -0.12 - 0.07 * edge;
    const nextLift = 0.14 - 0.36 * intro;
    if (Math.abs(nextShift - shift) > 0.0005 || Math.abs(nextLift - lift) > 0.0005) {
      shift = nextShift;
      lift = nextLift;
      applyOffset();
    }
    // Вступление: машина слегка «дышит» на месте
    car.root.rotation.y = intro * Math.sin((time - t0) / 1000 * 0.45) * 0.14;

    cameraAt(p);
  }

  function hotspotOf(active: StageId | null) {
    if (!active) return null;
    car.anchors[active].getWorldPosition(tmp);
    tmp.project(camera);
    if (tmp.z > 1) return null;
    return { x: (tmp.x * 0.5 + 0.5) * width, y: (-tmp.y * 0.5 + 0.5) * height };
  }

  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const k = 1 - Math.exp(-dt * 7);
    cur += (target - cur) * k;
    ptr.x += (ptr.tx - ptr.x) * k;
    ptr.y += (ptr.ty - ptr.y) * k;
    update(now);
    renderer.render(scene, camera);
    let active: StageId | null = null;
    let best = 0.5;
    for (const id of STAGE_IDS) if (weights[id] > best) ((best = weights[id]), (active = id));
    onFrame({ p: cur, weights, active, hotspot: hotspotOf(active) });
    if (running) raf = requestAnimationFrame(frame);
  }

  return {
    setProgress: (p, instant) => {
      target = clamp01(p);
      if (instant) cur = target;
    },
    setPointer: (x, y) => ((ptr.tx = x), (ptr.ty = y)),
    resize: (w, h) => {
      width = Math.max(1, w);
      height = Math.max(1, h);
      aspect = width / height;
      renderer.setSize(width, height, false);
      camera.aspect = aspect;
      camera.fov = aspect < 1 ? 40 : 30;
      applyOffset();
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
    dispose: () => {
      running = false;
      cancelAnimationFrame(raf);
      car.dispose();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
