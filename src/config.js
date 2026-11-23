export const GOSPELS = [
  {
    id: "matthew",
    label: "Matthew",
    heading: "Κατὰ Ματθαῖον",
    subheading: "Secundum Matthaeum",
    available: true,
  },
  {
    id: "mark",
    label: "Mark",
    heading: "Κατὰ Μᾶρκον",
    subheading: "Secundum Marcum",
    available: true,
  },
  {
    id: "luke",
    label: "Luke",
    heading: "Κατὰ Λουκᾶν",
    subheading: "Secundum Lucam",
    available: true,
  },
  {
    id: "john",
    label: "John",
    heading: "Κατὰ Ἰωάννην",
    subheading: "Secundum Ioannem",
    available: true,
  },
];

export const VERNACULARS = [
  { id: "spanish", label: "Español", field: "spanish", lang: "es", available: true },
  { id: "english", label: "English", field: "english", lang: "en", available: false },
  { id: "german", label: "Deutsch", field: "german", lang: "de", available: false },
  { id: "polski", label: "Polski", field: "polski", lang: "pl", available: true },
];

export const CHAPTER_LABELS = {
  spanish: "Capítulo",
  english: "Chapter",
  german: "Kapitel",
  polski: "Rozdział",
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

export const FONT_SCALE = { min: 0.85, max: 1.5, step: 0.1 };
