"""
Обрезка исходников перед публикацией (доли от ширины/высоты: left, top, right, bottom).
Убираем то, что не должно быть «вшито» в фото на сайте:
надписи с названием модели, интерфейс видео, стикеры, логотип поверх кадра.
"""
CROPS = {
    "04_minotti_wide": (0.0, 0.035, 1.0, 0.945),   # иконка сверху, «HD» и «17:26» снизу
    "07_oscar_product": (0.0, 0.30, 1.0, 0.97),    # надпись «@soft.home.kazakhstan OSCAR»
    "08_oscar_detail": (0.0, 0.16, 1.0, 0.955),    # подпись аккаунта
    "11_etno_hero": (0.0, 0.0, 1.0, 0.765),        # стикер-эмодзи на полу
    "13_bigboss_showroom": (0.0, 0.30, 1.0, 0.885),  # логотип поверх кадра и вывеска соседнего магазина
}


def apply(name, im):
    box = CROPS.get(name)
    if not box:
        return im
    w, h = im.size
    l, t, r, b = box
    return im.crop((round(l * w), round(t * h), round(r * w), round(b * h)))
