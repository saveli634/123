import { CONFIG } from "@/config";
import { HexBee } from "./Logo";
import { hasInstagram, extProps } from "@/lib/links";

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap foot__grid">
        <a href="#top" className="foot__mark" aria-label="Queen Bee — в начало">
          <HexBee className="foot__hex" />
          <span>
            Queen <em>Bee</em>
          </span>
        </a>
        <p className="foot__line">Queen Bee · салон красоты · Boheme Residence</p>
        <nav className="foot__nav" aria-label="Разделы">
          <a href="#works">Работы</a>
          <a href="#services">Услуги</a>
          <a href="#space">Пространство</a>
          <a href="#booking">Записаться</a>
          <a href="#top">Наверх</a>
        </nav>
        {hasInstagram && (
          <a href={CONFIG.instagram} className="ulink foot__ig" {...extProps(CONFIG.instagram)}>
            Instagram
          </a>
        )}
      </div>
    </footer>
  );
}
