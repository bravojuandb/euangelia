import { useEffect } from "react";

// Matches the phone layout in App.css.
const PHONE = "(max-width: 720px)";

// How far the page must move one way before the nav follows: small scrolls
// and the bounce at either end leave it where it is.
const TRAVEL = 24;

// Phones: the sticky reading nav slides away while the reader scrolls down
// the text and comes back as soon as they scroll up, so the text has the
// whole screen. It is marked with `data-tucked`; App.css moves it with a
// transform, so nothing below it shifts.
//
// The nav stays while it is being used. A chapter or a reference chosen in
// it scrolls the page down, but that scroll is not the reader's, so it is
// pinned until the next touch, wheel or key outside it. So it is on first
// load, when the page may jump to a verse from the address. A field in it
// that has the focus (the reference being typed) also keeps it.
export function useTuckingNav(navRef) {
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) {
      return undefined;
    }
    const phone = window.matchMedia(PHONE);
    let lastY = window.scrollY;
    let travel = 0;
    let pinned = true;
    let frame = 0;

    const tuck = (tucked) => {
      if (tucked) {
        nav.dataset.tucked = "";
      } else {
        delete nav.dataset.tucked;
      }
    };

    const update = () => {
      frame = 0;
      const end = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
      const y = Math.min(Math.max(window.scrollY, 0), end);
      const delta = y - lastY;
      lastY = y;

      const typing =
        nav.contains(document.activeElement) && document.activeElement.matches("input");
      if (!phone.matches || pinned || typing || y === 0) {
        travel = 0;
        tuck(false);
        return;
      }
      if (delta === 0) {
        return;
      }
      // Distance travelled in the current direction.
      travel = Math.sign(delta) === Math.sign(travel) ? travel + delta : delta;
      // Only once the nav has reached the top and is sticking there.
      const stuck = "tucked" in nav.dataset || nav.getBoundingClientRect().top <= 1;
      if (travel > TRAVEL && stuck) {
        tuck(true);
      } else if (travel < -TRAVEL) {
        tuck(false);
      }
    };
    const schedule = () => {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    };

    const pin = () => {
      pinned = true;
      travel = 0;
      tuck(false);
    };
    const unpin = (event) => {
      if (!nav.contains(event.target)) {
        pinned = false;
      }
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    nav.addEventListener("click", pin);
    nav.addEventListener("focusin", pin);
    window.addEventListener("touchstart", unpin, { passive: true });
    window.addEventListener("wheel", unpin, { passive: true });
    window.addEventListener("keydown", unpin);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      nav.removeEventListener("click", pin);
      nav.removeEventListener("focusin", pin);
      window.removeEventListener("touchstart", unpin);
      window.removeEventListener("wheel", unpin);
      window.removeEventListener("keydown", unpin);
      tuck(false);
    };
  }, [navRef]);
}
