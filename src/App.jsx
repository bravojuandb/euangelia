import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import sello from "./assets/sello.png";
import {
  CHAPTER_LABELS,
  COLUMN_IDS,
  FONT_SCALES,
  GOSPELS,
  LANG,
  VERNACULAR_LANGUAGES,
  VERNACULARS,
} from "./config.js";
import { useGospelData } from "./data.js";
import { UI } from "./i18n.js";
import { loadSettings, parseLocation, saveSettings, writeLocation } from "./settings.js";
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

// Scrolls to a chapter heading or a verse row; false if it is not on the page.
function scrollToPlace(chapter, verse, behavior = scrollBehavior()) {
  const element = document.getElementById(
    verse ? `verse-${chapter}-${verse}` : `chapter-${chapter}`,
  );
  if (!element) {
    return false;
  }
  element.scrollIntoView({ behavior, block: verse ? "center" : "start" });
  return true;
}

function initialState() {
  const settings = loadSettings();
  const place = parseLocation(window.location.hash);
  return {
    ...settings,
    gospel: place?.gospel ?? settings.gospel,
    place: place?.chapter ? { chapter: place.chapter, verse: place.verse } : null,
  };
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
      const line = (navRef.current?.getBoundingClientRect().bottom ?? 0) + 100;
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
  const [initial] = useState(initialState);
  const [selectedGospel, setSelectedGospel] = useState(initial.gospel);
  const [selectedVernacular, setSelectedVernacular] = useState(initial.vernacular);
  const [columns, setColumns] = useState(initial.columns);
  const [fontScale, setFontScale] = useState(initial.fontScale);
  const [welcomed, setWelcomed] = useState(initial.welcomed);
  const [target, setTarget] = useState(initial.place?.verse ? initial.place : null);
  const [reference, setReference] = useState("");
  const [referenceError, setReferenceError] = useState("");
  const navRef = useRef(null);
  const chipsRef = useRef(null);
  const guideRef = useRef(null);
  // A place to scroll to once its Gospel has loaded (from the address).
  const pendingPlaceRef = useRef(initial.place);

  const currentGospel = GOSPELS.find((gospel) => gospel.id === selectedGospel);
  const currentVernacular = VERNACULARS.find(
    (vernacular) => vernacular.id === selectedVernacular,
  );
  const ui = UI[currentVernacular.lang];
  const gospelName = ui.gospels[selectedGospel];

  // Only the texts of the visible columns are downloaded. Greek and Latin
  // columns are named after their files; the vernacular column reads the
  // selected translation.
  const textNames = columns.map((id) => (id === "vernacular" ? currentVernacular.id : id));
  const data = useGospelData(selectedGospel, textNames);
  // While a newly chosen translation loads, the column keeps the one it had.
  const shownVernacular = data.text(currentVernacular.id)
    ? currentVernacular
    : VERNACULARS.find((vernacular) => data.text(vernacular.id));
  const allTextsShown = Boolean(data.verses) && textNames.every((name) => data.text(name));

  // Jump to the place named in the address once its text is on the page.
  useEffect(() => {
    const place = pendingPlaceRef.current;
    if (!allTextsShown || !place) {
      return;
    }
    pendingPlaceRef.current = null;
    scrollToPlace(place.chapter, place.verse, "auto");
    // The Gospel is a dependency too: one already loaded is ready at once.
  }, [allTextsShown, selectedGospel]);

  // An address edited by hand, or back/forward between shared links.
  useEffect(() => {
    const onHashChange = () => {
      const place = parseLocation(window.location.hash);
      if (!place) {
        return;
      }
      setTarget(place.verse ? { chapter: place.chapter, verse: place.verse } : null);
      if (place.gospel === selectedGospel) {
        if (place.chapter) {
          scrollToPlace(place.chapter, place.verse);
        }
        return;
      }
      pendingPlaceRef.current = place.chapter ? place : null;
      setSelectedGospel(place.gospel);
      setReference("");
      setReferenceError("");
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [selectedGospel]);

  useEffect(() => {
    saveSettings({
      gospel: selectedGospel,
      vernacular: selectedVernacular,
      columns,
      fontScale,
      welcomed,
    });
  }, [selectedGospel, selectedVernacular, columns, fontScale, welcomed]);

  useEffect(() => {
    document.documentElement.lang = currentVernacular.lang;
    document.title = `${gospelName.full} · Euangelion`;
  }, [currentVernacular.lang, gospelName.full]);

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
    for (const [index, [chapter, number]] of (data.verses ?? NO_VERSES).entries()) {
      const verse = { chapter, verse: number, index };
      const last = groups[groups.length - 1];
      if (last?.chapter === verse.chapter) {
        last.verses.push(verse);
      } else {
        groups.push({ chapter: verse.chapter, verses: [verse] });
      }
    }
    return groups;
  }, [data.verses]);

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

  const columnDefs = {
    vernacular: {
      textLang: shownVernacular?.lang,
      textClass: "vernacular-text",
      note: shownVernacular?.note,
      texts: shownVernacular ? data.text(shownVernacular.id) : null,
      dividerLang: currentVernacular.lang,
      divider: (chapter) => `${ui.chapter} ${chapter}`,
    },
    greek: {
      textLang: LANG.greekText,
      textClass: "greek-text",
      texts: data.text("greek"),
      missing: ui.missingGreek,
      dividerLang: LANG.greekCaps,
      divider: (chapter) => `${CHAPTER_LABELS.greek} ${toGreekNumeral(chapter)}`,
    },
    latin: {
      textLang: LANG.latin,
      textClass: "latin-text",
      texts: data.text("latin"),
      dividerLang: LANG.latin,
      divider: (chapter) => `${CHAPTER_LABELS.latin} ${toRomanNumeral(chapter)}`,
    },
  };
  // A column just switched on appears once its text has arrived.
  const visibleColumns = columns
    .map((id) => ({ id, ...ui.columns[id], ...columnDefs[id] }))
    .filter((column) => column.texts);
  const isLoading = !data.error && visibleColumns.length === 0;

  function goTo(chapter, verse = null) {
    if (!scrollToPlace(chapter, verse)) {
      return false;
    }
    setTarget(verse ? { chapter, verse } : null);
    writeLocation(selectedGospel, chapter, verse);
    return true;
  }

  function handleReferenceSubmit(event) {
    event.preventDefault();
    const text = reference.trim();
    if (!text) {
      return;
    }
    const parsed = parseReference(text);
    if (!parsed) {
      setReferenceError(ui.badReference);
    } else if (goTo(parsed.chapter, parsed.verse)) {
      setReferenceError("");
    } else {
      setReferenceError(ui.notFound(gospelName.short, text));
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
    pendingPlaceRef.current = null;
    writeLocation(id);
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
  }

  function selectVernacular(id) {
    setSelectedVernacular(id);
    setReferenceError("");
  }

  function toggleColumn(id) {
    setColumns((shown) =>
      shown.includes(id)
        ? shown.filter((column) => column !== id)
        : COLUMN_IDS.filter((column) => column === id || shown.includes(column)),
    );
  }

  function toggleVerse(verse) {
    // A click that ends a text selection is not a request to highlight.
    if (window.getSelection()?.toString()) {
      return;
    }
    const isTarget = target?.chapter === verse.chapter && target?.verse === verse.verse;
    setTarget(isTarget ? null : { chapter: verse.chapter, verse: verse.verse });
    writeLocation(selectedGospel, verse.chapter, isTarget ? null : verse.verse);
  }

  function changeFontScale(step) {
    setFontScale((scale) => {
      const index = FONT_SCALES.indexOf(scale);
      return FONT_SCALES[Math.min(FONT_SCALES.length - 1, Math.max(0, index + step))];
    });
  }

  function openGuide() {
    setWelcomed(true);
    guideRef.current?.showModal();
  }

  const fontIndex = FONT_SCALES.indexOf(fontScale);

  return (
    <div className="app-shell" style={{ "--reader-font-scale": fontScale }}>
      <header className="masthead">
        <h1>Euangelion</h1>
        <p className="masthead-title">{gospelName.full}</p>
        <p className="masthead-subtitle">
          <span lang={LANG.greekCaps}>{currentGospel.heading}</span>
          <span aria-hidden="true"> · </span>
          <span lang={LANG.latin}>{currentGospel.subheading}</span>
        </p>

        <div className="settings">
          <div className="setting">
            <span id="gospel-label" className="setting-label">
              {ui.gospelGroup}
            </span>
            <div className="segmented" role="group" aria-labelledby="gospel-label">
              {GOSPELS.map((gospel) => (
                <button
                  key={gospel.id}
                  type="button"
                  className="segment"
                  aria-pressed={selectedGospel === gospel.id}
                  onClick={() => selectGospel(gospel.id)}
                >
                  {ui.gospels[gospel.id].short}
                </button>
              ))}
            </div>
          </div>

          <div className="setting">
            <span id="language-label" className="setting-label">
              {ui.languageGroup}
            </span>
            <div className="segmented" role="group" aria-labelledby="language-label">
              {VERNACULAR_LANGUAGES.map(({ lang, label, translations }) => {
                if (translations.length === 1) {
                  const [vernacular] = translations;
                  return (
                    <button
                      key={lang}
                      type="button"
                      className="segment"
                      lang={lang}
                      aria-pressed={selectedVernacular === vernacular.id}
                      onClick={() => selectVernacular(vernacular.id)}
                    >
                      {label}
                    </button>
                  );
                }
                // While another language is chosen the menu shows no choice,
                // so that picking any translation counts as a change.
                const isCurrent = currentVernacular.lang === lang;
                return (
                  <label
                    key={lang}
                    className={`segment segment-menu${isCurrent ? " is-current" : ""}`}
                    lang={lang}
                  >
                    <span>
                      {label}
                      <span className="segment-arrow" aria-hidden="true">
                        ▾
                      </span>
                    </span>
                    {isCurrent && (
                      <span className="segment-edition">{currentVernacular.edition}</span>
                    )}
                    <select
                      aria-label={label}
                      value={isCurrent ? currentVernacular.id : ""}
                      onChange={(event) => selectVernacular(event.target.value)}
                    >
                      {!isCurrent && <option value="" disabled hidden />}
                      {translations.map((vernacular) => (
                        <option key={vernacular.id} value={vernacular.id}>
                          {vernacular.note}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="setting">
            <span id="text-size-label" className="setting-label">
              {ui.textSize}
            </span>
            <div className="segmented text-size" role="group" aria-labelledby="text-size-label">
              <button
                type="button"
                className="segment"
                aria-label={ui.smaller}
                title={ui.smaller}
                disabled={fontIndex <= 0}
                onClick={() => changeFontScale(-1)}
              >
                A−
              </button>
              <button
                type="button"
                className="segment"
                aria-label={ui.larger}
                title={ui.larger}
                disabled={fontIndex >= FONT_SCALES.length - 1}
                onClick={() => changeFontScale(1)}
              >
                A+
              </button>
            </div>
          </div>

          <div className="setting">
            <span id="help-label" className="setting-label">
              {ui.help}
            </span>
            <div className="segmented" role="group" aria-labelledby="help-label">
              <button type="button" className="segment guide-button" onClick={openGuide}>
                <span aria-hidden="true">?</span> {ui.guide}
              </button>
            </div>
          </div>
        </div>
      </header>

      {!welcomed && (
        <aside className="welcome">
          <p>{ui.welcome}</p>
          <div className="welcome-actions">
            <button type="button" className="text-button" onClick={openGuide}>
              {ui.guide}
            </button>
            <button type="button" className="text-button" onClick={() => setWelcomed(true)}>
              {ui.dismiss}
            </button>
          </div>
        </aside>
      )}

      <nav ref={navRef} className="reader-nav" aria-label={gospelName.full}>
        <div className="reader-nav-row">
          <span className="nav-label" aria-hidden="true">
            {ui.chapter}
          </span>
          <div ref={chipsRef} className="chapter-chips">
            {chapters.map((chapter) => (
              <button
                key={chapter}
                type="button"
                className="chapter-chip"
                aria-label={`${ui.chapter} ${chapter}`}
                aria-current={chapter === currentChapter ? "true" : undefined}
                onClick={() => goTo(chapter)}
              >
                {chapter}
              </button>
            ))}
          </div>

          <form className="reference-form" role="search" onSubmit={handleReferenceSubmit}>
            <label className="visually-hidden" htmlFor="reference">
              {ui.referenceLabel}
            </label>
            <input
              id="reference"
              className="reference-input"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder={ui.referencePlaceholder}
              value={reference}
              aria-invalid={Boolean(referenceError)}
              aria-describedby="reference-error"
              onChange={(event) => {
                setReference(event.target.value);
                setReferenceError("");
              }}
            />
            <button type="submit" className="reference-submit">
              {ui.go}
            </button>
            <p id="reference-error" className="reference-error" aria-live="polite">
              {referenceError}
            </p>
          </form>
        </div>

        <div className="reader-nav-row reader-tools">
          <span id="columns-label" className="nav-label">
            {ui.columnsGroup}
          </span>
          <div className="segmented column-toggles" role="group" aria-labelledby="columns-label">
            {COLUMN_IDS.map((id) => {
              const shown = columns.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  className="segment"
                  aria-pressed={shown}
                  disabled={shown && columns.length === 1}
                  onClick={() => toggleColumn(id)}
                >
                  <span className="check" aria-hidden="true">
                    {shown ? "✓" : ""}
                  </span>
                  {ui.columns[id].label}
                </button>
              );
            })}
          </div>

        </div>
      </nav>

      <main className={`reader ${visibleColumns.length > 1 ? "is-multi" : "is-single"}`}>
        {data.error ? (
          <p className="status-message">{ui.loadError}</p>
        ) : isLoading ? (
          <p className="status-message">{ui.loading}</p>
        ) : (
          <div className="parallel-reader" style={{ "--columns": visibleColumns.length }}>
            <div className="folio-rule" aria-hidden="true" />
            {visibleColumns.map((column) => (
              <div key={column.id} className="parallel-header">
                <span className="parallel-header-label">{column.label}</span>
                <span className="parallel-header-note">{column.note}</span>
              </div>
            ))}

            {chapterGroups.map((group) => (
              <section
                key={`chapter-${group.chapter}`}
                className="chapter-section"
                aria-labelledby={`chapter-${group.chapter}`}
              >
                <h2 id={`chapter-${group.chapter}`} className="chapter-divider">
                  {visibleColumns.map((column) => (
                    <span key={column.id} lang={column.dividerLang}>
                      {column.divider(group.chapter)}
                    </span>
                  ))}
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
                      onClick={() => toggleVerse(verse)}
                    >
                      {visibleColumns.map((column) => {
                        const text = column.texts[verse.index];
                        return (
                          <article key={column.id} className="parallel-cell">
                            <span className="verse-number">{verse.verse}</span>
                            <span className="cell-lang" aria-hidden="true">
                              {column.code}
                            </span>
                            {text ? (
                              <p className={`verse ${column.textClass}`} lang={column.textLang}>
                                {bindPunctuation(text)}
                              </p>
                            ) : (
                              <p className="verse verse-missing">{column.missing ?? ui.missing}</p>
                            )}
                          </article>
                        );
                      })}
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
          {ui.credits.greek}:{" "}
          <a href="https://github.com/Faithlife/SBLGNT">SBL Greek New Testament</a>, © 2010
          Society of Biblical Literature {ui.credits.and} Logos Bible Software,{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>;{" "}
          {ui.credits.greekNote}.
        </p>
        <p>
          {ui.credits.latin}:{" "}
          <a href="https://github.com/BibleGet-I-O/Clementine-Vulgate">
            Clementine Vulgate Project
          </a>
          , {ui.credits.publicDomain}; {ui.credits.latinNote}. {ui.credits.spanish}:{" "}
          <a href="https://es.wikisource.org/wiki/La_Sagrada_Biblia_(XIII)">
            Torres Amat, 1836
          </a>
          , {ui.credits.publicDomain}. {ui.credits.polish}:{" "}
          <a href="https://pl.wikisource.org/wiki/Biblia_Wujka_(1923)">Biblia Wujka, 1923</a>,{" "}
          {ui.credits.publicDomain}. {ui.credits.english}:{" "}
          <a href="https://ebible.org/find/details.php?id=eng-kjv">
            King James Version, 1769
          </a>{" "}
          {ui.credits.and}{" "}
          <a href="https://ebible.org/find/details.php?id=engDRA">Douay-Rheims, 1899</a>,{" "}
          {ui.credits.publicDomain}.
        </p>
        <img className="colophon" src={sello} alt="JB" width="72" height="72" />
      </footer>

      <dialog
        ref={guideRef}
        className="guide"
        aria-labelledby="guide-title"
        onClick={(event) => {
          // A click on the backdrop lands on the <dialog> itself.
          if (event.target === guideRef.current) {
            guideRef.current.close();
          }
        }}
      >
        <div className="guide-body">
          <h2 id="guide-title">{ui.guideTitle}</h2>
          <ul>
            {[...ui.guideItems, ui.about[currentVernacular.id]].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <form method="dialog">
            <button type="submit" className="text-button">
              {ui.close}
            </button>
          </form>
        </div>
      </dialog>
    </div>
  );
}

export default App;
