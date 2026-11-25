# Euangelia

**[euangelia.org](https://euangelia.org)** shows the four Gospels in a translation in a modern language, in Greek and in the Latin Vulgate, side by side, verse by verse.

Euangelia places historical translations alongside a critical edition of the Greek text and the Latin version the Western Church read for centuries. The parallel columns let readers compare the wording and see where translations differ. The site also offers the daily Gospel according to the Roman Rite and the commentary compiled by Thomas Aquinas.

The editions and their terms of use are credited on the page and [below](#text-sources). The site is static, with no accounts or cookies. The reader's settings stay in their browser.

## What it offers

- **The reader.** Matthew, Mark, Luke and John in three columns: the critical Greek text of the SBL Greek New Testament, the Latin of the Clementine Vulgate, and a historical translation in Spanish (Torres Amat), French (Crampon), Italian (Martini), Polish (Wujek) or English (King James Version or Douay-Rheims). Some verses are absent from individual editions or their transcriptions. Columns can be hidden. The interface follows the language of the translation, with English as the fallback. A verse can be highlighted and shared by its address (`#john/3/16`).
- **The Gospel of the day.** A reference from the Roman Rite lectionary is displayed using the reader's editions. Open today (`#today`) or a date from 1583 onward (`#2026-11-25`). The site applies the current rules of the General Roman Calendar, with Epiphany on January 6 and Ascension and Corpus Christi on Sunday. Local calendars and historical observances can differ. See [docs/gospel-of-the-day.md](docs/gospel-of-the-day.md) for coverage and sources.
- **The commentary of the Fathers.** The *Catena Aurea* of Saint Thomas Aquinas, in the English of the Oxford edition: a dagger marks the verses the Fathers comment on, and their words open under the verse. See [docs/catena.md](docs/catena.md).

See [CHANGELOG.md](CHANGELOG.md) for the release history.

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

- [docs/data.md](docs/data.md): the data files, how to rebuild them from their sources, and the corrections and renumbering made to each text.
- [docs/gospel-of-the-day.md](docs/gospel-of-the-day.md): the liturgical calendar, the Lectionary table, and how both were checked.
- [docs/catena.md](docs/catena.md): where the Catena Aurea comes from and how its excerpts are tied to the verses.
- [docs/deployment.md](docs/deployment.md): Cloudflare Pages, the response headers, and how to release a version.

## Text sources

| Column  | Edition | Source | License |
| ------- | ------- | ------ | ------- |
| Greek   | SBL Greek New Testament (SBLGNT) v1.2, ed. Michael W. Holmes | [Faithlife/SBLGNT](https://github.com/Faithlife/SBLGNT) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| Latin   | Clementine Vulgate Project, digitized by Michael Tweedale and contributors, chiefly from the Colunga–Turrado edition (Madrid, 1946) | [BibleGet-I-O/Clementine-Vulgate](https://github.com/BibleGet-I-O/Clementine-Vulgate) (`src/utf8/{Mt,Mc,Lc,Jo}.lat`), [edition details](https://www.stepbible.org/version.jsp?version=VulgCT) | Public domain |
| Spanish | *La Sagrada Biblia*, Félix Torres Amat, drawing on the translation by José Miguel Petisco. Vol. XIII, Paris, 1836, reprint of the second Madrid edition | [Wikisource](https://es.wikisource.org/wiki/La_Sagrada_Biblia_(XIII)), [translation history](https://phte.upf.edu/dhte/hebreo/biblia-antiguo-testamento-y-nuevo-testamento/) | Public domain |
| Polish  | *Biblia Wujka*, tr. Jakub Wujek. British and Foreign Bible Society, Warsaw, 1923 | [Wikisource](https://pl.wikisource.org/wiki/Biblia_Wujka_(1923)) | Public domain |
| French  | *La Sainte Bible*, tr. Augustin Crampon, revised in 1923 by Jesuits and professors of Saint-Sulpice | [Wikisource](https://fr.wikisource.org/wiki/Bible_Crampon_1923), [BnF catalogue](https://catalogue.bnf.fr/ark:/12148/cb319787847) | Public domain |
| Italian | La Sacra Bibbia, tr. Antonio Martini (1769–1781) | [Parola Viva open data](https://parolaviva.art/opendata) (`/api/v1/bibbia/{mt,mc,lc,gv}/<chapter>.json`), by Giovanni Novelli | Text in the public domain; Parola Viva's data [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| English | King James Version (1611), standard text of 1769 | [eBible.org](https://ebible.org/find/details.php?id=eng-kjv) (`eng-kjv_usfm.zip`) | Public domain outside the United Kingdom. [Crown letters patent](https://www.gov.uk/government/publications/copyright-notice-duration-of-copyright-term/copyright-notice-duration-of-copyright-term#king-james-bible) govern UK publication and distribution. |
| English | Douay-Rheims, Challoner revision (1749–1752), American edition of 1899 | [eBible.org](https://ebible.org/find/details.php?id=engDRA) (`engDRA_usfm.zip`) | Public domain |
| Commentary | Thomas Aquinas, *Catena Aurea*, English translation, Oxford, 1841–1845, ed. J. H. Newman | [HistoricalChristianFaith/Writings-Database](https://github.com/HistoricalChristianFaith/Writings-Database) (`Thomas Aquinas/Catena Aurea/`); Matthew 15 from [CCEL](https://ccel.org/ccel/aquinas/catena1) | Public domain |

The SBLGNT is copyright 2010 by the Society of Biblical Literature and Logos Bible Software. See the [notes on each text](docs/data.md#changes-to-each-text) for the adaptations made here. The [source manifest](scripts/sources.lock.json) records the fingerprints of the downloaded inputs and the Wikisource revisions.

The typeface is [EB Garamond](https://github.com/octaviopardo/EBGaramond12) (SIL Open Font License 1.1), bundled through [Fontsource](https://fontsource.org/fonts/eb-garamond). The fish icon is from Tabler Icons by Paweł Kuna. See [third-party notices](public/THIRD-PARTY-NOTICES.txt).

The MIT license in [LICENSE](LICENSE) covers the code. Each text keeps the license of its source.
