import * as THREE from "three";
import type { Crop } from "@/lib/crop";

/**
 * Стекло зеркала: диск с фото внутри. Лицевая и тыльная стороны показывают разные кадры —
 * зеркало разворачивается на 180°, и кадр меняется ровно в момент «ребра».
 * Внутри шейдера: кроп по точке лица, мягкий край, диагональный блик от прокрутки,
 * хроматическое смещение по краю, зерно и размытие (LOD-bias) для фона формы записи.
 */
export function createGlass(milk: THREE.Color) {
  const uniforms = {
    uTexA: { value: null as THREE.Texture | null },
    uTexB: { value: null as THREE.Texture | null },
    uCropA: { value: new THREE.Vector4(0.5, 0.5, 0.4, 0.3) },
    uCropB: { value: new THREE.Vector4(0.5, 0.5, 0.4, 0.3) },
    uTime: { value: 0 },
    uSweep: { value: -1.4 },
    uBlur: { value: 0 },
    uVeil: { value: 0 },
    uBright: { value: 1 },
    uGrain: { value: 0.028 },
    uMilk: { value: milk.clone() },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying vec2 vP;
      void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uTexA; uniform sampler2D uTexB;
      uniform vec4 uCropA; uniform vec4 uCropB;
      uniform float uTime; uniform float uSweep; uniform float uBlur; uniform float uVeil; uniform float uBright; uniform float uGrain;
      uniform vec3 uMilk;
      varying vec2 vP;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      vec3 samp(sampler2D t, vec4 c, vec2 q, float r){
        vec2 uv = vec2(c.x + q.x * c.z, 1.0 - (c.y - q.y * c.w));
        vec2 dir = q / max(r, 1e-3);
        vec2 off = dir * 0.0065 * smoothstep(0.55, 1.0, r) * vec2(c.z, c.w);
        float lod = uBlur - 0.65; // минус — резче мип-уровень, иначе портрет «мылится»
        float rr = texture2D(t, uv + off, lod).r;
        float gg = texture2D(t, uv, lod).g;
        float bb = texture2D(t, uv - off, lod).b;
        return vec3(rr, gg, bb);
      }
      void main(){
        vec2 p = vP;
        float r = length(p);
        vec2 q = gl_FrontFacing ? p : vec2(-p.x, p.y);
        vec3 col = gl_FrontFacing ? samp(uTexA, uCropA, q, r) : samp(uTexB, uCropB, q, r);
        col *= mix(1.0, 0.8, smoothstep(0.76, 1.0, r));
        float d = (q.x + q.y) * 0.7071 - uSweep;
        float edge = smoothstep(0.35, 0.95, r);
        float band = (exp(-d * d * 36.0) * 0.035 + exp(-pow(d + 0.24, 2.0) * 420.0) * 0.045) * (0.35 + 0.65 * edge);
        col += vec3(1.0, 0.97, 0.92) * band;
        col += vec3(1.0, 0.94, 0.84) * smoothstep(0.955, 0.996, r) * 0.22;
        col *= uBright;
        col = mix(col, uMilk, uVeil);
        col += (hash(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5) * uGrain;
        float a = 1.0 - smoothstep(0.988, 1.0, r);
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
      }`,
  });
  mat.toneMapped = false;
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 128), mat);
  mesh.renderOrder = 1;
  const setCrop = (v: THREE.Vector4, c: Crop) => v.set(c.cx, c.cy, c.hx, c.hy);
  return { mesh, uniforms, setCrop };
}
