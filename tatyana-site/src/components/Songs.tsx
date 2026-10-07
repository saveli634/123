import { useEffect, useRef, useState } from "react";
import { songs, hasSongs } from "@/data/songs";
import { motionOk } from "@/lib/motion";
import { SphereEyebrow, SphereIcon } from "./Spheres";

const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
};

type AnyWindow = Window & { webkitAudioContext?: typeof AudioContext };

/**
 * «Песни»: каждая песня — планета на орбите. Нажатие запускает трек (автозапуска нет),
 * вокруг планеты пульсирует кольцо в такт звуку (Web Audio AnalyserNode), текст песни
 * проявляется построчно по ходу трека. Одновременно играет один трек; есть пауза, перемотка,
 * громкость и обычный <audio controls> как запасной вариант. Раздел скрыт, пока песен нет.
 */
export function Songs() {
  if (!hasSongs) return null;
  return <SongsInner />;
}

function SongsInner() {
  const [cur, setCur] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [vol, setVol] = useState(1);
  const [broken, setBroken] = useState<number[]>([]);
  const audio = useRef<HTMLAudioElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const plain = useRef<HTMLDetailsElement>(null);
  const ctx = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);

  // со скриптами обычные плееры свёрнуты (без скриптов — раскрыты и работают сами)
  useEffect(() => {
    if (plain.current) plain.current.open = false;
  }, []);

  // одновременно играет только один трек на странице
  useEffect(() => {
    const onPlay = (e: Event) => {
      document.querySelectorAll("audio, video").forEach((m) => {
        if (m !== e.target) (m as HTMLMediaElement).pause();
      });
    };
    document.addEventListener("play", onPlay, true);
    return () => document.removeEventListener("play", onPlay, true);
  }, []);

  // кольцо в такт звуку
  useEffect(() => {
    const st = stage.current;
    if (!playing || !st || !analyser.current || !motionOk()) return;
    const an = analyser.current;
    const data = new Uint8Array(an.frequencyBinCount);
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      an.getByteFrequencyData(data);
      let s = 0;
      for (let k = 2; k < 42; k++) s += data[k];
      st.style.setProperty("--amp", (s / (40 * 255)).toFixed(3));
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      st.style.setProperty("--amp", "0");
    };
  }, [playing]);

  /** Web Audio подключаем только по нажатию; с диска (file://) — без него, кольцо пульсирует само */
  const ensureAnalyser = () => {
    const a = audio.current;
    if (!a || !motionOk() || location.protocol === "file:") return;
    if (!ctx.current) {
      const AC = window.AudioContext || (window as AnyWindow).webkitAudioContext;
      if (!AC) return;
      try {
        const c = new AC();
        const src = c.createMediaElementSource(a);
        const an = c.createAnalyser();
        an.fftSize = 128;
        an.smoothingTimeConstant = 0.78;
        src.connect(an);
        an.connect(c.destination);
        ctx.current = c;
        analyser.current = an;
      } catch {
        return;
      }
    }
    void ctx.current.resume();
  };

  const play = (i: number) => {
    const a = audio.current;
    if (!a) return;
    if (i === cur && !a.paused) {
      a.pause();
      return;
    }
    if (i !== cur) {
      a.src = songs[i].url;
      setCur(i);
      setTime(0);
      setDur(songs[i].duration);
    }
    ensureAnalyser();
    a.play().catch(() => setPlaying(false));
  };

  const toggle = () => play(cur < 0 ? 0 : cur);

  const song = songs[cur < 0 ? 0 : cur];
  const lines = song.lyrics ? song.lyrics.flatMap((st, si) => st.map((l, li) => ({ l, first: li === 0 && si > 0 }))) : [];
  const sung = cur >= 0 && dur > 0 && (playing || time > 0) ? Math.floor((time / dur) * lines.length) : -1;
  const n = songs.length;
  const list = n > 7;
  if (broken.length >= n) return null;

  return (
    <section id="pesni" className="songs section" aria-labelledby="songs-title">
      <div className="wrap">
        <header className="songs__head rv">
          <SphereEyebrow id="pesnya" />
          <h2 id="songs-title" className="h2">
            <em>Песни</em>
          </h2>
          <p className="songs__lead">Песни, которые я сочиняю, — здесь их можно послушать.</p>
        </header>

        <div className="songs__grid songs__ui">
          <div className="songs__stagebox">
          <div
            ref={stage}
            className={`songs__stage${list ? " is-list" : ""}${playing ? " is-playing" : ""}${analyser.current ? " has-analyser" : ""}`}
          >
            {!list && (
              <svg className="songs__orbit" viewBox="-100 -100 200 200" preserveAspectRatio="none" aria-hidden="true">
                <ellipse rx="84" ry="76" />
                <ellipse rx="96" ry="88" className="songs__orbit-2" />
              </svg>
            )}
            <div className="songs__sun">
              <button type="button" className="songs__play" onClick={toggle} aria-label={playing ? "Пауза" : `Слушать: ${song.title}`}>
                {playing ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5.5v13M16 5.5v13" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5.2v13.6L19 12z" />
                  </svg>
                )}
              </button>
              <span className="songs__btn-label">{playing ? "Пауза" : "Слушать"}</span>
            </div>
            {songs.map((s, i) => {
              if (broken.includes(i)) return null;
              const a = ((-90 + (i * 360) / n) * Math.PI) / 180;
              const style = list
                ? undefined
                : { left: `${(50 + 42 * Math.cos(a)).toFixed(2)}%`, top: `${(50 + 38 * Math.sin(a)).toFixed(2)}%` };
              const on = cur === i;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`splanet${on ? " is-current" : ""}${on && playing ? " is-on" : ""}`}
                  style={style}
                  onClick={() => play(i)}
                  aria-pressed={on && playing}
                  aria-label={on && playing ? `Пауза: ${s.title}` : `Слушать: ${s.title}`}
                >
                  <span className="splanet__ring" aria-hidden="true" />
                  <span className="splanet__body" aria-hidden="true">
                    <SphereIcon id="pesnya" size={22} />
                  </span>
                  <span className="splanet__title">{s.title}</span>
                </button>
              );
            })}
          </div>
          </div>

          <div className="songs__panel">
            <p className="songs__now">
              <span className="songs__now-label">{cur < 0 ? "Первая песня" : playing ? "Сейчас звучит" : "На паузе"}</span>
              <span className="songs__now-title">{song.title}</span>
            </p>
            <div className="songs__controls">
              <span className="songs__time" aria-hidden="true">
                {fmt(time)}
              </span>
              <input
                type="range"
                className="range songs__seek"
                min={0}
                max={dur || song.duration || 1}
                step={0.1}
                value={Math.min(time, dur || song.duration || 1)}
                aria-label="Перемотка"
                aria-valuetext={`${fmt(time)} из ${fmt(dur)}`}
                disabled={cur < 0}
                onChange={(e) => {
                  const a = audio.current;
                  if (a) a.currentTime = Number(e.target.value);
                  setTime(Number(e.target.value));
                }}
                style={{ ["--fill" as string]: `${((time / (dur || 1)) * 100).toFixed(2)}%` }}
              />
              <span className="songs__time" aria-hidden="true">
                {fmt(dur || song.duration)}
              </span>
            </div>
            <label className="songs__vol">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4.5 9.5h3.5l4.5-4v13l-4.5-4H4.5zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
              </svg>
              <span className="sr-only">Громкость</span>
              <input
                type="range"
                className="range"
                min={0}
                max={1}
                step={0.05}
                value={vol}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVol(v);
                  if (audio.current) audio.current.volume = v;
                }}
                style={{ ["--fill" as string]: `${vol * 100}%` }}
              />
            </label>
            {lines.length > 0 && (
              <div className="lyrics" key={song.id}>
                {lines.map((x, i) => (
                  <span key={i} className={`lyrics__l${x.first ? " lyrics__l--gap" : ""}${i <= sung ? " is-sung" : ""}${i === sung ? " is-now" : ""}`}>
                    {x.l}{" "}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <details ref={plain} className="songs__plain" open>
          <summary>Обычный плеер</summary>
          <ul>
            {songs.map((s) => (
              <li key={s.id}>
                <span>{s.title}</span>
                <audio controls preload="none" src={s.url} />
              </li>
            ))}
          </ul>
        </details>
      </div>
      <audio
        ref={audio}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setTime(0);
        }}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => isFinite(e.currentTarget.duration) && setDur(e.currentTarget.duration)}
        onError={() => {
          if (cur >= 0) setBroken((b) => [...b, cur]);
          setPlaying(false);
          setCur(-1);
        }}
      />
    </section>
  );
}
