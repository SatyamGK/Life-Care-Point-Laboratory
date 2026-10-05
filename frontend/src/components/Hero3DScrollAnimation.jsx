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

/*
  Small pause on the last frame (fraction of the pinned scroll distance)
  before the pinned area is released and the next section scrolls in.
*/
const HOLD_RATIO = 0.05;

/*
  Layout (everything inside the stage stays pinned together):

  <section class="test-tube-scroll-section">         tall scroll track
    <div class="test-tube-scroll-stage">             position: sticky
      <div class="test-tube-scroll-before">  {before}  </div>   e.g. "We Are Your Health Care Partner"
      <div class="test-tube-scroll-media">   <img />    </div>   test tube frames
      <div class="test-tube-scroll-after">   {after}   </div>   e.g. "TRUSTED AND RECOMMENDED BY DOCTORS"
    </div>
  </section>

  Usage:
    <Hero3DScrollAnimation
      before={<div className="hero-content"><h1>We Are Your Health Care Partner</h1><p>...</p></div>}
      after={<div className="doctor-badge">TRUSTED AND RECOMMENDED BY DOCTORS</div>}
    />
*/
export default function Hero3DScrollAnimation({ before = null, after = null }) {
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

    // Preload every frame so swapping src never flickers.
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
      section.classList.toggle(
        "is-reduced-motion",
        reducedMotionQuery.matches
      );
    };

    const updateFrame = () => {
      rafRef.current = 0;

      if (reducedMotionQuery.matches) {
        showFrame(0);
        return;
      }

      // `top` of the sticky stage, in px (header height).
      const stickyTop = parseFloat(window.getComputedStyle(stage).top) || 0;
      const sectionRect = section.getBoundingClientRect();
      const pinnedDistance = section.offsetHeight - stage.offsetHeight;

      if (pinnedDistance <= 0) {
        return;
      }

      // 0 when the stage starts sticking, 1 when it is about to be released.
      const rawProgress = clamp(
        (stickyTop - sectionRect.top) / pinnedDistance,
        0,
        1
      );

      // Last frame is reached slightly before release, then held.
      const frameProgress = clamp(rawProgress / (1 - HOLD_RATIO), 0, 1);

      showFrame(
        clamp(
          Math.round(frameProgress * (frames.length - 1)),
          0,
          frames.length - 1
        )
      );
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

    // Sync once on mount (handles reload at a scrolled position).
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
      className="test-tube-scroll-section"
      aria-label="Laboratory test tube animation"
      // Scroll length scales with the number of frames (see CSS).
      style={{ "--tt-frame-count": frames.length }}
    >
      <div ref={stageRef} className="test-tube-scroll-stage">
        {before ? (
          <div className="test-tube-scroll-before">{before}</div>
        ) : null}

        <div className="test-tube-scroll-media">
          <img
            ref={imageRef}
            src={frames[0]}
            alt="Laboratory test tube"
            className="test-tube-scroll-image"
            draggable="false"
          />
        </div>

        {after ? (
          <div className="test-tube-scroll-after">{after}</div>
        ) : null}
      </div>
    </section>
  );
}