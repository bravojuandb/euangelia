# The texts: data files, sources and corrections

How the texts in `public/data/` are laid out, how they are built from their sources, and every change made to those sources on the way. The sources and their licenses are listed in the [README](../README.md#text-sources).

## The data files

The texts live in `public/data/<gospel>/`, one file per text, so the reader downloads only the columns it shows:

- `verses.json`: the verses in reading order, as `[chapter, verse]` pairs: `[[1, 1], [1, 2], …]`
- `greek.json`, `latin.json`, and one file per translation, named by its id in [src/config.js](../src/config.js) (`torres-amat.json`, `wujek.json`, `crampon.json`, `martini.json`, `kjv.json`, `douay-rheims.json`): one string per verse, in the same order; `""` where that text lacks the verse
- `catena.json`: the Catena Aurea on that Gospel (see [catena.md](catena.md)), downloaded only when the commentary is switched on
- `public/data/lectionary.json`: the Gospel of each liturgical day, built from [scripts/lectionary.tsv](../scripts/lectionary.tsv) (see [gospel-of-the-day.md](gospel-of-the-day.md))

A language can have several translations: each is an entry in `VERNACULARS` in [src/config.js](../src/config.js), and its description for the reading guide goes under `about` in [src/i18n.js](../src/i18n.js).

## Regenerating the data

The data files are built from the sources with Python 3.9+ (standard library only):

```sh
python3 scripts/fetch_sources.py        # download into scripts/sources/ (not committed)
python3 scripts/fetch_sources.py --check # verify local source files against the manifest
python3 scripts/build_data.py --check   # report: renumbering, gaps, length outliers
python3 scripts/build_data.py           # write public/data/<gospel>/*.json
python3 scripts/build_catena.py         # write public/data/<gospel>/catena.json (Python 3.11+)
```

`fetch_sources.py --only texts` or `--only fathers` downloads one part.

The [source manifest](../scripts/sources.lock.json) records fingerprints for the inputs used to generate the published data. GitHub downloads use commit hashes and Wikisource downloads use revision IDs. eBible.org, Parola Viva and CCEL supply files at live URLs. If those files change or a transcluded Wikisource page changes, an archived copy of the matching inputs is needed for an exact rebuild. To review a source update, download the current editions to a separate directory with `python3 scripts/fetch_sources.py --latest --dest /path/to/review`.

[scripts/build_data.py](../scripts/build_data.py) records the re-numbering and editorial corrections for each book. The builder checks that their source text matches the expected wording.

## Changes to each text

### Greek

The SBLGNT is copyright 2010 by the Society of Biblical Literature and Logos Bible Software. Here its variation-unit signs (⸀ ⸁ ⸂ ⸃ ⸄ ⸅) are removed, since the apparatus is not included; the double brackets ⟦ ⟧ are kept because they mark passages as later additions (the shorter ending after Mark 16:8, Mark 16:9–20 and John 7:53–8:11). As a critical text it omits Matthew 17:21, 18:11, 23:14; Mark 7:16, 9:44, 9:46, 11:26, 15:28; Luke 17:36, 23:17; and John 5:4, so those verses have no Greek.

### Latin

The Clementine Vulgate Project asks users to acknowledge the source and state their changes: here its layout marks for poetry, line breaks and paragraphs (`[ ] / \`) are removed, and `œ` characters damaged by a Windows-1252 conversion are restored.

### Spanish

The Spanish column uses Torres Amat (1836) because the usual modern Catholic translations (Nácar-Colunga, Bover-Cantera, the Biblia de Jerusalén, the Biblia de Navarra) are still under copyright.

The Spanish text is the Wikisource transcription of the 1836 edition, with its orthography (*á*, *Jesus*, *habia*). The words Torres Amat printed in italics as his own additions are kept as plain text. Where the transcription has no verse anchor or a mistyped one, verses are numbered in sequence. Transcription slips are corrected against the scans, including `deSpertaron` for `despertaron` in Matthew 8:25, `Joseph pu` for `Joseph pues` in Matthew 27:59 and `oira` for `otra` in Luke 17:35. The dashes that close some paragraphs are dropped. The 1836 printing itself skips from Matthew 14:11 “...en una fuente,” to 14:13, so the rest of 14:11 and all of 14:12 are missing in Spanish. [1836 facsimile](https://es.wikisource.org/wiki/Archivo:La_Sagrada_Biblia_(XIII).djvu)

### Polish

The Polish text is kept as transcribed on Wikisource, including the 1923 orthography (e.g. *jéj*, *woléj*). Where Wikisource marks a misprint, the corrected form is used. Chapter numbers are taken from the sequence of verses, since a few anchors carry the previous chapter's number. The transcription splits Luke 3:28, 4:42 and 19:47 into two verses each; they are joined again.

### French

The French text is the Wikisource transcription of the 1923 Crampon, with its notes and section headings left out. Like the Vulgate, it joins Matthew 17:14–15 and Mark 4:40–41, divides Matthew 17:27 in two and numbers Mark 9:1 as 8:39. Those verses follow the reader's common numbering.

### Italian

The Italian text is Parola Viva's digital edition of Martini, which follows the Vulgate numbering. Five reading slips are corrected (`|oro`, `accontarono`, `l'Angolo`, `Silone`, `parificarsi`). The end of John 11:56 in the printed edition supplies the sentence missing from the digital text, placed here in John 11:57 under the reader's numbering. [Martini facsimile, p. 325](https://www.e-rara.ch/download/pdf/14913624.pdf#page=56)

### English

The English texts are the eBible.org USFM editions. Strong's numbers and paragraph signs (¶) are removed. Words that USFM marks as italic, as words of Jesus or as LORD are kept in plain text. The KJV was translated from the Greek Textus Receptus, so in places it has words the SBLGNT omits, such as Matthew 27:35 and Luke 9:55–56. The Douay-Rheims follows the Latin Vulgate. In Luke 17:35–36, `keft` in the digital source is corrected to `left`. [Douay-Rheims, Luke 17](https://drbo.org/chapter/49017.htm)

## Verse numbering

Rows follow the Greek verse numbering, which the KJV shares. The reader aligns the other editions where they group, number or order the text differently.

- Matthew 5:4–5 puts those who mourn before the meek in all columns, following the Greek and the KJV. The other six editions print these two beatitudes in the reverse order.
- Matthew 17:14 is split into 17:14–15 (17:15–26 become 17:16–27).
- Mark 4:40 is split into 4:40–41, and Mark 8:39 becomes 9:1 (9:1–49 become 9:2–50; the Polish text follows the Vulgate here too).
- Luke 17:35–37 keeps the women at the mill in 17:35, the two men in the field in 17:36 and the question and answer together in 17:37. The six editions that join the two scenes and separate the question and answer are divided and joined accordingly.
- John 6:51–52 form 6:51 (6:53–72 become 6:52–71), and John 11:56 is split into 11:56–57 (the Douay-Rheims already divides it there).

In a few places the Vulgate ends a verse a few words earlier or later than the Greek (e.g. Luke 1:32–33, 9:42–44; Matthew 15:5–6, 16:2–3), so a phrase may sit in the neighbouring row.
