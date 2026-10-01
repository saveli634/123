"""
Карта изображений сайта: исходник -> семантическое имя, обрезка и зоны размытия госномеров.

crop  — (left, top, right, bottom) в долях исходника; убирает текст-оверлеи.
blur  — список зон (left, top, right, bottom) в долях ИСХОДНИКА (до обрезки),
        где виден госномер: зона пикселизируется и размывается.
Все зоны найдены вручную по сетке и проверены просмотром результата.
"""

IMAGES = {
    # --- Первый экран и силовой обвес ---
    "hero-main": ("01_hero/hero-main.jpg", None, [(0.12, 0.38, 0.42, 0.53)]),
    "obves-pickup-rollbar-1": ("01_hero/hero-backup-pickup.jpg", None, []),
    "obves-lc70-bumper": ("02_obves/lc70-bumper.jpg", None, [(0.17, 0.36, 0.45, 0.52)]),
    "obves-lc70-front": ("02_obves/lc70-front.jpg", None, []),
    "obves-pickup-rollbar-2": ("02_obves/pickup-rollbar-2.jpg", None, []),
    "obves-pickup-rollbar-3": ("02_obves/pickup-rollbar-3.jpg", None, []),
    "obves-rear-spare-1": ("02_obves/rear-spare-1.jpg", None, [(0.24, 0.25, 0.44, 0.50)]),
    "obves-rear-spare-2": ("02_obves/rear-spare-2.jpg", None, []),
    "obves-step": ("02_obves/side-step.jpg", None, []),
    "obves-rear-carrier": ("02_obves/rear-carrier-forester.jpg", None, [(0.57, 0.57, 0.90, 0.67)]),
    "obves-prado120-front": ("02_obves/prado120-front.jpg", None, [(0.27, 0.505, 0.50, 0.615)]),
    "obves-prado120-rear": ("02_obves/prado120-rear.jpg", None, [(0.24, 0.375, 0.43, 0.565)]),
    # --- Кондиционеры ---
    "ac-station-red-prado": ("03_kondicionery/ac-station-red-prado.jpg", None, [(0.61, 0.525, 0.88, 0.635)]),
    "ac-station-grey": ("03_kondicionery/ac-station-grey.jpg", None, [(0.0, 0.37, 0.21, 0.61)]),
    "ac-gwagen": ("03_kondicionery/ac-gwagen.jpg", None, [(0.45, 0.68, 0.565, 0.765)]),
    "ac-freon-boxes": ("03_kondicionery/freon-boxes.jpg", None, []),
    "ac-freon-boxes-2": ("03_kondicionery/freon-boxes-2.jpg", None, []),
    "ac-evaporator-prado": (
        "03_kondicionery/evaporator-prado.jpg",
        None,
        [(0.48, 0.71, 0.77, 0.84), (0.71, 0.0, 0.84, 0.10)],  # номер машины и номера на стене
    ),
    "ac-evaporator-dirty": ("03_kondicionery/evaporator-dirty.jpg", None, []),
    "ac-gauges-01": ("03_kondicionery/gauges-34.jpg", None, []),
    "ac-gauges-02": ("03_kondicionery/gauges-37.jpg", None, []),
    "ac-gauges-03": ("03_kondicionery/gauges-40.jpg", None, []),
    "ac-gauges-04": ("03_kondicionery/gauges-45.jpg", None, []),
    "ac-gauges-05": ("03_kondicionery/gauges-48.jpg", None, []),
    "ac-gauges-06": ("03_kondicionery/gauges-51.jpg", None, []),
    # --- Автопечка / охлаждение ---
    "heater-antifreeze-machine": ("04_pechka_ohlazhdenie/antifreeze-machine.jpg", None, [(0.48, 0.62, 0.74, 0.95)]),
    "heater-flush-unit": ("04_pechka_ohlazhdenie/flush-unit-radiator50.jpg", None, []),
    "heater-flush-blue-1": ("04_pechka_ohlazhdenie/flush-blue-1.jpg", None, [(0.39, 0.545, 0.64, 0.635)]),
    "heater-flush-blue-2": ("04_pechka_ohlazhdenie/flush-blue-2.jpg", None, [(0.39, 0.575, 0.68, 0.68)]),
    "heater-flush-blue-3": ("04_pechka_ohlazhdenie/flush-blue-3.jpg", None, [(0.59, 0.61, 0.95, 0.725)]),
    # --- Двигатель, топливо, трансмиссия, масла ---
    "engine-2kd": ("05_dvigatel_transmissiya/engine-2kd.jpg", None, []),
    "fuel-injector-stand": ("05_dvigatel_transmissiya/injector-stand.jpg", None, []),
    "fuel-injector-tubes": ("05_dvigatel_transmissiya/injector-tubes.jpg", None, []),
    "trans-transfer-chain": ("05_dvigatel_transmissiya/transfer-chain.jpg", None, []),
    "trans-lsd-differential": ("05_dvigatel_transmissiya/lsd-differential.jpg", None, []),
    "engine-valvetrain": ("05_dvigatel_transmissiya/valvetrain.jpg", None, []),
    "oil-pour": ("05_dvigatel_transmissiya/oil-pour.jpg", None, []),
    # --- Оборудование, ходовая, электроника ---
    "equip-lift-bay": ("06_oborudovanie_hodovaya/lift-bay.jpg", None, []),
    "equip-alignment": ("06_oborudovanie_hodovaya/alignment.jpg", None, []),
    "chassis-offroad-alignment": ("06_oborudovanie_hodovaya/offroad-alignment.jpg", (0.0, 0.21, 1.0, 1.0), []),
    "equip-launch-case": ("06_oborudovanie_hodovaya/launch-case.jpg", None, []),
    "elec-starline-box": ("06_oborudovanie_hodovaya/starline-box.jpg", None, []),
    "elec-soundproof-1": ("06_oborudovanie_hodovaya/soundproof-1.jpg", None, []),
    "elec-soundproof-2": ("06_oborudovanie_hodovaya/soundproof-2.jpg", None, []),
    # --- Автомагазин ---
    "shop-belts": ("07_avtomagazin/belts-wall.jpg", None, []),
    "shop-shelves-1": ("07_avtomagazin/shelves-1.jpg", None, []),
    "shop-shelves-2": ("07_avtomagazin/shelves-2.jpg", None, []),
    "shop-shelves-3": ("07_avtomagazin/shelves-3.jpg", None, []),
    "shop-boxes": ("07_avtomagazin/boxes.jpg", None, []),
    "shop-oils-drums": ("07_avtomagazin/oil-drums.jpg", None, []),
    "shop-accessories": ("07_avtomagazin/accessories.jpg", None, []),
    "shop-oils-wall": ("07_avtomagazin/oils-wall.jpg", None, []),
}
