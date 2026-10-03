import * as THREE from "three";

/**
 * Процедурная пчела без внешних файлов:
 * вытянутый эллипсоид с полосами золота и эспрессо, голова, жало, два прозрачных крыла
 * с быстрым маханием и мягкий золотой ореол. Модель смотрит вдоль +Z.
 */
export interface BeeModel {
  root: THREE.Group;
  /** flap — 0..1, сила махания (при посадке крылья почти замирают) */
  update: (t: number, flap: number) => void;
  dispose: () => void;
}

export function createBee(): BeeModel {
  const root = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x);

  // Полосы: текстура по долготе сферы, повёрнутой вдоль Z (полосы поперёк тела)
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#c39a52";
  g.fillRect(0, 0, 16, 256);
  g.fillStyle = "#2a1c1e";
  // полосы по высоте (v): брюшко ближе к низу текстуры
  for (const [a, b] of [
    [0.16, 0.25],
    [0.34, 0.43],
    [0.52, 0.6],
  ]) {
    g.fillRect(0, a * 256, 16, (b - a) * 256);
  }
  // кончик брюшка — эспрессо
  g.fillRect(0, 0, 16, 0.07 * 256);
  const tex = track(new THREE.CanvasTexture(c));
  tex.colorSpace = THREE.SRGBColorSpace;

  const bodyMat = track(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.34, metalness: 0.55 }));
  const darkMat = track(new THREE.MeshStandardMaterial({ color: 0x23181a, roughness: 0.5, metalness: 0.2 }));
  const thoraxMat = track(new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.8, metalness: 0.1 }));

  // Брюшко: эллипсоид вдоль Z
  const abdomen = new THREE.Mesh(track(new THREE.SphereGeometry(0.1, 32, 24)), bodyMat);
  // вытягиваем по оси полюсов (Y), затем кладём её вдоль тела: +Y → хвост (-Z)
  abdomen.scale.set(0.84, 1.5, 0.8);
  abdomen.rotation.x = -Math.PI / 2;
  abdomen.position.z = -0.06;
  root.add(abdomen);

  // Грудь и голова
  const thorax = new THREE.Mesh(track(new THREE.SphereGeometry(0.062, 24, 18)), thoraxMat);
  thorax.scale.set(1, 0.95, 1.1);
  thorax.position.z = 0.095;
  root.add(thorax);
  const head = new THREE.Mesh(track(new THREE.SphereGeometry(0.044, 24, 18)), darkMat);
  head.scale.set(1.1, 1, 0.9);
  head.position.set(0, 0.004, 0.17);
  root.add(head);

  // Жало
  const sting = new THREE.Mesh(track(new THREE.ConeGeometry(0.014, 0.05, 10)), darkMat);
  sting.rotation.x = -Math.PI / 2;
  sting.position.z = -0.235;
  root.add(sting);

  // Усики
  const antMat = track(new THREE.LineBasicMaterial({ color: 0x23181a }));
  for (const s of [-1, 1]) {
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0.018 * s, 0.03, 0.215),
      new THREE.Vector3(0.05 * s, 0.1, 0.25),
      new THREE.Vector3(0.075 * s, 0.11, 0.3),
    );
    root.add(new THREE.Line(track(new THREE.BufferGeometry().setFromPoints(curve.getPoints(12))), antMat));
  }

  // Крылья: эллипсы из ShapeGeometry, полупрозрачные, с золотой кромкой
  const wingShape = new THREE.Shape();
  wingShape.absellipse(0, 0.11, 0.06, 0.12, 0, Math.PI * 2, false, 0);
  const wingGeo = track(new THREE.ShapeGeometry(wingShape, 32));
  const wingMat = track(
    new THREE.MeshBasicMaterial({ color: 0xfffbf0, transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false }),
  );
  const edgeMat = track(new THREE.LineBasicMaterial({ color: 0xb9944f, transparent: true, opacity: 0.9 }));
  const edgeGeo = track(new THREE.BufferGeometry().setFromPoints(wingShape.getPoints(40).map((p) => new THREE.Vector3(p.x, p.y, 0))));
  const wings: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(0.035 * s, 0.045, 0.085);
    const w = new THREE.Group();
    const mesh = new THREE.Mesh(wingGeo, wingMat);
    const edge = new THREE.LineLoop(edgeGeo, edgeMat);
    w.add(mesh, edge);
    // крыло лежит в плоскости XY, вытянуто по Y → кладём горизонтально (нормаль вверх)
    // и разворачиваем вбок-назад: правое к +X, левое к −X, со стреловидностью назад
    w.rotation.set(-Math.PI / 2, s * -1.1, 0, "YXZ");
    pivot.add(w);
    root.add(pivot);
    wings.push(pivot);
  }

  // Ореол: спрайт с радиальным градиентом
  const hc = document.createElement("canvas");
  hc.width = hc.height = 128;
  const hg = hc.getContext("2d")!;
  const rg = hg.createRadialGradient(64, 64, 0, 64, 64, 64);
  rg.addColorStop(0, "rgba(232,205,140,0.55)");
  rg.addColorStop(0.35, "rgba(217,190,134,0.22)");
  rg.addColorStop(1, "rgba(217,190,134,0)");
  hg.fillStyle = rg;
  hg.fillRect(0, 0, 128, 128);
  const haloTex = track(new THREE.CanvasTexture(hc));
  haloTex.colorSpace = THREE.SRGBColorSpace;
  const halo = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, opacity: 0.9 })));
  halo.scale.setScalar(0.85);
  root.add(halo);

  return {
    root,
    update: (t, flap) => {
      // быстрое махание: ~28 Гц визуально; при посадке — медленное и узкое
      const speed = 70 + 110 * flap;
      const amp = 0.25 + 0.85 * flap;
      const a = Math.sin(t * speed) * amp;
      // крылья приподняты «галочкой» и машут симметрично
      wings[0].rotation.z = -0.3 - a;
      wings[1].rotation.z = 0.3 + a;
      halo.material.opacity = 0.65 + 0.25 * Math.sin(t * 2.2);
    },
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
