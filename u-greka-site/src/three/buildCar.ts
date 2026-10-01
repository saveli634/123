import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * Процедурная 3D-модель внедорожника в духе Land Cruiser 70 — без внешних файлов.
 * Оси: X — вперёд (перед машины в +X), Y — вверх, Z — вправо. Единицы ≈ метры.
 *
 * Каждый узел — отдельная группа, чтобы сцена могла «разбирать» машину по этапам
 * (обвес, кондиционер, двигатель, печка, ходовая) и подсвечивать нужные детали.
 */

export type StageId = "obves" | "ac" | "engine" | "heater" | "chassis";
export const STAGE_IDS: StageId[] = ["obves", "ac", "engine", "heater", "chassis"];

const YELLOW = new THREE.Color("#f6b400");

export interface CarModel {
  root: THREE.Group;
  groups: {
    chassis: THREE.Group;
    body: THREE.Group;
    frontClip: THREE.Group;
    hood: THREE.Group;
    frontBumper: THREE.Group;
    winch: THREE.Group;
    lightbar: THREE.Group;
    stepL: THREE.Group;
    stepR: THREE.Group;
    rack: THREE.Group;
    snorkel: THREE.Group;
    rearBumper: THREE.Group;
    carrier: THREE.Group;
    engine: THREE.Group;
    compressor: THREE.Group;
    condenser: THREE.Group;
    heater: THREE.Group;
    wheels: THREE.Group[]; // FL, FR, RL, RR
    tires: THREE.Object3D[]; // вращаются при «качении»
  };
  anchors: Record<StageId, THREE.Object3D>;
  /** Подсветка этапа: 0..1 */
  setHighlight: (stage: StageId, w: number) => void;
  dispose: () => void;
}

/* ------------------------------------------------------------------ */

function materials() {
  const m = {
    body: new THREE.MeshPhysicalMaterial({ color: "#e9e6de", roughness: 0.38, metalness: 0.08, clearcoat: 0.7, clearcoatRoughness: 0.22 }),
    glass: new THREE.MeshPhysicalMaterial({ color: "#0b0d10", roughness: 0.06, metalness: 0.3, side: THREE.DoubleSide }),
    black: new THREE.MeshStandardMaterial({ color: "#16171a", roughness: 0.55, metalness: 0.35 }),
    trim: new THREE.MeshStandardMaterial({ color: "#101113", roughness: 0.82, metalness: 0.05 }),
    chrome: new THREE.MeshStandardMaterial({ color: "#d9dde2", roughness: 0.16, metalness: 1 }),
    rubber: new THREE.MeshStandardMaterial({ color: "#121214", roughness: 0.95, metalness: 0 }),
    rim: new THREE.MeshStandardMaterial({ color: "#a8743f", roughness: 0.36, metalness: 0.7 }),
    rimDark: new THREE.MeshStandardMaterial({ color: "#3a2a1a", roughness: 0.6, metalness: 0.4 }),
    alu: new THREE.MeshStandardMaterial({ color: "#9298a0", roughness: 0.42, metalness: 0.75 }),
    engine: new THREE.MeshStandardMaterial({ color: "#2b2d31", roughness: 0.6, metalness: 0.45 }),
    steel: new THREE.MeshStandardMaterial({ color: "#26282c", roughness: 0.5, metalness: 0.6 }),
    disc: new THREE.MeshStandardMaterial({ color: "#7d8288", roughness: 0.35, metalness: 0.85 }),
    seat: new THREE.MeshStandardMaterial({ color: "#2a2c30", roughness: 0.92, metalness: 0 }),
    blue: new THREE.MeshStandardMaterial({ color: "#2f6bff", roughness: 0.4, metalness: 0.4 }),
    yellow: new THREE.MeshStandardMaterial({ color: "#f6b400", roughness: 0.45, metalness: 0.2 }),
    rope: new THREE.MeshStandardMaterial({ color: "#8c8c88", roughness: 0.9, metalness: 0 }),
    head: new THREE.MeshStandardMaterial({ color: "#fff6e0", emissive: "#fff1cc", emissiveIntensity: 0.7, roughness: 0.2 }),
    amber: new THREE.MeshStandardMaterial({ color: "#ff9a1a", emissive: "#ff8a00", emissiveIntensity: 0.5, roughness: 0.3 }),
    red: new THREE.MeshStandardMaterial({ color: "#9b1010", emissive: "#d01818", emissiveIntensity: 0.55, roughness: 0.3 }),
    led: new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#eaf2ff", emissiveIntensity: 1.6, roughness: 0.2 }),
    fins: new THREE.MeshStandardMaterial({ color: "#3d434b", roughness: 0.55, metalness: 0.6 }),
  };
  return m;
}
type Mats = ReturnType<typeof materials>;

function rbox(w: number, h: number, d: number, mat: THREE.Material, r = 0.02, seg = 2) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3)), mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.box = [w, h, d];
  return mesh;
}

/** Цилиндр, ось вдоль заданной оси */
function cyl(r: number, len: number, mat: THREE.Material, axis: "x" | "y" | "z" = "y", seg = 28, r2 = r) {
  const g = new THREE.CylinderGeometry(r, r2, len, seg);
  if (axis === "x") g.rotateZ(Math.PI / 2);
  if (axis === "z") g.rotateX(Math.PI / 2);
  const mesh = new THREE.Mesh(g, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Труба между двумя точками */
function rod(a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material, seg = 14) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dir.length(), seg), mat);
  mesh.position.copy(a).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = true;
  return mesh;
}

function tube(points: THREE.Vector3[], r: number, mat: THREE.Material, closed = false, tension = 0.5) {
  const curve = new THREE.CatmullRomCurve3(points, closed, "catmullrom", tension);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, points.length * 16, r, 10, closed), mat);
  mesh.castShadow = true;
  return mesh;
}

function at<T extends THREE.Object3D>(o: T, x: number, y: number, z: number, parent?: THREE.Object3D) {
  o.position.set(x, y, z);
  parent?.add(o);
  return o;
}

class Helix extends THREE.Curve<THREE.Vector3> {
  constructor(private r: number, private h: number, private turns: number) {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const a = t * Math.PI * 2 * this.turns;
    return target.set(Math.cos(a) * this.r, t * this.h, Math.sin(a) * this.r);
  }
}

/** Текстура «рёбер» для радиаторов */
function finTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 8;
  const g = c.getContext("2d")!;
  g.fillStyle = "#3d434b";
  g.fillRect(0, 0, 64, 8);
  g.fillStyle = "#6c7480";
  for (let x = 0; x < 64; x += 4) g.fillRect(x, 0, 1, 8);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10, 1);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ------------------------------------------------------------------ */

const R_TIRE = 0.43;
const AXLE_F = 1.3;
const AXLE_R = -1.43;
const TRACK = 0.83;
const ARCH_R = 0.58;
const SILL = 0.64;

function wheel(m: Mats) {
  const g = new THREE.Group();
  const spin = new THREE.Group(); // всё, что вращается
  g.add(spin);

  // Шина — профиль, «прокрученный» вокруг оси
  const prof = [
    [0.26, -0.15], [0.36, -0.165], [0.405, -0.16], [0.425, -0.135], [R_TIRE, -0.09],
    [R_TIRE, 0.09], [0.425, 0.135], [0.405, 0.16], [0.36, 0.165], [0.26, 0.15],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const tireGeo = new THREE.LatheGeometry(prof, 56);
  tireGeo.rotateX(Math.PI / 2);
  const tire = new THREE.Mesh(tireGeo, m.rubber);
  tire.castShadow = true;
  spin.add(tire);

  // Грунтозацепы — инстансы
  const N = 26;
  const blockGeo = new RoundedBoxGeometry(0.05, 0.08, 0.12, 1, 0.012);
  const blocks = new THREE.InstancedMesh(blockGeo, m.rubber, N * 2);
  blocks.castShadow = true;
  const mtx = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3(1, 1, 1);
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < N; i++) {
      const a = (i + row * 0.5) * ((Math.PI * 2) / N);
      q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), a);
      const p = new THREE.Vector3(Math.cos(a) * (R_TIRE + 0.008), Math.sin(a) * (R_TIRE + 0.008), row ? 0.07 : -0.07);
      mtx.compose(p, q, s);
      blocks.setMatrixAt(row * N + i, mtx);
    }
  }
  spin.add(blocks);

  // Диск (бронза, как на фото)
  const barrel = cyl(0.262, 0.25, m.rimDark, "z", 40);
  spin.add(barrel);
  const face = cyl(0.27, 0.03, m.rim, "z", 40);
  at(face, 0, 0, 0.11, spin);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const spoke = rbox(0.2, 0.055, 0.03, m.rim, 0.012);
    spoke.position.set(Math.cos(a) * 0.13, Math.sin(a) * 0.13, 0.13);
    spoke.rotation.z = a;
    spin.add(spoke);
    const lug = cyl(0.012, 0.03, m.chrome, "z", 8);
    at(lug, Math.cos(a + Math.PI / 6) * 0.06, Math.sin(a + Math.PI / 6) * 0.06, 0.145, spin);
  }
  at(cyl(0.045, 0.03, m.rimDark, "z", 20), 0, 0, 0.145, spin);
  return { group: g, spin };
}

export function buildCar(): CarModel {
  const m = materials();
  const fins = finTexture();
  const finMat = new THREE.MeshStandardMaterial({ map: fins, roughness: 0.55, metalness: 0.6 });
  const condMat = new THREE.MeshStandardMaterial({ map: fins, color: "#9fb4ff", roughness: 0.5, metalness: 0.6 });

  const root = new THREE.Group();
  const chassis = at(new THREE.Group(), 0, 0, 0, root);
  const body = at(new THREE.Group(), 0, 0, 0, root);
  const frontClip = at(new THREE.Group(), 0, 0, 0, root);
  const hood = at(new THREE.Group(), 0.62, 1.31, 0, frontClip); // шарнир у лобового стекла

  /* ---------- Рама, мосты, подвеска ---------- */
  for (const z of [-0.48, 0.48]) at(rbox(4.5, 0.16, 0.1, m.steel, 0.02), -0.06, 0.58, z, chassis);
  for (const x of [2.0, 0.65, -0.8, -2.15]) at(rbox(0.1, 0.1, 0.96, m.steel, 0.015), x, 0.58, 0, chassis);
  // Пол салона и моторный отсек
  at(rbox(2.95, 0.04, 1.7, m.trim, 0.01), -0.85, 0.68, 0, chassis);
  at(rbox(1.6, 0.03, 1.52, m.trim, 0.01), 1.42, 0.67, 0, chassis);
  const axleMeshes: THREE.Mesh[] = [];
  for (const ax of [AXLE_F, AXLE_R]) {
    const housing = cyl(0.058, 1.62, m.steel, "z", 18);
    at(housing, ax, R_TIRE, 0, chassis);
    const diff = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 16), m.steel);
    diff.scale.set(1, 1, 0.8);
    diff.castShadow = true;
    at(diff, ax, R_TIRE, ax > 0 ? 0.12 : 0, chassis);
    axleMeshes.push(housing, diff);
  }
  // Раздатка и карданы
  const transfer = at(rbox(0.32, 0.22, 0.28, m.steel, 0.03), 0.15, 0.6, 0.05, chassis);
  chassis.add(rod(new THREE.Vector3(-1.3, 0.47, 0), new THREE.Vector3(0.0, 0.57, 0.05), 0.034, m.steel));
  chassis.add(rod(new THREE.Vector3(0.3, 0.56, 0.08), new THREE.Vector3(1.18, 0.45, 0.12), 0.03, m.steel));

  // Пружины, амортизаторы, тормоза — у каждого колеса
  const helixGeo = new THREE.TubeGeometry(new Helix(0.075, 0.36, 6.5), 160, 0.013, 6, false);
  const springMat = new THREE.MeshStandardMaterial({ color: "#3a3d42", roughness: 0.4, metalness: 0.6 });
  const suspension: THREE.Object3D[] = [];
  const brakes: THREE.Object3D[] = [];
  const hubs: [number, number][] = [
    [AXLE_F, -TRACK],
    [AXLE_F, TRACK],
    [AXLE_R, -TRACK],
    [AXLE_R, TRACK],
  ];
  for (const [x, z] of hubs) {
    const side = Math.sign(z);
    const spring = new THREE.Mesh(helixGeo, springMat);
    spring.castShadow = true;
    at(spring, x, 0.49, side * 0.58, chassis);
    const seat = at(rbox(0.2, 0.05, 0.2, m.steel, 0.01), x, 0.87, side * 0.58, chassis);
    const shockA = new THREE.Vector3(x + 0.2, 0.42, side * 0.6);
    const shockB = new THREE.Vector3(x + 0.2, 0.93, side * 0.56);
    const shockBody = rod(shockA, shockA.clone().lerp(shockB, 0.62), 0.034, m.engine);
    const shockRod = rod(shockA.clone().lerp(shockB, 0.6), shockB, 0.014, m.chrome);
    chassis.add(shockBody, shockRod);
    const disc = cyl(0.19, 0.026, m.disc, "z", 36);
    at(disc, x, R_TIRE, side * (TRACK - 0.13), chassis);
    const caliper = rbox(0.1, 0.15, 0.07, m.engine, 0.02);
    caliper.rotation.z = 0.6;
    at(caliper, x - 0.11, R_TIRE + 0.11, side * (TRACK - 0.13), chassis);
    suspension.push(spring, seat, shockBody, shockRod);
    brakes.push(disc, caliper);
  }

  /* ---------- Салон (виден, когда кузов поднят) ---------- */
  at(rbox(0.32, 0.32, 1.66, m.seat, 0.04), 0.4, 1.1, 0, chassis);
  for (const z of [-0.42, 0.42]) {
    at(rbox(0.5, 0.12, 0.5, m.seat, 0.04), -0.34, 0.86, z, chassis);
    const back = at(rbox(0.12, 0.62, 0.5, m.seat, 0.05), -0.62, 1.16, z, chassis);
    back.rotation.z = 0.18;
  }
  at(rbox(0.5, 0.12, 1.42, m.seat, 0.04), -1.42, 0.86, 0, chassis);
  const rb = at(rbox(0.12, 0.58, 1.42, m.seat, 0.05), -1.7, 1.14, 0, chassis);
  rb.rotation.z = 0.16;
  const wheelRing = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.022, 10, 36), m.engine);
  wheelRing.rotation.y = Math.PI / 2;
  wheelRing.rotation.x = 0.0;
  wheelRing.rotation.z = -0.45;
  at(wheelRing, 0.12, 1.32, -0.42, chassis);
  chassis.add(rod(new THREE.Vector3(0.12, 1.32, -0.42), new THREE.Vector3(0.42, 1.12, -0.42), 0.022, m.engine));

  /* ---------- Печка: радиатор отопителя за торпедо + патрубки ---------- */
  const heater = at(new THREE.Group(), 0.34, 0.98, 0.2, chassis);
  const core = rbox(0.09, 0.22, 0.34, finMat, 0.015);
  heater.add(core);
  at(cyl(0.02, 0.1, m.alu, "x", 12), 0.07, 0.06, -0.1, heater);
  at(cyl(0.02, 0.1, m.alu, "x", 12), 0.07, -0.06, -0.1, heater);
  const heaterHoses = [
    tube([new THREE.Vector3(0.42, 1.04, 0.1), new THREE.Vector3(0.75, 1.02, 0.15), new THREE.Vector3(1.12, 1.0, 0.22)], 0.022, m.rubber),
    tube([new THREE.Vector3(0.42, 0.92, 0.1), new THREE.Vector3(0.75, 0.9, 0.18), new THREE.Vector3(1.12, 0.86, 0.24)], 0.022, m.rubber),
  ];
  chassis.add(...heaterHoses);

  /* ---------- Двигатель ---------- */
  const engine = at(new THREE.Group(), 1.4, 0.93, -0.02, chassis);
  engine.add(at(rbox(0.62, 0.4, 0.5, m.engine, 0.04), 0, -0.06, 0));
  at(rbox(0.6, 0.1, 0.36, m.alu, 0.03), 0, 0.2, -0.04, engine); // клапанная крышка
  for (let i = 0; i < 5; i++) at(rbox(0.5, 0.02, 0.02, m.alu, 0.006), 0, 0.26, -0.18 + i * 0.07, engine);
  at(cyl(0.035, 0.05, m.yellow, "y", 16), 0.18, 0.28, -0.12, engine); // крышка маслозаливной горловины
  at(rbox(0.56, 0.1, 0.11, m.alu, 0.03), 0, 0.32, 0.26, engine); // впускной коллектор
  for (let i = 0; i < 4; i++) at(cyl(0.032, 0.18, m.alu, "z", 12), -0.21 + i * 0.14, 0.22, 0.2, engine);
  at(rbox(0.06, 0.42, 0.44, m.engine, 0.02), 0.33, -0.02, 0, engine); // крышка ГРМ
  for (let i = 0; i < 4; i++) at(cyl(0.03, 0.16, m.steel, "z", 10), -0.21 + i * 0.14, -0.02, -0.3, engine); // выпуск
  const crank = at(cyl(0.075, 0.04, m.chrome, "x", 28), 0.38, -0.16, 0, engine);
  const alt = at(cyl(0.065, 0.12, m.alu, "x", 24), 0.33, 0.1, -0.2, engine);
  // Компрессор кондиционера — отдельная группа (этап «кондиционер»)
  const compressor = at(new THREE.Group(), 0.31, -0.03, 0.22, engine);
  compressor.add(cyl(0.07, 0.17, m.alu, "x", 24));
  at(cyl(0.06, 0.03, m.chrome, "x", 24), 0.09, 0, 0, compressor);
  // Ремень
  const belt = tube(
    [new THREE.Vector3(0.405, -0.24, 0), new THREE.Vector3(0.405, -0.1, 0.3), new THREE.Vector3(0.405, 0.18, -0.2), new THREE.Vector3(0.405, -0.02, -0.08)],
    0.012,
    m.rubber,
    true,
  );
  engine.add(belt);
  // Аккумулятор
  const battery = at(rbox(0.26, 0.2, 0.18, m.trim, 0.02), 1.72, 0.84, -0.55, chassis);
  at(cyl(0.015, 0.03, m.red, "y", 10), 1.65, 0.955, -0.58, chassis);

  /* ---------- Радиатор и конденсатор кондиционера ---------- */
  const condenser = at(new THREE.Group(), 2.07, 0.98, 0, chassis);
  const radiator = at(rbox(0.05, 0.48, 1.3, finMat, 0.01), -0.04, 0, 0, condenser);
  const condCore = at(rbox(0.03, 0.44, 1.26, condMat, 0.008), 0.03, -0.01, 0, condenser);
  at(rbox(0.07, 0.44, 0.62, m.trim, 0.02), -0.12, 0, 0, condenser); // кожух вентилятора
  const fan = at(cyl(0.2, 0.02, m.engine, "x", 7), -0.17, 0, 0, condenser);
  // Трубки кондиционера
  const acLines = [
    tube([new THREE.Vector3(2.08, 0.8, 0.58), new THREE.Vector3(1.96, 0.82, 0.44), new THREE.Vector3(1.82, 0.92, 0.3), new THREE.Vector3(1.73, 0.95, 0.2)], 0.016, m.blue),
    tube([new THREE.Vector3(1.73, 0.98, 0.26), new THREE.Vector3(1.4, 1.2, 0.42), new THREE.Vector3(0.95, 1.18, 0.5), new THREE.Vector3(0.64, 1.12, 0.45)], 0.016, m.blue),
  ];
  chassis.add(...acLines);

  /* ---------- Кузов: салон + корма (выдавленный профиль) ---------- */
  const cab = new THREE.Shape();
  cab.moveTo(0.58, SILL);
  cab.lineTo(0.58, 1.33);
  cab.lineTo(0.22, 1.91);
  cab.quadraticCurveTo(0.17, 1.98, 0.07, 1.98);
  cab.lineTo(-2.22, 1.98);
  cab.quadraticCurveTo(-2.36, 1.98, -2.36, 1.85);
  cab.lineTo(-2.36, SILL);
  cab.lineTo(AXLE_R - ARCH_R, SILL);
  cab.absarc(AXLE_R, SILL, ARCH_R, Math.PI, 0, true);
  cab.lineTo(0.58, SILL);
  const cabGeo = new THREE.ExtrudeGeometry(cab, { depth: 1.76, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.045, bevelSegments: 4, curveSegments: 28 });
  cabGeo.translate(0, 0, -0.88);
  const cabMesh = new THREE.Mesh(cabGeo, m.body);
  cabMesh.castShadow = cabMesh.receiveShadow = true;
  body.add(cabMesh);

  // Стёкла
  const Z_GLASS = 0.937;
  const windows: [number, number][][] = [
    [[0.47, 1.4], [0.2, 1.85], [-0.62, 1.85], [-0.62, 1.4]],
    [[-0.74, 1.4], [-0.74, 1.85], [-1.52, 1.85], [-1.52, 1.4]],
    [[-1.64, 1.4], [-1.64, 1.85], [-2.22, 1.85], [-2.22, 1.4]],
  ];
  for (const w of windows) {
    const sh = new THREE.Shape(w.map(([x, y]) => new THREE.Vector2(x, y)));
    const geo = new THREE.ShapeGeometry(sh);
    for (const z of [-Z_GLASS, Z_GLASS]) at(new THREE.Mesh(geo, m.glass), 0, 0, z, body);
  }
  // Лобовое
  {
    const n = new THREE.Vector3(0.825, 0.565, 0).multiplyScalar(0.052);
    const a = new THREE.Vector3(0.585, 1.37, 0).add(n);
    const b = new THREE.Vector3(0.22, 1.9, 0).add(n);
    const geo = new THREE.BufferGeometry();
    const v = new Float32Array([a.x, a.y, -0.8, a.x, a.y, 0.8, b.x, b.y, 0.78, a.x, a.y, -0.8, b.x, b.y, 0.78, b.x, b.y, -0.78]);
    geo.setAttribute("position", new THREE.BufferAttribute(v, 3));
    geo.computeVertexNormals();
    body.add(new THREE.Mesh(geo, m.glass));
  }
  at(new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.44), m.glass), -2.412, 1.64, 0, body).rotation.y = -Math.PI / 2;
  // Швы дверей, ручки, зеркала, фонари
  for (const z of [-0.936, 0.936]) {
    for (const x of [-0.68, -1.58]) at(rbox(0.008, 1.22, 0.004, m.trim, 0.002), x, 1.31, z, body);
    for (const x of [-0.5, -1.4]) at(rbox(0.12, 0.03, 0.02, m.trim, 0.008), x, 1.3, z * 1.005, body);
  }
  for (const s of [-1, 1]) {
    at(rbox(0.08, 0.04, 0.12, m.trim, 0.01), 0.46, 1.42, s * 0.96, body);
    at(rbox(0.05, 0.17, 0.12, m.trim, 0.02), 0.44, 1.5, s * 1.04, body);
    at(rbox(0.02, 0.24, 0.1, m.red, 0.01), -2.41, 1.08, s * 0.78, body);
  }
  // Задние расширители арок
  const flareShape = new THREE.Shape();
  flareShape.moveTo(0.65, 0);
  flareShape.absarc(0, 0, 0.65, 0, Math.PI, false);
  flareShape.lineTo(-0.57, 0);
  flareShape.absarc(0, 0, 0.57, Math.PI, 0, true);
  const flareGeo = new THREE.ExtrudeGeometry(flareShape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.012, bevelSegments: 2, curveSegments: 28 });
  const flare = (x: number, side: number, parent: THREE.Object3D) => {
    const f = new THREE.Mesh(flareGeo, m.trim);
    f.castShadow = true;
    at(f, x, SILL, side > 0 ? 0.88 : -0.98, parent);
  };
  flare(AXLE_R, 1, body);
  flare(AXLE_R, -1, body);

  /* ---------- Передок: крылья, решётка, фары, капот ---------- */
  const fender = new THREE.Shape();
  fender.moveTo(0.6, SILL);
  fender.lineTo(0.6, 1.29);
  fender.lineTo(2.12, 1.27);
  fender.quadraticCurveTo(2.24, 1.26, 2.24, 1.15);
  fender.lineTo(2.24, SILL);
  fender.lineTo(AXLE_F + ARCH_R, SILL);
  fender.absarc(AXLE_F, SILL, ARCH_R, 0, Math.PI, false);
  fender.lineTo(0.6, SILL);
  const fenderGeo = new THREE.ExtrudeGeometry(fender, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.045, bevelSegments: 4, curveSegments: 28 });
  for (const z of [-0.88, 0.76]) {
    const f = new THREE.Mesh(fenderGeo, m.body);
    f.castShadow = f.receiveShadow = true;
    at(f, 0, 0, z, frontClip);
  }
  flare(AXLE_F, 1, frontClip);
  flare(AXLE_F, -1, frontClip);
  at(rbox(0.06, 0.6, 1.56, m.trim, 0.02), 2.22, 0.95, 0, frontClip); // решётка
  for (let i = 0; i < 4; i++) at(rbox(0.02, 0.025, 0.86, m.alu, 0.008), 2.26, 0.98 + i * 0.065, 0, frontClip);
  for (const s of [-1, 1]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.018, 12, 36), m.chrome);
    ring.rotation.y = Math.PI / 2;
    at(ring, 2.26, 1.04, s * 0.63, frontClip);
    at(cyl(0.1, 0.03, m.head, "x", 32), 2.255, 1.04, s * 0.63, frontClip);
    at(rbox(0.03, 0.06, 0.1, m.amber, 0.01), 2.26, 0.82, s * 0.66, frontClip);
  }
  at(rbox(0.1, 0.16, 1.64, m.trim, 0.02), 0.61, 1.27, 0, frontClip); // жабо
  // Капот (на шарнире): основная панель + «выштамповка»
  at(rbox(1.62, 0.06, 1.76, m.body, 0.03, 3), 0.81, 0.02, 0, hood);
  at(rbox(1.1, 0.035, 0.7, m.body, 0.02, 3), 0.75, 0.06, 0, hood);
  hood.children.forEach((c) => ((c as THREE.Mesh).castShadow = true));

  /* ---------- Силовой обвес ---------- */
  const frontBumper = at(new THREE.Group(), 0, 0, 0, root);
  frontBumper.add(at(rbox(0.3, 0.3, 1.86, m.black, 0.03), 2.4, 0.66, 0));
  for (const s of [-1, 1]) {
    const wing = at(rbox(0.42, 0.22, 0.18, m.black, 0.03), 2.2, 0.62, s * 0.98, frontBumper);
    wing.rotation.y = s * 0.35;
    at(rbox(0.1, 0.1, 0.1, m.black, 0.015), 2.57, 0.79, s * 0.72, frontBumper);
    at(rbox(0.01, 0.07, 0.07, m.led, 0.005), 2.625, 0.79, s * 0.72, frontBumper);
    const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.013, 10, 24), m.blue);
    shackle.rotation.x = Math.PI / 2;
    at(shackle, 2.58, 0.52, s * 0.58, frontBumper);
  }
  const winch = at(new THREE.Group(), 2.57, 0.66, 0, root);
  winch.add(cyl(0.085, 0.42, m.black, "z", 28));
  winch.add(cyl(0.075, 0.38, m.rope, "z", 28));
  for (const s of [-1, 1]) at(rbox(0.17, 0.17, 0.1, m.black, 0.02), 0, 0, s * 0.26, winch);
  at(rbox(0.04, 0.1, 0.28, m.alu, 0.01), 0.07, 0, 0, winch);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 8, 20, Math.PI * 1.5), m.yellow);
  at(hook, 0.11, -0.04, 0, winch);
  const lightbar = at(new THREE.Group(), 0, 0, 0, root);
  lightbar.add(
    tube([new THREE.Vector3(2.46, 0.8, -0.7), new THREE.Vector3(2.42, 1.0, -0.64), new THREE.Vector3(2.4, 1.03, 0), new THREE.Vector3(2.42, 1.0, 0.64), new THREE.Vector3(2.46, 0.8, 0.7)], 0.024, m.black, false, 0.2),
  );
  at(rbox(0.07, 0.1, 1.0, m.black, 0.02), 2.43, 1.08, 0, lightbar);
  for (let i = 0; i < 18; i++) at(rbox(0.01, 0.05, 0.04, m.led, 0.004), 2.468, 1.08, -0.45 + i * 0.053, lightbar);
  const stepL = at(new THREE.Group(), 0, 0, 0, root);
  const stepR = at(new THREE.Group(), 0, 0, 0, root);
  for (const [g, s] of [[stepL, -1], [stepR, 1]] as const) {
    at(rbox(1.7, 0.07, 0.2, m.black, 0.02), -0.08, 0.6, s * 0.99, g);
    for (const x of [-0.75, 0.55]) at(rbox(0.06, 0.06, 0.18, m.black, 0.01), x, 0.6, s * 0.86, g);
  }
  // Багажник на крышу (на кузове)
  const rack = at(new THREE.Group(), 0, 0, 0, body);
  for (const z of [-0.8, 0.8]) at(rbox(2.24, 0.04, 0.04, m.black, 0.01), -1.06, 2.09, z, rack);
  for (let i = 0; i < 6; i++) at(rbox(0.04, 0.04, 1.64, m.black, 0.01), 0.05 - i * 0.44, 2.09, 0, rack);
  for (const x of [-2.0, -1.06, -0.05]) for (const z of [-0.8, 0.8]) at(rbox(0.05, 0.1, 0.05, m.black, 0.01), x, 2.03, z, rack);
  at(rbox(0.06, 0.07, 0.9, m.black, 0.015), 0.1, 2.13, 0, rack);
  for (let i = 0; i < 12; i++) at(rbox(0.01, 0.035, 0.05, m.led, 0.004), 0.133, 2.13, -0.36 + i * 0.066, rack);
  // Шноркель (на кузове)
  const snorkel = at(new THREE.Group(), 0, 0, 0, body);
  snorkel.add(
    tube([new THREE.Vector3(0.98, 1.22, 0.975), new THREE.Vector3(0.72, 1.28, 0.985), new THREE.Vector3(0.55, 1.42, 0.985), new THREE.Vector3(0.38, 1.7, 0.975), new THREE.Vector3(0.26, 1.98, 0.96), new THREE.Vector3(0.3, 2.06, 0.96)], 0.045, m.black),
  );
  at(cyl(0.06, 0.18, m.black, "x", 20), 0.4, 2.07, 0.96, snorkel);
  // Задний бампер и калитка с запаской
  const rearBumper = at(new THREE.Group(), 0, 0, 0, root);
  rearBumper.add(at(rbox(0.24, 0.26, 1.82, m.black, 0.03), -2.52, 0.66, 0));
  const carrier = at(new THREE.Group(), 0, 0, 0, root);
  carrier.add(at(rbox(0.06, 0.06, 1.1, m.black, 0.01), -2.66, 0.8, -0.3));
  carrier.add(at(rbox(0.06, 0.62, 0.06, m.black, 0.01), -2.66, 1.1, -0.3));
  const spare = wheel(m);
  spare.group.rotation.y = -Math.PI / 2;
  at(spare.group, -2.76, 1.12, -0.3, carrier);

  /* ---------- Колёса ---------- */
  const wheels: THREE.Group[] = [];
  const tires: THREE.Object3D[] = [];
  for (const [x, z] of hubs) {
    const w = wheel(m);
    if (z < 0) w.group.rotation.y = Math.PI; // наружной стороной наружу
    at(w.group, x, R_TIRE, z, root);
    wheels.push(w.group);
    tires.push(w.spin);
  }

  /* ---------- Якоря для подсказок ---------- */
  const anchors = {
    obves: at(new THREE.Object3D(), 0.08, 0.04, 0, winch),
    ac: at(new THREE.Object3D(), 0.03, 0.2, 0.4, condenser),
    engine: at(new THREE.Object3D(), 0, 0.3, 0, engine),
    heater: at(new THREE.Object3D(), 0, 0.12, 0, heater),
    chassis: at(new THREE.Object3D(), AXLE_F, 0.8, 0.62, chassis),
  } satisfies Record<StageId, THREE.Object3D>;

  /* ---------- Подсветка этапов: жёлтое свечение + контуры ---------- */
  const stageObjects: Record<StageId, THREE.Object3D[]> = {
    obves: [frontBumper, winch, lightbar, stepL, stepR, rack, snorkel, rearBumper, carrier],
    ac: [condenser, compressor, ...acLines],
    engine: [engine],
    heater: [heater, ...heaterHoses],
    chassis: [...suspension, ...brakes, ...axleMeshes, transfer],
  };
  const edgeStages: Partial<Record<StageId, THREE.Object3D[]>> = {
    obves: [frontBumper, winch, rearBumper, stepL, stepR],
    ac: [radiator, condCore, compressor],
    engine: [engine],
    heater: [core],
    chassis: [...brakes],
  };
  void alt;
  void crank;
  void fan;
  void battery;
  const hl: Record<StageId, { mats: THREE.MeshStandardMaterial[]; lines: THREE.LineBasicMaterial }> = {} as never;
  const skip = new Set<THREE.Material>([m.led, m.head, m.amber, m.red]);
  // «Двигатель» обрабатываем первым: компрессор внутри двигателя должен остаться за этапом «кондиционер»
  for (const id of ["engine", "obves", "ac", "heater", "chassis"] as StageId[]) {
    const mats: THREE.MeshStandardMaterial[] = [];
    const cache = new Map<THREE.Material, THREE.MeshStandardMaterial>();
    for (const obj of stageObjects[id]) {
      obj.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (skip.has(mat)) return;
        let c = cache.get(mat);
        if (!c) {
          c = mat.clone();
          c.emissive = YELLOW.clone();
          c.emissiveIntensity = 0;
          cache.set(mat, c);
          mats.push(c);
        }
        mesh.material = c;
      });
    }
    const lines = new THREE.LineBasicMaterial({ color: YELLOW, transparent: true, opacity: 0, depthWrite: false });
    for (const obj of edgeStages[id] ?? []) {
      obj.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh || (mesh as unknown as THREE.InstancedMesh).isInstancedMesh) return;
        if (mesh.geometry.type === "TubeGeometry" || mesh.geometry.type === "TorusGeometry") return;
        const box = mesh.userData.box as [number, number, number] | undefined;
        const src = box ? new THREE.BoxGeometry(...box) : mesh.geometry;
        const seg = new THREE.LineSegments(new THREE.EdgesGeometry(src, 40), lines);
        seg.renderOrder = 2;
        mesh.add(seg);
      });
    }
    hl[id] = { mats, lines };
  }

  const setHighlight = (stage: StageId, w: number) => {
    const h = hl[stage];
    for (const mat of h.mats) mat.emissiveIntensity = w * 0.55;
    h.lines.opacity = w * 0.95;
    h.lines.visible = w > 0.01;
  };

  const dispose = () => {
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose();
    });
    fins.dispose();
  };

  return {
    root,
    groups: { chassis, body, frontClip, hood, frontBumper, winch, lightbar, stepL, stepR, rack, snorkel, rearBumper, carrier, engine, compressor, condenser, heater, wheels, tires },
    anchors,
    setHighlight,
    dispose,
  };
}
