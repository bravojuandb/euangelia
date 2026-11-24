# Euangelion

A parallel reader for the Gospels: a vernacular translation, the Greek text and the Latin text side by side, verse by verse.

The four Gospels are available, complete, in Greek, Latin, Spanish, Polish and English.

The interface follows the chosen translation (Spanish, English or Polish); a browser in another language gets English.

## Development

```sh
npm install
npm run dev     # start the dev server
npm run build   # production build in dist/
npm run lint
```

The texts live in `public/data/<gospel>.json`, one entry per verse:

```json
{ "book": "John", "chapter": 1, "verse": 1, "greek": "…", "latin": "…", "spanish": "…", "polski": "…", "english": "…" }
```

### Regenerating the data

The data files are built from the sources below with Python 3.9+ (standard library only):

```sh
python3 scripts/fetch_sources.py        # download into scripts/sources/ (not committed)
python3 scripts/build_data.py --check   # report: renumbering, gaps, length outliers
python3 scripts/build_data.py           # write public/data/*.json
```

The GitHub sources are pinned to a commit; the Wikisource pages and the eBible.org KJV are fetched as currently published. Every re-numbering and correction described below is listed per book in [scripts/build_data.py](scripts/build_data.py), and the build stops if one no longer matches the text.

## Text sources

| Column  | Edition | Source | License |
| ------- | ------- | ------ | ------- |
| Greek   | SBL Greek New Testament (SBLGNT) v1.2, ed. Michael W. Holmes | [Faithlife/SBLGNT](https://github.com/Faithlife/SBLGNT) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| Latin   | Clementine Vulgate (1592), Clementine Vulgate Project text, digitized by Michael Tweedale | [BibleGet-I-O/Clementine-Vulgate](https://github.com/BibleGet-I-O/Clementine-Vulgate) (`src/utf8/{Mt,Mc,Lc,Jo}.lat`) | Public domain |
| Spanish | La Sagrada Biblia, tr. Félix Torres Amat, vol. XIII (1836) | [es.wikisource.org](https://es.wikisource.org/wiki/La_Sagrada_Biblia_(XIII)) | Public domain |
| Polish  | Biblia Wujka, 1923 edition | [pl.wikisource.org](https://pl.wikisource.org/wiki/Biblia_Wujka_(1923)) | Public domain |
| English | King James Version (1611), standard text of 1769 | [eBible.org](https://ebible.org/find/details.php?id=eng-kjv) (`eng-kjv_usfm.zip`) | Public domain (outside the UK, where printing it is under Crown letters patent) |

The SBLGNT is copyright 2010 by the Society of Biblical Literature and Logos Bible Software. Here its variation-unit signs (⸀ ⸁ ⸂ ⸃ ⸄ ⸅) are removed, since the apparatus is not included; the double brackets ⟦ ⟧ are kept because they mark passages as later additions (the shorter ending after Mark 16:8, Mark 16:9–20 and John 7:53–8:11). As a critical text it omits Matthew 17:21, 18:11, 23:14; Mark 7:16, 9:44, 9:46, 11:26, 15:28; Luke 17:36, 23:17; and John 5:4, so those verses have no Greek.

The Clementine Vulgate Project asks users to acknowledge the source and state their changes: here its layout marks for poetry, line breaks and paragraphs (`[ ] / \`) are removed, and `œ` characters damaged by a Windows-1252 conversion are restored.

The Spanish text is the Wikisource transcription of the 1836 edition, with its orthography (*á*, *Jesus*, *habia*). The words Torres Amat printed in italics as his own additions are kept as plain text. Where the transcription has no verse anchor or a mistyped one, verses are numbered in sequence. 26 transcription slips are corrected against the scans (stray apostrophes and braces, `=` for `?`, `a]` for `al`, words split at a line end, a speck read as `:—`), and the dashes that close some paragraphs are dropped. The 1836 printing itself skips from Matthew 14:11 "…en una fuente," to 14:13, so the rest of 14:11 and all of 14:12 are missing in Spanish.

The Polish text is kept as transcribed on Wikisource, including the 1923 orthography (e.g. *jéj*, *woléj*). Where Wikisource marks a misprint, the corrected form is used. Chapter numbers are taken from the sequence of verses, since a few anchors carry the previous chapter's number.

The English text is the eBible.org USFM edition of the KJV. Its markup is removed: Strong's numbers, the paragraph signs (¶), and the styles for words in italics (added by the translators), words of Jesus and LORD are kept as plain text. The KJV was translated from the Greek Textus Receptus, so in places it has words the SBLGNT omits (e.g. Matthew 27:35, Luke 9:55–56).

Rows follow the Greek verse numbering, which the KJV shares. The Latin and Spanish texts use the Vulgate numbering and are re-keyed where it differs:

- Matthew 17:14 is split into 17:14–15 (17:15–26 become 17:16–27).
- Mark 4:40 is split into 4:40–41, and Mark 8:39 becomes 9:1 (9:1–49 become 9:2–50; the Polish text follows the Vulgate here too).
- John 6:51–52 form 6:51 (6:53–72 become 6:52–71), and John 11:56 is split into 11:56–57.

The Polish transcription splits Luke 3:28, 4:42 and 19:47 into two verses each; they are joined again. In a few places the Vulgate ends a verse a few words earlier or later than the Greek (e.g. Luke 1:32–33, 9:42–44; Matthew 15:5–6, 16:2–3), so a phrase may sit in the neighbouring row.
Nácar-Colunga, Bover-Cantera and the Biblia de Navarra were considered for Spanish but are still under copyright.

The typeface is [EB Garamond](https://github.com/octaviopardo/EBGaramond12) (SIL Open Font License 1.1), bundled through [Fontsource](https://fontsource.org/fonts/eb-garamond).

The MIT license in [LICENSE](LICENSE) covers the code. Each text keeps the license of its source.
