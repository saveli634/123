import { useEffect, useRef } from "react";
import { Starfield } from "@/lib/starfield";
import { CursorTrail } from "@/lib/trail";
import { finePointer, reducedMotion, startFpsMonitor } from "@/lib/motion";

/** Фон (звёзды и туманность) и слой звёздного следа за курсором. */
export function Backdrop() {
  const sky = useRef<HTMLCanvasElement>(null);
  const trail = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const stopFps = startFpsMonitor();
    const field = sky.current ? new Starfield(sky.current) : null;
    const tr = trail.current && finePointer() && !reducedMotion() ? new CursorTrail(trail.current) : null;
    return () => {
      stopFps();
      field?.destroy();
      tr?.destroy();
    };
  }, []);

  return (
    <>
      <div className="backdrop" aria-hidden="true">
        <canvas ref={sky} className="backdrop__sky" />
      </div>
      <canvas ref={trail} className="trail" aria-hidden="true" />
    </>
  );
}
