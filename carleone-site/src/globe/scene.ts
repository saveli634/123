/**
 * Живой глобус «Карта Carleone» на Three.js. Загружается лениво (динамический import).
 * Тёмная сфера, ~9 000 золотых точек суши (InstancedMesh), сетка меридианов, свечение по краю,
 * дуги маршрутов (Line2, анимация dashOffset), маркеры стран и пульсирующий лев над Казахстаном.
 * Рисует только пока его видно: start()/stop() вызывает React-обёртка.
 */
import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  Float32BufferAttribute,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  QuadraticBezierCurve3,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Sprite,
  SpriteMaterial,
  Vector3,
  WebGLRenderer,
} from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import {
  cameraDistance,
  CENTER,
  COUNTRIES,
  type Country,
  fib,
  FOV,
  landPoints,
  shotsFor,
  type Shot,
  toXYZ,
} from "./geo";
import { ARCS, highlights, shotAt, smooth, textStage } from "./timeline";
import { OUTLINES } from "@/generated/globe-data";
import { LION_D, LION_H, LION_W } from "@/generated/lion";

export interface Globe {
  /** Положение прокрутки: -1 — первый экран, 0…4 — этапы. */
  setT(t: number): void;
  resize(w: number, h: number): void;
  start(): void;
  stop(): void;
  /** Для рендеров: один кадр без сглаживания; глобус по центру, с заданным кадром или "actual" — как на сайте. */
  still(t: number, w: number, h: number, shot?: Partial<Shot> | "actual"): void;
  dispose(): void;
}

export interface GlobeOptions {
  /** Режим рендера картинок: без цикла, буфер сохраняется для toDataURL. */
  still?: boolean;
  /** Сцена тормозит (<40 fps за 2 с) — качество уже снижено, можно сообщить интерфейсу. */
  onSlow?: () => void;
  /** Потерян WebGL-контекст — показываем запасные рендеры. */
  onLost?: () => void;
}

const GOLD = new Vector3(0.89, 0.757, 0.51); // #E3C182 (sRGB, шейдеры без перевода цвета)
const GOLD_HOT = new Vector3(1.0, 0.9, 0.68);

const sphereVS = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const sphereFS = /* glsl */ `
uniform vec3 uBase;
uniform vec3 uRim;
uniform vec3 uLight;
varying vec3 vN;
varying vec3 vV;
void main() {
  float facing = max(dot(vN, vV), 0.0);
  float rim = pow(1.0 - facing, 3.2);
  float l = max(dot(vN, normalize(uLight)), 0.0);
  vec3 c = uBase * (0.75 + 0.9 * l) + uRim * rim * 0.42;
  gl_FragColor = vec4(c, 1.0);
}`;

const atmoFS = /* glsl */ `
uniform vec3 uColor;
uniform float uK;
varying vec3 vN;
varying vec3 vV;
void main() {
  // задняя сторона внешней сферы: 0 на внешнем краю, максимум у края планеты
  float s = clamp(-dot(vN, vV) / 0.45, 0.0, 1.0);
  float i = pow(s, 3.4) * uK;
  gl_FragColor = vec4(uColor, i);
}`;

const dotsVS = /* glsl */ `
uniform float uHi[6];
uniform float uTime;
uniform float uSize;
attribute float aCountry;
attribute float aSeed;
varying float vA;
varying float vHi;
void main() {
  float hi = uHi[int(aCountry + 0.5)];
  vec3 p = position * uSize * (1.0 + hi * 0.3);
  vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.0);
  vec3 c = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  float facing = dot(normalize(c), normalize(cameraPosition - c));
  float tw = 0.78 + 0.22 * sin(uTime * 1.1 + aSeed * 37.0);
  vA = smoothstep(-0.02, 0.5, facing) * mix(0.5 * tw, 1.0, hi);
  vHi = hi;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const dotsFS = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uHot;
varying float vA;
varying float vHi;
void main() {
  gl_FragColor = vec4(mix(uColor, uHot, vHi), vA);
}`;

function glowTexture(size = 128, inner = "rgba(255,226,170,1)", mid = "rgba(227,193,130,.35)") {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, inner);
  grd.addColorStop(0.25, mid);
  grd.addColorStop(1, "rgba(227,193,130,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** Медальон со львом: тёмный круг, золотое кольцо, лев из векторного логотипа. */
function lionBadgeTexture() {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const R = S / 2 - 6;
  const grd = g.createRadialGradient(S / 2, S * 0.42, 0, S / 2, S / 2, R);
  grd.addColorStop(0, "#221a1b");
  grd.addColorStop(1, "#0a0809");
  g.fillStyle = grd;
  g.beginPath();
  g.arc(S / 2, S / 2, R, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 7;
  g.strokeStyle = "#e3c182";
  g.stroke();
  g.lineWidth = 2;
  g.strokeStyle = "rgba(227,193,130,.35)";
  g.beginPath();
  g.arc(S / 2, S / 2, R - 22, 0, Math.PI * 2);
  g.stroke();
  const s = ((R * 2) / Math.max(LION_W, LION_H)) * 0.62;
  g.save();
  g.translate(S / 2 - (LION_W * s) / 2 + 4, S / 2 - (LION_H * s) / 2);
  g.scale(s, s);
  g.fillStyle = "#e3c182";
  g.fill(new Path2D(LION_D), "evenodd");
  g.restore();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Плоский объект на поверхности: ось z — наружу, «верх» — на север. */
function placeOnSurface(o: Object3D, lat: number, lon: number, r: number) {
  const n = new Vector3(...toXYZ(lat, lon, 1));
  o.position.copy(n).multiplyScalar(r);
  const east = new Vector3(0, 1, 0).cross(n).normalize();
  const north = new Vector3().crossVectors(n, east).normalize();
  const m = o.matrix.makeBasis(east, north, n);
  o.quaternion.setFromRotationMatrix(m);
}

export function createGlobe(canvas: HTMLCanvasElement, opts: GlobeOptions = {}): Globe {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: !!opts.still,
  });
  renderer.setClearColor(0x000000, 0);
  const coarse = typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
  let dpr = opts.still ? 2 : Math.min(window.devicePixelRatio || 1, coarse ? 1.75 : 2);
  renderer.setPixelRatio(dpr);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.05, 50);
  const world = new Group();
  scene.add(world);
  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

  // --- сфера и свечение края --------------------------------------------------------------
  const sphere = new Mesh(
    keep(new SphereGeometry(1, 96, 64)),
    keep(
      new ShaderMaterial({
        vertexShader: sphereVS,
        fragmentShader: sphereFS,
        uniforms: {
          uBase: { value: new Vector3(0.062, 0.048, 0.05) },
          uRim: { value: GOLD },
          uLight: { value: new Vector3(-0.6, 0.9, 0.7) },
        },
      }),
    ),
  );
  world.add(sphere);

  const atmo = new Mesh(
    keep(new SphereGeometry(1.12, 64, 48)),
    keep(
      new ShaderMaterial({
        vertexShader: sphereVS,
        fragmentShader: atmoFS,
        uniforms: { uColor: { value: GOLD }, uK: { value: 0.2 } },
        side: BackSide,
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    ),
  );
  world.add(atmo);

  // --- сетка меридианов и параллелей ------------------------------------------------------
  {
    const pts: number[] = [];
    const R = 1.0015;
    for (let lon = -180; lon < 180; lon += 15)
      for (let lat = -84; lat < 84; lat += 3) pts.push(...toXYZ(lat, lon, R), ...toXYZ(lat + 3, lon, R));
    for (let lat = -75; lat <= 75; lat += 15)
      for (let lon = -180; lon < 180; lon += 3) pts.push(...toXYZ(lat, lon, R), ...toXYZ(lat, lon + 3, R));
    const g = keep(new BufferGeometry());
    g.setAttribute("position", new Float32BufferAttribute(pts, 3));
    const grid = new LineSegments(
      g,
      keep(
        new LineBasicMaterial({
          color: 0xe3c182,
          transparent: true,
          opacity: 0.09,
          depthWrite: false,
        }),
      ),
    );
    world.add(grid);
  }

  // --- точки суши ----------------------------------------------------------------------------
  const land = landPoints();
  // детерминированное перемешивание: при снижении качества отбрасываем «хвост» — остаётся равномерно
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = land.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [land[i], land[j]] = [land[j], land[i]];
  }
  const dotGeo = keep(new CircleGeometry(1, 10));
  const dotMat = keep(
    new ShaderMaterial({
      vertexShader: dotsVS,
      fragmentShader: dotsFS,
      uniforms: {
        uHi: { value: [0, 0, 0, 0, 0, 0] },
        uTime: { value: 0 },
        uSize: { value: 0.0047 },
        uColor: { value: GOLD },
        uHot: { value: GOLD_HOT },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    }),
  );
  const dots = new InstancedMesh(dotGeo, dotMat, land.length);
  {
    const o = new Object3D();
    const country = new Float32Array(land.length);
    const seeds = new Float32Array(land.length);
    land.forEach(({ i, c }, k) => {
      const [lon, lat] = fib(i);
      placeOnSurface(o, lat, lon, 1.0028);
      o.scale.setScalar(1);
      o.updateMatrix();
      dots.setMatrixAt(k, o.matrix);
      country[k] = c;
      seeds[k] = rnd();
    });
    dotGeo.setAttribute("aCountry", new InstancedBufferAttribute(country, 1));
    dotGeo.setAttribute("aSeed", new InstancedBufferAttribute(seeds, 1));
    dots.instanceMatrix.needsUpdate = true;
    dots.frustumCulled = false;
  }
  world.add(dots);

  // --- контуры стран маршрута --------------------------------------------------------------
  const outlineMats = {} as Record<Country, LineBasicMaterial>;
  for (const c of COUNTRIES) {
    const mat = keep(
      new LineBasicMaterial({
        color: 0xf0d59c,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    outlineMats[c] = mat;
    for (const ring of OUTLINES[c]) {
      const g = keep(new BufferGeometry());
      g.setAttribute(
        "position",
        new Float32BufferAttribute(
          ring.flatMap(([lon, lat]) => toXYZ(lat, lon, 1.0035)),
          3,
        ),
      );
      world.add(new LineLoop(g, mat));
    }
  }

  // --- маркеры стран -----------------------------------------------------------------------
  const ringGeo = keep(new RingGeometry(0.85, 1, 48));
  const coreGeo = keep(new CircleGeometry(1, 24));
  const markers = {} as Record<
    Country,
    {
      ring: Mesh;
      ring2: Mesh;
      core: Mesh;
      mat: MeshBasicMaterial;
      mat2: MeshBasicMaterial;
      coreMat: MeshBasicMaterial;
      pulse: number;
      on: number;
    }
  >;
  for (const c of COUNTRIES) {
    const [lat, lon] = CENTER[c];
    const mk = (geo: BufferGeometry, mat: MeshBasicMaterial, s: number) => {
      const m = new Mesh(geo, mat);
      placeOnSurface(m, lat, lon, 1.006);
      m.scale.setScalar(s);
      world.add(m);
      return m;
    };
    const base = {
      color: 0xe3c182,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      opacity: 0,
    } as const;
    const mat = keep(new MeshBasicMaterial(base));
    const mat2 = keep(new MeshBasicMaterial(base));
    const coreMat = keep(new MeshBasicMaterial({ ...base, color: 0xffe2a8 }));
    markers[c] = {
      ring: mk(ringGeo, mat, 0.024),
      ring2: mk(ringGeo, mat2, 0.024),
      core: mk(coreGeo, coreMat, 0.0085),
      mat,
      mat2,
      coreMat,
      pulse: -10,
      on: 0,
    };
  }

  // --- лев над Казахстаном: медальон на «ножке», всегда лицом к камере ----------------------
  const glowTex = keep(glowTexture());
  const kz = new Vector3(...toXYZ(CENTER.KZ[0], CENTER.KZ[1], 1));
  const lionMat = keep(
    new SpriteMaterial({
      map: keep(lionBadgeTexture()),
      transparent: true,
      depthWrite: false,
    }),
  );
  const lion = new Sprite(lionMat);
  lion.position.copy(kz).multiplyScalar(1.13);
  lion.renderOrder = 5;
  world.add(lion);
  const lionGlowMat = keep(
    new SpriteMaterial({
      map: glowTex,
      color: 0xe3c182,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      opacity: 0.5,
    }),
  );
  const lionGlow = new Sprite(lionGlowMat);
  lionGlow.position.copy(lion.position);
  lionGlow.renderOrder = 4;
  world.add(lionGlow);
  const stemMat = keep(
    new LineBasicMaterial({
      color: 0xe3c182,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    }),
  );
  {
    const g = keep(new BufferGeometry());
    g.setAttribute(
      "position",
      new Float32BufferAttribute(
        [...kz.clone().multiplyScalar(1.004).toArray(), ...kz.clone().multiplyScalar(1.1).toArray()],
        3,
      ),
    );
    world.add(new LineSegments(g, stemMat));
  }

  // --- дуги ----------------------------------------------------------------------------------
  const arcs = ARCS.map((a) => {
    const A = new Vector3(...toXYZ(...CENTER[a.from], 1.004));
    const B = new Vector3(...toXYZ(...CENTER[a.to], 1.004));
    const ang = A.angleTo(B);
    const ctrl = A.clone()
      .add(B)
      .normalize()
      .multiplyScalar(1.2 + ang * 0.62);
    const curve = new QuadraticBezierCurve3(A, ctrl, B);
    const pts = curve.getPoints(96);
    const flat = pts.flatMap((p) => [p.x, p.y, p.z]);
    const L = curve.getLength();
    const mk = (width: number, opacity: number) => {
      const geo = keep(new LineGeometry());
      geo.setPositions(flat);
      const mat = keep(
        new LineMaterial({
          color: 0xe3c182,
          linewidth: width,
          transparent: true,
          opacity,
          dashed: true,
          dashSize: L,
          gapSize: L * 1.05,
          dashOffset: L,
          depthWrite: false,
          blending: AdditiveBlending,
        }),
      );
      const line = new Line2(geo, mat);
      line.computeLineDistances();
      line.frustumCulled = false;
      world.add(line);
      return mat;
    };
    const glow = mk(6, 0.14);
    const main = mk(1.6, 0.95);
    const headMat = keep(
      new SpriteMaterial({
        map: glowTex,
        color: 0xffe0a6,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        opacity: 0,
      }),
    );
    const head = new Sprite(headMat);
    head.scale.setScalar(0.07);
    world.add(head);
    return { ...a, curve, L, main, glow, head, headMat, p: 0, arrived: false };
  });

  // «комета», бегущая по последней нарисованной дуге этапа
  const cometMat = keep(
    new SpriteMaterial({
      map: glowTex,
      color: 0xffe6b5,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      opacity: 0,
    }),
  );
  const comet = new Sprite(cometMat);
  comet.scale.setScalar(0.05);
  world.add(comet);

  // --- состояние -----------------------------------------------------------------------------
  let W = 1;
  let H = 1;
  let shots = shotsFor(1, 1);
  let tTarget = -1;
  let tCur = -1;
  const cur: Shot = { ...shots[0] };
  const hi: Record<Country, number> = { KZ: 1, DE: 0, FR: 0, BE: 0, JP: 0 };
  let time = 0;
  let last = 0;
  let raf = 0;
  let running = false;
  let slowChecked = false;
  let snapped = false;
  let fpsFrames = 0;
  let fpsStart = 0;

  function applyCamera(s: Shot) {
    const d = cameraDistance(s.r, W, H);
    camera.position.set(...toXYZ(s.lat, s.lon, d));
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    camera.setViewOffset(W, H, -s.cx * W, -s.cy * H, W, H);
  }

  /** Всё, что зависит от t (дуги, подсветки, маркеры). snap — без сглаживания (для рендеров). */
  function update(t: number, dt: number, snap: boolean) {
    const stage = textStage(t);
    const target = highlights(stage);
    const k = snap ? 1 : 1 - Math.pow(1 - 0.06, dt * 60);
    for (const c of COUNTRIES) hi[c] += (target[c] - hi[c]) * k;
    const u = dotMat.uniforms.uHi.value as number[];
    COUNTRIES.forEach((c, i) => (u[i + 1] = hi[c] * (c === "KZ" ? 0.85 : 1)));
    dotMat.uniforms.uTime.value = time;

    // контуры: Казахстан всегда чуть виден, остальные — на своём этапе
    for (const c of COUNTRIES) outlineMats[c].opacity = c === "KZ" ? 0.22 + 0.45 * hi.KZ : 0.6 * hi[c];

    // дуги
    let active: (typeof arcs)[number] | null = null;
    for (const a of arcs) {
      const p = smooth(a.start, a.end, t);
      a.p = p;
      const dim = stage === 4 ? 0.85 : a.stage === stage ? 1 : 0.42;
      a.main.dashOffset = a.L * (1 - p);
      a.glow.dashOffset = a.L * (1 - p);
      a.main.opacity = 0.95 * dim;
      a.glow.opacity = 0.14 * dim;
      const drawing = p > 0.001 && p < 0.999;
      a.headMat.opacity = drawing ? 0.95 : 0;
      if (drawing) a.head.position.copy(a.curve.getPoint(p));
      if (p >= 0.999 && !a.arrived) {
        a.arrived = true;
        markers[a.to].pulse = time;
      }
      if (p < 0.9) a.arrived = false;
      if (p >= 0.999 && a.stage === stage) active = a;
    }
    if (stage === 4) active = arcs[(Math.floor(time / 2.4) % arcs.length) as number];
    if (active && active.p >= 0.999 && !snap) {
      const u2 = (time % 2.4) / 2.4;
      comet.position.copy(active.curve.getPoint(u2));
      cometMat.opacity = Math.sin(u2 * Math.PI) * 0.9;
    } else cometMat.opacity = 0;

    // маркеры: видимы, когда страна в игре; вспышка-кольцо при прилёте дуги и периодически
    for (const c of COUNTRIES) {
      const m = markers[c];
      const visible = c === "KZ" ? 1 : smooth(0.05, 0.4, hi[c]);
      m.on += (visible - m.on) * k;
      m.coreMat.opacity = 0.9 * m.on;
      const cycle = 2.6;
      const since = time - m.pulse;
      const ph = since >= 0 && since < 1.6 ? since / 1.6 : ((time + COUNTRIES.indexOf(c) * 0.4) % cycle) / cycle;
      const strong = since >= 0 && since < 1.6;
      m.ring.scale.setScalar(0.016 + 0.05 * ph * (strong ? 1.6 : 1));
      m.mat.opacity = (1 - ph) * (strong ? 1 : 0.55) * m.on * (snap ? 0 : 1);
      m.ring2.scale.setScalar(0.024);
      m.mat2.opacity = 0.75 * m.on;
    }

    // лев: пульсирует — медальон «дышит», свечение за ним разгорается и гаснет.
    // На первом экране медальона нет (там большой лев в заголовке) — он «вырастает» к этапу 1.
    const breathe = snap ? 0 : Math.sin(time * 2.4);
    const show = smooth(-0.62, -0.18, t);
    const lionSize = (0.13 + 0.03 * hi.KZ) * (0.6 + 0.4 * show);
    lion.scale.setScalar(lionSize * (1 + 0.045 * breathe));
    lion.position.copy(kz).multiplyScalar(1.02 + 0.11 * show);
    lionMat.opacity = show;
    stemMat.opacity = 0.7 * show;
    lionGlow.position.copy(lion.position);
    lionGlow.scale.setScalar(lionSize * 3.2 * (1 + 0.12 * breathe));
    lionGlowMat.opacity = (0.3 + 0.16 * breathe + 0.12 * hi.KZ) * show;
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    time += dt;

    const k = 1 - Math.pow(1 - 0.07, dt * 60); // ТЗ: инерция камеры, lerp 0.07
    tCur += (tTarget - tCur) * k;
    const target = shotAt(tCur, shots);
    // первый экран — глобус медленно поворачивается
    const idle = smooth(-0.4, -1, tCur);
    target.lon += Math.sin(time * 0.12) * 7 * idle + Math.sin(time * 0.31) * 0.6;
    cur.lat += (target.lat - cur.lat) * k;
    cur.lon += (target.lon - cur.lon) * k;
    cur.r += (target.r - cur.r) * k;
    cur.cx += (target.cx - cur.cx) * k;
    cur.cy += (target.cy - cur.cy) * k;
    applyCamera(cur);
    update(tCur, dt, false);
    renderer.render(scene, camera);

    // медленно — снижаем плотность пикселей и число точек (один раз)
    if (!slowChecked) {
      if (!fpsStart) fpsStart = now;
      fpsFrames++;
      if (now - fpsStart > 2000) {
        slowChecked = true;
        const fps = (fpsFrames * 1000) / (now - fpsStart);
        if (fps < 40) {
          dpr = 1;
          renderer.setPixelRatio(1);
          renderer.setSize(W, H, false);
          dots.count = Math.floor(land.length * 0.55);
          opts.onSlow?.();
        }
      }
    }
  }

  const onLost = (e: Event) => {
    e.preventDefault();
    api.stop();
    opts.onLost?.();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  const api: Globe = {
    setT(t) {
      tTarget = t;
    },
    resize(w, h) {
      W = Math.max(1, w);
      H = Math.max(1, h);
      shots = shotsFor(W, H);
      camera.aspect = W / H;
      renderer.setPixelRatio(dpr);
      renderer.setSize(W, H, false);
      camera.updateProjectionMatrix();
    },
    start() {
      if (running) return;
      running = true;
      if (!snapped) {
        // первый запуск — сразу в нужный кадр, без «перелёта» из кадра по умолчанию
        snapped = true;
        tCur = tTarget;
        Object.assign(cur, shotAt(tCur, shots));
      }
      last = 0;
      fpsStart = 0;
      fpsFrames = 0;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    still(t, w, h, shot) {
      api.resize(w, h);
      time = 1.2;
      tCur = tTarget = t;
      const s = shot === "actual" ? shotAt(t, shots) : { ...shotAt(t, shots), cx: 0, cy: 0, r: 0.42, ...shot };
      Object.assign(cur, s);
      applyCamera(cur);
      update(t, 0, true);
      renderer.render(scene, camera);
    },
    dispose() {
      api.stop();
      canvas.removeEventListener("webglcontextlost", onLost);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    },
  };

  // первый кадр сразу — без «пустого» холста
  Object.assign(cur, shots[0]);
  return api;
}
