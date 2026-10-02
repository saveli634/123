import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Процедурная схема V8-дизеля 1VD‑FTV — без внешних моделей. Стилизация, не чертёж.
 * Оси: X — вдоль коленвала (перед мотора в +X), Y — вверх, Z — вбок. 1 единица ≈ 100 мм,
 * поэтому «дыхание» 2 мм = 0.02.
 *
 * Узлы — отдельные группы, чтобы сцена разбирала мотор по этапам и подсвечивала активный узел.
 */

export type HL = "block" | "heads" | "pistons" | "crank" | "attach" | "indicator";
export const HL_KEYS: HL[] = ["block", "heads", "pistons", "crank", "attach", "indicator"];

const S45 = Math.SQRT1_2;
/** Ось правого (+Z) и левого (−Z) рядов цилиндров: развал 90° */
const BANKS = [
  { side: 1, d: new THREE.Vector3(0, S45, S45), n: new THREE.Vector3(0, -S45, S45), rot: Math.PI / 4, dx: 0.15 },
  { side: -1, d: new THREE.Vector3(0, S45, -S45), n: new THREE.Vector3(0, -S45, -S45), rot: -Math.PI / 4, dx: -0.15 },
];
const THROW_X = [2.1, 0.7, -0.7, -2.1];
/** Крестообразный коленвал V8: фазы шеек */
const THROW_PHASE = [0, Math.PI / 2, (3 * Math.PI) / 2, Math.PI];
const CRANK_R = 0.5;
const ROD_L = 1.62;
const DECK = 2.65;
const BORE_R = 0.46;

export interface EngineModel {
  root: THREE.Group;
  engine: THREE.Group;
  parts: {
    block: THREE.Group;
    heads: THREE.Group[];
    crank: THREE.Group;
    pistons: THREE.Group[];
    rods: THREE.Group[];
    turbos: THREE.Group[];
    intake: THREE.Group;
    front: THREE.Group;
    pulleys: { obj: THREE.Object3D; ratio: number }[];
    pan: THREE.Group;
    frame: THREE.Group;
    floor: THREE.Group;
  };
  /** Точки для свечения/подписей по узлам (в координатах мотора) */
  anchors: Record<HL, THREE.Object3D>;
  indicator: THREE.Mesh;
  /** Подсветка узла 0..1 */
  setHighlight: (key: HL, w: number) => void;
  /** Мелкие детали (болты, рёбра) — выключаются при низком качестве */
  details: THREE.Object3D[];
  edges: THREE.LineSegments[];
  frameMaterials: THREE.Material[];
  floorMaterials: THREE.Material[];
  /** Положение поршней и шатунов по углу коленвала; up — «раскрытие» поршневой группы */
  pose: (crankAngle: number, up: number) => void;
  /** «Рентген»: блок, головки и поддон становятся полупрозрачными, видно коленвал и поршни */
  setXray: (v: number) => void;
  dispose: () => void;
}

/* ---------------- материалы ---------------- */

const STEEL_LINE = new THREE.Color("#b9c2cd");
const RED_LINE = new THREE.Color("#ff3b47");
const RED = new THREE.Color("#d3202b");

function std(color: string, metalness: number, roughness: number, extra: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
}

interface HLSet {
  meshes: THREE.MeshStandardMaterial[];
  lines: THREE.LineBasicMaterial[];
}

/* ---------------- геометрия ---------------- */

function clean(g: THREE.BufferGeometry) {
  const n = g.index ? g.toNonIndexed() : g;
  for (const k of Object.keys(n.attributes)) if (k !== "position" && k !== "normal") n.deleteAttribute(k);
  return n;
}

function merged(list: THREE.BufferGeometry[]) {
  const m = mergeGeometries(list.map(clean), false);
  if (!m) throw new Error("merge failed");
  return m;
}

function cylX(r: number, len: number, seg = 32) {
  // Цилиндр с осью вдоль X
  return new THREE.CylinderGeometry(r, r, len, seg, 1).rotateZ(Math.PI / 2);
}

function rbox(w: number, h: number, d: number, r = 0.05, seg = 2) {
  return new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3));
}

/** Сетка + контур «чертежа» */
function withEdges(mesh: THREE.Mesh, lineMat: THREE.LineBasicMaterial, threshold = 32, edgesList: THREE.LineSegments[]) {
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, threshold), lineMat);
  e.renderOrder = 2;
  mesh.add(e);
  edgesList.push(e);
  return mesh;
}

/** Профиль V-блока в плоскости (Z, Y) */
function blockShape() {
  const pts: [number, number][] = [
    [2.0, -1.05],
    [2.0, -0.92],
    [1.86, -0.86],
    [2.02, 0.25],
    [1.782, 0.906],
    [2.312, 1.436],
    [1.436, 2.312],
    [0.224, 1.1],
    [-0.224, 1.1],
    [-1.436, 2.312],
    [-2.312, 1.436],
    [-1.782, 0.906],
    [-2.02, 0.25],
    [-1.86, -0.86],
    [-2.0, -0.92],
    [-2.0, -1.05],
  ];
  const s = new THREE.Shape();
  pts.forEach(([z, y], i) => (i ? s.lineTo(z, y) : s.moveTo(z, y)));
  s.closePath();
  return s;
}

/** Щека коленвала с противовесом (плоскость Z-Y, толщина вдоль X) */
function webShape() {
  const s = new THREE.Shape();
  // шейка вверху (y = CRANK_R), противовес — полукруг внизу
  s.moveTo(-0.38, CRANK_R);
  s.absarc(0, CRANK_R, 0.38, Math.PI, 0, true);
  s.lineTo(0.42, 0);
  s.absarc(0, 0, 0.98, 0, -Math.PI, true);
  s.lineTo(-0.42, 0);
  s.closePath();
  return s;
}

function radialTexture(inner: string, outer: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, inner);
  grd.addColorStop(1, outer);
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------------- сборка ---------------- */

export function buildEngine(opts: { lowDetail?: boolean } = {}): EngineModel {
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x);
  const edges: THREE.LineSegments[] = [];
  const details: THREE.Object3D[] = [];

  const base = {
    block: std("#3a3f47", 0.85, 0.32),
    head: std("#42484f", 0.85, 0.3),
    cover: std("#1b1e23", 0.85, 0.34),
    machined: std("#a6aeb8", 1, 0.24),
    rod: std("#7f8792", 0.95, 0.3),
    comp: std("#b9c0c9", 0.9, 0.28),
    turbine: std("#4a3e39", 0.8, 0.5),
    intake: std("#4a515b", 0.85, 0.33),
    belt: std("#111215", 0, 0.85),
    pulley: std("#6f7782", 0.9, 0.3),
    frame: std("#1d2024", 0.6, 0.55, { transparent: true }),
    bore: std("#060607", 0.3, 0.85, { side: THREE.DoubleSide }),
    pan: std("#2c3036", 0.85, 0.38),
    bolt: std("#8d949e", 0.95, 0.3),
  };
  Object.values(base).forEach(track);

  // Отдельные копии материалов на каждый подсвечиваемый узел
  const hl: Record<HL, HLSet> = {} as Record<HL, HLSet>;
  const lineFor = (key: HL) => {
    const m = track(new THREE.LineBasicMaterial({ color: STEEL_LINE.clone(), transparent: true, opacity: 0.42, depthWrite: false, toneMapped: false }));
    hl[key].lines.push(m);
    return m;
  };
  const matFor = (key: HL, m: THREE.MeshStandardMaterial) => {
    const c = track(m.clone());
    c.emissive = RED.clone();
    c.emissiveIntensity = 0;
    hl[key].meshes.push(c);
    return c;
  };
  for (const k of HL_KEYS) hl[k] = { meshes: [], lines: [] };

  const root = new THREE.Group();
  root.name = "root";
  const engine = new THREE.Group();
  engine.name = "engine";
  root.add(engine);

  const mesh = (g: THREE.BufferGeometry, m: THREE.Material, line?: THREE.LineBasicMaterial, thr = 32) => {
    track(g);
    const me = new THREE.Mesh(g, m);
    if (line) withEdges(me, line, thr, edges);
    return me;
  };

  /* ---- блок цилиндров ---- */
  const block = new THREE.Group();
  block.name = "block";
  {
    const L = blockLine();
    function blockLine() {
      return lineFor("block");
    }
    const mBlock = matFor("block", base.block);
    const body = new THREE.ExtrudeGeometry(blockShape(), { depth: 5.8, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 1, curveSegments: 4 });
    body.rotateY(Math.PI / 2).translate(-2.9, 0, 0);
    block.add(mesh(body, mBlock, L, 28));

    // Передняя крышка ГРМ — тот же профиль, тонкая
    const cover = new THREE.ExtrudeGeometry(blockShape(), { depth: 0.18, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 1 });
    cover.rotateY(Math.PI / 2).scale(1, 0.96, 0.94).translate(2.95, 0.02, 0);
    block.add(mesh(cover, matFor("block", base.cover), L, 28));

    // Колодцы цилиндров и болты ГБЦ
    const boreGeo: THREE.BufferGeometry[] = [];
    const boltGeo: THREE.BufferGeometry[] = [];
    for (const b of BANKS) {
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), b.rot);
      for (const tx of THROW_X) {
        const x = tx + b.dx;
        // открытый цилиндр вглубь блока
        const g = new THREE.CylinderGeometry(BORE_R, BORE_R, 1.4, 32, 1, true);
        g.applyQuaternion(q);
        const c = b.d.clone().multiplyScalar(DECK - 0.7);
        g.translate(x, c.y, c.z);
        boreGeo.push(g);
        // кольцо-фаска по краю
        const ring = new THREE.RingGeometry(BORE_R - 0.005, BORE_R + 0.06, 32);
        ring.rotateX(-Math.PI / 2).applyQuaternion(q);
        const rc = b.d.clone().multiplyScalar(DECK + 0.006);
        ring.translate(x, rc.y, rc.z);
        boreGeo.push(ring);
        for (const off of [-0.62, 0.62]) {
          for (const side of [-0.52, 0.52]) {
            const bolt = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 10);
            bolt.applyQuaternion(q);
            const p = b.d.clone().multiplyScalar(DECK + 0.03).add(b.n.clone().multiplyScalar(side));
            bolt.translate(x + off, p.y, p.z);
            boltGeo.push(bolt);
          }
        }
      }
    }
    block.add(mesh(merged(boreGeo), base.bore));
    const bolts = mesh(merged(boltGeo), base.bolt);
    details.push(bolts);
    block.add(bolts);

    // Литые рёбра по бокам блока
    const ribGeo: THREE.BufferGeometry[] = [];
    for (const side of [1, -1]) {
      for (const [y, z] of [
        [-0.45, 1.95],
        [0.05, 2.03],
      ]) {
        ribGeo.push(rbox(5.4, 0.07, 0.08, 0.02, 1).translate(0, y, side * (z + 0.03)));
      }
    }
    const ribMesh = mesh(merged(ribGeo), mBlock);
    details.push(ribMesh);
    block.add(ribMesh);

    // Кронштейны опор двигателя
    const mountGeo: THREE.BufferGeometry[] = [];
    for (const side of [1, -1]) {
      mountGeo.push(rbox(0.9, 0.5, 0.36, 0.06).translate(0.6, -0.15, side * 2.18));
      mountGeo.push(cylX(0.2, 0.5, 20).rotateX(Math.PI / 2).rotateZ(Math.PI / 2).translate(0.6, -0.62, side * 2.32));
    }
    block.add(mesh(merged(mountGeo), matFor("block", base.block), L, 30));
  }
  engine.add(block);

  /* ---- поддон ---- */
  const pan = new THREE.Group();
  pan.name = "pan";
  {
    const g = merged([rbox(5.5, 0.55, 3.7, 0.08).translate(0, -1.32, 0), rbox(2.6, 0.55, 2.8, 0.12).translate(-1.2, -1.75, 0)]);
    pan.add(mesh(g, matFor("block", base.pan), lineFor("block"), 30));
  }
  engine.add(pan);

  /* ---- головки блока ---- */
  const heads: THREE.Group[] = [];
  for (const b of BANKS) {
    const holder = new THREE.Group();
    holder.rotation.x = b.rot;
    const head = new THREE.Group();
    head.name = "head";
    const L = lineFor("heads");
    const body = rbox(5.75, 0.62, 1.34, 0.06).translate(0, DECK + 0.31, 0);
    head.add(mesh(body, matFor("heads", base.head), L, 30));
    const cover = rbox(5.45, 0.4, 1.1, 0.12, 3).translate(0, DECK + 0.62 + 0.2, -0.04 * b.side);
    head.add(mesh(cover, matFor("heads", base.cover), L, 30));
    // рёбра крышки и форсунки — мелочь
    const ribs: THREE.BufferGeometry[] = [];
    for (let i = -4; i <= 4; i++) ribs.push(rbox(0.06, 0.06, 0.9, 0.02, 1).translate(i * 0.6, DECK + 1.04, 0));
    for (const tx of THROW_X) ribs.push(new THREE.CylinderGeometry(0.08, 0.1, 0.34, 12).translate(tx + b.dx, DECK + 1.0, -0.62 * b.side));
    const ribMesh = mesh(merged(ribs), matFor("heads", base.head));
    details.push(ribMesh);
    head.add(ribMesh);
    holder.add(head);
    engine.add(holder);
    heads.push(head);
  }

  /* ---- коленвал ---- */
  const crank = new THREE.Group();
  crank.name = "crank";
  {
    const L = lineFor("crank");
    const m = matFor("crank", base.machined);
    const geos: THREE.BufferGeometry[] = [];
    const mains = [2.85, 1.4, 0, -1.4, -2.85];
    for (const x of mains) geos.push(cylX(0.34, 0.32, 28).translate(x, 0, 0));
    THROW_X.forEach((tx, i) => {
      const ph = THROW_PHASE[i];
      const pin = cylX(0.3, 0.62, 28).translate(tx, CRANK_R, 0);
      pin.rotateX(ph);
      geos.push(pin);
      for (const side of [-1, 1]) {
        const web = new THREE.ExtrudeGeometry(webShape(), { depth: 0.18, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1, curveSegments: 10 });
        // форма в плоскости (Z, Y) → толщина вдоль X
        web.rotateY(Math.PI / 2).translate(tx + side * 0.4 - 0.09, 0, 0);
        web.rotateX(ph);
        geos.push(web);
      }
    });
    geos.push(cylX(0.24, 0.8, 24).translate(3.25, 0, 0)); // носок
    crank.add(mesh(merged(geos), m, L, 35));
    // маховик
    const fly = cylX(1.72, 0.14, 64).translate(-3.25, 0, 0);
    crank.add(mesh(fly, matFor("crank", base.pulley), L, 35));
  }
  engine.add(crank);

  /* ---- поршни и шатуны ---- */
  const pistons: THREE.Group[] = [];
  const rods: THREE.Group[] = [];
  {
    const pistonGeo = track(
      merged([
        new THREE.CylinderGeometry(0.44, 0.44, 0.6, 32),
        new THREE.TorusGeometry(0.44, 0.012, 4, 32).rotateX(Math.PI / 2).translate(0, 0.2, 0),
        new THREE.TorusGeometry(0.44, 0.012, 4, 32).rotateX(Math.PI / 2).translate(0, 0.12, 0),
      ]),
    );
    const rodGeo = track(merged([rbox(0.16, ROD_L, 0.11, 0.03, 1), new THREE.CylinderGeometry(0.22, 0.22, 0.12, 20).rotateZ(Math.PI / 2).translate(0, -ROD_L / 2, 0)]));
    const mP = matFor("pistons", base.machined);
    const mR = matFor("pistons", base.rod);
    const LP = lineFor("pistons");
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Group();
      p.add(withEdges(new THREE.Mesh(pistonGeo, mP), LP, 35, edges));
      engine.add(p);
      pistons.push(p);
      const r = new THREE.Group();
      r.add(withEdges(new THREE.Mesh(rodGeo, mR), LP, 40, edges));
      engine.add(r);
      rods.push(r);
    }
  }

  /* ---- турбокомпрессоры в развале ---- */
  const turbos: THREE.Group[] = [];
  for (const sx of [1, -1]) {
    const t = new THREE.Group();
    t.name = "turbo";
    const L = lineFor("attach");
    const comp = merged([
      new THREE.TorusGeometry(0.36, 0.2, 16, 40).rotateY(Math.PI / 2),
      new THREE.CylinderGeometry(0.3, 0.36, 0.22, 32).rotateZ(Math.PI / 2).translate(sx * 0.16, 0, 0),
      new THREE.CylinderGeometry(0.16, 0.16, 0.5, 20).rotateZ(Math.PI / 2).translate(sx * 0.42, 0, 0),
    ]);
    t.add(mesh(comp, matFor("attach", base.comp), L, 34));
    const turb = merged([
      new THREE.TorusGeometry(0.3, 0.17, 14, 36).rotateY(Math.PI / 2).translate(-sx * 0.55, 0, 0),
      new THREE.CylinderGeometry(0.17, 0.17, 0.38, 20).rotateZ(Math.PI / 2).translate(-sx * 0.28, 0, 0),
      new THREE.CylinderGeometry(0.12, 0.12, 0.7, 16).translate(-sx * 0.55, 0.42, 0),
    ]);
    t.add(mesh(turb, matFor("attach", base.turbine), L, 34));
    t.position.set(sx * 1.25, 2.28, 0);
    t.userData.base = t.position.clone();
    engine.add(t);
    turbos.push(t);
  }

  /* ---- впускной коллектор ---- */
  const intake = new THREE.Group();
  intake.name = "intake";
  {
    const L = lineFor("attach");
    const m = matFor("attach", base.intake);
    const plenum = rbox(5.0, 0.52, 0.96, 0.12, 3).translate(0, 3.62, 0);
    const throttle = cylX(0.3, 0.55, 28).translate(2.75, 3.62, 0);
    intake.add(mesh(merged([plenum, throttle]), m, L, 30));
    const runners: THREE.BufferGeometry[] = [];
    for (const b of BANKS) {
      for (const tx of THROW_X) {
        const x = tx + b.dx;
        const port = b.d.clone().multiplyScalar(DECK + 0.32).add(b.n.clone().multiplyScalar(-0.62));
        const start = new THREE.Vector3(x, 3.42, b.side * 0.36);
        const mid = new THREE.Vector3(x, 3.18, b.side * (0.36 + Math.abs(port.z)) * 0.5);
        const end = new THREE.Vector3(x, port.y + 0.08, port.z);
        const curve = new THREE.CatmullRomCurve3([start, mid, end]);
        runners.push(new THREE.TubeGeometry(curve, 16, 0.105, 12, false));
      }
    }
    intake.add(mesh(merged(runners), m, L, 50));
  }
  engine.add(intake);

  /* ---- шкивы, ремень, навесное спереди ---- */
  const front = new THREE.Group();
  front.name = "front";
  const pulleys: { obj: THREE.Object3D; ratio: number }[] = [];
  {
    const L = lineFor("attach");
    const mP = matFor("attach", base.pulley);
    const mB = matFor("attach", base.block);
    const defs: { y: number; z: number; r: number; body?: number }[] = [
      { y: 0, z: 0, r: 0.72 }, // коленвал
      { y: 1.55, z: 0, r: 0.48 }, // помпа
      { y: 2.2, z: 1.35, r: 0.3, body: 0.44 }, // генератор
      { y: 2.32, z: -0.8, r: 0.26 }, // ролик
      { y: 1.0, z: 1.3, r: 0.24 }, // натяжитель
      { y: 0.1, z: -1.5, r: 0.42, body: 0.5 }, // кондиционер
      { y: 1.72, z: -1.78, r: 0.36, body: 0.34 }, // ГУР
    ];
    const pulleyGeo = (r: number) =>
      merged([
        cylX(r, 0.24, 48),
        cylX(r * 0.62, 0.28, 32),
        cylX(r * 0.22, 0.34, 16),
        new THREE.TorusGeometry(r, 0.018, 4, 48).rotateY(Math.PI / 2).translate(0.07, 0, 0),
        new THREE.TorusGeometry(r, 0.018, 4, 48).rotateY(Math.PI / 2).translate(-0.07, 0, 0),
      ]);
    defs.forEach((d, i) => {
      const g = new THREE.Group();
      g.position.set(3.38, d.y, d.z);
      const pm = mesh(pulleyGeo(d.r), mP, L, 30);
      // метка на ступице — чтобы вращение было видно
      const notch = mesh(rbox(0.05, d.r * 0.5, 0.08, 0.015, 1).translate(0.16, d.r * 0.42, 0), base.machined);
      pm.add(notch);
      details.push(notch);
      g.add(pm);
      if (d.body) {
        const body = mesh(cylX(d.body, 0.8, 28).translate(-0.55, 0, 0), mB, L, 30);
        g.add(body);
      }
      front.add(g);
      pulleys.push({ obj: pm, ratio: 0.72 / d.r });
      if (i === 0) pm.userData.crank = true;
    });
    // Ремень: замкнутая кривая по внешним точкам шкивов
    const order = [0, 4, 2, 1, 3, 6, 5];
    const cx = defs.reduce((s, d) => s + d.z, 0) / defs.length;
    const cy = defs.reduce((s, d) => s + d.y, 0) / defs.length;
    const pts: THREE.Vector3[] = [];
    for (const i of order) {
      const d = defs[i];
      const a = Math.atan2(d.y - cy, d.z - cx);
      for (const da of [-0.5, 0, 0.5]) {
        const aa = a + da;
        pts.push(new THREE.Vector3(3.38, d.y + Math.sin(aa) * (d.r + 0.04), d.z + Math.cos(aa) * (d.r + 0.04)));
      }
    }
    const belt = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, "centripetal"), 160, 0.045, 6, true);
    const beltMesh = mesh(belt, base.belt);
    details.push(beltMesh);
    front.add(beltMesh);
  }
  engine.add(front);

  /* ---- индикатор (обкатка) ---- */
  const indicatorMat = track(new THREE.MeshStandardMaterial({ color: "#3a0b0e", emissive: RED.clone(), emissiveIntensity: 0, metalness: 0.2, roughness: 0.4 }));
  hl.indicator.meshes.push(indicatorMat);
  const indicator = new THREE.Mesh(track(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 24).rotateZ(Math.PI / 2)), indicatorMat);
  indicator.position.set(3.19, 1.45, 0.75);
  engine.add(indicator);

  /* ---- рама ---- */
  const frame = new THREE.Group();
  frame.name = "frame";
  const frameLine = track(new THREE.LineBasicMaterial({ color: STEEL_LINE.clone(), transparent: true, opacity: 0.32, depthWrite: false, toneMapped: false }));
  {
    const g = merged([
      rbox(10.5, 0.5, 0.34, 0.05).translate(0, -2.18, 2.4),
      rbox(10.5, 0.5, 0.34, 0.05).translate(0, -2.18, -2.4),
      rbox(0.5, 0.36, 4.9, 0.05).translate(0.6, -2.18, 0),
      rbox(0.42, 0.32, 4.9, 0.05).translate(-3.9, -2.18, 0),
      new THREE.CylinderGeometry(0.2, 0.24, 1.1, 16).translate(0.6, -1.42, 2.32),
      new THREE.CylinderGeometry(0.2, 0.24, 1.1, 16).translate(0.6, -1.42, -2.32),
    ]);
    const fm = mesh(g, base.frame, frameLine, 30);
    frame.add(fm);
  }
  root.add(frame);

  /* ---- пол-«чертёж»: сетка, окружность, размерные засечки ---- */
  const floor = new THREE.Group();
  floor.name = "floor";
  const floorMats: THREE.Material[] = [];
  {
    const gridMat = track(new THREE.LineBasicMaterial({ color: "#6b737e", transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false }));
    const accMat = track(new THREE.LineBasicMaterial({ color: "#d3202b", transparent: true, opacity: 0.6, depthWrite: false, toneMapped: false }));
    floorMats.push(gridMat, accMat);
    const pts: number[] = [];
    const R = 14;
    for (let i = -R; i <= R; i += 1) {
      pts.push(i, 0, -R, i, 0, R, -R, 0, i, R, 0, i);
    }
    const grid = new THREE.LineSegments(track(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(pts, 3))), gridMat);
    floor.add(grid);
    const ring: number[] = [];
    const ticks: number[] = [];
    const rr = 6.2;
    for (let i = 0; i < 128; i++) {
      const a0 = (i / 128) * Math.PI * 2;
      const a1 = ((i + 1) / 128) * Math.PI * 2;
      ring.push(Math.cos(a0) * rr, 0, Math.sin(a0) * rr, Math.cos(a1) * rr, 0, Math.sin(a1) * rr);
      if (i % 4 === 0) {
        const t = i % 16 === 0 ? 0.5 : 0.22;
        ticks.push(Math.cos(a0) * rr, 0, Math.sin(a0) * rr, Math.cos(a0) * (rr + t), 0, Math.sin(a0) * (rr + t));
      }
    }
    floor.add(new THREE.LineSegments(track(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute([...ring, ...ticks], 3))), gridMat));
    // красные метки по осям
    const acc = [-7.5, 0, 0, -6.6, 0, 0, 6.6, 0, 0, 7.5, 0, 0, 0, 0, -7.5, 0, 0, -6.6, 0, 0, 6.6, 0, 0, 7.5];
    floor.add(new THREE.LineSegments(track(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(acc, 3))), accMat));
    // мягкая тень
    const shadowTex = track(radialTexture("rgba(0,0,0,0.75)", "rgba(0,0,0,0)"));
    const shadowMat = track(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    floorMats.push(shadowMat);
    const shadow = new THREE.Mesh(track(new THREE.PlaneGeometry(13, 9)), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    floor.add(shadow);
    floor.position.y = -2.45;
  }
  root.add(floor);

  /* ---- якоря для свечения ---- */
  const anchor = (parent: THREE.Object3D, x: number, y: number, z: number) => {
    const o = new THREE.Object3D();
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  };
  const anchors: Record<HL, THREE.Object3D> = {
    block: anchor(engine, 0, 0.9, 0),
    heads: anchor(engine, 0, 3.1, 0),
    pistons: anchor(engine, 0, 2.4, 0),
    crank: anchor(engine, 0, 0, 0),
    attach: anchor(engine, 1.2, 2.6, 0),
    indicator: anchor(engine, 3.3, 1.45, 0.75),
  };

  /* ---- кинематика ---- */
  const pin = new THREE.Vector3();
  const pp = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const pose = (theta: number, lift: number) => {
    let k = 0;
    for (let t = 0; t < 4; t++) {
      const a = theta + THROW_PHASE[t];
      for (const b of BANKS) {
        const x = THROW_X[t] + b.dx;
        // палец шатуна на коленвале
        pin.set(x, Math.cos(a) * CRANK_R, Math.sin(a) * CRANK_R);
        const along = pin.y * b.d.y + pin.z * b.d.z;
        const across = pin.y * b.n.y + pin.z * b.n.z;
        const s = along + Math.sqrt(ROD_L * ROD_L - across * across);
        const sUp = s + lift * 2.9 + lift * 0.18 * (t - 1.5) * b.side * 0.4;
        pp.set(x, b.d.y * sUp, b.d.z * sUp);
        const piston = pistons[k];
        piston.position.copy(pp).addScaledVector(b.d, 0.16);
        piston.rotation.set(b.rot, 0, 0);
        // шатун: от пальца на коленвале к поршневому пальцу; при раскрытии висит под поршнем
        const low = tmp.copy(pin).lerp(pp.clone().addScaledVector(b.d, -ROD_L), lift);
        const rod = rods[k];
        rod.position.copy(low).add(pp).multiplyScalar(0.5);
        const dir = pp.clone().sub(low).normalize();
        rod.quaternion.setFromUnitVectors(up, dir);
        k++;
      }
    }
  };
  pose(0, 0);

  /* ---- подсветка ---- */
  const setHighlight = (key: HL, w: number) => {
    const set = hl[key];
    for (const m of set.meshes) m.emissiveIntensity = key === "indicator" ? 0.4 + w * 2.6 : w * 0.05;
    for (const l of set.lines) {
      l.color.copy(STEEL_LINE).lerp(RED_LINE, w);
      l.opacity = 0.42 + w * 0.5;
    }
  };

  const xrayMats = [...hl.block.meshes, ...hl.heads.meshes];
  let xrayOn = false;
  const setXray = (v: number) => {
    const on = v > 0.002;
    for (const m of xrayMats) {
      m.opacity = 1 - v * 0.86;
      if (on !== xrayOn) {
        m.transparent = on;
        m.depthWrite = !on;
        m.needsUpdate = true;
      }
    }
    xrayOn = on;
  };

  if (opts.lowDetail) details.forEach((d) => (d.visible = false));

  return {
    root,
    engine,
    parts: { block, heads, crank, pistons, rods, turbos, intake, front, pulleys, pan, frame, floor },
    anchors,
    indicator,
    setHighlight,
    details,
    edges,
    frameMaterials: [base.frame, frameLine],
    floorMaterials: floorMats,
    pose,
    setXray,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
