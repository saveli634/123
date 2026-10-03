import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { createGlass } from "./glass";
import { buildStrands } from "./strands";
import { createParticles } from "./particles";
import { materials, buildLipstick, buildBrush, buildComb, buildHexPin } from "./tools";
import type { Crop } from "@/lib/crop";
import { FLIPS } from "@/content/copy";
import { param } from "@/lib/env";

/**
 * «Зеркало образа» — один объект на всю первую половину страницы.
 * Снаружи на каждый кадр приходят: центр и диаметр стекла в пикселях экрана (cx, cy, d)
 * и прогресс закреплённой сцены p ∈ [0, 1]. Сцена сама ставит зеркало в эту точку,
 * поэтому подмена CSS-зеркала первого экрана на 3D проходит без скачка.
 */
export interface FrameIn {
  cx: number;
  cy: number;
  d: number;
  p: number;
  /** прокрутка в px — для блика на стекле */
  y: number;
}

export interface PhotoSrc {
  url: string;
  crop: Crop;
}

export interface SceneOptions {
  mobile: boolean;
  bloom: boolean;
  /** кадры зеркала по порядку (0 — первый экран) */
  photos: PhotoSrc[];
  /** неподвижный кадр для рендеров: фиксированное время, без случайностей */
  still?: boolean;
  onReady?: () => void;
  onLowPower?: () => void;
}

export interface MirrorScene {
  frame: (f: FrameIn) => void;
  resize: (w: number, h: number) => void;
  pointer: (x: number, y: number) => void;
  /** запустить зажигание кольца (после прелоадера) */
  ignite: () => void;
  /** все кадры зеркала загружены (для рендеров) */
  allLoaded: () => boolean;
  dispose: () => void;
}

const LEDS = 64;
const FOV = 30;
const CAM_Z = 10;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const sm = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Финальный проход вместо OutputPass. Буфер композера хранит цвет, умноженный на альфу
 * (прозрачный фон страницы виден сквозь канву). Тон-маппинг и sRGB применяем к «чистому» цвету
 * и снова умножаем на альфу, а свет bloom поверх пустых мест добавляем как чистое свечение —
 * иначе полупрозрачные ореолы выцветают в белое.
 */
const FinalShader = {
  uniforms: { tDiffuse: { value: null as THREE.Texture | null }, tBloom: { value: null as THREE.Texture | null } },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform sampler2D tBloom; varying vec2 vUv;
    vec3 neutral(vec3 color){
      const float sc = 0.92; const float desat = 0.1;
      float x = min(color.r, min(color.g, color.b));
      float off = x < 0.08 ? x - 6.25 * x * x : 0.04;
      color -= off;
      float peak = max(color.r, max(color.g, color.b));
      if (peak < sc) return color;
      float d = 1.0 - sc;
      float np = 1.0 - d * d / (peak + d - sc);
      color *= np / peak;
      float g = 1.0 - 1.0 / (desat * (peak - np) + 1.0);
      return mix(color, vec3(np), g);
    }
    vec3 enc(vec3 x){ x = clamp(x, 0.0, 1.0); return mix(x * 12.92, 1.055 * pow(x, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), x)); }
    void main(){
      vec4 t = texture2D(tDiffuse, vUv);
      float a = clamp(t.a, 0.0, 1.0);
      vec3 s = t.rgb / max(a, 1e-3);
      vec3 base = a > 1e-3 ? enc(neutral(min(s, vec3(4.0)))) * a : vec3(0.0);
      vec3 glow = enc(texture2D(tBloom, vUv).rgb * 0.5) * 0.8;
      vec3 rgb = min(base + glow, vec3(1.0));
      gl_FragColor = vec4(rgb, max(a, max(glow.r, max(glow.g, glow.b))));
    }`,
};

export function createMirrorScene(canvas: HTMLCanvasElement, opts: SceneOptions): MirrorScene | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: !!opts.still,
    });
  } catch {
    return null;
  }
  if (!renderer.capabilities.isWebGL2) {
    renderer.dispose();
    return null;
  }
  let dpr = Math.min(window.devicePixelRatio || 1, opts.mobile ? 1.6 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.95;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.set(0, 0, CAM_Z);

  scene.add(new THREE.HemisphereLight(0xfff6ea, 0xd9c8ae, 0.9));
  const key = new THREE.DirectionalLight(0xfff1dc, 1.8);
  key.position.set(-3, 4, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffe2c0, 1.1);
  rim.position.set(4, 1, -3);
  scene.add(rim);

  const M = materials();
  const MILK = new THREE.Color(0xf4efe6);

  /* ---------- Зеркало ---------- */
  const root = new THREE.Group();
  const pivot = new THREE.Group();
  root.add(pivot);
  scene.add(root);

  const glass = createGlass(MILK);
  pivot.add(glass.mesh);
  const bezel = new THREE.Mesh(new THREE.TorusGeometry(1.035, 0.038, 24, 180), M.champagne);
  const track = new THREE.Mesh(new THREE.TorusGeometry(1.118, 0.012, 12, 180), M.champagne);
  const rimBand = new THREE.Mesh(new THREE.CylinderGeometry(1.13, 1.13, 0.05, 160, 1, true), M.goldDark);
  rimBand.rotation.x = Math.PI / 2;
  const panel = new THREE.Mesh(
    new THREE.RingGeometry(1.03, 1.128, 160),
    new THREE.MeshStandardMaterial({ color: 0xefe6d6, roughness: 0.55, metalness: 0.1, side: THREE.DoubleSide }),
  );
  pivot.add(bezel, track, rimBand, panel);

  // кольцо света: 64 светодиода
  const ledGeo = new THREE.SphereGeometry(0.019, 12, 8);
  const ledMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const leds = new THREE.InstancedMesh(ledGeo, ledMat, LEDS);
  const ledAngles: number[] = [];
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < LEDS; i++) {
    const a = Math.PI / 2 - (i / LEDS) * Math.PI * 2; // по часовой стрелке от верхней точки
    ledAngles.push(a);
    m4.makeTranslation(Math.cos(a) * 1.08, Math.sin(a) * 1.08, 0);
    leds.setMatrixAt(i, m4);
    leds.setColorAt(i, new THREE.Color(0, 0, 0));
  }
  pivot.add(leds);

  // ореолы светодиодов (на телефоне заменяют bloom)
  const haloPos = new Float32Array(LEDS * 3);
  const haloB = new Float32Array(LEDS);
  ledAngles.forEach((a, i) => haloPos.set([Math.cos(a) * 1.08, Math.sin(a) * 1.08, 0.03], i * 3));
  const haloGeo = new THREE.BufferGeometry();
  haloGeo.setAttribute("position", new THREE.BufferAttribute(haloPos, 3));
  haloGeo.setAttribute("aB", new THREE.BufferAttribute(haloB, 1));
  const haloUniforms = { uScale: { value: 400 }, uSize: { value: opts.bloom ? 0.09 : 0.14 } };
  const haloMat = new THREE.ShaderMaterial({
    uniforms: haloUniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `uniform float uScale; uniform float uSize; attribute float aB; varying float vB;
      void main(){ vB = aB; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = uSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */ `varying float vB;
      void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = pow(max(0.0, 1.0 - d), 2.2);
        vec3 c = mix(vec3(1.0, 0.82, 0.55), vec3(1.0, 0.98, 0.93), pow(max(0.0, 1.0 - d * 2.2), 2.0));
        gl_FragColor = vec4(c, a * vB * 0.7); }`,
  });
  haloMat.toneMapped = false;
  const halos = new THREE.Points(haloGeo, haloMat);
  halos.renderOrder = 6;
  halos.frustumCulled = false;
  pivot.add(halos);

  // тёплое свечение за зеркалом — «подсветка гримёрки» на молочном фоне
  const glowMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uI: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `uniform float uI; varying vec2 vP;
      void main(){ float r = length(vP); float a = (1.0 - smoothstep(1.1, 2.0, r)) * 0.32 + (1.0 - smoothstep(1.12, 1.3, r)) * 0.18;
        gl_FragColor = vec4(1.0, 0.86, 0.66, a * uI); }`,
  });
  glowMat.toneMapped = false;
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), glowMat);
  glow.position.z = -0.45;
  glow.renderOrder = -1;
  root.add(glow);

  /* ---------- Инструменты ---------- */
  const tools = new THREE.Group();
  root.add(tools);
  const lipstick = buildLipstick(M);
  const brush = buildBrush(M);
  const comb = buildComb(M);
  const hexPin = buildHexPin(M);
  tools.add(lipstick.group, brush.group, comb, hexPin);
  const toolScale = opts.mobile ? 0.72 : 1;

  const strandCount = opts.mobile ? 24 : 40;
  const strands = buildStrands(opts.mobile ? 4 : 5, opts.mobile ? 6 : 8, opts.mobile ? 90 : 130, opts.mobile ? 4 : 5);
  root.add(strands.mesh);
  const strandIndexPerStrand = strands.mesh.geometry.index!.count / strandCount;

  const particles = createParticles(opts.mobile ? 160 : 320);
  root.add(particles.group);

  /* ---------- Фото ---------- */
  const loader = new THREE.TextureLoader();
  const tex: (THREE.Texture | null)[] = opts.photos.map(() => null);
  const loading = new Set<number>();
  function load(i: number, then?: () => void) {
    if (i < 0 || i >= opts.photos.length || tex[i] || loading.has(i)) return;
    loading.add(i);
    loader.load(
      opts.photos[i].url,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        t.generateMipmaps = true;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        tex[i] = t;
        loading.delete(i);
        then?.();
      },
      undefined,
      () => loading.delete(i),
    );
  }
  let ready = false;
  load(0, () => {
    ready = true;
    // остальные кадры — после первого кадра, по одному
    let k = 1;
    const next = () => {
      if (k < opts.photos.length) load(k++, next);
    };
    next();
  });
  const texFor = (i: number) => {
    const j = Math.max(0, Math.min(opts.photos.length - 1, i));
    for (let k = j; k >= 0; k--) if (tex[k]) return k;
    return 0;
  };

  /* ---------- Пост-обработка ----------
     Выборочное свечение: UnrealBloomPass видит только светодиоды (слой 1),
     поэтому портрет в стекле остаётся чистым, без дымки. */
  const BLOOM_LAYER = 1;
  leds.layers.enable(BLOOM_LAYER);
  let bloomComposer: EffectComposer | null = null;
  let composer: EffectComposer | null = null;
  let bloomPass: UnrealBloomPass | null = null;
  const hdrTarget = () =>
    new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, colorSpace: THREE.LinearSRGBColorSpace });
  function setupBloom() {
    bloomComposer = new EffectComposer(renderer, hdrTarget());
    bloomComposer.renderToScreen = false;
    const bp = new RenderPass(scene, camera);
    bp.clearAlpha = 0;
    bloomComposer.addPass(bp);
    bloomPass = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.28, 0);
    bloomComposer.addPass(bloomPass);
    composer = new EffectComposer(renderer, hdrTarget());
    const rp = new RenderPass(scene, camera);
    rp.clearAlpha = 0;
    composer.addPass(rp);
    const fin = new ShaderPass(FinalShader);
    fin.uniforms.tBloom.value = bloomComposer.renderTarget2.texture;
    composer.addPass(fin);
  }
  if (opts.bloom) setupBloom();
  function draw() {
    if (composer && bloomComposer) {
      const bg = scene.environment;
      camera.layers.set(BLOOM_LAYER);
      bloomComposer.render();
      camera.layers.set(0);
      scene.environment = bg;
      composer.render();
    } else renderer.render(scene, camera);
  }

  /* ---------- Состояние ---------- */
  let W = 1, H = 1, ppu = 1;
  const pointerT = new THREE.Vector2();
  const pointerS = new THREE.Vector2();
  let t = 0;
  let last = performance.now();
  let igniteAt = opts.still ? -10 : Infinity;
  let prevP = 0;
  let flickerAt = -10;
  let sparksAt = -10;
  let level = 0.85;
  let moteTimer = 0;
  // замер скорости первые 2 секунды
  let fpsFrames = 0, fpsTime = 0, fpsStart = 0, fpsChecked = !!opts.still || param("nodegrade") !== null;
  let degraded = false;
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const col = new THREE.Color();
  const WARM = new THREE.Color(0xffe9c7);

  function resize(w: number, h: number) {
    W = Math.max(1, w);
    H = Math.max(1, h);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    ppu = H / (2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    composer?.setSize(W, H);
    bloomComposer?.setSize(W, H);
  }

  function degrade() {
    if (degraded) return;
    degraded = true;
    dpr = opts.mobile ? 1 : 1.25;
    renderer.setPixelRatio(dpr);
    composer?.dispose();
    bloomComposer?.dispose();
    composer = null;
    bloomComposer = null;
    bloomPass = null;
    haloUniforms.uSize.value = 0.14;
    strands.mesh.geometry.setDrawRange(0, Math.floor(strandCount / 2) * strandIndexPerStrand);
    particles.setLimit(opts.mobile ? 70 : 140);
    resize(W, H);
    opts.onLowPower?.();
  }

  function placeTool(o: THREE.Object3D, home: THREE.Vector3, orbitI: number, homeW: number, orbitW: number, p: number, scale: number) {
    const a = t * 0.32 + p * 9 + orbitI * (Math.PI / 2);
    const rx = opts.mobile ? 1.22 : 1.45;
    tmp2.set(Math.cos(a) * rx, Math.sin(a * 2) * 0.12 + Math.sin(a) * 0.32, Math.sin(a) * 0.95);
    const w = Math.max(homeW, orbitW);
    o.visible = w > 0.002;
    if (!o.visible) return;
    const k = orbitW / Math.max(w, 1e-4);
    o.position.lerpVectors(home, tmp2, k);
    o.scale.setScalar(scale * toolScale * (0.25 + 0.75 * w));
  }

  function frame(f: FrameIn) {
    const now = performance.now();
    const dt = opts.still ? 1 / 60 : Math.min(0.05, (now - last) / 1000);
    last = now;
    t = opts.still ? 2.4 : t + dt;
    const p = f.p;

    // ---------- раскладка: центр и диаметр стекла в пикселях -> мир ----------
    const s = f.d / 2 / ppu;
    const breathe = opts.still ? 0 : Math.sin(t * 1.15) * 0.012;
    root.position.set((f.cx - W / 2) / ppu, -(f.cy - H / 2) / ppu + breathe * s, 0);
    root.scale.setScalar(s * (1 + (opts.still ? 0 : Math.sin(t * 0.9) * 0.0025)));

    // ---------- разворот на 180° между кадрами ----------
    let flips = 0;
    for (const x of FLIPS) flips += sm(x, x + 0.04, p);
    pointerS.lerp(pointerT, 1 - Math.pow(1 - 0.06, dt * 60));
    const enter = sm(0.77, 0.93, p);
    const tiltK = 1 - enter;
    pivot.rotation.set(-pointerS.y * 0.12 * tiltK, flips * Math.PI + pointerS.x * 0.16 * tiltK, 0);
    camera.rotation.z = opts.still ? 0 : THREE.MathUtils.degToRad(0.4) * Math.sin(t * 0.45);

    const even = 2 * Math.round(flips / 2);
    const odd = 2 * Math.round((flips - 1) / 2) + 1;
    const ia = texFor(even);
    const ib = texFor(odd);
    glass.uniforms.uTexA.value = tex[ia];
    glass.uniforms.uTexB.value = tex[ib] ?? tex[ia];
    glass.setCrop(glass.uniforms.uCropA.value, opts.photos[ia].crop);
    glass.setCrop(glass.uniforms.uCropB.value, opts.photos[tex[ib] ? ib : ia].crop);
    glass.uniforms.uTime.value = t;
    glass.uniforms.uSweep.value = -1.5 + ((f.y / 1400 + 0.62) % 1) * 3.0;
    glass.uniforms.uBlur.value = sm(0.8, 0.92, p) * 3.6;
    glass.uniforms.uVeil.value = sm(0.81, 0.92, p) * 0.88;

    // ---------- кольцо света ----------
    if (prevP < 0.004 && p >= 0.004 && !opts.still) flickerAt = t; // вход в «Макияж»: мигает и разгорается
    if (prevP < 0.515 && p >= 0.515) sparksAt = t; // «Полный образ»: вспышка искр
    prevP = p;
    let target = 0.82;
    if (p > 0.004) target = 1.0;
    if (p > 0.25) target = 0.95;
    if (p > 0.5) target = 1.3;
    if (p > 0.78) target = 1.1;
    level = lerp(level, target, 1 - Math.pow(0.04, dt));
    let flick = 1;
    const ft = t - flickerAt;
    if (ft >= 0 && ft < 0.75) {
      const steps = [1, 0.15, 0.9, 0.25, 0.6, 0.2, 1];
      flick = steps[Math.min(steps.length - 1, Math.floor((ft / 0.75) * steps.length))];
    }
    const igT = (opts.still ? t : now / 1000) - igniteAt;
    for (let i = 0; i < LEDS; i++) {
      const lit = opts.still ? 1 : clamp01((igT - (0.8 * i) / LEDS) / 0.14);
      const shimmer = 0.9 + 0.1 * Math.sin(ledAngles[i] * 3 - t * 1.6);
      const b = lit * level * flick * shimmer;
      col.copy(WARM).multiplyScalar(0.25 + b * (opts.bloom && !degraded ? 2.2 : 1.6));
      leds.setColorAt(i, col);
      haloB[i] = clamp01(b);
    }
    leds.instanceColor!.needsUpdate = true;
    haloGeo.attributes.aB.needsUpdate = true;
    glowMat.uniforms.uI.value = clamp01(level * flick * (opts.bloom ? 0.55 : 0.75)) * (opts.still ? 1 : clamp01(igT / 0.9)) * (1 - enter);
    haloUniforms.uScale.value = (H * dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) * s;
    particles.uniforms.uScale.value = haloUniforms.uScale.value;
    glass.uniforms.uBright.value = 0.97 + 0.05 * clamp01(level - 0.8);

    // ---------- этап 1: помада и кисть ----------
    const rise = sm(0.02, 0.08, p);
    const out1 = sm(0.215, 0.25, p);
    const v1 = rise * (1 - out1);
    const orbit = sm(0.5, 0.57, p) * (1 - sm(0.74, 0.8, p));
    const lipHome = tmp.set(opts.mobile ? 0.78 : 1.0, lerp(-2.1, opts.mobile ? -0.82 : -0.6, rise), 0.5).clone();
    placeTool(lipstick.group, lipHome, 0, v1, orbit, p, 1.25);
    lipstick.group.rotation.set(0.15, t * 0.5 + p * 10, orbit > 0.01 ? 0.9 : 0.12);
    lipstick.open(sm(0.07, 0.11, p));
    lipstick.extend(sm(0.1, 0.15, p));

    const bin = sm(0.06, 0.1, p);
    const bout = sm(0.205, 0.24, p);
    const vb = bin * (1 - bout);
    const sp = clamp01((p - 0.1) / 0.11);
    const e = (sp * 2) % 1;
    const stroke2 = sp >= 0.5 ? 1 : 0;
    const tipX = lerp(-0.6, 0.08, e) + stroke2 * 0.06;
    const tipY = lerp(-0.02, -0.3, e) + 0.07 * Math.sin(e * Math.PI) - stroke2 * 0.14;
    const tipZ = 0.04 + 0.14 * (1 - Math.sin(e * Math.PI));
    const dTip = tmp2.set(-0.5, 0.22, -0.84).normalize();
    const brushHome = new THREE.Vector3(tipX, tipY, tipZ).addScaledVector(dTip, -0.39 * 1.2);
    brushHome.add(new THREE.Vector3(0.9, -0.7, 0.9).multiplyScalar(1 - bin));
    brush.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dTip);
    if (orbit > 0.01) brush.group.quaternion.slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(0.3, 0, 2.2 + t * 0.2)), orbit);
    placeTool(brush.group, brushHome, 1, vb, orbit, p, 1.2);
    if (!opts.still && vb > 0.6 && sp > 0 && sp < 1) {
      brush.group.localToWorld(tmp.copy(brush.tip));
      root.worldToLocal(tmp);
      particles.emit(tmp, Math.ceil(dt * 70), 0.32, 0.04, 1.5, 0.05, new THREE.Vector3(0.2, 0.35, 0.8));
    }

    // ---------- этап 2: пряди, гребень, шпилька ----------
    strands.mat.uniforms.uTime.value = t;
    strands.mat.uniforms.uReveal.value = sm(0.255, 0.4, p);
    strands.mat.uniforms.uOpacity.value = sm(0.25, 0.29, p) * (1 - sm(0.49, 0.56, p));
    strands.mesh.visible = strands.mat.uniforms.uOpacity.value > 0.003;
    strands.mesh.rotation.z = t * 0.05 + p * 1.2;
    const v2 = sm(0.27, 0.33, p) * (1 - sm(0.48, 0.52, p));
    const float = Math.sin(t * 1.3) * 0.04;
    placeTool(comb, new THREE.Vector3(opts.mobile ? -0.78 : 1.42, (opts.mobile ? -1.22 : 0.92) + float, 0.42), 2, v2, orbit, p, 1.1);
    comb.rotation.set(0.25, -0.4 + t * 0.12, 0.5 + float);
    placeTool(hexPin, new THREE.Vector3(opts.mobile ? 0.84 : 1.5, (opts.mobile ? -1.18 : -0.7) - float, 0.45), 3, v2, orbit, p, 1.25);
    hexPin.rotation.set(0.2, t * 0.6, -0.45);

    // ---------- этап 3: искры ----------
    const st = t - sparksAt;
    if (!opts.still && st >= 0 && st < 0.5) {
      const n = Math.ceil(dt * (opts.mobile ? 160 : 320));
      for (let k = 0; k < n; k++) {
        const a = Math.random() * Math.PI * 2;
        tmp.set(Math.cos(a) * 1.12, Math.sin(a) * 1.12, 0.1);
        particles.emit(tmp, 1, 1.1, 0.02, 1.6, 0.06, tmp2.set(Math.cos(a), Math.sin(a), 0.4));
      }
    }
    if (opts.still && p > 0.5 && p < 0.75) {
      // для рендера: застывшая вспышка
      for (let k = 0; k < 90; k++) {
        const a = (k / 90) * Math.PI * 2 + Math.sin(k * 7.3) * 0.2;
        const r = 1.2 + ((k * 37) % 23) / 23 * 0.45;
        tmp.set(Math.cos(a) * r, Math.sin(a) * r, 0.15);
        particles.emit(tmp, 1, 0, 0, 1, 0.05);
      }
    }
    // плавающие золотые блики вокруг кольца
    moteTimer -= dt;
    if (!opts.still && moteTimer <= 0 && enter < 0.5) {
      moteTimer = 0.22;
      const a = Math.random() * Math.PI * 2;
      tmp.set(Math.cos(a) * (1.14 + Math.random() * 0.18), Math.sin(a) * (1.14 + Math.random() * 0.18), 0.12);
      particles.emit(tmp, 1, 0.05, 0.03, 2.2, 0.03, tmp2.set(Math.cos(a), Math.sin(a), 0.3));
    }
    particles.update(opts.still ? 0 : dt);
    tools.visible = enter < 0.98;

    // ---------- отрисовка ----------
    if (!ready) return;
    draw();
    if (!readyFired) {
      readyFired = true;
      opts.onReady?.();
    }
    if (import.meta.env.DEV) (window as unknown as { __mdbg?: object }).__mdbg = { frames: (((window as any).__mdbg?.frames) ?? 0) + 1, degraded, igniteAt, t, bloom: !!composer, level, dpr, bp: !!bloomPass };
    if (!fpsChecked) {
      fpsFrames++;
      if (!fpsStart) fpsStart = now;
      fpsTime = (now - fpsStart) / 1000;
      if (fpsTime > 2) {
        fpsChecked = true;
        if (fpsFrames / fpsTime < 40) degrade();
      }
    }
  }
  let readyFired = false;

  return {
    frame,
    resize,
    pointer: (x, y) => pointerT.set(x, y),
    allLoaded: () => tex.every(Boolean),
    ignite: () => {
      // зажигание идёт по настоящим часам — синхронно с прелоадером даже на медленном устройстве
      if (igniteAt === Infinity) igniteAt = performance.now() / 1000;
    },
    dispose: () => {
      composer?.dispose();
      bloomComposer?.dispose();
      renderer.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
      });
      tex.forEach((x) => x?.dispose());
    },
  };
}
