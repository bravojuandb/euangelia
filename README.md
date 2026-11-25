# Euangelion

A parallel reader for the Gospels: a vernacular translation, the Greek text and the Latin text side by side, verse by verse.

The four Gospels are available, complete, in Greek, Latin, Spanish, French, Italian, Polish and English (two translations: the King James Version and the Douay-Rheims).

The interface follows the language of the chosen translation (Spanish, English, French, Italian or Polish); a browser in another language gets English, in the King James Version.

"Catena Aurea" marks with a dagger the verses the Fathers comment on, and opens their words under the verse: the Catena Aurea of Saint Thomas Aquinas, in English (see [The commentary of the Fathers](#the-commentary-of-the-fathers)).

"Today" shows the Gospel of the day's Mass in the Roman Rite (the Missal of Paul VI), laid out like the reader, with the days before and after and any date from 1583 on: `#today` or `#2026-11-24` in the address.

## Development

```sh
npm install
npm run dev     # start the dev server
npm run build   # production build in dist/
npm run lint
npm test        # the liturgical calendar against the Lectionary
```

The texts live in `public/data/<gospel>/`, one file per text, so the reader downloads only the columns it shows:

- `verses.json`: the verses in reading order, as `[chapter, verse]` pairs: `[[1, 1], [1, 2], …]`
- `greek.json`, `latin.json`, and one file per translation, named by its id in [src/config.js](src/config.js) (`torres-amat.json`, `wujek.json`, `crampon.json`, `martini.json`, `kjv.json`, `douay-rheims.json`): one string per verse, in the same order; `""` where that text lacks the verse

- `catena.json`: the Catena Aurea on that Gospel (see [The commentary of the Fathers](#the-commentary-of-the-fathers)), downloaded only when the commentary is switched on
- `public/data/lectionary.json`: the Gospel of each liturgical day, built from [scripts/lectionary.tsv](scripts/lectionary.tsv) (see [The Gospel of the day](#the-gospel-of-the-day))

A language can have several translations: each is an entry in `VERNACULARS` in [src/config.js](src/config.js), and its description for the reading guide goes under `about` in [src/i18n.js](src/i18n.js).

### Regenerating the data

The data files are built from the sources below with Python 3.9+ (standard library only):

```sh
python3 scripts/fetch_sources.py        # download into scripts/sources/ (not committed)
python3 scripts/build_data.py --check   # report: renumbering, gaps, length outliers
python3 scripts/build_data.py           # write public/data/<gospel>/*.json
python3 scripts/build_catena.py         # write public/data/<gospel>/catena.json (Python 3.11+)
```

`fetch_sources.py --only texts` or `--only fathers` downloads one part.

The GitHub sources are pinned to a commit; the Wikisource pages, the eBible.org English Bibles and Parola Viva's Italian text are fetched as currently published. Every re-numbering and correction described below is listed per book in [scripts/build_data.py](scripts/build_data.py), and the build stops if one no longer matches the text.

### The Gospel of the day

[src/liturgy.js](src/liturgy.js) works out the liturgical day of a date and its key in the Lectionary; [src/liturgyText.js](src/liturgyText.js) names the day in each language and announces the Gospel as the Lectionary in that language does (the Latin column as the Roman Missal, the Greek as the Byzantine liturgy).

The calendar follows the General Norms for the Liturgical Year and the Calendar and the General Roman Calendar, without national or diocesan calendars:

- Epiphany on January 6, the Ascension and Corpus Christi on the following Sunday, as in most countries (`DEFAULT_OPTIONS` in [src/liturgy.js](src/liturgy.js) also covers Epiphany on a Sunday and the two others on Thursday).
- The table of precedence decides between a saint's day and the day of the season. An impeded solemnity moves to the next free day; Saint Joseph in Holy Week moves to the Saturday before Palm Sunday, and the Nativity of Saint John the Baptist on the day of the Sacred Heart to June 23.
- Only celebrations that change the Gospel are followed: solemnities, feasts, and the obligatory memorials with a Gospel of their own (the Blessed Virgin Mary, Mother of the Church; the Immaculate Heart; Barnabas; Joachim and Anne; Martha, Mary and Lazarus; the Passion of John the Baptist; Our Lady of Sorrows; the Guardian Angels). On other memorials the Lectionary keeps the weekday's Gospel, and so does the page.

The Gospels themselves are listed in [scripts/lectionary.tsv](scripts/lectionary.tsv), after the *Ordo Lectionum Missae*, second typical edition (1981): the three Sunday cycles, the weekdays (the same in Years I and II), the saints' days, and the alternatives the Lectionary offers (Masses of Christmas, the procession of Palm Sunday, shorter forms, Year A readings in Lent). The reader shows the texts of its own columns, not those of a current lectionary, and shows whole verses where the reference takes part of one (`5a`, `12b`).

```sh
python3 scripts/build_lectionary.py --check   # check every reference against the verse lists
python3 scripts/build_lectionary.py           # write public/data/lectionary.json
```

The table was checked against the tables of the Lectionary published by Felix Just, S.J., at [catholic-resources.org](https://catholic-resources.org/Lectionary/1998USL.htm) (the 1998–2002 edition for the United States, which numbers its readings as the 1981 Latin edition). They agree except on December 18, where the United States edition reads Matthew 1:18-25 and the Latin edition 1:18-24, kept here. The calendar was checked against the dates of those tables for 2026–2028. `npm test` checks that every day from 1990 to 2100 has a Gospel in the table, and that every line of the table is reached.

### The commentary of the Fathers

The commentary is the *Catena Aurea* of Saint Thomas Aquinas: for each passage of the four Gospels, the words of the Fathers on it, chained in the order he chose. It is shown in the English of the Oxford edition (1841–1845) edited by John Henry Newman, the one complete translation in the public domain; there is none in Spanish, French, Italian or Polish.

[scripts/build_catena.py](scripts/build_catena.py) reads the Catena from the transcription in HistoricalChristianFaith's [Writings-Database](https://github.com/HistoricalChristianFaith/Writings-Database) (pinned to a commit), one HTML file per chapter. It lacks Matthew 15, which is read from [CCEL](https://ccel.org/ccel/aquinas/catena1)'s plain text of the same edition, fetched as currently published. The Catena prints each passage (the lemma) in the Authorized Version and its verse numbering, which is the reader's; every excerpt is tied to the verses of the lemma before it, and a passage runs on to the next one, so verses whose lemma the transcription dropped (Matthew 5:15–16) stay with the passage that comments on them. The reader shows the excerpts under the first verse of their passage that is on the page, in the Catena's order, with the work each is taken from as the edition gives it ("Hom. in Matt. 15").

The same group's verse-indexed Commentaries-Database was tried first, but it files some excerpts under the wrong verse (the last words on Matthew 5:11–12 under 5:13, and Chrysostom's first words on 5:13 elsewhere), so it is not used. Three excerpts are unattributed in the sources (Matthew 1:6–8, Luke 1:30–33, John 19:23–24) and are shown so.

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

The SBLGNT is copyright 2010 by the Society of Biblical Literature and Logos Bible Software. Here its variation-unit signs (⸀ ⸁ ⸂ ⸃ ⸄ ⸅) are removed, since the apparatus is not included; the double brackets ⟦ ⟧ are kept because they mark passages as later additions (the shorter ending after Mark 16:8, Mark 16:9–20 and John 7:53–8:11). As a critical text it omits Matthew 17:21, 18:11, 23:14; Mark 7:16, 9:44, 9:46, 11:26, 15:28; Luke 17:36, 23:17; and John 5:4, so those verses have no Greek.

The Clementine Vulgate Project asks users to acknowledge the source and state their changes: here its layout marks for poetry, line breaks and paragraphs (`[ ] / \`) are removed, and `œ` characters damaged by a Windows-1252 conversion are restored.

The Spanish text is the Wikisource transcription of the 1836 edition, with its orthography (*á*, *Jesus*, *habia*). The words Torres Amat printed in italics as his own additions are kept as plain text. Where the transcription has no verse anchor or a mistyped one, verses are numbered in sequence. 26 transcription slips are corrected against the scans (stray apostrophes and braces, `=` for `?`, `a]` for `al`, words split at a line end, a speck read as `:—`), and the dashes that close some paragraphs are dropped. The 1836 printing itself skips from Matthew 14:11 "…en una fuente," to 14:13, so the rest of 14:11 and all of 14:12 are missing in Spanish.

The Polish text is kept as transcribed on Wikisource, including the 1923 orthography (e.g. *jéj*, *woléj*). Where Wikisource marks a misprint, the corrected form is used. Chapter numbers are taken from the sequence of verses, since a few anchors carry the previous chapter's number.

The French text is the Wikisource transcription of the 1923 Crampon, with its notes and section headings left out. It follows the Greek verse numbering, except that, like the Vulgate, it joins Matthew 17:14–15 and Mark 4:40–41, divides Matthew 17:27 in two and numbers Mark 9:1 as 8:39; these are re-keyed.

The Italian text is Parola Viva's digital edition of Martini, which follows the Vulgate numbering. Five reading slips are corrected (`|oro`, `accontarono`, `l'Angolo`, `Silone`, `parificarsi`), and the sentence the Greek numbers John 11:57 is missing from it.

The English texts are the eBible.org USFM editions. Their markup is removed: Strong's numbers, the paragraph signs (¶), and the styles for words in italics (added by the translators), words of Jesus and LORD are kept as plain text. The KJV was translated from the Greek Textus Receptus, so in places it has words the SBLGNT omits (e.g. Matthew 27:35, Luke 9:55–56). The Douay-Rheims was translated from the Latin Vulgate and follows it closely.

Rows follow the Greek verse numbering, which the KJV shares. The Latin, Spanish, Douay-Rheims and Italian texts use the Vulgate numbering and are re-keyed where it differs:

- Matthew 17:14 is split into 17:14–15 (17:15–26 become 17:16–27).
- Mark 4:40 is split into 4:40–41, and Mark 8:39 becomes 9:1 (9:1–49 become 9:2–50; the Polish text follows the Vulgate here too).
- John 6:51–52 form 6:51 (6:53–72 become 6:52–71), and John 11:56 is split into 11:56–57 (the Douay-Rheims already divides it there).

The Polish transcription splits Luke 3:28, 4:42 and 19:47 into two verses each; they are joined again. In a few places the Vulgate ends a verse a few words earlier or later than the Greek (e.g. Luke 1:32–33, 9:42–44; Matthew 15:5–6, 16:2–3), so a phrase may sit in the neighbouring row.
Nácar-Colunga, Bover-Cantera, the Biblia de Navarra and the Biblia de Jerusalén were considered for Spanish but are still under copyright.

The typeface is [EB Garamond](https://github.com/octaviopardo/EBGaramond12) (SIL Open Font License 1.1), bundled through [Fontsource](https://fontsource.org/fonts/eb-garamond).

The MIT license in [LICENSE](LICENSE) covers the code. Each text keeps the license of its source.
