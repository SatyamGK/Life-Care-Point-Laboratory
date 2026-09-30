import { useEffect, useRef, useState } from "react";

const TOTAL_FRAMES = 50;
const HEADER_OFFSET = 54;
const frameUrl = (n) => `/hero-3d/Test-tube_image_${String(n).padStart(2, "0")}.jpg`;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export default function Hero3DScrollAnimation() {
  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const hintRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!track || !stage || !canvas || !ctx) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const frames = new Array(TOTAL_FRAMES).fill(null);
    let disposed = false;
    let raf = 0;
    let current = -1;
    let lastDrawn = -1;
    let loadErrors = 0;

    const nearestLoaded = (index) => {
      for (let d = 0; d < TOTAL_FRAMES; d += 1) {
        if (frames[index - d]) return frames[index - d];
        if (frames[index + d]) return frames[index + d];
      }
      return null;
    };

    const draw = (index) => {
      const image = nearestLoaded(index);
      if (!image) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      ctx.clearRect(0, 0, w, h);
      const scale = Math.min(w / image.naturalWidth, h / image.naturalHeight);
      const dw = image.naturalWidth * scale;
      const dh = image.naturalHeight * scale;
      ctx.drawImage(image, (w - dw) / 2, (h - dh) / 2, dw, dh);
      lastDrawn = index;
    };

    const indexFromScroll = () => {
      if (reduceMotion.matches) return Math.round((TOTAL_FRAMES - 1) / 2);
      const rect = track.getBoundingClientRect();
      const travel = Math.max(1, track.offsetHeight - stage.offsetHeight);
      const fraction = clamp((HEADER_OFFSET - rect.top) / travel, 0, 1);
      if (hintRef.current) hintRef.current.style.opacity = fraction > 0.02 ? "0" : "1";
      return Math.round(fraction * (TOTAL_FRAMES - 1));
    };

    const update = () => {
      raf = 0;
      current = indexFromScroll();
      if (current !== lastDrawn) draw(current);
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * ratio);
      canvas.height = Math.round(canvas.clientHeight * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      lastDrawn = -1;
      schedule();
    };

    const load = (i) =>
      new Promise((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          if (!disposed) {
            frames[i] = img;
            if (i === 0) setReady(true);
            if (i === current || lastDrawn === -1) schedule();
          }
          resolve();
        };
        img.onerror = () => {
          loadErrors += 1;
          if (!disposed && loadErrors === 1) {
            console.error(
              `[Hero3DScrollAnimation] Could not load ${frameUrl(i + 1)}. ` +
                `Check that the file exists in /public/hero-3d/.`
            );
            setFailed(true);
          }
          resolve();
        };
        img.src = frameUrl(i + 1);
      });

    (async () => {
      await load(0);
      const queue = Array.from({ length: TOTAL_FRAMES - 1 }, (_, k) => k + 1);
      const worker = async () => {
        while (queue.length && !disposed) await load(queue.shift());
      };
      await Promise.all([worker(), worker(), worker()]);
    })();

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    reduceMotion.addEventListener?.("change", schedule);
    resize();

    return () => {
      disposed = true;
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduceMotion.removeEventListener?.("change", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={trackRef} className="hero-scroll-track">
      <div ref={stageRef} className="hero-media">
        <canvas ref={canvasRef} className={`hero-3d-canvas${ready ? " is-ready" : ""}`} role="img" aria-label="Laboratory test tube rotating as you scroll" />
        {failed && !ready && (
          <div className="hero-3d-error" role="status">
            Animation frames not found in /public/hero-3d/
          </div>
        )}
      </div>
    </div>
  );
}