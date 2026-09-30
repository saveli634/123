from __future__ import annotations

import csv
import html as html_lib
import json
import os
import re
import shutil
import sqlite3
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urlparse

import requests
from selenium import webdriver
from selenium.common.exceptions import StaleElementReferenceException, WebDriverException
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options

BASE = Path(__file__).resolve().parent
OUT = BASE / "downloads"


WINDOWS_INVALID_CHARS_RE = re.compile(r'[<>:"/\\|?*\x00-\x1f]')
WINDOWS_RESERVED_NAMES = {
    "CON", "PRN", "AUX", "NUL",
    *(f"COM{i}" for i in range(1, 10)),
    *(f"LPT{i}" for i in range(1, 10)),
}
INSTAGRAM_RESERVED_PATHS = {
    "accounts", "about", "developer", "developers", "directory",
    "direct", "emails", "explore", "legal", "p", "reel", "reels",
    "stories", "web", "challenge",
}
INSTAGRAM_USERNAME_RE = re.compile(r"^[A-Za-z0-9._]{1,30}$")


def extract_instagram_username(text: str) -> str:
    """Извлекает username из @username, username или URL Instagram."""
    raw = (text or "").strip()
    if not raw:
        raise ValueError("Пустая ссылка или username.")

    if "instagram.com" not in raw.lower():
        username = raw.lstrip("@/").split("?", 1)[0].split("#", 1)[0].strip("/")
    else:
        candidate = raw
        if not re.match(r"^[a-z][a-z0-9+.-]*://", candidate, flags=re.I):
            candidate = "https://" + candidate.lstrip("/")

        parsed = urlparse(candidate)
        host = (parsed.netloc or "").lower().split(":", 1)[0]
        if host not in {"instagram.com", "www.instagram.com", "m.instagram.com"}:
            raise ValueError(f"Это не ссылка Instagram: {raw}")

        parts = [p for p in parsed.path.split("/") if p]
        if not parts:
            raise ValueError(f"Не удалось определить username из ссылки: {raw}")
        username = parts[0].lstrip("@")

    username = username.strip()
    if not username:
        raise ValueError(f"Не удалось определить username: {raw}")

    if username.lower() in INSTAGRAM_RESERVED_PATHS:
        raise ValueError(
            f"Ссылка ведёт не на профиль Instagram, а в раздел '/{username}/'. "
            "Нужна ссылка вида https://www.instagram.com/USERNAME/"
        )

    if not INSTAGRAM_USERNAME_RE.fullmatch(username):
        raise ValueError(
            f"Некорректный Instagram username: {username!r}. "
            "Допустимы буквы, цифры, точка и подчёркивание."
        )
    return username


def safe_windows_name(name: str, fallback: str = "instagram_profile") -> str:
    """Возвращает безопасное имя одного компонента пути Windows."""
    cleaned = WINDOWS_INVALID_CHARS_RE.sub("_", (name or "").strip())
    cleaned = cleaned.rstrip(" .")
    if not cleaned:
        cleaned = fallback
    stem = cleaned.split(".", 1)[0].upper()
    if stem in WINDOWS_RESERVED_NAMES:
        cleaned = "_" + cleaned
    return cleaned[:120]


def normalize_profile_url(text: str) -> str:
    """Канонический URL профиля без ?query и #fragment."""
    username = extract_instagram_username(text)
    return f"https://www.instagram.com/{username}/"


def firefox_profiles() -> list[Path]:
    base = Path(os.environ.get("APPDATA", "")) / "Mozilla" / "Firefox" / "Profiles"
    if not base.exists():
        raise RuntimeError("Папка профилей Firefox не найдена.")
    profiles = [p for p in base.iterdir() if p.is_dir()]
    if not profiles:
        raise RuntimeError("Профили Firefox не найдены.")
    profiles.sort(
        key=lambda p: (
            0 if "default-release" in p.name else
            1 if "default" in p.name else 2,
            -p.stat().st_mtime,
        )
    )
    return profiles


def choose_profile() -> Path:
    profiles = firefox_profiles()
    print("\nНайдены профили Firefox:")
    for i, p in enumerate(profiles, 1):
        print(f"  {i} - {p.name}")
    raw = input("\nНомер профиля [1]: ").strip() or "1"
    idx = int(raw) - 1
    if idx < 0 or idx >= len(profiles):
        raise ValueError("Неверный номер профиля.")
    return profiles[idx]


def _read_instagram_cookies_from_db(db_path: Path) -> list[dict]:
    """Читает только cookies Instagram. База Firefox не изменяется."""
    conn = sqlite3.connect(str(db_path), timeout=3)
    try:
        columns = {row[1] for row in conn.execute("PRAGMA table_info(moz_cookies)")}
        required = {"host", "path", "name", "value"}
        if not required.issubset(columns):
            raise RuntimeError("Неожиданная структура cookies.sqlite")

        select_cols = ["host", "path", "name", "value"]
        for optional in ("expiry", "isSecure", "isHttpOnly"):
            if optional in columns:
                select_cols.append(optional)

        where = "(host = 'instagram.com' OR host = 'www.instagram.com' OR host = '.instagram.com')"
        # Обычный профиль Firefox хранит cookies без container-originAttributes.
        # Если колонка есть, сначала берём обычный контейнер.
        if "originAttributes" in columns:
            sql = f"SELECT {', '.join(select_cols)} FROM moz_cookies WHERE {where} AND originAttributes = ''"
            rows = conn.execute(sql).fetchall()
            if not rows:
                sql = f"SELECT {', '.join(select_cols)} FROM moz_cookies WHERE {where}"
                rows = conn.execute(sql).fetchall()
        else:
            sql = f"SELECT {', '.join(select_cols)} FROM moz_cookies WHERE {where}"
            rows = conn.execute(sql).fetchall()

        out = []
        now = int(time.time())
        for row in rows:
            data = dict(zip(select_cols, row))
            expiry = int(data.get("expiry") or 0)
            if expiry and expiry <= now:
                continue

            cookie = {
                "name": str(data["name"]),
                "value": str(data["value"]),
                "path": str(data.get("path") or "/"),
                "domain": str(data["host"]),
                "secure": bool(data.get("isSecure", False)),
                "httpOnly": bool(data.get("isHttpOnly", False)),
            }
            if expiry:
                cookie["expiry"] = expiry
            out.append(cookie)

        # Убираем возможные дубли.
        unique = {}
        for c in out:
            unique[(c["name"], c["domain"], c["path"])] = c
        return list(unique.values())
    finally:
        conn.close()


def load_instagram_cookies(profile: Path) -> list[dict]:
    """
    FIX: вместо передачи живого Firefox-профиля Selenium читаем только cookies.
    Это обходит geckodriver/Selenium ошибку:
    "Failed to set preferences: unknown error".
    """
    db = profile / "cookies.sqlite"
    if not db.exists():
        print("[!] cookies.sqlite в выбранном Firefox-профиле не найден.")
        return []

    # Сначала пробуем безопасно читать базу напрямую.
    try:
        return _read_instagram_cookies_from_db(db)
    except Exception as first_error:
        print(f"[i] Прямое чтение cookies не получилось: {first_error}")
        print("[i] Пробую временную копию cookies.sqlite...")

    # Если Firefox держит WAL/блокировку — копируем только cookie-БД, а не весь профиль.
    tmp_root = Path(tempfile.mkdtemp(prefix="ig_cookie_db_"))
    try:
        tmp_db = tmp_root / "cookies.sqlite"
        shutil.copy2(db, tmp_db)
        for suffix in ("-wal", "-shm"):
            src = Path(str(db) + suffix)
            if src.exists():
                try:
                    shutil.copy2(src, Path(str(tmp_db) + suffix))
                except OSError:
                    pass
        return _read_instagram_cookies_from_db(tmp_db)
    except Exception as e:
        print(f"[!] Не удалось прочитать cookies Firefox: {e}")
        print("[!] Это не критично: Firefox откроется чистым, можно войти вручную.")
        return []
    finally:
        shutil.rmtree(tmp_root, ignore_errors=True)


def make_driver():
    """
    Запускаем ЧИСТЫЙ временный профиль, созданный самим geckodriver.
    Не задаём Options.profile / --profile — именно это вызывало ошибку prefs.
    """
    opts = Options()
    driver = webdriver.Firefox(options=opts)
    driver.set_window_size(1280, 980)
    driver.set_page_load_timeout(45)
    return driver


def restore_instagram_session(driver, cookies: list[dict]) -> int:
    """Переносит авторизацию Instagram из выбранного обычного Firefox в чистый Selenium Firefox."""
    if not cookies:
        return 0

    driver.get("https://www.instagram.com/")
    time.sleep(0.8)

    added = 0
    for cookie in cookies:
        try:
            driver.add_cookie(cookie)
            added += 1
        except Exception:
            # Отдельная вспомогательная cookie может не подойти текущему домену —
            # это не должно срывать запуск.
            pass

    if added:
        driver.refresh()
        time.sleep(1.2)
    return added


def has_instagram_login(driver) -> bool:
    try:
        names = {c.get("name") for c in driver.get_cookies()}
        return "sessionid" in names and "ds_user_id" in names
    except Exception:
        return False


def dismiss_popups(driver):
    wanted = {
        "not now", "не сейчас", "сейчас не надо",
        "allow all cookies", "разрешить все файлы cookie",
        "only allow essential cookies", "только необходимые",
    }
    try:
        nodes = driver.find_elements(By.XPATH, "//button | //*[@role='button']")
        for node in nodes:
            try:
                txt = (node.text or "").strip().lower()
                if txt in wanted and node.is_displayed():
                    driver.execute_script("arguments[0].click();", node)
                    time.sleep(0.15)
            except Exception:
                pass
    except Exception:
        pass


def normalize_found_url(value: str) -> str | None:
    if not value:
        return None
    value = html_lib.unescape(value)
    value = value.replace("\\u002F", "/").replace("\\u002f", "/").replace("\\/", "/")
    value = value.strip("'\" \t\r\n")

    m = re.search(
        r"(?:https?://(?:www\.)?instagram\.com)?/(p|reel)/([A-Za-z0-9_-]+)",
        value,
        flags=re.I,
    )
    if not m:
        return None
    return f"https://www.instagram.com/{m.group(1).lower()}/{m.group(2)}/"


def extract_links_every_way(driver) -> set[str]:
    found: set[str] = set()

    try:
        values = driver.execute_script("""
            const out = [];
            const nodes = document.querySelectorAll('a, [role="link"], [href]');
            for (const el of nodes) {
                const vals = [
                    el.href,
                    el.getAttribute && el.getAttribute('href'),
                    el.getAttribute && el.getAttribute('data-href')
                ];
                for (const v of vals) if (v) out.push(v);
            }
            return out;
        """) or []
        for value in values:
            u = normalize_found_url(str(value))
            if u:
                found.add(u)
    except Exception:
        pass

    try:
        source = driver.page_source or ""
        variants = [
            source,
            html_lib.unescape(source),
            source.replace("\\u002F", "/").replace("\\u002f", "/").replace("\\/", "/"),
        ]
        pattern = r"(?:https?://(?:www\.)?instagram\.com)?/(?:p|reel)/[A-Za-z0-9_-]+"
        for data in variants:
            for m in re.finditer(pattern, data, flags=re.I):
                u = normalize_found_url(m.group(0))
                if u:
                    found.add(u)
    except Exception:
        pass

    return found


def infer_media_count(driver) -> int | None:
    """
    Best-effort: extract profile media count from visible text/meta.
    Instagram localization changes often, so this is intentionally permissive.
    """
    candidates = []
    try:
        candidates.append(driver.title or "")
    except Exception:
        pass
    try:
        candidates.append(driver.page_source or "")
    except Exception:
        pass

    patterns = [
        r'([\d.,\s]+)\s+(?:posts|publications|публикац(?:ий|ии)|публикации)',
        r'(?:posts|publications|публикац(?:ий|ии)|публикации)\s*[:\-]?\s*([\d.,\s]+)',
    ]
    for data in candidates:
        data = html_lib.unescape(data)
        for pat in patterns:
            m = re.search(pat, data, flags=re.I)
            if not m:
                continue
            raw = re.sub(r"[^\d]", "", m.group(1))
            if raw:
                try:
                    n = int(raw)
                    if 0 < n < 100000:
                        return n
                except Exception:
                    pass
    return None


def deep_scroll_collect(
    driver,
    url: str,
    label: str,
    target_count: int | None,
    max_rounds: int,
    done_urls: set[str] | None = None,
    target_new_count: int | None = None,
) -> set[str]:
    print(f"\n=== DEEP SCAN: {label} ===")
    driver.get(url)
    time.sleep(1.8)
    dismiss_popups(driver)

    found: set[str] = set()
    done_urls = set(done_urls or set())
    no_growth = 0
    last_count = -1
    last_height = 0

    for step in range(1, max_rounds + 1):
        found |= extract_links_every_way(driver)

        if step == 1 or step % 5 == 0:
            target_text = f"/{target_count}" if target_count else ""
            new_now = len(found - done_urls)
            if target_new_count:
                print(
                    f"[deep {label}] найдено уникальных: {len(found)}{target_text} | "
                    f"НОВЫХ: {new_now}/{target_new_count}"
                )
            else:
                print(f"[deep {label}] найдено уникальных: {len(found)}{target_text}")

        if target_new_count and len(found - done_urls) >= target_new_count:
            print(
                f"[deep {label}] достигнут лимит режима: "
                f"{len(found - done_urls)}/{target_new_count} новых URL"
            )
            break

        if target_count and len(found) >= target_count:
            print(f"[deep {label}] достигнут заявленный count: {target_count}")
            break

        try:
            current_height = driver.execute_script(
                "return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);"
            ) or 0
        except Exception:
            current_height = 0

        # Alternate between incremental scrolling and hard jump to bottom.
        try:
            if step % 4 == 0:
                driver.execute_script(
                    "window.scrollTo(0, Math.max(document.body.scrollHeight, document.documentElement.scrollHeight));"
                )
            else:
                driver.execute_script(
                    "window.scrollBy(0, Math.max(window.innerHeight * 0.92, 760));"
                )
        except Exception:
            pass

        # Longer pauses every few rounds to let Instagram append older rows.
        if step % 8 == 0:
            time.sleep(1.4)
        else:
            time.sleep(0.5)

        if len(found) == last_count and current_height == last_height:
            no_growth += 1
        else:
            no_growth = 0

        last_count = len(found)
        last_height = current_height

        # Deep mode intentionally waits much longer than FAST before giving up.
        if no_growth >= 20:
            print(f"[deep {label}] новых элементов давно нет — завершаю этот проход.")
            break

    # One final read after the last scroll.
    found |= extract_links_every_way(driver)
    return found


def click_grid_fallback(
    driver,
    profile_url: str,
    already: set[str],
    max_clicks: int = 120,
    done_urls: set[str] | None = None,
    target_new_count: int | None = None,
) -> set[str]:
    found = set(already)
    done_urls = set(done_urls or set())
    seen_src = set()
    clicks = 0

    print("\n[fallback] Добираю URL кликами по плиткам сетки...")

    driver.get(profile_url)
    time.sleep(1.5)
    dismiss_popups(driver)

    for round_no in range(120):
        try:
            images = driver.find_elements(By.CSS_SELECTOR, "main img")
        except Exception:
            images = []

        clicked = False

        for img in images:
            if clicks >= max_clicks:
                return found
            try:
                if not img.is_displayed():
                    continue
                rect = img.rect or {}
                if rect.get("width", 0) < 140 or rect.get("height", 0) < 140:
                    continue

                src = img.get_attribute("src") or ""
                if not src or src in seen_src:
                    continue
                seen_src.add(src)

                href = driver.execute_script("""
                    let el = arguments[0];
                    for (let i = 0; i < 9 && el; i++, el = el.parentElement) {
                        if (el.tagName === 'A' && el.href) return el.href;
                        if (el.getAttribute && el.getAttribute('href')) return el.getAttribute('href');
                    }
                    return null;
                """, img)

                u = normalize_found_url(href or "")
                if u:
                    found.add(u)
                    if target_new_count and len(found - done_urls) >= target_new_count:
                        print(
                            f"[fallback] достигнут лимит режима: "
                            f"{len(found - done_urls)}/{target_new_count} новых URL"
                        )
                        return found
                    continue

                driver.execute_script(
                    "arguments[0].scrollIntoView({block:'center', inline:'center'});",
                    img,
                )
                time.sleep(0.1)

                before = driver.current_url
                driver.execute_script("""
                    let el = arguments[0];
                    let target = el;
                    for (let i = 0; i < 9 && el; i++, el = el.parentElement) {
                        if (el.tagName === 'A' ||
                            el.getAttribute('role') === 'link' ||
                            el.getAttribute('role') === 'button') {
                            target = el;
                            break;
                        }
                    }
                    target.click();
                """, img)

                clicks += 1
                clicked = True
                time.sleep(0.35)

                u = normalize_found_url(driver.current_url)
                if u:
                    found.add(u)
                    print(f"[fallback] найдено уникальных: {len(found)}")

                if driver.current_url != before:
                    try:
                        driver.back()
                        time.sleep(0.35)
                    except Exception:
                        driver.get(profile_url)
                        time.sleep(0.7)
                break

            except StaleElementReferenceException:
                break
            except Exception:
                continue

        found |= extract_links_every_way(driver)

        if target_new_count and len(found - done_urls) >= target_new_count:
            print(
                f"[fallback] достигнут лимит режима: "
                f"{len(found - done_urls)}/{target_new_count} новых URL"
            )
            return found

        if not clicked:
            try:
                driver.execute_script(
                    "window.scrollBy(0, Math.max(window.innerHeight * 0.9, 700));"
                )
            except Exception:
                pass
            time.sleep(0.35)

        if round_no % 15 == 0:
            print(f"[fallback] текущий итог: {len(found)}")

    return found


def session_from_driver(driver):
    s = requests.Session()
    try:
        ua = driver.execute_script("return navigator.userAgent;")
    except Exception:
        ua = "Mozilla/5.0"
    s.headers.update({
        "User-Agent": ua,
        "Referer": "https://www.instagram.com/",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "ru,en-US;q=0.9,en;q=0.8",
    })
    for c in driver.get_cookies():
        try:
            s.cookies.set(c["name"], c["value"], domain=c.get("domain"))
        except Exception:
            s.cookies.set(c["name"], c["value"])
    return s


def ext_from_url(url: str, fallback: str) -> str:
    path = urlparse(url).path.lower()
    for ext in (".mp4", ".jpg", ".jpeg", ".png", ".webp"):
        if ext in path:
            return ext
    return fallback


def download_file(session, url: str, path: Path, referer: str = "") -> bool:
    """Скачивает медиа с повторными попытками и не оставляет битые/пустые файлы."""
    if not url or url.startswith("blob:"):
        return False
    if path.exists() and path.stat().st_size > 1024:
        return True

    headers = {}
    if referer:
        headers["Referer"] = referer

    last_error = None
    for attempt in range(1, 4):
        # v10.7: если папка была удалена/пропала во время работы — создаём её заново.
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix(path.suffix + ".part")
        try:
            tmp.unlink(missing_ok=True)
        except Exception:
            pass

        try:
            with session.get(url, stream=True, timeout=(20, 60), headers=headers) as r:
                if r.status_code in (403, 429):
                    raise RuntimeError(f"HTTP {r.status_code} — Instagram/CDN временно ограничил загрузку")
                r.raise_for_status()

                content_type = (r.headers.get("Content-Type") or "").lower()
                if content_type.startswith("text/") or "json" in content_type:
                    raise RuntimeError(f"вместо медиа получен Content-Type: {content_type or 'unknown'}")

                written = 0
                with tmp.open("wb") as f:
                    for chunk in r.iter_content(256 * 1024):
                        if chunk:
                            f.write(chunk)
                            written += len(chunk)

                if written < 1024:
                    raise RuntimeError(f"файл слишком маленький: {written} bytes")

                tmp.replace(path)
                return True

        except Exception as e:
            last_error = e
            try:
                tmp.unlink(missing_ok=True)
            except Exception:
                pass
            if attempt < 3:
                time.sleep(1.2 * attempt)

    print(f"    [!] download error: {last_error}")
    return False



def clone_requests_session(session):
    """Отдельная requests.Session для безопасной параллельной загрузки."""
    s = requests.Session()
    s.headers.update(dict(session.headers))
    try:
        for c in session.cookies:
            try:
                s.cookies.set(c.name, c.value, domain=c.domain, path=c.path)
            except Exception:
                s.cookies.set(c.name, c.value)
    except Exception:
        pass
    return s


def download_media_batch(session, media, item: Path, referer: str, max_workers: int = 3):
    """
    Быстрее скачивает карусели: до 3 файлов одновременно.
    Не создаёт чрезмерную нагрузку и сохраняет порядок файлов.
    """
    if not media:
        return []

    jobs = []
    for i, (kind, src) in enumerate(media, 1):
        ext = ext_from_url(src, ".mp4" if kind == "video" else ".jpg")
        path = item / f"{i:02d}_{kind}{ext}"
        jobs.append((i, src, path))

    def worker(job):
        idx, src, path = job
        local_session = clone_requests_session(session)
        ok = download_file(local_session, src, path, referer=referer)
        try:
            local_session.close()
        except Exception:
            pass
        return idx, path, ok

    workers = min(max_workers, len(jobs))
    results = []

    if workers <= 1:
        for job in jobs:
            idx, path, ok = worker(job)
            if ok:
                results.append((idx, path))
    else:
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = [pool.submit(worker, job) for job in jobs]
            for fut in as_completed(futures):
                idx, path, ok = fut.result()
                if ok:
                    results.append((idx, path))

    results.sort(key=lambda x: x[0])
    return [path for _, path in results]

def meta(driver, prop: str) -> str:
    try:
        return driver.find_element(
            By.CSS_SELECTOR, f'meta[property="{prop}"]'
        ).get_attribute("content") or ""
    except Exception:
        return ""


def _visible_body_text(driver) -> str:
    try:
        return (driver.find_element(By.TAG_NAME, "body").text or "").lower()
    except Exception:
        return ""


def instagram_page_problem(driver) -> str | None:
    """Распознаёт типичные страницы логина/challenge/rate-limit."""
    try:
        current = (driver.current_url or "").lower()
    except Exception:
        current = ""

    if "/accounts/login" in current:
        return "Instagram перебросил на страницу входа"
    if "/challenge/" in current or "/checkpoint/" in current:
        return "Instagram запросил проверку аккаунта"

    text = _visible_body_text(driver)
    phrases = {
        "please wait a few minutes before you try again": "Instagram временно ограничил запросы",
        "подождите несколько минут, прежде чем повторить попытку": "Instagram временно ограничил запросы",
        "we restrict certain activity": "Instagram ограничил активность",
        "мы ограничиваем некоторые действия": "Instagram ограничил активность",
        "something went wrong": "Instagram вернул ошибку страницы",
        "произошла ошибка": "Instagram вернул ошибку страницы",
    }
    for phrase, reason in phrases.items():
        if phrase in text:
            return reason
    return None


def _decode_media_url(value: str) -> str:
    """Декодирует URL из JSON/HTML Instagram."""
    if not value:
        return ""
    value = html_lib.unescape(str(value))
    replacements = {
        r"\/": "/",
        r"\u002F": "/",
        r"\u002f": "/",
        r"\u0026": "&",
        r"\u0026amp;": "&",
        r"\u003D": "=",
        r"\u003d": "=",
        r"\u003F": "?",
        r"\u003f": "?",
    }
    for old, new in replacements.items():
        value = value.replace(old, new)
    return value.strip("'\" \t\r\n")


def _looks_like_media_url(url: str) -> bool:
    if not url or url.startswith("blob:"):
        return False
    low = url.lower()
    return (
        low.startswith("http")
        and (
            "cdninstagram.com" in low
            or "fbcdn.net" in low
            or ".jpg" in low
            or ".jpeg" in low
            or ".webp" in low
            or ".png" in low
            or ".mp4" in low
        )
    )


def _kind_from_url(url: str, default: str = "image") -> str:
    low = (url or "").lower()
    if ".mp4" in low or "video" in low:
        return "video"
    return default


def _best_srcset_url(srcset: str) -> str:
    """Берёт самый крупный вариант из srcset."""
    if not srcset:
        return ""
    candidates = []
    for part in srcset.split(","):
        part = part.strip()
        if not part:
            continue
        bits = part.rsplit(" ", 1)
        url = bits[0].strip()
        score = 0
        if len(bits) == 2:
            m = re.search(r"(\d+)", bits[1])
            if m:
                score = int(m.group(1))
        candidates.append((score, url))
    if not candidates:
        return ""
    candidates.sort(key=lambda x: x[0], reverse=True)
    return candidates[0][1]


def sync_session_from_driver(session, driver):
    """Обновляет cookies requests.Session из текущего Selenium Firefox."""
    try:
        ua = driver.execute_script("return navigator.userAgent;")
        if ua:
            session.headers["User-Agent"] = ua
    except Exception:
        pass

    try:
        for c in driver.get_cookies():
            try:
                session.cookies.set(
                    c["name"],
                    c["value"],
                    domain=c.get("domain"),
                    path=c.get("path") or "/",
                )
            except Exception:
                try:
                    session.cookies.set(c["name"], c["value"])
                except Exception:
                    pass
    except Exception:
        pass


def shortcode_to_media_id(shortcode: str) -> str | None:
    """
    Instagram shortcode -> numeric media id.
    Нужен для штатного media-info endpoint текущей авторизованной сессии.
    """
    alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
    if not shortcode or any(ch not in alphabet for ch in shortcode):
        return None
    value = 0
    for ch in shortcode:
        value = value * 64 + alphabet.index(ch)
    return str(value)


def _best_image_candidate(item: dict) -> str:
    candidates = (((item or {}).get("image_versions2") or {}).get("candidates") or [])
    best = None
    best_score = -1
    for c in candidates:
        if not isinstance(c, dict):
            continue
        url = _decode_media_url(c.get("url") or "")
        if not _looks_like_media_url(url):
            continue
        try:
            score = int(c.get("width") or 0) * int(c.get("height") or 0)
        except Exception:
            score = 0
        if score > best_score:
            best = url
            best_score = score
    return best or ""


def _best_video_candidate(item: dict) -> str:
    versions = (item or {}).get("video_versions") or []
    best = None
    best_score = -1
    for v in versions:
        if not isinstance(v, dict):
            continue
        url = _decode_media_url(v.get("url") or "")
        if not _looks_like_media_url(url):
            continue
        try:
            score = int(v.get("width") or 0) * int(v.get("height") or 0)
        except Exception:
            score = 0
        if score > best_score:
            best = url
            best_score = score
    return best or ""


def media_from_post_api(session, post_url: str) -> tuple[list[tuple[str, str]], str, str | None]:
    """
    Основной fallback v10.3:
    получает media-info публикации через текущую Instagram-сессию.
    Это позволяет скачать фото даже когда новый DOM Instagram не содержит обычного <img>.
    """
    try:
        shortcode = urlparse(post_url).path.rstrip("/").split("/")[-1]
    except Exception:
        return [], "", None

    media_id = shortcode_to_media_id(shortcode)
    if not media_id:
        return [], "", None

    csrf = session.cookies.get("csrftoken") or ""
    headers = {
        "Referer": post_url,
        "Accept": "*/*",
        "X-IG-App-ID": "936619743392459",
        "X-Requested-With": "XMLHttpRequest",
    }
    if csrf:
        headers["X-CSRFToken"] = csrf

    endpoints = [
        f"https://www.instagram.com/api/v1/media/{media_id}/info/",
        f"https://i.instagram.com/api/v1/media/{media_id}/info/",
    ]

    last_problem = None
    payload = None

    for endpoint in endpoints:
        try:
            r = session.get(endpoint, headers=headers, timeout=(15, 35))
            if r.status_code in (401, 403):
                last_problem = f"media API HTTP {r.status_code}"
                continue
            if r.status_code == 429:
                last_problem = "media API HTTP 429"
                continue
            if r.status_code >= 400:
                last_problem = f"media API HTTP {r.status_code}"
                continue

            ct = (r.headers.get("Content-Type") or "").lower()
            if "json" not in ct:
                last_problem = f"media API вернул {ct or 'неизвестный Content-Type'}"
                continue

            payload = r.json()
            if isinstance(payload, dict):
                break
        except Exception as e:
            last_problem = f"media API: {e}"

    if not isinstance(payload, dict):
        return [], "", last_problem

    items = payload.get("items") or []
    if not items or not isinstance(items[0], dict):
        return [], "", last_problem or "media API не вернул items"

    root = items[0]
    caption = ""
    try:
        caption = ((root.get("caption") or {}).get("text") or "").strip()
    except Exception:
        pass

    nodes = root.get("carousel_media") or [root]
    found = []
    seen = set()

    for node in nodes:
        if not isinstance(node, dict):
            continue

        video_url = _best_video_candidate(node)
        image_url = _best_image_candidate(node)

        # Для видео сохраняем само видео. Для фото — лучший image candidate.
        if video_url and video_url not in seen:
            seen.add(video_url)
            found.append(("video", video_url))
        elif image_url and image_url not in seen:
            seen.add(image_url)
            found.append(("image", image_url))

    return found, caption, last_problem


def media_on_page(driver):
    """
    Расширенный DOM-поиск v10.3.
    Instagram меняет разметку, поэтому смотрим article/main/dialog,
    src/currentSrc/srcset и <source>.
    """
    found = []
    seen = set()

    try:
        rows = driver.execute_script(r"""
            const out = [];
            const roots = [
                document.querySelector('article'),
                document.querySelector('main'),
                document.querySelector('[role="dialog"]'),
                document.body
            ].filter(Boolean);

            const uniq = new Set();
            for (const root of roots) {
                for (const el of root.querySelectorAll('img, video, picture source, video source')) {
                    if (uniq.has(el)) continue;
                    uniq.add(el);

                    const tag = (el.tagName || '').toLowerCase();
                    const src = el.currentSrc || el.src || el.getAttribute('src') || '';
                    const srcset = el.srcset || el.getAttribute('srcset') || '';
                    const nw = Number(el.naturalWidth || el.videoWidth || 0);
                    const nh = Number(el.naturalHeight || el.videoHeight || 0);
                    const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : {width:0,height:0};

                    out.push({
                        tag,
                        src,
                        srcset,
                        nw,
                        nh,
                        cw: Number(rect.width || 0),
                        ch: Number(rect.height || 0)
                    });
                }
            }
            return out;
        """) or []
    except Exception:
        rows = []

    for row in rows:
        try:
            tag = str(row.get("tag") or "").lower()
            src = _decode_media_url(row.get("src") or "")
            srcset = row.get("srcset") or ""
            if srcset:
                best = _decode_media_url(_best_srcset_url(srcset))
                if _looks_like_media_url(best):
                    src = best

            if not _looks_like_media_url(src):
                continue

            w = max(int(row.get("nw") or 0), int(row.get("cw") or 0))
            h = max(int(row.get("nh") or 0), int(row.get("ch") or 0))

            if tag in {"video", "source"} and (".mp4" in src.lower() or tag == "video"):
                kind = "video"
            else:
                kind = _kind_from_url(src, "image")

            # Отсекаем мелкие аватарки/иконки. Если браузер ещё не знает размер,
            # URL всё равно оставляем — API/page-source ниже даст дополнительную проверку.
            if kind == "image" and w and h and max(w, h) < 240:
                continue

            if src not in seen:
                seen.add(src)
                found.append((kind, src))
        except Exception:
            continue

    return found


def media_from_page_source(driver) -> list[tuple[str, str]]:
    """
    Ищет медиа URL внутри JSON, который Instagram встраивает в HTML.
    Используется только если API/DOM не дали результат.
    """
    try:
        source = driver.page_source or ""
    except Exception:
        return []

    found = []
    seen = set()

    strong_patterns = [
        ("video", r'"video_url"\s*:\s*"([^"]+)"'),
        ("image", r'"display_url"\s*:\s*"([^"]+)"'),
        ("image", r'"image_url"\s*:\s*"([^"]+)"'),
        ("video", r'"contentUrl"\s*:\s*"([^"]+\.mp4[^"]*)"'),
    ]

    for kind, pat in strong_patterns:
        for m in re.finditer(pat, source, flags=re.I):
            url = _decode_media_url(m.group(1))
            if _looks_like_media_url(url) and url not in seen:
                seen.add(url)
                found.append((kind, url))

    # image_versions2 хранит картинки как generic "url".
    # Этот проход включаем только если сильные ключи ничего не нашли.
    if not found:
        generic = re.compile(
            r'"url"\s*:\s*"((?:https?:)?(?:\\?/){2}[^"]*(?:cdninstagram\.com|fbcdn\.net)[^"]*)"',
            flags=re.I,
        )
        for m in generic.finditer(source):
            url = _decode_media_url(m.group(1))
            if _looks_like_media_url(url) and url not in seen:
                seen.add(url)
                found.append((_kind_from_url(url), url))
                if len(found) >= 12:
                    break

    return found


def media_from_resource_timing(driver) -> list[tuple[str, str]]:
    """
    Последний fallback: URL ресурсов, которые реально загрузил Firefox.
    Ограничиваем количество, чтобы не собирать весь интерфейс страницы.
    """
    try:
        urls = driver.execute_script("""
            return performance.getEntriesByType('resource')
                .filter(e => ['img','video'].includes(e.initiatorType))
                .map(e => e.name);
        """) or []
    except Exception:
        return []

    found = []
    seen = set()
    for raw in urls:
        url = _decode_media_url(raw)
        if not _looks_like_media_url(url) or url in seen:
            continue
        seen.add(url)
        found.append((_kind_from_url(url), url))

    # Самые поздние ресурсы чаще относятся к открытой публикации.
    return found[-8:]


def wait_for_post_media(driver, timeout: float = 8.0) -> tuple[list[tuple[str, str]], str | None]:
    """Ждёт DOM/OG медиа после открытия публикации."""
    deadline = time.time() + timeout
    last_problem = None
    while time.time() < deadline:
        last_problem = instagram_page_problem(driver)
        media = media_on_page(driver)
        og_video = meta(driver, "og:video")
        og_image = meta(driver, "og:image")

        if media or og_video or og_image:
            return media, None

        if last_problem:
            return [], last_problem

        time.sleep(0.4)

    return [], last_problem


def click_next_carousel(driver) -> bool:
    selectors = [
        'button[aria-label="Next"]',
        'button[aria-label="Далее"]',
        'button[aria-label="Следующая"]',
        'button[aria-label="Next photo"]',
        'button[aria-label="Следующее фото"]',
        'button[aria-label="Next slide"]',
    ]
    for sel in selectors:
        try:
            b = driver.find_element(By.CSS_SELECTOR, sel)
            if b.is_displayed():
                driver.execute_script("arguments[0].click();", b)
                time.sleep(0.25)
                return True
        except Exception:
            pass
    return False


def scrape_post(driver, session, url: str, folder: Path, number: int) -> dict:
    """
    v10.9 TURBO:
    1) СНАЧАЛА пробует media-info API без открытия поста в Firefox.
    2) Если API сработал — сразу скачивает файлы.
    3) Firefox открывает публикацию только как fallback.
    4) Карусели скачиваются до 3 файлов одновременно.
    """
    shortcode = urlparse(url).path.rstrip("/").split("/")[-1]
    shortcode = safe_windows_name(shortcode, fallback=f"post_{number:03d}")
    # v10.7: корневая media-папка могла исчезнуть между публикациями.
    folder.mkdir(parents=True, exist_ok=True)
    item = folder / f"{number:03d}_{shortcode}"
    item.mkdir(parents=True, exist_ok=True)

    # -------- TURBO PATH: без открытия страницы в браузере --------
    api_media, api_caption, api_problem = media_from_post_api(session, url)

    if api_media:
        downloaded = download_media_batch(
            session,
            api_media,
            item,
            referer=url,
            max_workers=3,
        )

        files = [
            p.relative_to(folder).as_posix()
            for p in downloaded
            if p.exists() and p.stat().st_size > 1024
        ]

        if files:
            (item / "caption.txt").write_text(api_caption or "", encoding="utf-8")
            (item / "source_url.txt").write_text(url, encoding="utf-8")
            return {
                "shortcode": shortcode,
                "url": url,
                "title": "",
                "description": api_caption or "",
                "files": files,
                "method": "api_turbo",
            }

    # -------- FALLBACK: только если прямой путь не сработал --------
    driver.get(url)
    time.sleep(0.75)
    dismiss_popups(driver)
    sync_session_from_driver(session, driver)

    # После открытия страницы API иногда начинает работать.
    api_media2, api_caption2, api_problem2 = media_from_post_api(session, url)
    if api_media2:
        downloaded = download_media_batch(
            session,
            api_media2,
            item,
            referer=url,
            max_workers=3,
        )
        files = [
            p.relative_to(folder).as_posix()
            for p in downloaded
            if p.exists() and p.stat().st_size > 1024
        ]
        if files:
            caption = api_caption2 or api_caption or ""
            (item / "caption.txt").write_text(caption, encoding="utf-8")
            (item / "source_url.txt").write_text(url, encoding="utf-8")
            return {
                "shortcode": shortcode,
                "url": url,
                "title": "",
                "description": caption,
                "files": files,
                "method": "api_after_browser",
            }

    initial_media, problem = wait_for_post_media(driver, timeout=2.5)

    title = meta(driver, "og:title")
    description = api_caption2 or api_caption or meta(driver, "og:description")
    og_image = _decode_media_url(meta(driver, "og:image"))
    og_video = _decode_media_url(meta(driver, "og:video"))

    media = []
    seen = set()

    def add_media(items):
        for kind, src in items:
            src = _decode_media_url(src)
            if src and src not in seen and _looks_like_media_url(src):
                seen.add(src)
                media.append((kind, src))

    add_media(initial_media)
    add_media(media_on_page(driver))

    # Карусель через DOM только в fallback-режиме.
    for _ in range(20):
        if not click_next_carousel(driver):
            break
        time.sleep(0.18)
        add_media(media_on_page(driver))

    if og_video:
        add_media([("video", og_video)])
    if og_image:
        add_media([("image", og_image)])

    if not media:
        add_media(media_from_page_source(driver))

    if not media:
        add_media(media_from_resource_timing(driver))

    if not media:
        reasons = [
            x for x in (problem, api_problem, api_problem2)
            if x
        ]
        detail = "; ".join(dict.fromkeys(reasons))
        if detail:
            raise RuntimeError(f"не удалось получить media URL ({detail})")
        raise RuntimeError("страница открылась, но Instagram не отдал media URL ни одним способом")

    downloaded = download_media_batch(
        session,
        media,
        item,
        referer=url,
        max_workers=3,
    )

    files = [
        p.relative_to(folder).as_posix()
        for p in downloaded
        if p.exists() and p.stat().st_size > 1024
    ]

    if not files:
        raise RuntimeError("media URL найдены, но ни один файл не удалось скачать")

    (item / "caption.txt").write_text(description or title or "", encoding="utf-8")
    (item / "source_url.txt").write_text(url, encoding="utf-8")

    return {
        "shortcode": shortcode,
        "url": url,
        "title": title,
        "description": description,
        "files": files,
        "method": "browser_fallback",
    }


def _record_files_exist(target: Path, record: dict) -> bool:
    """Проверяет, что запись progress действительно имеет скачанный файл."""
    files = record.get("files") or []
    for rel in files:
        rel_path = Path(str(rel).replace("\\", "/"))
        path = target / "browser_media" / rel_path
        try:
            if path.exists() and path.is_file() and path.stat().st_size > 1024:
                return True
        except OSError:
            pass
    return False


def _recover_record_from_disk(target: Path, url: str) -> dict | None:
    """
    Восстанавливает запись progress из уже существующей папки,
    если старый progress содержит done, но records потерялись.
    """
    try:
        shortcode = urlparse(url).path.rstrip("/").split("/")[-1]
    except Exception:
        return None
    if not shortcode:
        return None

    media_root = target / "browser_media"
    for item in media_root.glob(f"*_{shortcode}"):
        if not item.is_dir():
            continue
        files = []
        for file in sorted(item.iterdir()):
            if not file.is_file():
                continue
            if file.name in {"caption.txt", "source_url.txt"} or file.suffix == ".part":
                continue
            try:
                if file.stat().st_size <= 1024:
                    continue
            except OSError:
                continue
            files.append(file.relative_to(media_root).as_posix())

        if not files:
            continue

        caption = ""
        try:
            caption = (item / "caption.txt").read_text(encoding="utf-8")
        except Exception:
            pass
        return {
            "shortcode": shortcode,
            "url": url,
            "title": "",
            "description": caption,
            "files": files,
        }
    return None


def load_progress(target: Path):
    """
    FIX v10.2:
    URL считается обработанным только если на диске реально есть скачанный медиафайл.
    Пустые записи старой версии автоматически возвращаются в очередь.
    """
    progress_file = target / "progress.json"
    if progress_file.exists():
        try:
            progress = json.loads(progress_file.read_text(encoding="utf-8"))
        except Exception:
            progress = {}
    else:
        progress = {}

    raw_done = set(progress.get("done", []))
    records = progress.get("records", [])
    raw_by_url = {
        r.get("url"): r
        for r in records
        if isinstance(r, dict) and r.get("url")
    }

    by_url = {}
    recovered_empty = 0

    for url in sorted(raw_done | set(raw_by_url)):
        rec = raw_by_url.get(url)
        if rec and _record_files_exist(target, rec):
            by_url[url] = rec
            continue

        recovered = _recover_record_from_disk(target, url)
        if recovered:
            by_url[url] = recovered
        else:
            recovered_empty += 1

    done = set(by_url)
    return progress_file, done, by_url, recovered_empty


def save_progress(progress_file: Path, done: set[str], by_url: dict[str, dict]):
    """
    v10.7: папка восстанавливается автоматически.
    Запись через .tmp снижает шанс повреждения progress.json при аварийном завершении.
    """
    progress_file.parent.mkdir(parents=True, exist_ok=True)
    tmp = progress_file.with_suffix(progress_file.suffix + ".tmp")
    payload = json.dumps(
        {"done": sorted(done), "records": list(by_url.values())},
        ensure_ascii=False,
        indent=2,
    )
    tmp.write_text(payload, encoding="utf-8")
    tmp.replace(progress_file)


def save_exports(target: Path, by_url: dict[str, dict]):
    # v10.7: если папка исчезла, экспорт сам её восстановит.
    target.mkdir(parents=True, exist_ok=True)
    rows = list(by_url.values())
    (target / "all_media.json").write_text(
        json.dumps(rows, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    with (target / "all_media.csv").open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(
            f,
            fieldnames = ["shortcode", "url", "title", "description", "files", "method"],
        )
        writer.writeheader()
        for row in rows:
            writer.writerow({
                **row,
                "files": " | ".join(row.get("files", [])),
            })


def maybe_import_old_progress(username: str, target: Path):
    """
    Helps if v9 FAST and v10 DEEP are extracted next to each other.
    If v10 has no progress yet, copy the whole existing profile folder automatically.
    """
    if (target / "progress.json").exists():
        return

    parent = BASE.parent
    candidates = [
        parent / "instagram_parser_v9_fast" / "downloads" / username,
        parent / "instagram_parser_v8" / "downloads" / username,
        parent / "instagram_parser_v7_firefox" / "downloads" / username,
    ]

    for old in candidates:
        if old.exists() and (old / "progress.json").exists():
            print(f"[resume] Нашёл старый прогресс: {old}")
            print("[resume] Копирую его в v10 DEEP...")
            target.parent.mkdir(parents=True, exist_ok=True)
            # v10.7: НИКОГДА не удаляем текущую папку downloads.
            # Копируем старый архив только если целевой папки ещё нет.
            if not target.exists():
                shutil.copytree(old, target)
                print("[resume] Готово.")
            else:
                print("[resume] Текущая папка уже существует — не удаляю её.")
            return


def main():
    print("=" * 78)
    print(" INSTAGRAM PARSER v10.9 TURBO — PERCENT SCAN + DOWNLOAD")
    print("=" * 78)
    print()
    print("Запускай ПОСЛЕ v9 FAST, не одновременно.")
    print("v10.9 TURBO:")
    print("- делает длинный скролл профиля;")
    print("- отдельно проходит вкладку Reels;")
    print("- при необходимости кликает по плиткам;")
    print("- URL считается готовым только если медиа реально скачано;")
    print("- пустые записи старой версии автоматически повторяются;")
    print("- при серии блокировок парсер безопасно останавливается;")
    print("- принимает @username, username и ссылки с ?hl=ru / ?igsh / utm-параметрами.")
    print("- медиа ищется через media-info API, DOM/srcset, JSON страницы и resource fallback.")
    print("- TURBO: Firefox открывает пост только если быстрый API-способ не сработал.")
    print("- карусели скачиваются до 3 файлов одновременно.")
    print("- ДО сканирования можно выбрать 15%, 35%, 50% или 100%; процент ограничивает и ПОИСК, и СКАЧИВАНИЕ.")
    print("- SELF-HEAL: пропавшие downloads/profile/browser_media папки создаются заново.")

    firefox_cookies = []

    try:
        raw_profile = input("\nСсылка профиля для глубокого прохода: ").strip()
        username = extract_instagram_username(raw_profile)
        profile_url = normalize_profile_url(raw_profile)
        folder_name = safe_windows_name(username)

        print(f"[+] Профиль Instagram: @{username}")
        print(f"[+] Канонический URL: {profile_url}")
        if folder_name != username:
            print(f"[i] Имя папки Windows: {folder_name}")

        profile = choose_profile()
        print(f"[+] Firefox-профиль: {profile.name}")
        print("[i] Читаю только cookies Instagram из Firefox (сам профиль Selenium больше не копирует)...")
        firefox_cookies = load_instagram_cookies(profile)
        print(f"[+] Найдено подходящих cookies Instagram: {len(firefox_cookies)}")
        if not any(c.get("name") == "sessionid" for c in firefox_cookies):
            print("[!] Cookie sessionid не найден. Если сессия не подхватится — войди вручную в открытом Firefox.")
    except Exception as e:
        print(f"\n[ОШИБКА] {e}")
        input("\nEnter для выхода...")
        return

    target = OUT / folder_name
    maybe_import_old_progress(username, target)

    media_dir = target / "browser_media"
    try:
        target.mkdir(parents=True, exist_ok=True)
        media_dir.mkdir(parents=True, exist_ok=True)
    except OSError as e:
        print("\n[ОШИБКА ПАПКИ]")
        print(f"Не удалось создать папку: {target}")
        print(e)
        input("\nEnter для выхода...")
        return

    progress_file, done, by_url, recovered_empty = load_progress(target)
    print(f"[resume] Реально скачано раньше: {len(done)}")
    if recovered_empty:
        print(
            f"[FIX] Найдено пустых/битых записей старой версии: {recovered_empty}. "
            "Они НЕ считаются готовыми и будут скачаны повторно."
        )
        save_progress(progress_file, done, by_url)
        save_exports(target, by_url)

    driver = None
    try:
        print("[i] Запускаю отдельный ЧИСТЫЙ Firefox...")
        driver = make_driver()
        restored = restore_instagram_session(driver, firefox_cookies)
        if restored:
            print(f"[+] Перенесено cookies в Selenium Firefox: {restored}")
        driver.get(profile_url)
        time.sleep(1.8)
        dismiss_popups(driver)

        if not has_instagram_login(driver):
            print("\n[!] Instagram-сессия не обнаружена.")
            print("[!] В открывшемся Firefox войди в Instagram вручную.")
            print(f"[!] Потом открой: {profile_url}")
            input("\nКогда увидишь сетку постов — вернись сюда и нажми Enter...")
        else:
            print("[+] Instagram-сессия обнаружена.")

        print("\nУбедись, что в открывшемся Firefox видна сетка нужного профиля.")
        input("Enter для запуска DEEP SCAN...")

        try:
            current_username = extract_instagram_username(driver.current_url)
        except Exception:
            current_username = None

        if (current_username or "").lower() != username.lower():
            driver.get(profile_url)
            time.sleep(1.5)

        declared_count = infer_media_count(driver)
        if declared_count:
            print(f"[i] Instagram показывает примерно {declared_count} публикаций.")
        else:
            print("[i] Точное число публикаций автоматически не распознано.")

        # v10.9: процент выбирается ДО поиска и ограничивает сам DEEP SCAN.
        print("\n" + "=" * 78)
        print("СКОЛЬКО ИСКАТЬ И СКАЧАТЬ В ЭТОМ ЗАПУСКЕ?")
        if declared_count:
            estimated_left = max(0, declared_count - len(done))
            print(f"[i] Уже реально скачано: {len(done)}")
            print(f"[i] Ориентировочно осталось: {estimated_left}")
        else:
            estimated_left = None

        percent_options = {
            "1": (15, 0.15),
            "2": (35, 0.35),
            "3": (50, 0.50),
            "4": (100, 1.00),
        }

        if estimated_left is not None:
            for key, (pct_label, frac) in percent_options.items():
                approx = estimated_left if frac >= 1.0 else max(1, round(estimated_left * frac))
                print(f"  {key} - {pct_label}%: примерно {approx} новых публикаций")
        else:
            print("  1 - 15%")
            print("  2 - 35%")
            print("  3 - 50%")
            print("  4 - 100%")
            print("[!] Без распознанного общего count процент поиска будет применён после найденной выборки.")
        print("=" * 78)

        while True:
            choice = input("Выбери 1, 2, 3 или 4 [4]: ").strip() or "4"
            if choice in percent_options:
                break
            print("[!] Введи 1, 2, 3 или 4.")

        percent_label, percent = percent_options[choice]

        if estimated_left is not None:
            if estimated_left <= 0:
                print("\nНовых публикаций по заявленному count не осталось.")
                save_exports(target, by_url)
                input("\nEnter для выхода...")
                return

            if percent >= 1.0:
                target_new_scan = estimated_left
            else:
                target_new_scan = max(1, round(estimated_left * percent))

            print(
                f"[+] Режим {percent_label}%: DEEP SCAN остановится примерно после "
                f"{target_new_scan} НОВЫХ URL."
            )
        else:
            target_new_scan = None
            print(
                f"[+] Режим {percent_label}% выбран. "
                "Общий count не распознан, поэтому сканирование идёт до доступного лимита, "
                "а процент будет применён к найденным новым URL."
            )

        found = set()

        # Main profile grid. Останавливаемся, когда нашли нужное число НОВЫХ URL.
        found |= deep_scroll_collect(
            driver,
            profile_url,
            label="PROFILE",
            target_count=None,
            max_rounds=180,
            done_urls=done,
            target_new_count=target_new_scan,
        )

        new_found_count = len(found - done)

        # Reels сканируем только если выбранный лимит ещё не набран.
        if target_new_scan is None or new_found_count < target_new_scan:
            reels_url = profile_url.rstrip("/") + "/reels/"
            remaining_needed = (
                None if target_new_scan is None
                else max(0, target_new_scan - new_found_count)
            )
            if remaining_needed is None or remaining_needed > 0:
                reels_found = deep_scroll_collect(
                    driver,
                    reels_url,
                    label="REELS",
                    target_count=None,
                    max_rounds=140,
                    done_urls=(done | found),
                    target_new_count=remaining_needed,
                )
                found |= reels_found

        new_found_count = len(found - done)

        # Fallback только если выбранный процент ещё не набран.
        if target_new_scan is not None and new_found_count < target_new_scan:
            print(
                f"\n[i] Для режима {percent_label}% нужно примерно {target_new_scan} новых URL, "
                f"а найдено {new_found_count}. Запускаю дополнительный fallback."
            )
            found = click_grid_fallback(
                driver,
                profile_url,
                found,
                max_clicks=140,
                done_urls=done,
                target_new_count=target_new_scan,
            )

        print(f"\n[+] DEEP SCAN нашёл уникальных URL: {len(found)}")
        new_urls = [u for u in sorted(found) if u not in done]
        print(f"[+] Из них НОВЫХ относительно progress.json: {len(new_urls)}")

        # Save discovered URLs for inspection.
        (target / "deep_found_urls.txt").write_text(
            "\n".join(sorted(found)) + ("\n" if found else ""),
            encoding="utf-8",
        )

        if not new_urls:
            print("\nНовых публикаций не найдено. Текущий архив уже максимально полный для этой сессии.")
            save_exports(target, by_url)
            input("\nEnter для выхода...")
            return

        # Если общий count Instagram определить не удалось, применяем процент к найденной выборке.
        if target_new_scan is None and percent < 1.0:
            limit = max(1, round(len(new_urls) * percent))
            new_urls = new_urls[:limit]
            print(
                f"[+] Общий count не был распознан: беру {percent_label}% "
                f"от найденных новых URL = {len(new_urls)}."
            )
        else:
            # При известном count сам поиск уже был ограничен выбранным процентом.
            if target_new_scan is not None and len(new_urls) > target_new_scan:
                new_urls = new_urls[:target_new_scan]
            print(
                f"[+] Режим {percent_label}%: найдено для скачивания "
                f"{len(new_urls)} новых публикаций."
            )

        session = session_from_driver(driver)

        print("\n=== СКАЧИВАЮ МЕДИА — TURBO ===")
        failed_urls = []
        consecutive_failures = 0
        base_number = len(done)

        for i, url in enumerate(new_urls, 1):
            # v10.7 SELF-HEAL: если папку удалили/переместили во время работы,
            # пробуем восстановить структуру автоматически.
            target.mkdir(parents=True, exist_ok=True)
            media_dir.mkdir(parents=True, exist_ok=True)

            print(f"[MEDIA {i}/{len(new_urls)}] {url}")
            started = time.time()
            try:
                rec = scrape_post(
                    driver,
                    session,
                    url,
                    media_dir,
                    number=base_number + i,
                )

                # Критический FIX: done только ПОСЛЕ реального скачивания.
                if not rec.get("files"):
                    raise RuntimeError("публикация не содержит скачанных файлов")

                by_url[url] = rec
                done.add(url)
                consecutive_failures = 0
                print(
                    f"    [+] скачано файлов: {len(rec['files'])}; "
                    f"готово за {time.time() - started:.1f} сек."
                )

            except Exception as e:
                by_url.pop(url, None)
                done.discard(url)
                failed_urls.append(url)
                consecutive_failures += 1
                print(f"    [!] НЕ отмечаю как готовое: {e}")

            # Прогресс сохраняем после каждой публикации, чтобы ничего не потерять.
            save_progress(progress_file, done, by_url)

            # Тяжёлые CSV/JSON экспорты делаем пачками — это заметно быстрее на больших профилях.
            if i % 10 == 0:
                save_exports(target, by_url)

            # Небольшая пауза остаётся, чтобы не создавать лишнюю нагрузку.
            if i % 25 == 0:
                sync_session_from_driver(session, driver)
                time.sleep(1.5)
            else:
                time.sleep(0.25)

            # Если подряд ничего не скачивается, почти наверняка Instagram ограничил сессию.
            # Лучше остановиться и сохранить очередь, чем записать сотни пустых URL как done.
            if consecutive_failures >= 8:
                print("\n[СТОП ЗАЩИТЫ]")
                print("8 публикаций подряд не удалось скачать.")
                print("Instagram, вероятно, временно ограничил запросы или запросил проверку.")
                print("Прогресс сохранён. Пустые URL НЕ помечены готовыми.")
                print("После проверки/паузы просто запусти парсер снова — он продолжит их.")
                break

        # Финальный экспорт после завершения выбранной пачки.
        save_progress(progress_file, done, by_url)
        save_exports(target, by_url)

        if failed_urls:
            target.mkdir(parents=True, exist_ok=True)
            (target / "failed_urls.txt").write_text(
                "\n".join(failed_urls) + "\n",
                encoding="utf-8",
            )
        else:
            try:
                (target / "failed_urls.txt").unlink(missing_ok=True)
            except Exception:
                pass

        print("\n" + "=" * 78)
        print("DEEP SCAN ГОТОВ")
        print(f"Папка: {target}")
        print(f"Выбрано для скачивания в этом запуске: {len(new_urls)}")
        print(f"Всего URL в progress: {len(done)}")
        if declared_count:
            print(f"Заявлено Instagram: ~{declared_count}")
        print("=" * 78)

    except WebDriverException as e:
        print("\n[ОШИБКА FIREFOX/SELENIUM]")
        print(e)
    except Exception as e:
        print("\n[ОШИБКА]")
        print(e)
    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass

    input("\nEnter для выхода...")


if __name__ == "__main__":
    main()
