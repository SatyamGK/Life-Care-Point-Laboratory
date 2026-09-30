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
  .sort(
    ([a], [b]) =>
      getFrameNumber(a) - getFrameNumber(b)
  )
  .map(([, url]) => url)
  .filter(Boolean);

export default function Hero3DScrollAnimation() {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);
  const rafRef = useRef(0);
  const lastFrameRef = useRef(-1);
  const imagesRef = useRef([]);

  const frames = useMemo(
    () => FRAME_URLS,
    []
  );

  useEffect(() => {
    const section = sectionRef.current;
    const image = imageRef.current;

    if (!section || !image || !frames.length) {
      return undefined;
    }

    const preload = () => {
      imagesRef.current = frames.map((src) => {
        const img = new Image();
        img.src = src;
        return img;
      });
    };

    preload();

    const update = () => {
      rafRef.current = 0;

      const rect = section.getBoundingClientRect();

      const scrollDistance = Math.max( section.offsetHeight - window.innerHeight, 1 );

      let progress = -rect.top / scrollDistance;

      progress = Math.max( 0, Math.min(1, progress));

      const frameIndex = Math.min( frames.length - 1, Math.floor(progress * (frames.length - 1)));

      if (
        frameIndex !== lastFrameRef.current
      ) {
        image.src = frames[frameIndex];
        lastFrameRef.current = frameIndex;
      }

      const active = rect.top <= 0 && rect.bottom >= window.innerHeight * 0.25;

      image.style.opacity = active || progress === 0 ? "1" : "0";

      image.dataset.frame = String(frameIndex + 1);
    };

    const requestUpdate = () => {
      if (!rafRef.current) {
        rafRef.current = window.requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll",requestUpdate, { passive: true } );

    window.addEventListener( "resize", requestUpdate );
    image.src = frames[0];
    lastFrameRef.current = 0;

    requestUpdate();

    return () => {
      window.removeEventListener( "scroll", requestUpdate );

      window.removeEventListener( "resize", requestUpdate );

      if (rafRef.current) { 
        window.cancelAnimationFrame( rafRef.current );
      }

      imagesRef.current = [];
    };
  }, [frames]);

  if (!frames.length) {
    return null;
  }

  return (
    <section ref={sectionRef} className="test-tube-scroll-section" aria-label="Test tube animation" >
      <div className="test-tube-scroll-stage">
        <img ref={imageRef} src={frames[0]} alt="Laboratory test tube" className="test-tube-scroll-image" draggable="false" />
      </div>
    </section>
  );
}
