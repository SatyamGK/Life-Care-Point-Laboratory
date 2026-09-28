import { useEffect, useRef, useState } from "react";

const TOTAL_FRAMES = 50;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const frameModules = import.meta.glob(
  "../hero-3d/Test-tube_image_*.jpg",
  { eager: true, query: "?url", import: "default" }
);

const frameUrls = Array.from({ length: TOTAL_FRAMES }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");
  return frameModules[`../hero-3d/Test-tube_image_${number}.jpg`];
});

export default function Hero3DScrollAnimation() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const progressRef = useRef(null);
  const imagesRef = useRef([]);
  const frameRef = useRef(0);
  const rafRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return undefined;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return undefined;

    let disposed = false;
    reducedMotionRef.current = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    const resizeCanvas = () => {
      const cssWidth = canvas.clientWidth || 1;
      const cssHeight = canvas.clientHeight || 1;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssWidth * ratio);
      canvas.height = Math.round(cssHeight * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw(frameRef.current);
    };

    const draw = (index) => {
      const image = imagesRef.current[index];
      if (!image?.complete || !image.naturalWidth) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;

      const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
      const drawWidth = image.naturalWidth * scale;
      const drawHeight = image.naturalHeight * scale;
      ctx.setTransform(
        Math.min(window.devicePixelRatio || 1, 2), 0, 0,
        Math.min(window.devicePixelRatio || 1, 2), 0, 0
      );
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    };

    const update = () => {
      rafRef.current = 0;
      const rect = section.getBoundingClientRect();
      const scrollableDistance = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = reducedMotionRef.current ? 0 : clamp(-rect.top / scrollableDistance, 0, 1);
      const nextFrame = Math.min(TOTAL_FRAMES - 1, Math.floor(progress * (TOTAL_FRAMES - 1) + 0.5));

      if (nextFrame !== frameRef.current) {
        frameRef.current = nextFrame;
        draw(nextFrame);
      } else {
        draw(frameRef.current);
      }

      if (progressRef.current) progressRef.current.textContent = `${Math.round(progress * 100)}%`;
    };

    const requestUpdate = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(update);
    };

    const loadAllFrames = async () => {
      const images = await Promise.all(frameUrls.map((src, index) => new Promise((resolve) => {
        if (!src) { resolve(null); return; }
        const image = new Image();
        image.decoding = "async";
        image.onload = () => resolve({ index, image });
        image.onerror = () => resolve(null);
        image.src = src;
      })));

      if (disposed) return;
      images.forEach((entry) => {
        if (entry) imagesRef.current[entry.index] = entry.image;
      });
      setLoaded(images.filter(Boolean).length);
      draw(frameRef.current);
      requestUpdate();
    };

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
    window.addEventListener("resize", resizeCanvas);

    resizeCanvas();
    requestUpdate();
    loadAllFrames();

    return () => {
      disposed = true;
      observer.disconnect();
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      window.removeEventListener("resize", resizeCanvas);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      imagesRef.current = [];
    };
  }, []);

  return (
    <section ref={sectionRef} className="hero-3d-scroll" aria-label="Scroll-controlled laboratory animation">
      <div className="hero-3d-sticky">
        <div className="hero-3d-glow" aria-hidden="true" />
        <canvas ref={canvasRef} className="hero-3d-canvas" aria-hidden="true" />
        <div className="hero-3d-caption"><span>SCROLL TO EXPLORE</span><span ref={progressRef}>0%</span></div>
        {loaded < TOTAL_FRAMES && <div className="hero-3d-loading" role="status" aria-live="polite">Loading {loaded}/{TOTAL_FRAMES}…</div>}
      </div>
    </section>
  );
}
