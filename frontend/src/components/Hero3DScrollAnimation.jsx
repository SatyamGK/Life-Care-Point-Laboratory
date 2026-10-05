import { useEffect, useMemo, useRef } from "react";

/* -------------------------------------------------------------------------
   Frames: ../hero-3d/Test-tube_image_1.webp ... Test-tube_image_50.webp
   (sorted by the number in the file name)
------------------------------------------------------------------------- */
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

/*
  Share of the pinned scroll distance during which the LAST frame (50th) stays
  on screen while everything is still pinned. This guarantees the user always
  sees the final frame before the next section scrolls in.
*/
const HOLD_RATIO = 0.08;

/*
  HOW IT WORKS
  ------------
  <section.tt-hero>                 tall scroll track (height set in CSS)
    <div.tt-hero__stage>            position: sticky  -> everything inside is pinned
      <h1> + <p>                    "We Are Your Health Care Partner"
      <img>                         test tube image sequence
      <div.tt-hero__badge>          "TRUSTED AND RECOMMENDED BY DOCTORS"
  </section>
  <next section>                    appears only after the track ends

  While the track scrolls past, the stage stays pinned and the frame is chosen
  from the scroll progress. When the track ends the stage un-sticks naturally.
*/
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

    // Preload every frame so swapping `src` never flickers.
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

      // `top` of the sticky stage (computed px value of --tt-header).
      const stickyTop = parseFloat(window.getComputedStyle(stage).top) || 0;
      const sectionRect = section.getBoundingClientRect();

      // Distance the stage stays pinned while the track scrolls by.
      const pinnedDistance = section.offsetHeight - stage.offsetHeight;
      if (pinnedDistance <= 0) {
        return;
      }

      // 0 when the stage first sticks, 1 when the track ends.
      const scrolled = stickyTop - sectionRect.top;
      const rawProgress = clamp(scrolled / pinnedDistance, 0, 1);

      // Reach the final frame slightly before the track ends, then hold it.
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

    // Initial state
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

    // Sync once (e.g. page reloaded while scrolled down).
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
    <section
      ref={sectionRef}
      className="tt-hero"
      aria-label="Laboratory test tube animation"
    >
      <div ref={stageRef} className="tt-hero__stage">
        <div className="tt-hero__content">
          <h1 className="tt-hero__title">{title}</h1>
          {description ? <p className="tt-hero__text">{description}</p> : null}
        </div>

        <div className="tt-hero__media">
          <img
            ref={imageRef}
            src={frames[0]}
            alt="Laboratory test tube"
            className="tt-hero__image"
            draggable="false"
          />
        </div>

        <div className="tt-hero__badge">{badgeText}</div>
      </div>
    </section>
  );
}