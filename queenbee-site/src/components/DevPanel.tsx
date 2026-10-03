import { useEffect, useState } from "react";
import { CONFIG } from "@/config";
import { stageSceneState } from "@/lib/stageController";

/** Панель для владельца/разработчика: ?dev=1. Только здесь видно, каких данных не хватает. */
export function releaseBlockers(): string[] {
  const b: string[] = [];
  if (!CONFIG.city.trim()) b.push("city — город");
  if (!CONFIG.phone.trim() && !CONFIG.whatsapp.trim()) b.push("phone или whatsapp");
  if (!CONFIG.instagram.trim()) b.push("instagram");
  if (!CONFIG.guestsConsentConfirmed) b.push("guestsConsentConfirmed — согласие гостей на фото");
  if (!CONFIG.staffConsentConfirmed) b.push("staffConsentConfirmed — согласие мастера (guest_a_02, guest_a_03)");
  return b;
}

export function DevPanel() {
  const [on, setOn] = useState(false);
  const [open, setOpen] = useState(false);
  const [scene, setScene] = useState("—");
  useEffect(() => {
    setOn(new URLSearchParams(location.search).get("dev") === "1");
  }, []);
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      const r = document.documentElement.classList;
      setScene(`${stageSceneState()}${r.contains("mirror-lowpower") ? " · упрощённый режим" : ""}${r.contains("no-webgl") ? " · рендеры" : ""}${r.contains("mirror-static") ? " · статично" : ""}`);
    }, 500);
    return () => clearInterval(id);
  }, [open]);
  if (!on) return null;
  const fields: [string, boolean, string][] = [
    ["city", !!CONFIG.city.trim(), "город — в заголовке, описании и JSON-LD"],
    ["address", !!CONFIG.address.trim(), "блок «Адрес» скрыт"],
    ["workHours", !!CONFIG.workHours.trim(), "блок «Часы» скрыт"],
    ["phone", !!CONFIG.phone.trim(), "«Позвонить» ведёт к #contacts"],
    ["whatsapp", !!CONFIG.whatsapp.trim(), "«Написать в WhatsApp» ведёт к форме; форма открывает WhatsApp без адресата"],
    ["instagram", !!CONFIG.instagram.trim(), "«Смотреть работы» ведёт к «Стене работ», блок Instagram скрыт"],
    ["mapLink", !!CONFIG.mapLink.trim(), "«Построить маршрут» скрыта"],
    ["services[]", CONFIG.services.length > 0, "показаны 3 подтверждённых направления, цен нет"],
    ["guestsConsentConfirmed", CONFIG.guestsConsentConfirmed, "бейдж ДЕМО; release не соберётся"],
    ["staffConsentConfirmed", CONFIG.staffConsentConfirmed, "в зеркале guest_a_01/04 вместо кадров с мастером; release не соберётся"],
    ["showAiReel", CONFIG.showAiReel, "кадры works_check выключены (ждут подтверждения)"],
    ["showTeam", CONFIG.showTeam && CONFIG.team.length > 0, "блок «Команда» скрыт"],
  ];
  return (
    <div className="dev" data-lenis-prevent>
      <button type="button" className="dev__btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        DEV
      </button>
      {open && (
        <div className="dev__panel" role="region" aria-label="Недостающие данные">
          <p className="dev__h">CONFIG — src/config.ts</p>
          <ul>
            {fields.map(([k, ok, note]) => (
              <li key={k} className={ok ? "ok" : "miss"}>
                <b>{ok ? "✓" : "—"} {k}</b>
                {!ok && <span>{note}</span>}
              </li>
            ))}
          </ul>
          <p className="dev__h">build:release блокируют</p>
          <ul>
            {releaseBlockers().map((b) => (
              <li key={b} className="miss">
                {b}
              </li>
            ))}
            {releaseBlockers().length === 0 && <li className="ok">ничего — можно собирать</li>}
          </ul>
          <p className="dev__h">3D-сцена: {scene}</p>
        </div>
      )}
    </div>
  );
}
