# The commentary of the Fathers

Where the commentary comes from, and how its excerpts are tied to the verses.

The commentary is the *Catena Aurea* of Saint Thomas Aquinas, who arranged excerpts from the Fathers and other commentators around passages of the four Gospels. Euangelia uses the English translation published at Oxford in 1841–1845 under the editorship of John Henry Newman. The prefaces credit Mark Pattison for Matthew and John Dobree Dalgairns for Mark. [Preface to Matthew](https://www.newmanreader.org/works/fathers/catena.html), [preface to Mark](https://www.ccel.org/ccel/a/aquinas/catena2/cache/catena2.pdf).

The Bibliothèque nationale de France also catalogues a complete historical French translation by J.-M. Péronne (1868–1869). [Bibliothèque nationale de France](https://catalogue.bnf.fr/ark:/12148/cb314619721).

## The source

[scripts/build_catena.py](../scripts/build_catena.py) reads the Catena from the transcription in HistoricalChristianFaith's [Writings-Database](https://github.com/HistoricalChristianFaith/Writings-Database) (pinned to a commit), one HTML file per chapter. It lacks Matthew 15, which is read from [CCEL](https://ccel.org/ccel/aquinas/catena1)'s plain text of the same edition, fetched as currently published.

The same group's verse-indexed Commentaries-Database was tried first, but it files some excerpts under the wrong verse (the last words on Matthew 5:11–12 under 5:13, and Chrysostom's first words on 5:13 elsewhere), so it is not used.

The CCEL transcription also verifies corrections in the commentary on Matthew 1:1 and 15:39–16:4. The generator removes stranded footnote markers and corrects transcription slips such as “lore” for “love” and “mill” for “will”. [CCEL transcription](https://ccel.org/ccel/a/aquinas/catena1/cache/catena1.txt).

## Tying the excerpts to the verses

The Catena prints each passage (the lemma) in the Authorized Version and its verse numbering, which is the reader's. Every excerpt is tied to the verses of the lemma before it, and a passage runs on to the next one, so verses whose lemma the transcription dropped (Matthew 5:15–16) stay with the passage that comments on them.

The reader shows the excerpts under the first verse of their passage that is on the page, in the Catena's order. It includes source references supplied by the English edition, such as “Hom. in Matt. 15”.

The Latin edition at Corpus Thomisticum supplies three names missing from the English transcription. It identifies the Gloss on Matthew 1:6–8 (§85337), Bede on Luke 1:30–33 (§85736), and Augustine on John 19:23–24 (§86150). [Matthew](https://www.corpusthomisticum.org/cmt01.html), [Luke](https://www.corpusthomisticum.org/clc012.html), [John](https://www.corpusthomisticum.org/cjo12.html).
