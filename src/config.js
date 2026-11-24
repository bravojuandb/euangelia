// Interface names of the Gospels live in i18n.js; these are the Greek and
// Latin titles shown in the masthead.
export const GOSPELS = [
  { id: "matthew", heading: "Κατὰ Ματθαῖον", subheading: "Secundum Matthaeum" },
  { id: "mark", heading: "Κατὰ Μᾶρκον", subheading: "Secundum Marcum" },
  { id: "luke", heading: "Κατὰ Λουκᾶν", subheading: "Secundum Lucam" },
  { id: "john", heading: "Κατὰ Ἰωάννην", subheading: "Secundum Ioannem" },
];

export const GOSPEL_IDS = GOSPELS.map((gospel) => gospel.id);

// The translations offered for the first column. `id` names the text's file,
// public/data/<gospel>/<id>.json; `lang` also selects the interface language
// in i18n.js. A language with several translations gets one button with a
// menu of them, and the chosen one's `edition` shows under its name. `note`
// heads the column and names the translation in the menu. The first
// translation of a language is the one a browser in that language starts with.
export const VERNACULARS = [
  { id: "torres-amat", label: "Español", note: "Torres Amat, 1836", lang: "es" },
  { id: "kjv", label: "English", edition: "KJV", note: "King James Version", lang: "en" },
  {
    id: "douay-rheims",
    label: "English",
    edition: "Douay-Rheims",
    note: "Douay-Rheims, 1899",
    lang: "en",
  },
  { id: "wujek", label: "Polski", note: "Biblia Wujka, 1923", lang: "pl" },
];

// The translations grouped by language, in the order above, for the buttons.
export const VERNACULAR_LANGUAGES = VERNACULARS.reduce((languages, vernacular) => {
  const language = languages.find((entry) => entry.lang === vernacular.lang);
  if (language) {
    language.translations.push(vernacular);
  } else {
    languages.push({ lang: vernacular.lang, label: vernacular.label, translations: [vernacular] });
  }
  return languages;
}, []);

// For a browser in a language without a translation here.
export const FALLBACK_VERNACULAR = "kjv";

// Translation ids used before a language could have more than one, as they
// may still be stored in a reader's browser.
export const FORMER_VERNACULAR_IDS = {
  spanish: "torres-amat",
  english: "kjv",
  polski: "wujek",
};

export const COLUMN_IDS = ["vernacular", "greek", "latin"];

export const CHAPTER_LABELS = {
  greek: "Κεφάλαιον",
  latin: "Caput",
};

// Greek set in capitals uses lang="el": browsers only drop accents and
// breathings when uppercasing for "el" ("Κατὰ" → "ΚΑΤΑ"), not for "grc".
export const LANG = {
  greekCaps: "el",
  greekText: "grc",
  latin: "la",
};

export const FONT_SCALES = [0.85, 0.92, 1, 1.1, 1.2, 1.35, 1.5];
