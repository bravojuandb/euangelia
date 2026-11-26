"""Check the sentences of the Imitation of Christ shown under the title.

Usage: python3 scripts/check_imitatio.py

src/imitatio.json lists the sentences, in Latin, with their book, chapter
and section. This script downloads the four books from the Latin Wikisource
at the revisions below, applies the corrections listed in CORRECTIONS and
reports any sentence that is not found, word for word, in its section.
"""

import json
import pathlib
import re
import sys
import urllib.parse
import urllib.request

USER_AGENT = "Euangelia source fetcher/1.0 (https://github.com/bravojuandb/euangelia)"
ROOT = pathlib.Path(__file__).resolve().parent.parent
QUOTES = ROOT / "src" / "imitatio.json"

# "De imitatione Christi/I" … "/IV" on la.wikisource.org.
REVISIONS = {1: 193274, 2: 193196, 3: 193197, 4: 193198}

# Transcription slips in the sections quoted, corrected against the common
# text of the Imitation: (book, chapter, section) -> [(found, corrected)].
CORRECTIONS = {
    (1, 5, 1): [("non eloquenda", "non eloquentia")],
    (2, 1, 5): [("si vis regare", "si vis regnare")],
    (2, 11, 1): [("sui regnis cælestis", "sui regni cælestis")],
    (2, 12, 6): [("Opertebat autem", "Oportebat autem")],
}

ROMAN = {"I": 1, "V": 5, "X": 10}
CHAPTER = re.compile(r"^==\s*C(?:ap|hap)\.?\s*([0-9IVX]+)\.?[^=]*==\s*$", re.M)
SECTION = re.compile(r"^(\d+)\.\s+(.*?)(?=^\d+\.\s|\Z)", re.M | re.S)


def roman(numeral):
    if numeral.isdigit():
        return int(numeral)
    values = [ROMAN[c] for c in numeral]
    return sum(-v if v < w else v for v, w in zip(values, values[1:] + [0]))


def fetch(revision):
    query = urllib.parse.urlencode(
        {"action": "query", "prop": "revisions", "revids": revision, "rvprop": "content",
         "rvslots": "main", "format": "json", "formatversion": 2}
    )
    request = urllib.request.Request(
        f"https://la.wikisource.org/w/api.php?{query}", headers={"User-Agent": USER_AGENT}
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        page = json.load(response)["query"]["pages"][0]
    return page["revisions"][0]["slots"]["main"]["content"]


def sections(book, wikitext):
    parts = CHAPTER.split(wikitext)
    for number, body in zip(parts[1::2], parts[2::2]):
        for match in SECTION.finditer(body):
            text = re.sub(r"\s+", " ", match[2]).strip()
            yield (book, roman(number), int(match[1])), text


def main():
    text = {}
    for book, revision in REVISIONS.items():
        text.update(sections(book, fetch(revision)))

    for ref, fixes in CORRECTIONS.items():
        for found, corrected in fixes:
            if found not in text.get(ref, ""):
                sys.exit(f"{ref}: the correction no longer applies: {found!r}")
            text[ref] = text[ref].replace(found, corrected)

    quotes = json.loads(QUOTES.read_text(encoding="utf-8"))
    missing = [q for q in quotes if q["text"] not in text.get(tuple(q["ref"]), "")]
    for quote in missing:
        print(f"not found in {quote['ref']}: {quote['text']}")
    print(f"{len(quotes) - len(missing)} of {len(quotes)} sentences found in their sections.")
    sys.exit(1 if missing else 0)


if __name__ == "__main__":
    main()
