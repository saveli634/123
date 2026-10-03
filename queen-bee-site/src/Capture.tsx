import { createRoot } from "react-dom/client";
import { useEffect, useRef } from "react";
import { imageUrl } from "@/components/shared/Img";
import { CARD_IMAGES, createSpiralScene } from "@/three/scene";

/**
 * Служебная страница для рендеров спирали (только dev): ?capture=1&p=0.48[&og=1][&mobile=1]
 * Рендеры нужны для телефонов без WebGL 2, reduced motion, предпросмотра без JS и для Open Graph.
 */
function CaptureView() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const q = new URLSearchParams(location.search);
  const p = Number(q.get("p") ?? "0.5");
  const og = q.get("og") === "1";

  useEffect(() => {
    const c = canvas.current!;
    const s = createSpiralScene(c, () => {}, { mobile: q.get("mobile") === "1", capture: true, beeCloseup: q.get("bee") === "1", overview: q.get("view") === "overview", urls: CARD_IMAGES.map((n) => imageUrl(n)) });
    if (!s) return;
    const r = c.getBoundingClientRect();
    s.resize(r.width, r.height);
    s.setProgress(p, true);
    void s.ready.then(async () => {
      await document.fonts.ready;
      for (let i = 0; i < 4; i++) {
        s.renderOnce();
        await new Promise((res) => requestAnimationFrame(res));
      }
      (window as unknown as { __qbCaptureReady?: boolean }).__qbCaptureReady = true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="tone-milk" style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#F4EFE6" }}>
      <div className="honeycomb" style={{ opacity: 0.04 }} />
      <span className="flare" style={{ width: "60vmax", height: "60vmax", left: og ? "40%" : "20%", top: "-10%", opacity: 0.55 }} />
      <canvas
        ref={canvas}
        style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: og ? "58%" : "100%", height: "100%", display: "block" }}
      />
      {og && (
        <div style={{ position: "absolute", left: 72, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p className="display" style={{ fontSize: 150, lineHeight: 0.82, letterSpacing: "-0.035em", margin: 0 }}>
            Queen
            <br />
            <span className="it text-bordo" style={{ paddingLeft: "0.9em" }}>
              Bee
            </span>
          </p>
          <p className="label" style={{ marginTop: 30, display: "flex", alignItems: "center", gap: 16, fontSize: 15 }}>
            <span style={{ width: 56, height: 1, background: "#B9944F" }} />
            Boheme Residence
          </p>
        </div>
      )}
      <div className="res-frame" style={{ inset: 14 }} />
    </div>
  );
}

export function mountCapture(root: HTMLElement) {
  document.querySelector(".preloader")?.remove();
  createRoot(root).render(<CaptureView />);
}
