# Euangelion

A parallel reader for the Gospels: a vernacular translation, the Greek text and the Latin text side by side, verse by verse.

So far the Gospel of John is available, complete, in Greek, Latin, Spanish and Polish.

## Development

```sh
npm install
npm run dev     # start the dev server
npm run build   # production build in dist/
npm run lint
```

The texts live in `public/data/<gospel>.json`, one entry per verse:

```json
{ "book": "John", "chapter": 1, "verse": 1, "greek": "…", "latin": "…", "spanish": "…", "polski": "…" }
```

## Text sources

| Column  | Edition | Source | License |
| ------- | ------- | ------ | ------- |
| Greek   | SBL Greek New Testament (SBLGNT) v1.2, ed. Michael W. Holmes | [Faithlife/SBLGNT](https://github.com/Faithlife/SBLGNT) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| Latin   | Clementine Vulgate (1592), Clementine Vulgate Project text, digitized by Michael Tweedale | [BibleGet-I-O/Clementine-Vulgate](https://github.com/BibleGet-I-O/Clementine-Vulgate) (`src/utf8/Jo.lat`) | Public domain |
| Spanish | La Sagrada Biblia, tr. Félix Torres Amat, vol. XIII (1836) | [es.wikisource.org](https://es.wikisource.org/wiki/La_Sagrada_Biblia_(XIII)/Juan) | Public domain |
| Polish  | Biblia Wujka, 1923 edition | [pl.wikisource.org](https://pl.wikisource.org/wiki/Biblia_Wujka_(1923)/Ewangelia_wg_%C5%9Bw._Jana) | Public domain |

The SBLGNT is copyright 2010 by the Society of Biblical Literature and Logos Bible Software. Here its variation-unit signs (⸀ ⸁ ⸂ ⸃ ⸄ ⸅) are removed, since the apparatus is not included; the double brackets ⟦ ⟧ around John 7:53–8:11 are kept because they mark the passage as a later addition. As a critical text it omits John 5:4, so that verse has no Greek.

The Clementine Vulgate Project asks users to acknowledge the source and state their changes: here its layout marks for poetry, line breaks and paragraphs (`[ ] / \`) are removed, and `œ` characters damaged by a Windows-1252 conversion are restored.

The Spanish text is the Wikisource transcription of the 1836 edition, with its orthography (*á*, *Jesus*, *habia*). The words Torres Amat printed in italics as his own additions are kept as plain text. Ten transcription slips are corrected (stray apostrophes, `=` for `?`, `a]` for `al`, a split word, a leftover template), and the dashes that close some paragraphs are dropped.

The Polish text is kept as transcribed on Wikisource, including the 1923 orthography (e.g. *jéj*, *woléj*).

Rows follow the Greek verse numbering. The Latin and Spanish texts use the Vulgate numbering, which differs twice in John: Vulgate 6:51–52 form Greek 6:51 (and 6:53–72 become 6:52–71), and Vulgate 11:56 is split into Greek 11:56–57.

Nácar-Colunga, Bover-Cantera and the Biblia de Navarra were considered for Spanish but are still under copyright.

The typeface is [EB Garamond](https://github.com/octaviopardo/EBGaramond12) (SIL Open Font License 1.1), bundled through [Fontsource](https://fontsource.org/fonts/eb-garamond).

The MIT license in [LICENSE](LICENSE) covers the code. Each text keeps the license of its source.
