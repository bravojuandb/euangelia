import { useEffect, useState } from "react";

// More than this many screens from an end, its arrow shows.
const SCREENS = 1;

function scrollBehavior() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

function Chevron({ down }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d={down ? "M6 9l6 6 6-6" : "M6 15l6-6 6 6"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Two arrows at the side of the page: up to its head and down to the end of
// the text (`endRef`), each shown while that end is far away.
// `words`: UI[lang].scroll.
export function ScrollArrows({ endRef, words }) {
  const [shown, setShown] = useState({ top: false, end: false });

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const screen = window.innerHeight;
      const end = endRef.current?.getBoundingClientRect().bottom ?? 0;
      const next = { top: window.scrollY > screen * SCREENS, end: end - screen > screen * SCREENS };
      setShown((last) => (last.top === next.top && last.end === next.end ? last : next));
    };
    const schedule = () => {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    };

    // The text grows as a Gospel loads, with no scroll.
    const observer = new ResizeObserver(schedule);
    if (endRef.current) {
      observer.observe(endRef.current);
    }
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [endRef]);

  const toTop = () => window.scrollTo({ top: 0, behavior: scrollBehavior() });
  const toEnd = () => {
    const end = endRef.current?.getBoundingClientRect().bottom ?? 0;
    window.scrollTo({
      top: window.scrollY + end - window.innerHeight,
      behavior: scrollBehavior(),
    });
  };

  return (
    <div className="scroll-arrows">
      <button
        type="button"
        className={`scroll-arrow ${shown.top ? "is-shown" : ""}`}
        aria-label={words.top}
        title={words.top}
        onClick={toTop}
      >
        <Chevron />
      </button>
      <button
        type="button"
        className={`scroll-arrow ${shown.end ? "is-shown" : ""}`}
        aria-label={words.end}
        title={words.end}
        onClick={toEnd}
      >
        <Chevron down />
      </button>
    </div>
  );
}
