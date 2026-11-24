"""Download the source texts of the four Gospels.

Usage: python3 scripts/fetch_sources.py [--dest DIR]

Files are written to scripts/sources/ (not committed) as
gr/<gospel>.txt, la/<gospel>.lat, es/<gospel>.json, pl/<gospel>.json,
kjv/<gospel>.usfm and dra/<gospel>.usfm. GitHub files are pinned to a commit.
Wikisource pages are rendered by the MediaWiki API from the current
transcription, and eBible.org serves its current edition of each English
Bible, so both can change; build_data.py stops if a correction or the verse
numbering no longer matches.
"""

import argparse
import io
import json
import pathlib
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile

USER_AGENT = "gospel-data-fetch/1.0 (one-off script)"

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

SOURCES = {
    "matthew": {
        "greek": "Matt",
        "kjv": "70-MATeng-kjv.usfm",
        "dra": "70-MATengDRA.usfm",
        "latin": "Mt",
        "spanish": "La Sagrada Biblia (XIII)/Mateo",
        "polish": "Biblia Wujka (1923)/Ewangelia wg św. Mateusza (całość)",
    },
    "mark": {
        "greek": "Mark",
        "kjv": "71-MRKeng-kjv.usfm",
        "dra": "71-MRKengDRA.usfm",
        "latin": "Mc",
        "spanish": "La Sagrada Biblia (XIII)/Marcos",
        "polish": "Biblia Wujka (1923)/Ewangelia wg św. Marka (całość)",
    },
    "luke": {
        "greek": "Luke",
        "kjv": "72-LUKeng-kjv.usfm",
        "dra": "72-LUKengDRA.usfm",
        "latin": "Lc",
        "spanish": "La Sagrada Biblia (XIII)/Lucas",
        "polish": "Biblia Wujka (1923)/Ewangelia wg św. Łukasza (całość)",
    },
    "john": {
        "greek": "John",
        "kjv": "73-JHNeng-kjv.usfm",
        "dra": "73-JHNengDRA.usfm",
        "latin": "Jo",
        "spanish": "La Sagrada Biblia (XIII)/Juan",
        "polish": "Biblia Wujka (1923)/Ewangelia wg św. Jana (całość)",
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


def wikisource_page(language, title):
    query = urllib.parse.urlencode(
        {"action": "parse", "page": title, "prop": "text", "format": "json", "formatversion": 2}
    )
    body = get(f"https://{language}.wikisource.org/w/api.php?{query}")
    data = json.loads(body)
    if "parse" not in data:
        raise RuntimeError(f"{title}: {data.get('error', data)}")
    # Wikimedia asks API clients to send requests one at a time, unhurried.
    time.sleep(2)
    return body


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--dest", type=pathlib.Path,
                        default=pathlib.Path(__file__).resolve().parent / "sources")
    args = parser.parse_args()

    for folder in ("gr", "la", "es", "pl", "kjv", "dra"):
        (args.dest / folder).mkdir(parents=True, exist_ok=True)

    print("King James Version and Douay-Rheims (eBible.org)")
    english = {
        "kjv": zipfile.ZipFile(io.BytesIO(get(KJV_ZIP))),
        "dra": zipfile.ZipFile(io.BytesIO(get(DRA_ZIP))),
    }

    for gospel, source in SOURCES.items():
        print(f"{gospel}: Greek, Latin, Spanish, Polish, English")
        for folder, archive in english.items():
            (args.dest / folder / f"{gospel}.usfm").write_bytes(archive.read(source[folder]))
        (args.dest / "gr" / f"{gospel}.txt").write_bytes(get(SBLGNT.format(source["greek"])))
        (args.dest / "la" / f"{gospel}.lat").write_bytes(get(CLEMENTINE.format(source["latin"])))
        (args.dest / "es" / f"{gospel}.json").write_bytes(wikisource_page("es", source["spanish"]))
        (args.dest / "pl" / f"{gospel}.json").write_bytes(wikisource_page("pl", source["polish"]))
    print(f"sources written to {args.dest}")


if __name__ == "__main__":
    main()
