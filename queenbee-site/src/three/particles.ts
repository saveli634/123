import * as THREE from "three";

/**
 * Золотые пылинки (с кисти) и искры (этап «Полный образ»).
 * Два слоя на одной геометрии: аддитивное ядро-блик и тонкий золотой ореол
 * обычным смешиванием — иначе на молочном фоне золото теряется.
 */
export function createParticles(max: number) {
  const pos = new Float32Array(max * 3);
  const vel = new Float32Array(max * 3);
  const life = new Float32Array(max);
  const ttl = new Float32Array(max).fill(1);
  const alpha = new Float32Array(max);
  const size = new Float32Array(max);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aAlpha", new THREE.BufferAttribute(alpha, 1));
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  let cursor = 0;

  const uniforms = { uScale: { value: 400 } };
  const vert = /* glsl */ `
    uniform float uScale; attribute float aAlpha; attribute float aSize; varying float vA;
    void main(){ vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`;
  // аддитивное ядро: и цвет, и альфа складываются — канва с premultiplied alpha не получает «квадратов»
  const core = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vert,
    fragmentShader: /* glsl */ `
      varying float vA;
      void main(){ float d = length(gl_PointCoord - 0.5); float a = 1.0 - smoothstep(0.0, 0.5, d); a *= a * vA;
        gl_FragColor = vec4(vec3(1.0, 0.82, 0.5) * a, a * 0.6); }`,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneFactor,
    transparent: true,
    depthWrite: false,
  });
  const halo = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vert,
    fragmentShader: /* glsl */ `
      varying float vA;
      void main(){ float d = length(gl_PointCoord - 0.5); float a = (1.0 - smoothstep(0.18, 0.5, d)) * 0.75;
        gl_FragColor = vec4(0.72, 0.55, 0.26, a * vA); }`,
    transparent: true,
    depthWrite: false,
  });
  core.toneMapped = false;
  halo.toneMapped = false;
  const group = new THREE.Group();
  const pHalo = new THREE.Points(geo, halo);
  const pCore = new THREE.Points(geo, core);
  pHalo.frustumCulled = pCore.frustumCulled = false;
  pHalo.renderOrder = 4;
  pCore.renderOrder = 5;
  group.add(pHalo, pCore);
  let limit = max;

  function emit(o: THREE.Vector3, n: number, speed: number, spread: number, lifetime: number, sz: number, dir?: THREE.Vector3) {
    for (let k = 0; k < n; k++) {
      const i = cursor;
      cursor = (cursor + 1) % limit;
      pos[i * 3] = o.x + (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = o.y + (Math.random() - 0.5) * spread;
      pos[i * 3 + 2] = o.z + (Math.random() - 0.5) * spread;
      let vx = Math.random() - 0.5, vy = Math.random() - 0.5, vz = Math.random() - 0.5;
      if (dir) {
        vx = dir.x + vx * 0.35;
        vy = dir.y + vy * 0.35;
        vz = dir.z + vz * 0.35;
      }
      const l = Math.hypot(vx, vy, vz) || 1;
      const s = speed * (0.4 + Math.random() * 0.8);
      vel[i * 3] = (vx / l) * s;
      vel[i * 3 + 1] = (vy / l) * s;
      vel[i * 3 + 2] = (vz / l) * s;
      ttl[i] = lifetime * (0.6 + Math.random() * 0.7);
      life[i] = ttl[i];
      size[i] = sz * (0.5 + Math.random());
    }
  }

  function update(dt: number) {
    for (let i = 0; i < max; i++) {
      if (life[i] <= 0) {
        alpha[i] = 0;
        continue;
      }
      life[i] -= dt;
      const t = Math.max(0, life[i] / ttl[i]);
      vel[i * 3 + 1] -= 0.18 * dt; // лёгкое оседание
      const drag = Math.pow(0.35, dt);
      vel[i * 3] *= drag;
      vel[i * 3 + 1] *= drag;
      vel[i * 3 + 2] *= drag;
      pos[i * 3] += vel[i * 3] * dt;
      pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
      pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
      alpha[i] = Math.sin(Math.PI * Math.min(1, t * 1.15)) * (0.75 + 0.25 * Math.sin(i * 12.9 + life[i] * 9));
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aAlpha.needsUpdate = true;
    geo.attributes.aSize.needsUpdate = true;
  }

  return {
    group,
    uniforms,
    emit,
    update,
    setLimit: (n: number) => {
      limit = Math.max(8, Math.min(max, n));
      cursor %= limit;
    },
  };
}
