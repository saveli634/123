/**
 * Какие фото гостий используются в блоке «Образ» (только при showGuestPhotos=true).
 * guest_a_02 и guest_a_03 — с мастером: только при showStaffFaces=true (нужно и его согласие).
 * Список общий для вёрстки и сборки: в файл попадают только эти кадры.
 */
export const GUEST_BASE = ["guest_b_03", "guest_a_01", "guest_c_01", "guest_b_01", "guest_a_04", "guest_c_02", "guest_b_04"];
export const GUEST_WITH_STAFF = ["guest_a_03", "guest_a_02"];

export function guestImages(showStaffFaces: boolean) {
  if (!showStaffFaces) return GUEST_BASE;
  // вместо guest_a_04 и guest_b_04 — кадры процесса с мастером
  return GUEST_BASE.map((g) => (g === "guest_a_04" ? "guest_a_03" : g === "guest_b_04" ? "guest_a_02" : g));
}
