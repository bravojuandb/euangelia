// Interface names of the Gospels live in i18n.js; these are the Greek and
// Latin titles shown in the masthead.
export const GOSPELS = [
  { id: "matthew", heading: "Κατὰ Ματθαῖον", subheading: "Secundum Matthaeum" },
  { id: "mark", heading: "Κατὰ Μᾶρκον", subheading: "Secundum Marcum" },
  { id: "luke", heading: "Κατὰ Λουκᾶν", subheading: "Secundum Lucam" },
  { id: "john", heading: "Κατὰ Ἰωάννην", subheading: "Secundum Ioannem" },
];

export const GOSPEL_IDS = GOSPELS.map((gospel) => gospel.id);

// `field` is the key of the text in public/data/<gospel>.json; `lang` also
// selects the interface language in i18n.js.
export const VERNACULARS = [
  { id: "spanish", label: "Español", field: "spanish", lang: "es" },
  { id: "english", label: "English", field: "english", lang: "en" },
  { id: "polski", label: "Polski", field: "polski", lang: "pl" },
];

// For a browser in a language without a translation here.
export const FALLBACK_VERNACULAR = "english";

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
