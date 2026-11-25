# The commentary of the Fathers

Where the commentary comes from, and how its excerpts are tied to the verses.

The commentary is the *Catena Aurea* of Saint Thomas Aquinas: for each passage of the four Gospels, the words of the Fathers on it, chained in the order he chose. It is shown in the English of the Oxford edition (1841–1845) edited by John Henry Newman, the one complete translation in the public domain; there is none in Spanish, French, Italian or Polish.

## The source

[scripts/build_catena.py](../scripts/build_catena.py) reads the Catena from the transcription in HistoricalChristianFaith's [Writings-Database](https://github.com/HistoricalChristianFaith/Writings-Database) (pinned to a commit), one HTML file per chapter. It lacks Matthew 15, which is read from [CCEL](https://ccel.org/ccel/aquinas/catena1)'s plain text of the same edition, fetched as currently published.

The same group's verse-indexed Commentaries-Database was tried first, but it files some excerpts under the wrong verse (the last words on Matthew 5:11–12 under 5:13, and Chrysostom's first words on 5:13 elsewhere), so it is not used.

## Tying the excerpts to the verses

The Catena prints each passage (the lemma) in the Authorized Version and its verse numbering, which is the reader's. Every excerpt is tied to the verses of the lemma before it, and a passage runs on to the next one, so verses whose lemma the transcription dropped (Matthew 5:15–16) stay with the passage that comments on them.

The reader shows the excerpts under the first verse of their passage that is on the page, in the Catena's order, with the work each is taken from as the edition gives it ("Hom. in Matt. 15"). Three excerpts are unattributed in the sources (Matthew 1:6–8, Luke 1:30–33, John 19:23–24) and are shown so.
