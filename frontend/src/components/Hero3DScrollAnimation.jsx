import React, { useEffect, useMemo, useRef } from "react";

const HEADER_HEIGHT = 54;

const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

function getFrames() {
  const modules = import.meta.glob(
    "../hero-3d/Test-tube_image_*.webp",
    {
      eager: true,
      query: "?url",
      import: "default",
    }
  );

  return Object.entries(modules)
    .sort(([a], [b]) => {
      const getNumber = (file) => {
        const match = file.match(/Test-tube_image_(\d+)/i);
        return match ? Number(match[1]) : 0;
      };

      return getNumber(a) - getNumber(b);
    })
    .map(([, url]) => url);
}

export default function Hero3DScrollAnimation() {
  const sectionRef = useRef(null);
  const imageRef = useRef(null);

  const currentFrame = useRef(0);
  const animationFrame = useRef(null);

  const frames = useMemo(() => getFrames(), []);

  /*
   * ----------------------------------------------------------
   * PRELOAD ALL FRAMES
   * ----------------------------------------------------------
   */

  useEffect(() => {
    if (!frames.length) return;

    const loadedImages = [];

    frames.forEach((src) => {
      const img = new Image();
      img.src = src;
      loadedImages.push(img);
    });

    return () => {
      loadedImages.forEach((img) => {
        img.src = "";
      });
    };
  }, [frames]);

  /*
   * ----------------------------------------------------------
   * SHOW FRAME
   * ----------------------------------------------------------
   */

  const setFrame = (index) => {
    if (!imageRef.current || !frames.length) return;

    const safeIndex = clamp(
      Math.round(index),
      0,
      frames.length - 1
    );

    if (safeIndex === currentFrame.current) return;

    currentFrame.current = safeIndex;

    imageRef.current.src = frames[safeIndex];
  };

  /*
   * ----------------------------------------------------------
   * SCROLL CALCULATION
   * ----------------------------------------------------------
   *
   * IMPORTANT:
   *
   * We calculate the animation distance from the ACTUAL
   * section position.
   *
   * The animation ends exactly at the bottom of the
   * sticky section.
   *
   */

  useEffect(() => {
    const section = sectionRef.current;

    if (!section || !frames.length) return;

    let ticking = false;

    const update = () => {
      ticking = false;

      const rect = section.getBoundingClientRect();

      /*
       * Absolute position of section.
       */
      const sectionTop =
        rect.top + window.scrollY;

      /*
       * Sticky image starts when the section reaches
       * the bottom of the fixed header.
       */
      const start =
        sectionTop - HEADER_HEIGHT;

      /*
       * ------------------------------------------------------
       * THIS IS THE IMPORTANT FIX
       *
       * Calculate the EXACT scroll distance available
       * before the sticky element is released.
       * ------------------------------------------------------
       */

      const sectionHeight = section.offsetHeight;

      const viewportHeight = window.innerHeight;

      const stickyHeight =
        viewportHeight - HEADER_HEIGHT;

      /*
       * Sticky element remains pinned for:
       *
       * section height - sticky element height
       */
      const animationDistance = Math.max(
        sectionHeight - stickyHeight,
        1
      );

      /*
       * Current scroll position inside animation.
       */
      const travelled =
        window.scrollY - start;

      /*
       * Convert to 0 -> 1.
       */
      const progress = clamp(
        travelled / animationDistance,
        0,
        1
      );

      /*
       * Convert to frame.
       */
      const frame =
        progress * (frames.length - 1);

      setFrame(frame);
    };

    const onScroll = () => {
      if (ticking) return;

      ticking = true;

      animationFrame.current =
        window.requestAnimationFrame(update);
    };

    const onResize = () => {
      update();
    };

    /*
     * Initial frame.
     */
    currentFrame.current = 0;

    if (imageRef.current) {
      imageRef.current.src = frames[0];
    }

    update();

    window.addEventListener(
      "scroll",
      onScroll,
      { passive: true }
    );

    window.addEventListener(
      "resize",
      onResize
    );

    return () => {
      window.removeEventListener(
        "scroll",
        onScroll
      );

      window.removeEventListener(
        "resize",
        onResize
      );

      if (animationFrame.current) {
        window.cancelAnimationFrame(
          animationFrame.current
        );
      }
    };
  }, [frames]);

  if (!frames.length) {
    return (
      <section className="test-tube-scroll-error">
        <p>
          Test tube animation frames were not found.
        </p>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="test-tube-scroll-section"
      aria-label="Laboratory test tube animation"
    >
      <div className="test-tube-scroll-stage">
        <img
          ref={imageRef}
          src={frames[0]}
          alt="Laboratory test tube"
          className="test-tube-scroll-image"
          draggable="false"
        />
      </div>
    </section>
  );
}