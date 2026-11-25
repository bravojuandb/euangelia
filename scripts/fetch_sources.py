"""Download the source texts of the four Gospels.

Usage: python3 scripts/fetch_sources.py [--dest DIR] [--only texts|fathers]
                                       [--check | --latest]

Files are written to scripts/sources/ (not committed) as
gr/<gospel>.txt, la/<gospel>.lat, es/<gospel>.json, pl/<gospel>.json,
fr/<gospel>.json, it/<gospel>.json, kjv/<gospel>.usfm and dra/<gospel>.usfm;
and, for the commentary of the Fathers, catena/<gospel>/<chapter>.html (the
Catena Aurea, one file per chapter) and catena/matthew.txt (CCEL's text of
the Catena on Matthew, which supplies the one chapter the others lack).
GitHub files are pinned to commits and Wikisource pages to revisions. The
source manifest checks downloads against the inputs used to build the data.
"""

import argparse
import hashlib
import io
import json
import pathlib
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile

USER_AGENT = "Euangelia source fetcher/1.0 (https://github.com/bravojuandb/euangelia)"
SCRIPT_DIR = pathlib.Path(__file__).resolve().parent
SOURCE_LOCK = SCRIPT_DIR / "sources.lock.json"
WIKISOURCE = {"es": "spanish", "pl": "polish", "fr": "french"}

# MediaWiki appends diagnostics whose timing, cache metadata and render ID
# can differ between requests for the same revision.
RENDER_COMMENTS = re.compile(
    r"\s*<!--\s*(?:NewPP limit report|Transclusion expansion time report|"
    r"Render ID|Saved in parser cache)\b.*?-->",
    re.S,
)

SBLGNT = (
    "https://raw.githubusercontent.com/Faithlife/SBLGNT/"
    "d7f35adca9ec410e1d1499c63b4dd989d76c8d4d/data/sblgnt/text/{}.txt"
)
CLEMENTINE = (
    "https://raw.githubusercontent.com/BibleGet-I-O/Clementine-Vulgate/"
    "d57e2cde0cceda0d073ea9efc1fee616bcfeb2c1/src/utf8/{}.lat"
)

# One USFM file per book: the King James Version in the standard text of
# 1769, and the Douay-Rheims in the American edition of 1899 (Challoner's
# revision).
KJV_ZIP = "https://ebible.org/Scriptures/eng-kjv_usfm.zip"
DRA_ZIP = "https://ebible.org/Scriptures/engDRA_usfm.zip"

# The Catena Aurea of Saint Thomas Aquinas in the English of the Oxford
# edition (1841–1845), one HTML file per chapter, from HistoricalChristianFaith's
# Writings-Database at a fixed commit. Its Matthew lacks chapter 15, which
# CCEL's plain text of the same edition supplies.
CATENA = (
    "https://raw.githubusercontent.com/HistoricalChristianFaith/Writings-Database/"
    "401527e29ee0ebeee5f0f4d6928807ef956c1d60/Thomas%20Aquinas/Catena%20Aurea/"
    "Commentary%20on%20{}/Chapter%20{}.html"
)
CATENA_MATTHEW_TEXT = "https://ccel.org/ccel/a/aquinas/catena1/cache/catena1.txt"
CATENA_BOOKS = {"matthew": ("Matthew", 28), "mark": ("Mark", 16), "luke": ("Luke", 24), "john": ("John", 21)}
CATENA_MISSING = {("matthew", 15)}

# Antonio Martini's Italian translation, one JSON file per chapter, from
# Parola Viva's open data (https://parolaviva.art/opendata).
MARTINI = "https://parolaviva.art/api/v1/bibbia/{}/{}.json"

SOURCES = {
    "matthew": {
        "greek": "Matt",
        "kjv": "70-MATeng-kjv.usfm",
        "dra": "70-MATengDRA.usfm",
        "latin": "Mt",
        "spanish": "La Sagrada Biblia (XIII)/Mateo",
        "polish": "Biblia Wujka (1923)/Ewangelia wg św. Mateusza (całość)",
        "french": "Bible Crampon 1923/Matthieu",
        "italian": ("mt", 28),
    },
    "mark": {
        "greek": "Mark",
        "kjv": "71-MRKeng-kjv.usfm",
        "dra": "71-MRKengDRA.usfm",
        "latin": "Mc",
        "spanish": "La Sagrada Biblia (XIII)/Marcos",
        "polish": "Biblia Wujka (1923)/Ewangelia wg św. Marka (całość)",
        "french": "Bible Crampon 1923/Marc",
        "italian": ("mc", 16),
    },
    "luke": {
        "greek": "Luke",
        "kjv": "72-LUKeng-kjv.usfm",
        "dra": "72-LUKengDRA.usfm",
        "latin": "Lc",
        "spanish": "La Sagrada Biblia (XIII)/Lucas",
        "polish": "Biblia Wujka (1923)/Ewangelia wg św. Łukasza (całość)",
        "french": "Bible Crampon 1923/Luc",
        "italian": ("lc", 24),
    },
    "john": {
        "greek": "John",
        "kjv": "73-JHNeng-kjv.usfm",
        "dra": "73-JHNengDRA.usfm",
        "latin": "Jo",
        "spanish": "La Sagrada Biblia (XIII)/Juan",
        "polish": "Biblia Wujka (1923)/Ewangelia wg św. Jana (całość)",
        "french": "Bible Crampon 1923/Jean",
        "italian": ("gv", 21),
    },
}


def get(url, attempts=4):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if error.code not in (429, 503) or attempt == attempts - 1:
                raise
            time.sleep(10 * (attempt + 1))  # rate limited: back off
    raise RuntimeError("unreachable")


def source_sha256(relative, body):
    """Fingerprint a build input independently of the upstream transport."""
    folder = relative.split("/", 1)[0]
    if folder in WIKISOURCE:
        rendered = json.loads(body)["parse"]["text"]
        body = RENDER_COMMENTS.sub("", rendered).encode("utf-8")
    elif folder == "it":
        body = json.dumps(json.loads(body), sort_keys=True, ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(body).hexdigest()


def verify_source(relative, body, fingerprints):
    expected = fingerprints[relative]
    actual = source_sha256(relative, body)
    if actual != expected:
        raise SystemExit(
            f"{relative}: source fingerprint differs from {SOURCE_LOCK.name}\n"
            f"  expected {expected}\n  received {actual}"
        )


def wikisource_page(language, title, revision):
    page = {"page": title} if revision is None else {"oldid": revision}
    query = urllib.parse.urlencode(
        {"action": "parse", **page, "prop": "text|revid", "format": "json", "formatversion": 2}
    )
    body = get(f"https://{language}.wikisource.org/w/api.php?{query}")
    data = json.loads(body)
    if "parse" not in data:
        raise RuntimeError(f"{title}: {data.get('error', data)}")
    # Wikimedia asks API clients to send requests one at a time, unhurried.
    time.sleep(2)
    return body


def martini_book(book, chapters):
    """Parola Viva's chapter files of one book, as one JSON list."""
    files = []
    for chapter in range(1, chapters + 1):
        files.append(json.loads(get(MARTINI.format(book, chapter))))
        time.sleep(1)  # one small file a second
    return json.dumps(files, ensure_ascii=False).encode("utf-8")


def catena_files(save):
    """The Catena Aurea, chapter by chapter, and CCEL's text of its Matthew."""
    for gospel, (book, chapters) in CATENA_BOOKS.items():
        for chapter in range(1, chapters + 1):
            if (gospel, chapter) in CATENA_MISSING:
                continue
            body = get(CATENA.format(book, chapter))
            save(f"catena/{gospel}/{chapter}.html", body)
    save("catena/matthew.txt", get(CATENA_MATTHEW_TEXT))


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--dest", type=pathlib.Path, default=SCRIPT_DIR / "sources")
    parser.add_argument("--only", choices=("texts", "fathers"),
                        help="download only the Gospel texts, or only the commentary")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--check", action="store_true",
                      help="verify existing local inputs without downloading")
    mode.add_argument("--latest", action="store_true",
                      help="download live inputs without checking the manifest")
    args = parser.parse_args()
    manifest = json.loads(SOURCE_LOCK.read_text(encoding="utf-8"))
    fingerprints = manifest["sha256"]
    if args.check:
        for relative in fingerprints:
            group = "fathers" if relative.startswith("catena/") else "texts"
            if args.only not in (None, group):
                continue
            path = args.dest / relative
            try:
                body = path.read_bytes()
            except FileNotFoundError:
                raise SystemExit(f"source file missing: {path}") from None
            verify_source(relative, body, fingerprints)
        print(f"source fingerprints verified in {args.dest}")
        return

    def save(relative, body):
        if not args.latest:
            verify_source(relative, body, fingerprints)
        path = args.dest / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(body)

    if args.only != "texts":
        print("Commentary of the Fathers: the Catena Aurea")
        catena_files(save)
    if args.only == "fathers":
        print(f"sources written to {args.dest}")
        return

    print("King James Version and Douay-Rheims (eBible.org)")
    english = {
        "kjv": zipfile.ZipFile(io.BytesIO(get(KJV_ZIP))),
        "dra": zipfile.ZipFile(io.BytesIO(get(DRA_ZIP))),
    }

    for gospel, source in SOURCES.items():
        print(f"{gospel}: Greek, Latin, Spanish, Polish, French, Italian, English")
        for folder, archive in english.items():
            save(f"{folder}/{gospel}.usfm", archive.read(source[folder]))
        save(f"gr/{gospel}.txt", get(SBLGNT.format(source["greek"])))
        save(f"la/{gospel}.lat", get(CLEMENTINE.format(source["latin"])))
        for language, edition in WIKISOURCE.items():
            relative = f"{language}/{gospel}.json"
            revision = None if args.latest else manifest["wikisource_revisions"][relative]
            save(relative, wikisource_page(language, source[edition], revision))
        save(f"it/{gospel}.json", martini_book(*source["italian"]))
    print(f"sources written to {args.dest}")


if __name__ == "__main__":
    main()
