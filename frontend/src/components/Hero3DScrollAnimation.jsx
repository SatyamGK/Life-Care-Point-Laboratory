import { useEffect, useMemo, useRef } from "react";

const frameModules = import.meta.glob(
  "../hero-3d/Test-tube_image_*.webp",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
);

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

export default function Hero3DScrollAnimation() {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);
  const currentFrameRef = useRef(0);
  const animationStartedRef = useRef(false);
  const animationStartScrollRef = useRef(null);
  const lastScrollYRef = useRef(0);
  const rafRef = useRef(0);
  const isVisibleRef = useRef(false);
  const preloadedImagesRef = useRef([]);
  const frames = useMemo( () => FRAME_URLS, [] );
  const DESKTOP_SCROLL_DISTANCE = 0.75;
  const MOBILE_SCROLL_DISTANCE = 0.5;

  useEffect(() => {
    const section = sectionRef.current;
    const image = imageRef.current;

    if ( !section || !image || !frames.length) {
      return undefined;
    }

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    preloadedImagesRef.current = frames.map((src) => {
        const img = new Image();
        img.decoding = "async";
        img.src = src;
        return img;
      });

    lastScrollYRef.current = window.scrollY;
    image.src = frames[0];
    image.dataset.frame = "1";
    currentFrameRef.current = 0;

    const resetAnimation = () => {
        animationStartedRef.current = false;
        animationStartScrollRef.current = null;
        image.src = frames[0];
        image.dataset.frame = "1";
        currentFrameRef.current = 0;
      };

    const updateFrame = () => {
        rafRef.current = 0;

        // if (!isVisibleRef.current) {
        //   return;
        // }

        if (reducedMotionQuery.matches) {
          resetAnimation();
          return;
        }

        const currentScrollY = window.scrollY;

        if (!animationStartedRef.current) {
          if (currentScrollY !== lastScrollYRef.current) {
            animationStartedRef.current = true;
            animationStartScrollRef.current = lastScrollYRef.current;
          }
        }

        if (!animationStartedRef.current) {
          lastScrollYRef.current = currentScrollY;
          return;
        }

        const isMobile = window.matchMedia("(max-width: 767px)").matches;
        const scrollDistance = window.innerHeight * (isMobile ? MOBILE_SCROLL_DISTANCE : DESKTOP_SCROLL_DISTANCE);
        const startScroll = animationStartScrollRef.current;
        const travelled = currentScrollY - startScroll;

        let progress = travelled / scrollDistance;
        progress = clamp(progress, 0, 1);

        const frameIndex = Math.round(progress * (frames.length - 1));
        const safeFrameIndex = clamp(frameIndex, 0, frames.length - 1);

        if (safeFrameIndex !== currentFrameRef.current) {

          const preloadedImage = preloadedImagesRef.current[safeFrameIndex];

          if (preloadedImage && preloadedImage.complete && preloadedImage.naturalWidth > 0) {
            image.src = preloadedImage.src;
          } else {
            image.src = frames[safeFrameIndex];
          }

          currentFrameRef.current = safeFrameIndex;
          image.dataset.frame = String(safeFrameIndex + 1);

        }

        lastScrollYRef.current = currentScrollY;
      };

    const requestUpdate = () => {
        if (rafRef.current) {
          return;
        }
        rafRef.current = window.requestAnimationFrame(updateFrame);
      };

    const handleScroll = () => {
        requestUpdate();
      };

    const handleResize = () => {
        requestUpdate();
      };

    const handleReducedMotionChange = () => {
        resetAnimation();
        requestUpdate();
      };

    const observer = new IntersectionObserver((entries) => {
          const entry = entries[0];
          isVisibleRef.current = Boolean(entry?.isIntersecting);
          if (isVisibleRef.current) {
            lastScrollYRef.current = window.scrollY;
          }
        },
        {
          root: null,
          rootMargin: "0px 0px 0px 0px",
          threshold: 0.10,
        }
      );

    observer.observe(section);

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );

    window.addEventListener(
      "resize",
      handleResize,
      {
        passive: true,
      }
    );

    if (reducedMotionQuery.addEventListener) {
      reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
    }
    requestUpdate();
    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );

      window.removeEventListener(
        "resize",
        handleResize
      );

      if (reducedMotionQuery.removeEventListener) {
        reducedMotionQuery.removeEventListener(
          "change",
          handleReducedMotionChange
        );
      }

      observer.disconnect();

      if (rafRef.current) {
        window.cancelAnimationFrame(
          rafRef.current
        );
      }

      rafRef.current = 0;
      preloadedImagesRef.current = [];
    };
  }, [frames]);

  if (!frames.length) {
    return null;
  }

  return (
    <section ref={sectionRef} className="test-tube-scroll-section" aria-label="Laboratory test tube animation" >
      <div className="test-tube-scroll-stage" >
        <img ref={imageRef} src={frames[0]} alt="Laboratory test tube" className="test-tube-scroll-image" draggable="false" />
      </div>
    </section>
  );

}