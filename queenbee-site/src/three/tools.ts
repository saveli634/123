import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * Процедурные инструменты — стилизованные, без логотипов и надписей.
 * Размеры — в единицах зеркала (радиус стекла = 1).
 */
export function materials() {
  return {
    gold: new THREE.MeshStandardMaterial({ color: 0xd4b06a, metalness: 1, roughness: 0.24 }),
    goldDark: new THREE.MeshStandardMaterial({ color: 0xb48f4e, metalness: 1, roughness: 0.32 }),
    champagne: new THREE.MeshStandardMaterial({ color: 0xd9be85, metalness: 0.95, roughness: 0.28 }),
    lacquer: new THREE.MeshPhysicalMaterial({ color: 0x3a1a20, roughness: 0.16, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06 }),
    bullet: new THREE.MeshPhysicalMaterial({ color: 0x9e2b3a, roughness: 0.34, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.2 }),
    espresso: new THREE.MeshPhysicalMaterial({ color: 0x2b1a17, roughness: 0.2, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08 }),
    ivory: new THREE.MeshPhysicalMaterial({ color: 0xeadcc2, roughness: 0.38, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
    tortoise: new THREE.MeshPhysicalMaterial({ color: 0x5a2e22, roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.4, sheenColor: new THREE.Color(0xc98a4b) }),
    bristle: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 }),
  };
}
export type Mats = ReturnType<typeof materials>;

const mesh = (g: THREE.BufferGeometry, m: THREE.Material) => {
  const x = new THREE.Mesh(g, m);
  x.castShadow = false;
  return x;
};

/** «Пуля» помады со скосом: верх цилиндра срезан под углом, кромка скруглена. */
function bulletGeometry(r: number, h: number) {
  const g = new THREE.CylinderGeometry(r, r, h, 48, 10);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const slant = 0.085;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const t = Math.max(0, y / (h / 2));
    const cut = slant * ((x / r + 1) / 2);
    pos.setY(i, y - Math.pow(t, 3) * cut);
  }
  g.computeVertexNormals();
  return g;
}

export interface Lipstick {
  group: THREE.Group;
  /** 0 — закрыта, 1 — колпачок снят */
  open: (k: number) => void;
  /** 0..1 — выдвинуть стик */
  extend: (k: number) => void;
}

export function buildLipstick(m: Mats): Lipstick {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);

  const base = mesh(new THREE.CylinderGeometry(0.074, 0.074, 0.2, 48), m.gold);
  base.position.y = 0.1;
  const foot = mesh(new THREE.CylinderGeometry(0.077, 0.077, 0.018, 48), m.goldDark);
  foot.position.y = 0.009;
  const lip = mesh(new THREE.TorusGeometry(0.0745, 0.006, 8, 48), m.goldDark);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 0.2;
  body.add(base, foot, lip);

  const sleeve = new THREE.Group();
  const sleeveMesh = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.14, 48), m.goldDark);
  sleeveMesh.position.y = 0.07;
  const bullet = mesh(bulletGeometry(0.05, 0.17), m.bullet);
  bullet.position.y = 0.14 + 0.085 - 0.01;
  sleeve.add(sleeveMesh, bullet);
  sleeve.position.y = 0.06;
  body.add(sleeve);

  const cap = new THREE.Group();
  const capMesh = mesh(new THREE.CylinderGeometry(0.079, 0.079, 0.25, 48), m.lacquer);
  capMesh.position.y = 0.125;
  const capTop = mesh(new THREE.CylinderGeometry(0.07, 0.079, 0.012, 48), m.lacquer);
  capTop.position.y = 0.256;
  const band = mesh(new THREE.TorusGeometry(0.079, 0.006, 8, 48), m.gold);
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.006;
  cap.add(capMesh, capTop, band);
  cap.position.y = 0.2;
  body.add(cap);
  body.position.y = -0.2;

  return {
    group,
    open: (k) => {
      cap.position.set(0.16 * k, 0.2 + 0.36 * k, 0.04 * k);
      cap.rotation.z = -0.55 * k;
    },
    extend: (k) => {
      sleeve.position.y = 0.06 + 0.13 * k;
    },
  };
}

export interface Brush {
  group: THREE.Group;
  /** кончик кисти в координатах группы */
  tip: THREE.Vector3;
}

export function buildBrush(m: Mats): Brush {
  const group = new THREE.Group();
  // токарная ручка
  const handlePts = [
    [0.0, -0.66],
    [0.014, -0.655],
    [0.022, -0.62],
    [0.026, -0.5],
    [0.031, -0.3],
    [0.034, -0.1],
    [0.033, 0.0],
    [0.031, 0.02],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const handle = mesh(new THREE.LatheGeometry(handlePts, 40), m.espresso);
  const ferrule = mesh(new THREE.CylinderGeometry(0.037, 0.031, 0.15, 40), m.gold);
  ferrule.position.y = 0.095;
  const ring = mesh(new THREE.TorusGeometry(0.0315, 0.004, 8, 40), m.goldDark);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.02;
  // щетинки: пушистый конус, от тёмного у основания к нюду на кончике
  const bPts = [
    [0.034, 0.165],
    [0.046, 0.2],
    [0.056, 0.25],
    [0.057, 0.29],
    [0.048, 0.33],
    [0.03, 0.365],
    [0.012, 0.384],
    [0.0, 0.39],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const bg = new THREE.LatheGeometry(bPts, 40);
  const pos = bg.attributes.position as THREE.BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  const c0 = new THREE.Color(0x5b3f36);
  const c1 = new THREE.Color(0xd8b4a6);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = THREE.MathUtils.smoothstep(pos.getY(i), 0.17, 0.33);
    c.copy(c0).lerp(c1, t);
    col.set([c.r, c.g, c.b], i * 3);
  }
  bg.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const bristles = mesh(bg, m.bristle);
  group.add(handle, ferrule, ring, bristles);
  return { group, tip: new THREE.Vector3(0, 0.39, 0) };
}

export function buildComb(m: Mats): THREE.Group {
  const group = new THREE.Group();
  const spine = mesh(new RoundedBoxGeometry(0.66, 0.075, 0.026, 3, 0.012), m.tortoise);
  group.add(spine);
  const edge = mesh(new THREE.BoxGeometry(0.62, 0.006, 0.028), m.gold);
  edge.position.y = 0.03;
  group.add(edge);
  const n = 27;
  const tooth = new THREE.BoxGeometry(0.012, 1, 0.02);
  tooth.translate(0, -0.5, 0);
  const teeth = new THREE.InstancedMesh(tooth, m.tortoise, n);
  const mtx = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    const x = -0.3 + (0.6 * i) / (n - 1);
    const len = i < 11 ? 0.15 : 0.19; // частая и редкая половины
    mtx.compose(new THREE.Vector3(x, -0.035, 0), new THREE.Quaternion(), new THREE.Vector3(i < 11 ? 0.8 : 1, len, 1));
    teeth.setMatrixAt(i, mtx);
  }
  group.add(teeth);
  return group;
}

/** Шпилька с шестиугольником — отсыл к соте и пчеле. */
export function buildHexPin(m: Mats): THREE.Group {
  const group = new THREE.Group();
  const hex = mesh(new THREE.TorusGeometry(0.12, 0.016, 10, 6), m.gold);
  hex.rotation.z = Math.PI / 6;
  const inner = mesh(new THREE.TorusGeometry(0.062, 0.009, 8, 6), m.goldDark);
  inner.rotation.z = Math.PI / 6;
  const pearl = mesh(new THREE.SphereGeometry(0.028, 24, 16), m.ivory);
  const pin = mesh(new THREE.CylinderGeometry(0.008, 0.003, 0.46, 12), m.gold);
  pin.position.y = -0.12 - 0.23;
  group.add(hex, inner, pearl, pin);
  return group;
}
