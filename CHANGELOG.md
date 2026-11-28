# Changelog

The versions of Euangelia, newest first. The numbers follow [Semantic Versioning](https://semver.org/): a new major number for changes that break addresses or settings, a minor one for new features, a patch for fixes.

## Unreleased

### The site

- The page no longer jumps while it opens. The foot of the page stays out of sight until the texts arrive, instead of showing and then being pushed away; the row of chapters keeps its height before its numbers appear; and the faces of EB Garamond that every page shows are fetched with the page, so the text no longer reflows when the font arrives late.

## 1.2.0 — 2026-11-27

### The reader

- On wider screens the choices at the head of the page lose their headings ("Gospel of the day", "Gospel", "Translation"), as on phones: the buttons name themselves, and screen readers still hear the headings. Thin rules divide today, the Gospels, the translation and the tools, on one line on wide screens and in two rows on narrower ones.
- The commentary is one button, "Commentary", with "Catena Aurea" under it, set apart from the columns by a thin rule.
- The name of the Gospel above the text is set in red capitals, a size above the Greek and Latin titles under it.
- On phones the translation menu is as wide as the chosen translation, and in browsers that allow it, its list opens in the colours of the page.

### The site

- A new foot of the page: the emblem L.D.V.M (_Laus Deo Virginique Matri_) in red, the seal, the author's name with the contact address written out, and the version, which links to the source code. The sources, their licenses and the third-party notices are folded together under "Sources and licenses", one per line with the name of their text, and open with a tap. The page closes with the date of its last revision, written in the language of the interface.
- An address that does not exist gets a short "Page not found" page, in the five languages, with the status 404, instead of the reader. A stylesheet missing for a moment during a deployment can no longer be stored as a copy of the page, which left the site without its styles.
- Browsers keep the site's built files for a day instead of a year, so that a wrong copy cannot outlast a day.
- On iPhone the text keeps its size when the phone is turned sideways.

## 1.1.0 — 2026-11-26

### On phones

- The Gospel text shows on opening the page. The header is shorter and leaves out the sentence of the _Imitation of Christ_; the day's Gospel and the four Gospels share one row; the translation is chosen from a menu.
- The columns and the _Catena Aurea_ open from a "Reading" button, and the text size and the reading guide from an "Aa" button, each in a sheet that rises from the foot of the screen.
- The chapter bar slides away while reading down and comes back on the way up. It stays while it is being used, and the text does not move when it goes.
- More width for the text: a narrower column for the verse numbers and the language codes, and a finer double rule around the text.
- Shorter headings: the chapter in its three languages on one line, the announcement of the day's Gospel with its reference beside it, and the day's choice of Gospels as a menu.

### The reader

- The arrows to the head and to the foot of the page jump most of the way at once and glide over the last screen, instead of scrolling through the whole Gospel.

### The site

- A red ichthys (ΙΧΘΥΣ) as the icon in the browser tab and on a phone's home screen, and as the image shown when a link is shared.
- A new seal at the foot of the page.

## 1.0.0 — 2026-11-26

The first public version.

### The reader

- The four Gospels, verse by verse in parallel columns, with a historical translation in a modern language, the Greek of the SBL Greek New Testament and the Latin of the Clementine Vulgate.
- Translations: Spanish (Torres Amat, 1836), French (Crampon, 1923), Italian (Martini, 1769–1781), Polish (Biblia Wujka, 1923) and English (King James Version, 1769, and Douay-Rheims, 1899).
- A welcome window on the first visit, to choose the language to start in, each named in its own language.
- Under the title, a sentence of the _Imitation of Christ_ in Latin, on Christ, the Gospel or Scripture, different on each visit, with a translation on hover.
- An interface in the language of the chosen translation, with a reading guide.
- Chapter navigation, a chapter and verse typed as "3:16", "3,16" or "3.16", a highlighted verse, addresses that can be shared (`#john/3/16`), and seven text sizes.
- Columns that can be shown or hidden, and loaded only when shown.
- Arrows at the side to go to the head and to the foot of the page.

### The Gospel of the day

- Daily Gospel readings based on the current General Roman Calendar, with Epiphany on January 6 and Ascension and Corpus Christi on Sunday. The reader can browse civil dates from 1583 using the same calendar rules (`#today`, `#2026-11-24`).

### The commentary of the Fathers

- The _Catena Aurea_ of Saint Thomas Aquinas, in the English of the Oxford edition (1841–1845): a dagger marks the verses the Fathers comment on, and their words open under the verse.

### The site

- Published on Cloudflare Pages, with link previews, a home-screen icon, a Content-Security-Policy and long caching for the built files.
