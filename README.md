# Euangelia

**[euangelia.org](https://euangelia.org)**: the four Gospels in a modern translation, in the Greek original and in the Latin Vulgate, side by side, verse by verse.

Euangelia sets the Gospel in three forms: the Greek in which the evangelists wrote it, the Latin in which the Western Church read it for centuries, and a modern translation. Read side by side, each sheds light on the others. A translation can be weighed against the original; a student of Greek or Latin has the meaning at hand; and any reader can see where translators agree and where they chose differently. Beside the text are the Gospel of each day's Mass and the commentary of the Fathers of the Church.

Every text is in the public domain or under an open license, and each is credited on the page and [below](#text-sources). The site is static: no accounts and no cookies, and the reader's settings stay in their browser.

## What it offers

- **The reader.** Matthew, Mark, Luke and John, complete, in three columns: the Greek of the SBL Greek New Testament (the critical edition published by the Society of Biblical Literature in 2010), the Latin of the Clementine Vulgate, and a translation in Spanish (Torres Amat), French (Crampon), Italian (Martini), Polish (Wujek) or English (King James Version or Douay-Rheims). Columns can be hidden. The interface speaks the language of the translation, with a short reading guide; a browser in any other language gets English. A verse can be highlighted and shared by its address (`#john/3/16`).
- **The Gospel of the day.** The Gospel of each day's Mass in the Roman Rite (the Missal of Paul VI), laid out like the reader, for today, the days around it or any date from 1583 on (`#today`, `#2026-11-24`). See [docs/gospel-of-the-day.md](docs/gospel-of-the-day.md).
- **The commentary of the Fathers.** The *Catena Aurea* of Saint Thomas Aquinas, in the English of the Oxford edition: a dagger marks the verses the Fathers comment on, and their words open under the verse. See [docs/catena.md](docs/catena.md).

The current version is 1.0.0; [CHANGELOG.md](CHANGELOG.md) lists what each version brought.

## The repository

| Path | What it holds |
| ---- | ------------- |
| [src/](src/) | The web app, in React: the reader, the Gospel of the day, the commentary, the liturgical calendar and the interface in five languages |
| [public/data/](public/data/) | The texts, the commentary and the Lectionary as JSON, built by the scripts |
| [scripts/](scripts/) | Python scripts that download the sources, correct and align them verse by verse, and write `public/data/` |
| [public/](public/) | Files served as they are: the icons, the image for link previews, `robots.txt` and the response headers |
| [docs/](docs/) | How the texts were prepared, how the Gospel of the day and the commentary work, and how the site is deployed |
| [design/](design/) | The seal shown at the foot of the page |

## Development

```sh
npm install
npm run dev     # start the dev server
npm run build   # production build in dist/
npm run lint
npm test        # the liturgical calendar against the Lectionary
```

The site needs Node.js 20.19 or later; it is built with the version in [.node-version](.node-version).

## Documentation

- [docs/data.md](docs/data.md): the data files, how to rebuild them from their sources (Python scripts in [scripts/](scripts/)), and every correction and re-numbering made to each text.
- [docs/gospel-of-the-day.md](docs/gospel-of-the-day.md): the liturgical calendar, the Lectionary table, and how both were checked.
- [docs/catena.md](docs/catena.md): where the Catena Aurea comes from and how its excerpts are tied to the verses.
- [docs/deployment.md](docs/deployment.md): Cloudflare Pages, the response headers, and how to release a version.

## Text sources

| Column  | Edition | Source | License |
| ------- | ------- | ------ | ------- |
| Greek   | SBL Greek New Testament (SBLGNT) v1.2, ed. Michael W. Holmes | [Faithlife/SBLGNT](https://github.com/Faithlife/SBLGNT) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| Latin   | Clementine Vulgate (1592), Clementine Vulgate Project text, digitized by Michael Tweedale | [BibleGet-I-O/Clementine-Vulgate](https://github.com/BibleGet-I-O/Clementine-Vulgate) (`src/utf8/{Mt,Mc,Lc,Jo}.lat`) | Public domain |
| Spanish | La Sagrada Biblia, tr. Félix Torres Amat, vol. XIII (1836) | [es.wikisource.org](https://es.wikisource.org/wiki/La_Sagrada_Biblia_(XIII)) | Public domain |
| Polish  | Biblia Wujka, 1923 edition | [pl.wikisource.org](https://pl.wikisource.org/wiki/Biblia_Wujka_(1923)) | Public domain |
| French  | La Sainte Bible, tr. Augustin Crampon, revised edition of 1923 | [fr.wikisource.org](https://fr.wikisource.org/wiki/Bible_Crampon_1923) | Public domain |
| Italian | La Sacra Bibbia, tr. Antonio Martini (1769–1781) | [Parola Viva open data](https://parolaviva.art/opendata) (`/api/v1/bibbia/{mt,mc,lc,gv}/<chapter>.json`), by Giovanni Novelli | Text in the public domain; Parola Viva's data [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| English | King James Version (1611), standard text of 1769 | [eBible.org](https://ebible.org/find/details.php?id=eng-kjv) (`eng-kjv_usfm.zip`) | Public domain (outside the UK, where printing it is under Crown letters patent) |
| English | Douay-Rheims, Challoner revision (1749–1752), American edition of 1899 | [eBible.org](https://ebible.org/find/details.php?id=engDRA) (`engDRA_usfm.zip`) | Public domain |
| Commentary | Thomas Aquinas, *Catena Aurea*, English translation, Oxford, 1841–1845, ed. J. H. Newman | [HistoricalChristianFaith/Writings-Database](https://github.com/HistoricalChristianFaith/Writings-Database) (`Thomas Aquinas/Catena Aurea/`); Matthew 15 from [CCEL](https://ccel.org/ccel/aquinas/catena1) | Public domain |

The SBLGNT is copyright 2010 by the Society of Biblical Literature and Logos Bible Software. What was changed in each text, as the licenses ask, is set out in [docs/data.md](docs/data.md#changes-to-each-text).

The typeface is [EB Garamond](https://github.com/octaviopardo/EBGaramond12) (SIL Open Font License 1.1), bundled through [Fontsource](https://fontsource.org/fonts/eb-garamond).

The MIT license in [LICENSE](LICENSE) covers the code. Each text keeps the license of its source.
