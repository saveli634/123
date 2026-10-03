import { CONFIG } from "@/config";

/** Бейдж демо-версии: пока не подтверждены согласия на фото. В release-сборке его нет (сборка не пройдёт). */
export function DemoBadge() {
  const g = !CONFIG.guestsConsentConfirmed;
  const s = !CONFIG.staffConsentConfirmed;
  if (!g && !s) return null;
  const who = g && s ? "фото гостий и мастера" : g ? "фото гостий" : "фото мастера";
  return (
    <p className="demo" role="note">
      ДЕМО · {who}: согласие не подтверждено
    </p>
  );
}
