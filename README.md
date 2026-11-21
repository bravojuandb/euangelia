# Euangelion

A parallel reader for the Gospels: a vernacular translation, the Greek text and the Latin text side by side, verse by verse.

So far only John 1–4 and 5:1–30 are available, in Greek, Latin, Spanish and Polish.

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
| Latin   | _to be documented_ | | |
| Spanish | _to be documented_ | | |
| Polish  | Biblia Wujka, 1923 edition | [pl.wikisource.org](https://pl.wikisource.org/wiki/Biblia_Wujka_(1923)/Ewangelia_wg_%C5%9Bw._Jana) | Public domain |

The SBLGNT is copyright 2010 by the Society of Biblical Literature and Logos Bible Software. Here its text-critical signs (⸀ ⸁ ⸂ ⸃ ⸄ ⸅ ⟦ ⟧) are removed, since the apparatus is not included. As a critical text it omits John 5:4, so that verse has no Greek.

The Polish text is kept as transcribed on Wikisource, including the 1923 orthography (e.g. *jéj*, *woléj*).

The typeface is [EB Garamond](https://github.com/octaviopardo/EBGaramond12) (SIL Open Font License 1.1), bundled through [Fontsource](https://fontsource.org/fonts/eb-garamond).

The MIT license in [LICENSE](LICENSE) covers the code. Each text keeps the license of its source.
