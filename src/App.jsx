import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { CHAPTER_LABELS, FONT_SCALE, GOSPELS, LANG, VERNACULARS } from "./config.js";
import {
  bindPunctuation,
  parseReference,
  toGreekNumeral,
  toRomanNumeral,
} from "./text.js";

const NO_VERSES = [];

function scrollBehavior() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

function roundScale(value) {
  return Math.round(value * 100) / 100;
}

// The chapter whose divider has scrolled past the bottom of the sticky nav.
function useCurrentChapter(chapters, navRef) {
  const [current, setCurrent] = useState(null);

  useEffect(() => {
    if (!chapters.length) {
      return undefined;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const line = (navRef.current?.getBoundingClientRect().bottom ?? 0) + 72;
      let found = chapters[0];
      for (const chapter of chapters) {
        const divider = document.getElementById(`chapter-${chapter}`);
        if (!divider || divider.getBoundingClientRect().top > line) {
          break;
        }
        found = chapter;
      }
      setCurrent(found);
    };
    const schedule = () => {
      if (!frame) {
        frame = requestAnimationFrame(update);
      }
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [chapters, navRef]);

  return chapters.includes(current) ? current : (chapters[0] ?? null);
}

function App() {
  const [selectedGospel, setSelectedGospel] = useState("john");
  const [selectedVernacular, setSelectedVernacular] = useState("spanish");
  const [loaded, setLoaded] = useState({ gospel: null, verses: NO_VERSES, error: null });
  const [target, setTarget] = useState(null);
  const [reference, setReference] = useState("");
  const [referenceError, setReferenceError] = useState("");
  const [fontScale, setFontScale] = useState(1);
  const [mobileColumn, setMobileColumn] = useState("all");
  const navRef = useRef(null);
  const chipsRef = useRef(null);

  const currentGospel = GOSPELS.find((gospel) => gospel.id === selectedGospel);
  const currentVernacular = VERNACULARS.find(
    (vernacular) => vernacular.id === selectedVernacular,
  );
  const isLoading = loaded.gospel !== selectedGospel;
  const verses = isLoading ? NO_VERSES : loaded.verses;

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}data/${selectedGospel}.json`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (!cancelled) {
          setLoaded({ gospel: selectedGospel, verses: data, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoaded({ gospel: selectedGospel, verses: NO_VERSES, error });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedGospel]);

  // Sticky column headers and scroll targets sit below the sticky nav.
  useEffect(() => {
    const nav = navRef.current;
    const observer = new ResizeObserver(() => {
      document.documentElement.style.setProperty("--nav-height", `${nav.offsetHeight}px`);
    });
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);

  const chapterGroups = useMemo(() => {
    const groups = [];
    for (const verse of verses) {
      const last = groups[groups.length - 1];
      if (last?.chapter === verse.chapter) {
        last.verses.push(verse);
      } else {
        groups.push({ chapter: verse.chapter, verses: [verse] });
      }
    }
    return groups;
  }, [verses]);

  const chapters = useMemo(() => chapterGroups.map((group) => group.chapter), [chapterGroups]);
  const currentChapter = useCurrentChapter(chapters, navRef);

  // Keep the current chapter chip in view when the chips overflow.
  useEffect(() => {
    const list = chipsRef.current;
    const chip = list?.querySelector('[aria-current="true"]');
    if (!list || !chip) {
      return;
    }
    list.scrollTo({ left: chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2 });
  }, [currentChapter]);

  const columns = [
    { id: "all", label: "All" },
    { id: "vernacular", label: currentVernacular.label, lang: currentVernacular.lang },
    { id: "greek", label: "Ελληνικά", lang: LANG.greekCaps },
    { id: "latin", label: "Latina", lang: LANG.latin },
  ];

  function goTo(chapter, verse = null) {
    const element = document.getElementById(
      verse ? `verse-${chapter}-${verse}` : `chapter-${chapter}`,
    );
    if (!element) {
      return false;
    }
    setTarget(verse ? { chapter, verse } : null);
    element.scrollIntoView({ behavior: scrollBehavior(), block: verse ? "center" : "start" });
    return true;
  }

  function handleReferenceSubmit(event) {
    event.preventDefault();
    const text = reference.trim();
    if (!text) {
      return;
    }
    const parsed = parseReference(text);
    if (parsed && goTo(parsed.chapter, parsed.verse)) {
      setReferenceError("");
    } else {
      setReferenceError(`${currentGospel.label} ${text} is not available.`);
    }
  }

  function selectGospel(id) {
    if (id === selectedGospel) {
      return;
    }
    setSelectedGospel(id);
    setTarget(null);
    setReference("");
    setReferenceError("");
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
  }

  function changeFontScale(delta) {
    setFontScale((scale) =>
      roundScale(Math.min(FONT_SCALE.max, Math.max(FONT_SCALE.min, scale + delta))),
    );
  }

  return (
    <div className="app-shell" style={{ "--reader-font-scale": fontScale }}>
      <header className="masthead">
        <h1 lang={LANG.latin}>Evangelium Heptaglotton</h1>
        <p className="masthead-subtitle">
          <span lang={LANG.greekCaps}>{currentGospel.heading}</span>
          <span aria-hidden="true"> · </span>
          <span lang={LANG.latin}>{currentGospel.subheading}</span>
        </p>

        <div className="settings">
          <div className="segmented" role="group" aria-label="Gospel">
            {GOSPELS.map((gospel) => (
              <button
                key={gospel.id}
                type="button"
                className="segment"
                aria-pressed={selectedGospel === gospel.id}
                disabled={!gospel.available}
                onClick={() => selectGospel(gospel.id)}
              >
                {gospel.label}
                {!gospel.available && <span className="soon">soon</span>}
              </button>
            ))}
          </div>

          <div className="segmented" role="group" aria-label="Translation">
            {VERNACULARS.map((vernacular) => (
              <button
                key={vernacular.id}
                type="button"
                className="segment"
                lang={vernacular.lang}
                aria-pressed={selectedVernacular === vernacular.id}
                disabled={!vernacular.available}
                onClick={() => setSelectedVernacular(vernacular.id)}
              >
                {vernacular.label}
                {!vernacular.available && (
                  <span className="soon" lang="en">
                    soon
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="segmented text-size" role="group" aria-label="Text size">
            <button
              type="button"
              className="segment"
              aria-label="Decrease text size"
              disabled={fontScale <= FONT_SCALE.min}
              onClick={() => changeFontScale(-FONT_SCALE.step)}
            >
              A−
            </button>
            <button
              type="button"
              className="segment"
              aria-label="Increase text size"
              disabled={fontScale >= FONT_SCALE.max}
              onClick={() => changeFontScale(FONT_SCALE.step)}
            >
              A+
            </button>
          </div>
        </div>
      </header>

      <nav ref={navRef} className="reader-nav" aria-label="Reading navigation">
        <div className="reader-nav-row">
          <span className="nav-label" aria-hidden="true">
            Chapter
          </span>
          <div ref={chipsRef} className="chapter-chips">
            {chapters.map((chapter) => (
              <button
                key={chapter}
                type="button"
                className="chapter-chip"
                aria-label={`Chapter ${chapter}`}
                aria-current={chapter === currentChapter ? "true" : undefined}
                onClick={() => goTo(chapter)}
              >
                {chapter}
              </button>
            ))}
          </div>

          <form className="reference-form" role="search" onSubmit={handleReferenceSubmit}>
            <label className="visually-hidden" htmlFor="reference">
              Go to chapter and verse
            </label>
            <input
              id="reference"
              className="reference-input"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="3:16"
              value={reference}
              aria-invalid={Boolean(referenceError)}
              aria-describedby="reference-error"
              onChange={(event) => {
                setReference(event.target.value);
                setReferenceError("");
              }}
            />
            <button type="submit" className="reference-submit" aria-label="Go">
              →
            </button>
            <p id="reference-error" className="reference-error" aria-live="polite">
              {referenceError}
            </p>
          </form>
        </div>

        <div className="column-tabs" role="group" aria-label="Columns">
          {columns.map((column) => (
            <button
              key={column.id}
              type="button"
              className="segment"
              lang={column.lang}
              aria-pressed={mobileColumn === column.id}
              onClick={() => setMobileColumn(column.id)}
            >
              {column.label}
            </button>
          ))}
        </div>
      </nav>

      <main className={`reader show-${mobileColumn}`}>
        {isLoading ? (
          <p className="status-message">Setting the folio…</p>
        ) : loaded.error ? (
          <p className="status-message">
            The Gospel of {currentGospel.label} could not be loaded. Please try again later.
          </p>
        ) : (
          <div className="parallel-reader">
            <div className="folio-rule" aria-hidden="true" />
            <div className="parallel-header col-vernacular" lang={currentVernacular.lang}>
              {currentVernacular.label}
            </div>
            <div className="parallel-header col-greek" lang={LANG.greekCaps}>
              Ελληνικά
            </div>
            <div className="parallel-header col-latin" lang={LANG.latin}>
              Latina
            </div>

            {chapterGroups.map((group) => (
              <section
                key={`chapter-${group.chapter}`}
                className="chapter-section"
                aria-labelledby={`chapter-${group.chapter}`}
              >
                <h2 id={`chapter-${group.chapter}`} className="chapter-divider">
                  <span className="col-vernacular" lang={currentVernacular.lang}>
                    {CHAPTER_LABELS[selectedVernacular] || "Chapter"} {group.chapter}
                  </span>
                  <span className="col-greek" lang={LANG.greekCaps}>
                    {CHAPTER_LABELS.greek} {toGreekNumeral(group.chapter)}
                  </span>
                  <span className="col-latin" lang={LANG.latin}>
                    {CHAPTER_LABELS.latin} {toRomanNumeral(group.chapter)}
                  </span>
                </h2>

                {group.verses.map((verse) => {
                  const isTarget =
                    target?.chapter === verse.chapter && target?.verse === verse.verse;
                  return (
                    <div
                      key={`verse-${verse.chapter}-${verse.verse}`}
                      id={`verse-${verse.chapter}-${verse.verse}`}
                      className={`parallel-verse-row ${isTarget ? "is-target" : ""}`}
                      data-verse={verse.verse}
                    >
                      <article className="parallel-cell col-vernacular">
                        <span className="verse-number">{verse.verse}</span>
                        <span className="cell-lang" aria-hidden="true">
                          {currentVernacular.lang.toUpperCase()}
                        </span>
                        <p className="verse vernacular-text" lang={currentVernacular.lang}>
                          {bindPunctuation(verse[currentVernacular.field] || "—")}
                        </p>
                      </article>

                      <article className="parallel-cell col-greek">
                        <span className="verse-number">{verse.verse}</span>
                        <span className="cell-lang" aria-hidden="true">
                          ΕΛ
                        </span>
                        <p className="verse greek-text" lang={LANG.greekText}>
                          {bindPunctuation(verse.greek || "—")}
                        </p>
                      </article>

                      <article className="parallel-cell col-latin">
                        <span className="verse-number">{verse.verse}</span>
                        <span className="cell-lang" aria-hidden="true">
                          LA
                        </span>
                        <p className="verse latin-text" lang={LANG.latin}>
                          {bindPunctuation(verse.latin || "—")}
                        </p>
                      </article>
                    </div>
                  );
                })}
              </section>
            ))}
          </div>
        )}
      </main>

      <footer className="credits">
        <p>
          Greek:{" "}
          <a href="https://github.com/Faithlife/SBLGNT">SBL Greek New Testament</a>, © 2010
          Society of Biblical Literature and Logos Bible Software,{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>; text-critical
          signs removed.
        </p>
        <p>
          Polish:{" "}
          <a href="https://pl.wikisource.org/wiki/Biblia_Wujka_(1923)/Ewangelia_wg_%C5%9Bw._Jana">
            Biblia Wujka, 1923 edition
          </a>
          , public domain.
        </p>
      </footer>
    </div>
  );
}

export default App;
