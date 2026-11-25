# The Gospel of the day

[src/liturgy.js](../src/liturgy.js) works out the liturgical day and its key in the lectionary. [src/liturgyText.js](../src/liturgyText.js) names the day in each language and provides the formula that introduces the Gospel, using the Roman Missal for Latin and the Byzantine liturgy for Greek.

## The calendar

Euangelia applies the current General Roman Calendar to Gregorian dates from 1583 through 9999. The same rules apply to past and future dates, including celebrations introduced in recent years. The site uses one setting for the regional transfers permitted by the universal norms. Particular celebrations in national and diocesan calendars fall outside its scope. [Universal Norms, nos. 7 and 59–60](https://www.liturgyoffice.org/Calendar/Info/GNLY.pdf), [decree on Mary, Mother of the Church](https://press.vatican.va/roman_curia/congregations/ccdds/documents/rc_con_ccdds_doc_20180211_decreto-mater-ecclesiae_en.html)

- The site keeps Epiphany on January 6 and celebrates Ascension on the Seventh Sunday of Easter and Corpus Christi on the Sunday after Trinity. The engine also supports Epiphany on a Sunday and Ascension and Corpus Christi on Thursday through its options in [src/liturgy.js](../src/liturgy.js).
- The table of precedence determines which celebration takes priority. The implementation moves an impeded solemnity to the next free day, with exceptions for Saint Joseph in Holy Week and the Nativity of Saint John the Baptist when it coincides with the Sacred Heart.
- The weekday Gospel is the default for the memorials of Saint Barnabas and Saints Joachim and Anne. The Gospel proposed for each memorial is available as an alternative. [General Instruction of the Roman Missal, nos. 357–358](https://www.vatican.va/content/dam/wss/roman_curia/congregations/ccdds/documents/rc_con_ccdds_doc_20030317_ordinamento-messale_en.html)
- When the Immaculate Heart of Mary coincides with another obligatory memorial, both become optional. The page shows the weekday Gospel first and offers the Gospel of the Immaculate Heart as an alternative. [Notification of December 8, 1998](https://www.vatican.va/roman_curia/congregations/ccdds/documents/rc_con_ccdds_doc_20000630_memoria-immaculati-cordis-mariae-virginis_lt.html)

## The Lectionary

The references in [scripts/lectionary.tsv](../scripts/lectionary.tsv) cover the three Sunday cycles, the weekdays, the saints' days and alternatives such as the Masses of Christmas, the procession of Palm Sunday and Year A readings in Lent. The Gospel is the same in weekday Years I and II. On November 2 the reader offers Gospel readings from the Common of the Dead, with one preselected for convenience. The reader uses its own editions and displays whole verses even where the reference specifies part of a verse (`5a`, `12b`). [*Ordo Lectionum Missae*, second typical edition (1981)](https://fr.scribd.com/document/716826938/Ordo-Lectionum-Missae-Editio-Typica-Altera-1981), [*Notitiae* 17 (1981), p. 462](https://www.cultodivino.va/content/dam/cultodivino/rivista-notitiae/1980/notitiae-17-%281981%29/Notitiae-180-181-182-183-1981.pdf)

```sh
python3 scripts/build_lectionary.py --check   # check every reference against the verse lists
python3 scripts/build_lectionary.py           # write public/data/lectionary.json
```

## How it was checked

The U.S. lectionary tables compiled by Felix Just, S.J., were used as a cross-check. The Latin edition gives Matthew 1:18–24 for December 18, while the U.S. edition ends at verse 25. The automated checks verify known dates and the selection of readings on specific dates. They also verify that every date from 1990 to 2100 has an entry and every entry in the table can be reached. [Felix Just's lectionary tables](https://catholic-resources.org/Lectionary/1998USL.htm), [calendar tests](../src/liturgy.test.js)
