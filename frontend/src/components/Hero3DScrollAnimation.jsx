import { useEffect, useRef, useState } from "react";
import "../styles.css";

const TOTAL_FRAMES = 50;
const PRELOAD_RADIUS = 3;
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
  const frameRef = useRef(0);
  const rafRef = useRef(0);
  const imagesRef = useRef(new Map());
  const loadingRef = useRef(new Set());
  const [loaded, setLoaded] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: true });

    if (!section || !canvas || !ctx) return undefined;

    let disposed = false;

    const draw = (index = frameRef.current) => {
      const image = imagesRef.current.get(index);
      if (!image) return;

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;

      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const scale = Math.min(
        width / image.naturalWidth,
        height / image.naturalHeight
      );

      const imageWidth = image.naturalWidth * scale;
      const imageHeight = image.naturalHeight * scale;

      ctx.drawImage(
        image,
        (width - imageWidth) / 2,
        (height - imageHeight) / 2,
        imageWidth,
        imageHeight
      );
    };

    const loadFrame = (index) => {
      if (
        disposed ||
        index < 0 ||
        index >= TOTAL_FRAMES ||
        imagesRef.current.has(index) ||
        loadingRef.current.has(index) ||
        !frameUrls[index]
      ) {
        return;
      }

      loadingRef.current.add(index);
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        loadingRef.current.delete(index);
        if (disposed) return;

        imagesRef.current.set(index, image);
        setLoaded(imagesRef.current.size);

        if (index === frameRef.current) draw(index);
      };
      image.onerror = () => {
        loadingRef.current.delete(index);
      };
      image.src = frameUrls[index];
    };

    const trimCache = (center) => {
      for (const index of imagesRef.current.keys()) {
        if (Math.abs(index - center) > PRELOAD_RADIUS + 2) {
          imagesRef.current.delete(index);
        }
      }
      setLoaded(imagesRef.current.size);
    };

    const preloadAround = (center) => {
      for (
        let index = Math.max(0, center - PRELOAD_RADIUS);
        index <= Math.min(TOTAL_FRAMES - 1, center + PRELOAD_RADIUS);
        index += 1
      ) {
        loadFrame(index);
      }
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      draw();
    };

    const updateFromScroll = () => {
      rafRef.current = 0;

      const bounds = section.getBoundingClientRect();
      const travel = Math.max(
        1,
        section.offsetHeight - window.innerHeight
      );
      const fraction = clamp(-bounds.top / travel, 0, 1);
      const index = Math.round(fraction * (TOTAL_FRAMES - 1));

      if (index !== frameRef.current) {
        frameRef.current = index;
        trimCache(index);
        preloadAround(index);
        draw(index);
      }

      if (progressRef.current) {
        progressRef.current.textContent = `${Math.round(fraction * 100)}%`;
      }
    };

    const onScroll = () => {
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(updateFromScroll);
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    // Only the initial neighborhood is loaded. The rest is loaded as the
    // user scrolls, avoiding decoding all 50 large source images at once.
    preloadAround(0);
    resize();
    updateFromScroll();

    return () => {
      disposed = true;
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      imagesRef.current.clear();
      loadingRef.current.clear();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="hero-3d-scroll"
      aria-label="Scroll-controlled laboratory animation"
    >
      <div className="hero-3d-sticky">
        <div className="hero-3d-glow" aria-hidden="true" />
        <canvas
          ref={canvasRef}
          className="hero-3d-canvas"
          aria-hidden="true"
        />
        <div className="hero-3d-caption">
          <span>SCROLL TO EXPLORE</span>
          <span ref={progressRef}>0%</span>
        </div>
        {loaded === 0 && (
          <div className="hero-3d-loading" role="status" aria-live="polite">
            Loading animation…
          </div>
        )}
      </div>
    </section>
  );
}
