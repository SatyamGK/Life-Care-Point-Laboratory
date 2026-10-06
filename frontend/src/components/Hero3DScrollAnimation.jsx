import { useEffect, useMemo, useRef } from "react";

const frameModules = import.meta.glob("../hero-3d/Test-tube_image_*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});

function getFrameNumber(path) {
  const match = path.match(/Test-tube_image_(\d+)\.webp$/i);
  return match ? Number(match[1]) : 0;
}

const FRAME_URLS = Object.entries(frameModules)
  .sort(([pathA], [pathB]) => getFrameNumber(pathA) - getFrameNumber(pathB))
  .map(([, url]) => url)
  .filter(Boolean);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

const HOLD_RATIO = 0.08;

export default function Hero3DScrollAnimation({
  title = "We Are Your Health Care Partner",
  description = "Every Blood Test has a story to tell and with over 25+ years of experience, we know how to deliver it with high precision.",
  badgeText = "TRUSTED AND RECOMMENDED BY DOCTORS",
}) {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const imageRef = useRef(null);
  const currentFrameRef = useRef(0);
  const rafRef = useRef(0);
  const preloadedImagesRef = useRef([]);
  const frames = useMemo(() => FRAME_URLS, []);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const image = imageRef.current;

    if (!section || !stage || !image || !frames.length) {
      return undefined;
    }

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    preloadedImagesRef.current = frames.map((src) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      return img;
    });

    const showFrame = (index) => {
      if (index === currentFrameRef.current) {
        return;
      }
      image.src = frames[index];
      image.dataset.frame = String(index + 1);
      currentFrameRef.current = index;
    };

    const applyReducedMotionClass = () => {
      section.classList.toggle("is-reduced-motion", reducedMotionQuery.matches);
    };

    const updateFrame = () => {
      rafRef.current = 0;

      if (reducedMotionQuery.matches) {
        showFrame(0);
        return;
      }

      const stickyTop = parseFloat(window.getComputedStyle(stage).top) || 0;
      const sectionRect = section.getBoundingClientRect();
      const pinnedDistance = section.offsetHeight - stage.offsetHeight;
      if (pinnedDistance <= 0) {
        return;
      }

      const scrolled = stickyTop - sectionRect.top;
      const rawProgress = clamp(scrolled / pinnedDistance, 0, 1);
      const frameProgress = clamp(rawProgress / (1 - HOLD_RATIO), 0, 1);
      const frameIndex = clamp(
        Math.round(frameProgress * (frames.length - 1)),
        0,
        frames.length - 1
      );

      showFrame(frameIndex);
    };

    const requestUpdate = () => {
      if (rafRef.current) {
        return;
      }
      rafRef.current = window.requestAnimationFrame(updateFrame);
    };

    const handleReducedMotionChange = () => {
      applyReducedMotionClass();
      requestUpdate();
    };

    image.src = frames[0];
    image.dataset.frame = "1";
    currentFrameRef.current = 0;
    applyReducedMotionClass();

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
    window.addEventListener("orientationchange", requestUpdate);

    if (reducedMotionQuery.addEventListener) {
      reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
    } else if (reducedMotionQuery.addListener) {
      reducedMotionQuery.addListener(handleReducedMotionChange);
    }

    requestUpdate();

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      window.removeEventListener("orientationchange", requestUpdate);

      if (reducedMotionQuery.removeEventListener) {
        reducedMotionQuery.removeEventListener(
          "change",
          handleReducedMotionChange
        );
      } else if (reducedMotionQuery.removeListener) {
        reducedMotionQuery.removeListener(handleReducedMotionChange);
      }

      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = 0;
      preloadedImagesRef.current = [];
    };
  }, [frames]);

  if (!frames.length) {
    return null;
  }

  return (
    <section ref={sectionRef} className="tt-hero" aria-label="Laboratory test tube animation">
      <div ref={stageRef} className="tt-hero__stage">
        <div className="tt-hero__content">
          <h1 className="tt-hero__title">{title}</h1>
          {description ? <p className="tt-hero__text">{description}</p> : null}
        </div>

        <div className="tt-hero__media">
          <img ref={imageRef} src={frames[0]} alt="Laboratory test tube" className="tt-hero__image" draggable="false" />
        </div>

        <div className="tt-hero__badge">{badgeText}</div>
      </div>
    </section>
  );
}