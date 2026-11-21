import { useEffect, useMemo, useState } from "react";
import "./App.css";

const GOSPELS = [
  {
    id: "matthew",
    label: "Matthew",
    heading: "Κατὰ Ματθαῖον",
    subheading: "Secundum Matthaeum",
    available: false,
  },
  {
    id: "mark",
    label: "Mark",
    heading: "Κατὰ Μᾶρκον",
    subheading: "Secundum Marcum",
    available: false,
  },
  {
    id: "luke",
    label: "Luke",
    heading: "Κατὰ Λουκᾶν",
    subheading: "Secundum Lucam",
    available: false,
  },
  {
    id: "john",
    label: "John",
    heading: "Κατὰ Ἰωάννην",
    subheading: "Secundum Ioannem",
    available: true,
  },
];

const VERNACULARS = [
  { id: "spanish", label: "Español", field: "spanish", lang: "es", available: true },
  { id: "english", label: "English", field: "english", lang: "en", available: false },
  { id: "german", label: "Deutsch", field: "german", lang: "de", available: false },
  { id: "polski", label: "Polski", field: "polski", lang: "pl", available: true },
];

// Greek labels set in capitals use lang="el": browsers only drop accents and
// breathings when uppercasing for "el" ("Κατὰ" → "ΚΑΤΑ"), not for "grc".
const GREEK_CAPS_LANG = "el";
const GREEK_TEXT_LANG = "grc";
const LATIN_LANG = "la";

// The Latin edition puts a space before : ; ? (French style). A no-break
// space keeps the mark from starting a new line.
function bindPunctuation(text) {
  return text.replace(/ ([:;!?])/g, " $1");
}

const CHAPTER_LABELS = {
  spanish: "Capítulo",
  english: "Chapter",
  german: "Kapitel",
  polski: "Rozdział",
  greek: "Κεφάλαιον",
  latin: "Caput",
};

function toRomanNumeral(number) {
  const numerals = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];

  let value = number;
  let result = "";

  for (const [arabic, roman] of numerals) {
    while (value >= arabic) {
      result += roman;
      value -= arabic;
    }
  }

  return result || String(number);
}

function toGreekNumeral(number) {
  const greekOnes = ["", "α", "β", "γ", "δ", "ε", "ϛ", "ζ", "η", "θ"];
  const greekTens = ["", "ι", "κ", "λ", "μ", "ν", "ξ", "ο", "π", "ϟ"];
  const greekHundreds = ["", "ρ", "σ", "τ", "υ", "φ", "χ", "ψ", "ω", "ϡ"];

  if (!Number.isInteger(number) || number <= 0 || number >= 1000) {
    return String(number);
  }

  const hundreds = Math.floor(number / 100);
  const tens = Math.floor((number % 100) / 10);
  const ones = number % 10;

  return `ʹ${greekHundreds[hundreds]}${greekTens[tens]}${greekOnes[ones]}`.replace(
    "ʹ",
    "",
  ).concat("ʹ");
}

function App() {
  const [selectedGospel, setSelectedGospel] = useState("john");
  const [selectedVernacular, setSelectedVernacular] = useState("spanish");
  const [verses, setVerses] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedVerse, setSelectedVerse] = useState(1);
  const [jumpChapterInput, setJumpChapterInput] = useState("1");
  const [jumpVerseInput, setJumpVerseInput] = useState("1");
  const [fontScale, setFontScale] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const currentGospel = GOSPELS.find((gospel) => gospel.id === selectedGospel);
  const currentVernacular = VERNACULARS.find(
    (vernacular) => vernacular.id === selectedVernacular,
  );

  useEffect(() => {
    setIsLoading(true);
    fetch(`/data/${selectedGospel}.json`)
      .then((response) => response.json())
      .then((data) => {
        setVerses(data);
        setSelectedChapter(1);
        setSelectedVerse(1);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedGospel]);

  const chapters = useMemo(() => {
    return [...new Set(verses.map((verse) => verse.chapter))];
  }, [verses]);

  const chapterVerses = useMemo(() => {
    return verses.filter((verse) => verse.chapter === selectedChapter);
  }, [selectedChapter, verses]);

  const chapterGroups = useMemo(() => {
    return chapters.map((chapter) => ({
      chapter,
      verses: verses.filter((verse) => verse.chapter === chapter),
    }));
  }, [chapters, verses]);

  useEffect(() => {
    if (!chapterVerses.length) {
      return;
    }

    const hasSelectedVerse = chapterVerses.some(
      (verse) => verse.verse === selectedVerse,
    );

    if (!hasSelectedVerse) {
      setSelectedVerse(chapterVerses[0].verse);
    }
  }, [chapterVerses, selectedVerse]);

  useEffect(() => {
    setJumpChapterInput(String(selectedChapter));
    setJumpVerseInput(String(selectedVerse));
  }, [selectedVerse, selectedChapter]);

  function jumpToChapter(chapterNumber) {
    if (!chapters.length) {
      return;
    }

    const minChapter = chapters[0];
    const maxChapter = chapters[chapters.length - 1];
    const boundedChapter = Math.min(maxChapter, Math.max(minChapter, chapterNumber));

    setSelectedChapter(boundedChapter);
    setSelectedVerse(1);
    setJumpChapterInput(String(boundedChapter));
    document
      .getElementById(`chapter-${boundedChapter}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function jumpToVerse(verseNumber) {
    if (!chapterVerses.length) {
      return;
    }

    const minVerse = chapterVerses[0].verse;
    const maxVerse = chapterVerses[chapterVerses.length - 1].verse;
    const boundedVerse = Math.min(maxVerse, Math.max(minVerse, verseNumber));

    setSelectedVerse(boundedVerse);
    setJumpVerseInput(String(boundedVerse));
    document
      .getElementById(`verse-${selectedChapter}-${boundedVerse}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div
      className="app-shell"
      style={{
        "--reader-font-scale": fontScale,
      }}
    >
      <nav className="gospel-topbar" aria-label="Gospel selection">
        <div className="gospel-list">
          {GOSPELS.map((gospel) => (
            <button
              key={gospel.id}
              type="button"
              className={`gospel-link ${selectedGospel === gospel.id ? "is-active" : ""}`}
              aria-pressed={selectedGospel === gospel.id}
              disabled={!gospel.available}
              onClick={() => {
                setSelectedGospel(gospel.id);
              }}
            >
              <span className="gospel-heading" lang={GREEK_CAPS_LANG}>
                {gospel.heading}
              </span>
              <span className="gospel-subheading" lang={LATIN_LANG}>
                {gospel.subheading}
              </span>
            </button>
          ))}
        </div>
      </nav>

      <main className="app">
        <header className="page-header">
          <h1 lang={LATIN_LANG}>Evangelium Heptaglotton</h1>
          <p className="folio-subtitle">The Gospel according to Saint {currentGospel?.label}</p>
        </header>

        <div className="reader-controls">
          <div className="reader-controls-left">
            <div className="control-group vernacular-group">
              <div className="vernacular-list" role="group" aria-label="Vernacular selection">
                {VERNACULARS.map((vernacular) => (
                  <button
                    key={vernacular.id}
                    type="button"
                    className={`vernacular-button ${
                      selectedVernacular === vernacular.id ? "is-active" : ""
                    }`}
                    lang={vernacular.lang}
                    aria-pressed={selectedVernacular === vernacular.id}
                    disabled={!vernacular.available}
                    onClick={() => {
                      setSelectedVernacular(vernacular.id);
                    }}
                  >
                    {vernacular.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="control-group">
              <span>Jump to chapter</span>
              <div className="jump-controls">
                <input
                  className="reader-input"
                  type="number"
                  min={chapters[0] ?? 1}
                  max={chapters[chapters.length - 1] ?? 1}
                  value={jumpChapterInput}
                  onChange={(event) => {
                    setJumpChapterInput(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      jumpToChapter(Number(jumpChapterInput));
                    }
                  }}
                />
                <button
                  type="button"
                  className="jump-button"
                  onClick={() => {
                    jumpToChapter(Number(jumpChapterInput));
                  }}
                >
                  Go
                </button>
              </div>
            </label>

            <label className="control-group">
              <span>Jump to verse</span>
              <div className="jump-controls">
                <input
                  className="reader-input"
                  type="number"
                  min={chapterVerses[0]?.verse ?? 1}
                  max={chapterVerses[chapterVerses.length - 1]?.verse ?? 1}
                  value={jumpVerseInput}
                  onChange={(event) => {
                    setJumpVerseInput(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      jumpToVerse(Number(jumpVerseInput));
                    }
                  }}
                />
                <button
                  type="button"
                  className="jump-button"
                  onClick={() => {
                    jumpToVerse(Number(jumpVerseInput));
                  }}
                >
                  Go
                </button>
              </div>
            </label>
          </div>

          <div className="reader-controls-right">
            <div className="control-group text-size-group">
              <span>Text size</span>
              <div className="size-buttons" role="group" aria-label="Text size controls">
                <button
                  type="button"
                  className="size-button"
                  aria-label="Decrease text size"
                  onClick={() => {
                    setFontScale((currentScale) => Math.max(0.85, currentScale - 0.1));
                  }}
                >
                  −
                </button>
                <button
                  type="button"
                  className="size-button"
                  aria-label="Increase text size"
                  onClick={() => {
                    setFontScale((currentScale) => Math.min(1.5, currentScale + 0.1));
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <p className="loading-state">Setting the folio...</p>
        ) : (
          <div className="parallel-reader">
            <div className="folio-rule" aria-hidden="true" />
            <div className="parallel-header" lang={currentVernacular?.lang}>
              {currentVernacular?.label}
            </div>
            <div className="parallel-header" lang={GREEK_CAPS_LANG}>
              Ελληνικά
            </div>
            <div className="parallel-header" lang={LATIN_LANG}>
              Latina
            </div>

            {chapterGroups.map((group) => (
              <div key={`chapter-${group.chapter}`} className="chapter-section">
                <div id={`chapter-${group.chapter}`} className="chapter-divider">
                  <span lang={currentVernacular?.lang}>
                    {CHAPTER_LABELS[selectedVernacular] || "Chapter"} {group.chapter}
                  </span>
                  <span lang={GREEK_CAPS_LANG}>
                    {CHAPTER_LABELS.greek} {toGreekNumeral(group.chapter)}
                  </span>
                  <span lang={LATIN_LANG}>
                    {CHAPTER_LABELS.latin} {toRomanNumeral(group.chapter)}
                  </span>
                </div>

                {group.verses.map((verse) => (
                  <div
                    key={`verse-${verse.chapter}-${verse.verse}`}
                    id={`verse-${verse.chapter}-${verse.verse}`}
                    className={`parallel-verse-row ${
                      selectedChapter === verse.chapter && selectedVerse === verse.verse
                        ? "is-target"
                        : ""
                    }`}
                  >
                    <article className="parallel-cell">
                      <span className="verse-number">{verse.verse}</span>
                      <p className="verse vernacular-text" lang={currentVernacular?.lang}>
                        {bindPunctuation(verse[currentVernacular?.field] || "—")}
                      </p>
                    </article>

                    <article className="parallel-cell">
                      <span className="verse-number">{verse.verse}</span>
                      <p className="verse greek-text" lang={GREEK_TEXT_LANG}>
                        {bindPunctuation(verse.greek || "—")}
                      </p>
                    </article>

                    <article className="parallel-cell">
                      <span className="verse-number">{verse.verse}</span>
                      <p className="verse latin-text" lang={LATIN_LANG}>
                        {bindPunctuation(verse.latin || "—")}
                      </p>
                    </article>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
