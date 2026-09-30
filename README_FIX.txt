INSTAGRAM PARSER v10.1 DEEP FIX

Что исправлено:
- больше НЕ передаёт существующий Firefox-профиль в Selenium;
- исправляет типичную ошибку:
  SessionNotCreatedException: Failed to set preferences: unknown error;
- из выбранного Firefox-профиля читаются только cookies Instagram;
- Selenium запускает чистый временный Firefox и переносит cookies в него;
- если cookies не удалось прочитать или сессия истекла, можно войти вручную;
- логика DEEP SCAN / Reels / progress.json сохранена.

Запуск:
1. Полностью закрой старый запущенный v10/v9.
2. Распакуй эту папку.
3. Запусти START.cmd.
4. Вставь ссылку профиля Instagram.
5. Выбери Firefox-профиль, где ты авторизован в Instagram.
6. Если Instagram уже открыт авторизованным — продолжай по подсказкам.
7. Если попросит вход — войди вручную в открывшемся Selenium Firefox и нажми Enter в консоли.

Важно:
v9 FAST и v10.1 DEEP FIX одновременно не запускай.

Примечание:
В FIX-архив специально не включены старые тяжёлые downloads из исходного ZIP
(там был, в частности, файл vagfull.zip примерно на 426 МБ).
Парсер создаёт downloads заново. Если нужен старый progress.json —
скопируй папку нужного username из старой версии в downloads новой версии.
