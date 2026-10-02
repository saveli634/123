/**
 * Что делать с каждым исходным кадром (assets-src/).
 *
 * blur — зоны, которые размываются перед грейдом: чужие логотипы, люди на заднем плане,
 *        силуэт за стеклом. Координаты — в пикселях исходного файла, найдены вручную,
 *        результат проверен глазами (scripts/images.mjs --check сохраняет превью зон).
 * keepColor — кадры, которые не обесцвечиваются: они задают красный цвет сайта.
 * bg — дополнительно сделать размытую тёмную версию для фона (только под затемнением).
 */
export const IMAGES = {
  // Кадры из видео (720 px по короткой стороне)
  lift_red_land_cruiser: { src: "frames/lift_red_land_cruiser.jpg", keepColor: true, blur: [{ x: 55, y: 55, w: 66, h: 152, s: 7 }] },
  engine_on_crane: { src: "frames/engine_on_crane.jpg", blur: [{ x: 604, y: 210, w: 36, h: 96, s: 8 }] },
  cylinder_head_valves: { src: "frames/cylinder_head_valves.jpg" },
  dial_gauge_measuring: { src: "frames/dial_gauge_measuring.jpg" },
  pistons_closeup: { src: "frames/pistons_closeup.jpg" },
  crankshaft_block: { src: "frames/crankshaft_block.jpg" },
  crankshaft_caps: { src: "frames/crankshaft_caps.jpg" },
  engine_on_stand: {
    src: "frames/engine_on_stand.jpg",
    blur: [
      { x: 584, y: 26, w: 92, h: 92, s: 9 }, // человек у стойки на заднем плане
      { x: 534, y: 164, w: 94, h: 114, s: 8 }, // логотип на коробке
    ],
  },
  oil_yacco_1: { src: "frames/oil_yacco_1.jpg" },
  oil_yacco_2: { src: "frames/oil_yacco_2.jpg" },
  break_in_cluster: { src: "frames/break_in_cluster.jpg" },
  break_in_road: { src: "frames/break_in_road.jpg" },
  hardkorr_light: { src: "frames/hardkorr_light.jpg" },
  land_cruiser_silver_side: {
    src: "frames/land_cruiser_silver_side.jpg",
    blur: [
      { x: 186, y: 210, w: 68, h: 42, s: 6 }, // логотип на багажнике
      { x: 498, y: 1226, w: 66, h: 54, s: 6 }, // этикетка баллончика
    ],
  },
  land_cruiser_black_front: { src: "frames/land_cruiser_black_front.jpg" },
  red_garage_atmosphere: { src: "frames/red_garage_atmosphere.jpg", keepColor: true, bg: true },

  // Фото высокого разрешения (1440×1920) — единственные, что можно показывать крупно
  interior_wheel_wrap_1: { src: "photos/interior_wheel_wrap_1.jpg" },
  interior_wheel_wrap_2: { src: "photos/interior_wheel_wrap_2.jpg", blur: [{ x: 830, y: 820, w: 108, h: 94, s: 10 }] }, // бутылки с чужим логотипом
  interior_wheel_wrap_3: { src: "photos/interior_wheel_wrap_3.jpg", blur: [{ x: 1024, y: 928, w: 48, h: 98, s: 8 }] }, // надпись на брелоке
  interior_wheel_wrap_4: { src: "photos/interior_wheel_wrap_4.jpg" },
  predator_snorkel_1: { src: "photos/predator_snorkel_1.jpg" },
  predator_snorkel_2: { src: "photos/predator_snorkel_2.jpg" },
  predator_snorkel_3: { src: "photos/predator_snorkel_3.jpg" },
  predator_snorkel_4: { src: "photos/predator_snorkel_4.jpg" },
  red_4x4_street: {
    src: "photos/red_4x4_street.jpg",
    blur: [
      { x: 766, y: 980, w: 184, h: 64, s: 9 }, // надпись на бампере
      { x: 1166, y: 900, w: 128, h: 114, s: 9 }, // логотипы на бампере второй машины
      { x: 596, y: 616, w: 88, h: 68, s: 7 }, // наклейки на стёклах
      { x: 1041, y: 721, w: 48, h: 48, s: 6 }, // круглая наклейка
      { x: 236, y: 508, w: 58, h: 44, s: 6 }, // наклейка на лобовом
      { x: 484, y: 648, w: 82, h: 72, s: 8 }, // силуэт за стеклом
    ],
  },
};
