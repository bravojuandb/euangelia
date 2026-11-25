# The Gospel of the day

How the page finds the Gospel of a day's Mass, and how that was checked.

[src/liturgy.js](../src/liturgy.js) works out the liturgical day of a date and its key in the Lectionary; [src/liturgyText.js](../src/liturgyText.js) names the day in each language and announces the Gospel as the Lectionary in that language does (the Latin column as the Roman Missal, the Greek as the Byzantine liturgy).

## The calendar

The calendar follows the General Norms for the Liturgical Year and the Calendar and the General Roman Calendar, without national or diocesan calendars:

- Epiphany on January 6, the Ascension and Corpus Christi on the following Sunday, as in most countries (`DEFAULT_OPTIONS` in [src/liturgy.js](../src/liturgy.js) also covers Epiphany on a Sunday and the two others on Thursday).
- The table of precedence decides between a saint's day and the day of the season. An impeded solemnity moves to the next free day; Saint Joseph in Holy Week moves to the Saturday before Palm Sunday, and the Nativity of Saint John the Baptist on the day of the Sacred Heart to June 23.
- Only celebrations that change the Gospel are followed: solemnities, feasts, and the obligatory memorials with a Gospel of their own (the Blessed Virgin Mary, Mother of the Church; the Immaculate Heart; Barnabas; Joachim and Anne; Martha, Mary and Lazarus; the Passion of John the Baptist; Our Lady of Sorrows; the Guardian Angels). On other memorials the Lectionary keeps the weekday's Gospel, and so does the page.

## The Lectionary

The Gospels themselves are listed in [scripts/lectionary.tsv](../scripts/lectionary.tsv), after the *Ordo Lectionum Missae*, second typical edition (1981): the three Sunday cycles, the weekdays (the same in Years I and II), the saints' days, and the alternatives the Lectionary offers (Masses of Christmas, the procession of Palm Sunday, shorter forms, Year A readings in Lent). The reader shows the texts of its own columns, not those of a current lectionary, and shows whole verses where the reference takes part of one (`5a`, `12b`).

```sh
python3 scripts/build_lectionary.py --check   # check every reference against the verse lists
python3 scripts/build_lectionary.py           # write public/data/lectionary.json
```

## How it was checked

The table was checked against the tables of the Lectionary published by Felix Just, S.J., at [catholic-resources.org](https://catholic-resources.org/Lectionary/1998USL.htm) (the 1998–2002 edition for the United States, which numbers its readings as the 1981 Latin edition). They agree except on December 18, where the United States edition reads Matthew 1:18-25 and the Latin edition 1:18-24, kept here. The calendar was checked against the dates of those tables for 2026–2028. `npm test` checks that every day from 1990 to 2100 has a Gospel in the table, and that every line of the table is reached.
