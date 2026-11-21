# Euangelion

A parallel reader for the Gospels: a vernacular translation, the Greek text and the Latin text side by side, verse by verse.

So far only John 1–4 and 5:1–30 are available, in Latin, Spanish and Polish. The Greek column is still empty.

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
| Greek   | _to be documented_ | | |
| Latin   | _to be documented_ | | |
| Spanish | _to be documented_ | | |
| Polish  | Biblia Wujka, 1923 edition | [pl.wikisource.org](https://pl.wikisource.org/wiki/Biblia_Wujka_(1923)/Ewangelia_wg_%C5%9Bw._Jana) | Public domain |

The Polish text is kept as transcribed on Wikisource, including the 1923 orthography (e.g. *jéj*, *woléj*).

The MIT license in [LICENSE](LICENSE) covers the code. Each text keeps the license of its source.
