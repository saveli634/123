import { CONFIG } from "@/config";
import { Photo } from "./Photo";
import { IMAGES, type ImgName } from "@/content/media";

/** «Команда» — только при showTeam и заполненном списке. Иначе блока нет совсем. */
export function Team() {
  const team = CONFIG.team.filter((m) => m.name.trim());
  if (!CONFIG.showTeam || team.length === 0) return null;
  return (
    <section id="team" className="team" aria-labelledby="team-title">
      <div className="wrap">
        <p className="eyebrow">Команда</p>
        <h2 id="team-title" className="h2">
          Мастера Queen Bee
        </h2>
        <ul className="team__list">
          {team.map((m) => (
            <li key={m.name} className="team__item">
              {m.photo && m.photo in IMAGES && <Photo name={m.photo as ImgName} alt={m.name} className="team__photo" />}
              <p className="team__name">{m.name}</p>
              <p className="team__role">{m.role}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
