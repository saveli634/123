import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * «Волна прядей»: ленты-трубки по синусоидальным сплайнам вокруг зеркала.
 * Все пряди — одна геометрия и один вызов отрисовки; волна бежит в вершинном шейдере,
 * концы затухают, uReveal «вытягивает» пряди по длине.
 */
const BLONDE_A = new THREE.Color(0xe8cf9b);
const BLONDE_B = new THREE.Color(0xb98f58);
const CHOCO = new THREE.Color(0x2b1a17);

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function buildStrands(locks: number, perLock: number, segments: number, radial: number) {
  const rnd = rand(11);
  const geos: THREE.BufferGeometry[] = [];
  const K = 30;
  for (let b = 0; b < locks; b++) {
    // прядь-«локон»: общий изгиб, внутри — отдельные волоски, которые расходятся и сходятся
    const phase = rnd() * Math.PI * 2;
    const theta0 = (b / locks) * Math.PI * 2 + rnd() * 0.5;
    const sweep = 1.9 + rnd() * 0.8;
    const r0 = 1.2 + rnd() * 0.12;
    const choco = b % 3 === 2;
    const base = choco ? CHOCO.clone() : BLONDE_A.clone().lerp(BLONDE_B, rnd() * 0.8);
    for (let j = 0; j < perLock; j++) {
      const off = (j / (perLock - 1) - 0.5) * 0.2;
      const jit = (rnd() - 0.5) * 0.6;
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= K; k++) {
        const u = k / K;
        const th = theta0 + sweep * u;
        const spread = 0.35 + 0.65 * Math.sin(Math.PI * u);
        const r = r0 + 0.075 * Math.sin(th * 6 + phase + jit * 0.3) + off * spread;
        const z = 0.12 * Math.sin(th * 1.4 + phase) + off * 0.4 * spread + 0.05;
        pts.push(new THREE.Vector3(Math.cos(th) * r, Math.sin(th) * r, z));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const g = new THREE.TubeGeometry(curve, segments, 0.0042 + rnd() * 0.0042, radial, false);
      const n = g.attributes.position.count;
      const seed = new Float32Array(n).fill(b / locks + j * 0.004);
      const col = new Float32Array(n * 3);
      const c = base.clone().multiplyScalar(0.88 + rnd() * 0.24);
      for (let v = 0; v < n; v++) col.set([c.r, c.g, c.b], v * 3);
      g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
      g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
      geos.push(g);
    }
  }
  const geo = mergeGeometries(geos, false)!;
  geos.forEach((g) => g.dispose());

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uOpacity: { value: 0 },
      uAmp: { value: 1 },
    },
    vertexShader: /* glsl */ `
      uniform float uTime; uniform float uAmp;
      attribute float aSeed; attribute vec3 aColor;
      varying float vU; varying float vSeed; varying vec3 vColor; varying vec3 vN; varying vec3 vView;
      void main(){
        vec3 p = position;
        float u = uv.x;
        float env = sin(3.14159 * u);
        float w = sin(u * 9.0 - uTime * 1.6 + aSeed * 6.283) * 0.03 + sin(u * 4.0 - uTime * 0.8 + aSeed * 3.1) * 0.045;
        vec2 dir = normalize(p.xy + vec2(1e-4));
        p.xy += dir * w * env * uAmp;
        p.z += cos(u * 7.0 - uTime * 1.2 + aSeed * 5.0) * 0.04 * env * uAmp;
        vU = u; vSeed = aSeed; vColor = aColor;
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vView = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uReveal; uniform float uOpacity;
      varying float vU; varying float vSeed; varying vec3 vColor; varying vec3 vN; varying vec3 vView;
      void main(){
        float head = uReveal * 1.35 - fract(vSeed * 3.7) * 0.35;
        float vis = 1.0 - smoothstep(head - 0.12, head, vU);
        float ends = smoothstep(0.0, 0.14, vU) * (1.0 - smoothstep(0.8, 1.0, vU));
        float a = vis * ends * uOpacity;
        if (a < 0.01) discard;
        vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
        vec3 L = normalize(vec3(-0.4, 0.75, 0.6));
        vec3 V = normalize(vView);
        vec3 H = normalize(L + V);
        float diff = 0.5 + 0.5 * max(dot(N, L), 0.0);
        float spec = pow(max(dot(N, H), 0.0), 36.0) * 0.55;
        vec3 col = vColor * diff + vec3(1.0, 0.93, 0.8) * spec;
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }`,
  });
  mat.toneMapped = false;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 3;
  return { mesh, mat };
}
