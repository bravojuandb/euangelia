import { COLUMN_IDS, FONT_SCALES, GOSPEL_IDS, VERNACULARS } from "./config.js";

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

function browserVernacular() {
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language];
  const match = VERNACULARS.find((vernacular) =>
    languages.some((language) => language?.toLowerCase().startsWith(vernacular.lang)),
  );
  return (match ?? VERNACULARS[0]).id;
}

// Stored settings are validated: an old or hand-edited value falls back to the default.
export function loadSettings() {
  const stored = readStorage();
  const columns = COLUMN_IDS.filter((id) => stored.columns?.includes(id));
  return {
    gospel: GOSPEL_IDS.includes(stored.gospel) ? stored.gospel : "john",
    vernacular: VERNACULARS.some((v) => v.id === stored.vernacular)
      ? stored.vernacular
      : browserVernacular(),
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
