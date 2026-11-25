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
import { CommentaryPanel } from "./Commentary.jsx";
import { DailyHeading, DailyNav } from "./DailyGospel.jsx";
import { useCatena, useGospelData, useLectionary } from "./data.js";
import ParallelReader from "./ParallelReader.jsx";
import { ScrollArrows } from "./ScrollArrows.jsx";
import { UI } from "./i18n.js";
import { lectionaryEntry, liturgicalDay, todayISO } from "./liturgy.js";
import { COLUMN_WORDS, LITURGY } from "./liturgyText.js";
import {
  loadSettings,
  parseLocation,
  saveSettings,
  writeDailyLocation,
  writeLocation,
} from "./settings.js";
import { parseReference, toGreekNumeral, toRomanNumeral } from "./text.js";

const NO_VERSES = [];

// Whether a row lies within one of a reading's [chapter, verse, chapter, verse] ranges.
function inSegments(row, segments) {
  return segments.some(
    ([c1, v1, c2, v2]) =>
      (row.chapter > c1 || (row.chapter === c1 && row.verse >= v1)) &&
      (row.chapter < c2 || (row.chapter === c2 && row.verse <= v2)),
  );
}

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
  // An address decides the view; without one, the page opens as it was left.
  const daily = place ? Boolean(place.daily) : settings.view === "daily";
  return {
    ...settings,
    view: daily ? "daily" : "reader",
    date: place?.daily ? place.date : null,
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
  // "reader": a whole Gospel; "daily": the Gospel of a day.
  const [view, setView] = useState(initial.view);
  // The commentary of the Fathers (the Catena Aurea) beside the verses.
  const [showCatena, setShowCatena] = useState(initial.catena);
  // The verse whose commentary is open: { gospel, index } of its row.
  const [openNote, setOpenNote] = useState(null);
  // The day whose Gospel is read; null is today.
  const [dailyDate, setDailyDate] = useState(initial.date);
  // Which of the day's Gospels is shown; null is the one the Lectionary puts first.
  const [chosenOption, setChosenOption] = useState(null);
  const navRef = useRef(null);
  const chipsRef = useRef(null);
  const guideRef = useRef(null);
  const dailyHeadingRef = useRef(null);
  const mainRef = useRef(null);
  // A place to scroll to once its Gospel has loaded (from the address).
  const pendingPlaceRef = useRef(initial.view === "reader" ? initial.place : null);

  const currentVernacular = VERNACULARS.find(
    (vernacular) => vernacular.id === selectedVernacular,
  );
  const ui = UI[currentVernacular.lang];
  const words = LITURGY[currentVernacular.lang];

  const isDaily = view === "daily";
  const today = todayISO();
  const shownDate = dailyDate ?? today;
  const lectionary = useLectionary(isDaily);
  const day = isDaily ? liturgicalDay(shownDate) : null;
  const entry = day && lectionary.entries ? lectionaryEntry(lectionary.entries, day) : null;
  const optionIndex = chosenOption ?? entry?.main ?? 0;
  const reading = entry?.options[optionIndex] ?? null;

  // The Gospel on the page: the chosen one, or the day's reading.
  const shownGospel = isDaily ? (reading?.gospel ?? null) : selectedGospel;
  const currentGospel = GOSPELS.find((gospel) => gospel.id === (shownGospel ?? selectedGospel));
  const gospelName = ui.gospels[selectedGospel];

  // Only the texts of the visible columns are downloaded. Greek and Latin
  // columns are named after their files; the vernacular column reads the
  // selected translation.
  const textNames = columns.map((id) => (id === "vernacular" ? currentVernacular.id : id));
  const data = useGospelData(shownGospel, textNames);
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
    // The Gospel and the view are dependencies too: a Gospel already loaded
    // is ready at once.
  }, [allTextsShown, selectedGospel, view]);

  // An address edited by hand, or back/forward between shared links, or a
  // link on the page ("Read it in context").
  useEffect(() => {
    const onHashChange = () => {
      const place = parseLocation(window.location.hash);
      if (!place) {
        return;
      }
      if (place.daily) {
        if (view !== "daily") {
          window.scrollTo({ top: 0 });
        }
        setView("daily");
        setDailyDate(place.date);
        setChosenOption(null);
        setTarget(null);
        return;
      }
      setTarget(place.verse ? { chapter: place.chapter, verse: place.verse } : null);
      if (view === "daily") {
        // The reader is not on the page yet: scroll once it is.
        setView("reader");
        pendingPlaceRef.current = place.chapter ? place : null;
        setSelectedGospel(place.gospel);
        if (!place.chapter) {
          window.scrollTo({ top: 0 });
        }
        return;
      }
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
  }, [selectedGospel, view]);

  useEffect(() => {
    saveSettings({
      gospel: selectedGospel,
      vernacular: selectedVernacular,
      columns,
      fontScale,
      welcomed,
      view,
      catena: showCatena,
    });
  }, [selectedGospel, selectedVernacular, columns, fontScale, welcomed, view, showCatena]);

  const pageTitle = isDaily ? words.title : gospelName.full;
  useEffect(() => {
    document.documentElement.lang = currentVernacular.lang;
    document.title = `${pageTitle} · Euangelion`;
  }, [currentVernacular.lang, pageTitle]);

  // Sticky column headers and scroll targets sit below the sticky nav.
  useEffect(() => {
    const nav = navRef.current;
    const observer = new ResizeObserver(() => {
      document.documentElement.style.setProperty("--nav-height", `${nav.offsetHeight}px`);
    });
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);

  const rows = useMemo(
    () =>
      (data.verses ?? NO_VERSES).map(([chapter, verse], index) => ({ chapter, verse, index })),
    [data.verses],
  );

  // Each chapter once, in reading order.
  const chapters = useMemo(() => [...new Set(rows.map((row) => row.chapter))], [rows]);
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

  // The day's reading: its verses, and its announcement in each column's language.
  const dailyRows = useMemo(
    () => (reading ? rows.filter((row) => inSegments(row, reading.segments)) : NO_VERSES),
    [rows, reading],
  );
  const pericopeHeading = reading
    ? visibleColumns.map((column) => {
        const columnWords = column.id === "vernacular" ? words : COLUMN_WORDS[column.textLang];
        return {
          lang: column.textLang,
          title: columnWords.incipit[reading.gospel],
          reference: `${columnWords.books[reading.gospel]} ${columnWords.reference(reading.ref)}`,
        };
      })
    : null;

  // The Catena's words on the shown verses, each under the first verse of its
  // passage that is on the page (a day's reading may begin within a passage).
  const catena = useCatena(shownGospel, showCatena);
  const shownRows = isDaily ? dailyRows : rows;
  const notesByRow = useMemo(() => {
    if (!catena || !data.verses) {
      return null;
    }
    const position = new Map(data.verses.map(([c, v], index) => [`${c}:${v}`, index]));
    const shown = new Set(shownRows.map((row) => row.index));
    const byRow = new Map();
    for (const [father, c1, v1, c2, v2, cite, paragraphs] of catena.comments) {
      const first = position.get(`${c1}:${v1}`);
      const last = position.get(`${c2}:${v2}`);
      for (let index = first; index <= last; index += 1) {
        if (shown.has(index)) {
          const comment = {
            father: catena.fathers[father],
            start: [c1, v1],
            end: [c2, v2],
            cite,
            paragraphs,
          };
          byRow.set(index, [...(byRow.get(index) ?? []), comment]);
          break;
        }
      }
    }
    return byRow;
  }, [catena, data.verses, shownRows]);

  // "Mt 5, 14-16" in the interface language.
  function passageReference(start, end) {
    const [c1, v1] = start;
    const [c2, v2] = end;
    const ref =
      c1 !== c2 ? `${c1}:${v1}-${c2}:${v2}` : v1 !== v2 ? `${c1}:${v1}-${v2}` : `${c1}:${v1}`;
    return `${words.books[shownGospel]} ${words.reference(ref)}`;
  }

  const notes = notesByRow && {
    label: (row) =>
      notesByRow.has(row.index)
        ? ui.catena.open(passageReference([row.chapter, row.verse], [row.chapter, row.verse]))
        : null,
    open: openNote?.gospel === shownGospel ? openNote.index : null,
    onToggle: (row) =>
      setOpenNote((open) =>
        open?.gospel === shownGospel && open.index === row.index
          ? null
          : { gospel: shownGospel, index: row.index },
      ),
    render: (row) => (
      <CommentaryPanel
        lang={currentVernacular.lang}
        comments={notesByRow.get(row.index)}
        reference={passageReference}
        words={ui.catena}
        onClose={() => setOpenNote(null)}
      />
    ),
  };

  const loadError = data.error || (isDaily && lectionary.error);
  const isLoading =
    !loadError &&
    (visibleColumns.length === 0 || (isDaily && (!reading || dailyRows.length === 0)));

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
    if (id === selectedGospel && !isDaily) {
      return;
    }
    setView("reader");
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

  // The Gospel of a day; null is today.
  function openDay(date) {
    const next = date === today ? null : date;
    setView("daily");
    setDailyDate(next);
    setChosenOption(null);
    setTarget(null);
    writeDailyLocation(next);
    // From a Gospel, the day opens at the top; from another day, back to the
    // top of the reading if the reader had scrolled into it.
    const heading = dailyHeadingRef.current;
    if (!isDaily) {
      window.scrollTo({ top: 0 });
    } else if (heading && heading.getBoundingClientRect().top < 0) {
      heading.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
    }
  }

  function toggleVerse(verse) {
    // A click that ends a text selection is not a request to highlight.
    if (window.getSelection()?.toString()) {
      return;
    }
    const isTarget = target?.chapter === verse.chapter && target?.verse === verse.verse;
    setTarget(isTarget ? null : { chapter: verse.chapter, verse: verse.verse });
    // The address of the day's Gospel names the day, not a verse.
    if (!isDaily) {
      writeLocation(selectedGospel, verse.chapter, isTarget ? null : verse.verse);
    }
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
        <p className="masthead-title">{pageTitle}</p>
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
              <button
                type="button"
                className="segment"
                aria-pressed={isDaily}
                onClick={() => openDay(today)}
              >
                {words.today}
              </button>
              {GOSPELS.map((gospel) => (
                <button
                  key={gospel.id}
                  type="button"
                  className="segment"
                  aria-pressed={!isDaily && selectedGospel === gospel.id}
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

      <nav ref={navRef} className="reader-nav" aria-label={pageTitle}>
        {isDaily ? (
          <DailyNav lang={currentVernacular.lang} date={shownDate} today={today} onGoTo={openDay} />
        ) : (
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
        )}

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

          <span id="commentary-label" className="nav-label">
            {ui.catena.group}
          </span>
          <div className="segmented column-toggles" role="group" aria-labelledby="commentary-label">
            <button
              type="button"
              className="segment"
              aria-pressed={showCatena}
              onClick={() => {
                setShowCatena((shown) => !shown);
                setOpenNote(null);
              }}
            >
              <span className="check" aria-hidden="true">
                {showCatena ? "✓" : ""}
              </span>
              Catena Aurea
            </button>
          </div>
        </div>
      </nav>

      <main
        ref={mainRef}
        className={`reader ${visibleColumns.length > 1 ? "is-multi" : "is-single"}`}
      >
        {loadError ? (
          <p className="status-message">{ui.loadError}</p>
        ) : isLoading ? (
          <p className="status-message">{ui.loading}</p>
        ) : isDaily ? (
          <>
            <div ref={dailyHeadingRef} className="daily-heading-anchor">
              <DailyHeading
                lang={currentVernacular.lang}
                day={day}
                entry={entry}
                chosen={optionIndex}
                onChoose={(index) => {
                  setChosenOption(index);
                  setTarget(null);
                }}
                contextHref={`#${reading.gospel}/${dailyRows[0].chapter}/${dailyRows[0].verse}`}
              />
            </div>
            <ParallelReader
              rows={dailyRows}
              columns={visibleColumns}
              target={target}
              onToggleVerse={toggleVerse}
              missing={ui.missing}
              heading={pericopeHeading}
              notes={notes}
            />
          </>
        ) : (
          <ParallelReader
            rows={rows}
            columns={visibleColumns}
            target={target}
            onToggleVerse={toggleVerse}
            missing={ui.missing}
            notes={notes}
          />
        )}
      </main>

      <ScrollArrows endRef={mainRef} words={ui.scroll} />

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
          {ui.credits.publicDomain}. {ui.credits.french}:{" "}
          <a href="https://fr.wikisource.org/wiki/Bible_Crampon_1923">Bible Crampon, 1923</a>,{" "}
          {ui.credits.publicDomain}. {ui.credits.italian}:{" "}
          <a href="https://parolaviva.art/bibbia">Bibbia Martini, 1769–1781</a>,{" "}
          {ui.credits.publicDomain}; {ui.credits.digitalText}{" "}
          <a href="https://parolaviva.art/opendata">Parola Viva</a> (Giovanni Novelli),{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.{" "}
          {ui.credits.english}:{" "}
          <a href="https://ebible.org/find/details.php?id=eng-kjv">
            King James Version, 1769
          </a>{" "}
          {ui.credits.and}{" "}
          <a href="https://ebible.org/find/details.php?id=engDRA">Douay-Rheims, 1899</a>,{" "}
          {ui.credits.publicDomain}.
        </p>
        <p>
          {ui.credits.commentary}:{" "}
          <a href="https://github.com/HistoricalChristianFaith/Writings-Database">
            Catena Aurea, Oxford 1841–1845
          </a>
          , {ui.credits.publicDomain}; {ui.credits.digitalText} HistoricalChristianFaith{" "}
          {ui.credits.and} <a href="https://ccel.org/ccel/aquinas/catena1">CCEL</a>.
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
