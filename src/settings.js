import {
  COLUMN_IDS,
  FALLBACK_VERNACULAR,
  FONT_SCALES,
  FORMER_VERNACULAR_IDS,
  GOSPEL_IDS,
  VERNACULARS,
} from "./config.js";

const STORAGE_KEY = "euangelion:settings";

function readStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Private browsing or storage disabled: settings last for this visit only.
  }
}

// The first of the browser's languages, in the reader's order of preference,
// that has a translation here.
function browserVernacular() {
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const language of languages) {
    const code = language?.toLowerCase().split("-")[0];
    const match = VERNACULARS.find((vernacular) => vernacular.lang === code);
    if (match) {
      return match.id;
    }
  }
  return FALLBACK_VERNACULAR;
}

// Stored settings are validated: an old or hand-edited value falls back to the default.
export function loadSettings() {
  const stored = readStorage();
  const columns = COLUMN_IDS.filter((id) => stored.columns?.includes(id));
  const vernacular = FORMER_VERNACULAR_IDS[stored.vernacular] ?? stored.vernacular;
  return {
    gospel: GOSPEL_IDS.includes(stored.gospel) ? stored.gospel : "john",
    vernacular: VERNACULARS.some((v) => v.id === vernacular) ? vernacular : browserVernacular(),
    columns: columns.length ? columns : COLUMN_IDS,
    fontScale: FONT_SCALES.includes(stored.fontScale) ? stored.fontScale : 1,
    welcomed: stored.welcomed === true,
  };
}

// The address names the place being read: "#john", "#john/3" or "#john/3/16".
export function parseLocation(hash) {
  const [gospel, chapter, verse] = hash.replace(/^#/, "").split("/");
  if (!GOSPEL_IDS.includes(gospel)) {
    return null;
  }
  const number = (part) => (/^[1-9]\d{0,2}$/.test(part ?? "") ? Number(part) : null);
  const chapterNumber = number(chapter);
  return {
    gospel,
    chapter: chapterNumber,
    verse: chapterNumber ? number(verse) : null,
  };
}

export function writeLocation(gospel, chapter = null, verse = null) {
  const parts = [gospel, chapter, chapter ? verse : null].filter((part) => part != null);
  history.replaceState(null, "", `#${parts.join("/")}`);
}
