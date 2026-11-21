"""Download the source texts of the four Gospels.

Usage: python3 scripts/fetch_sources.py [--dest DIR]

Files are written to scripts/sources/ (not committed) as
gr/<gospel>.txt, la/<gospel>.lat, es/<gospel>.json and pl/<gospel>.json.
GitHub files are pinned to a commit. Wikisource pages are rendered by the
MediaWiki API from the current transcription, so they can change when
someone edits them; build_data.py stops if a correction no longer applies.
"""

import argparse
import json
import pathlib
import time
import urllib.error
import urllib.parse
import urllib.request

USER_AGENT = "gospel-data-fetch/1.0 (one-off script)"

SBLGNT = (
    "https://raw.githubusercontent.com/Faithlife/SBLGNT/"
    "d7f35adca9ec410e1d1499c63b4dd989d76c8d4d/data/sblgnt/text/{}.txt"
)
CLEMENTINE = (
    "https://raw.githubusercontent.com/BibleGet-I-O/Clementine-Vulgate/"
    "d57e2cde0cceda0d073ea9efc1fee616bcfeb2c1/src/utf8/{}.lat"
)

SOURCES = {
    "matthew": {
        "greek": "Matt",
        "latin": "Mt",
        "spanish": "La Sagrada Biblia (XIII)/Mateo",
        "polish": "Biblia Wujka (1923)/Ewangelia wg św. Mateusza (całość)",
    },
    "mark": {
        "greek": "Mark",
        "latin": "Mc",
        "spanish": "La Sagrada Biblia (XIII)/Marcos",
        "polish": "Biblia Wujka (1923)/Ewangelia wg św. Marka (całość)",
    },
    "luke": {
        "greek": "Luke",
        "latin": "Lc",
        "spanish": "La Sagrada Biblia (XIII)/Lucas",
        "polish": "Biblia Wujka (1923)/Ewangelia wg św. Łukasza (całość)",
    },
    "john": {
        "greek": "John",
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

    for folder in ("gr", "la", "es", "pl"):
        (args.dest / folder).mkdir(parents=True, exist_ok=True)

    for gospel, source in SOURCES.items():
        print(f"{gospel}: Greek, Latin, Spanish, Polish")
        (args.dest / "gr" / f"{gospel}.txt").write_bytes(get(SBLGNT.format(source["greek"])))
        (args.dest / "la" / f"{gospel}.lat").write_bytes(get(CLEMENTINE.format(source["latin"])))
        (args.dest / "es" / f"{gospel}.json").write_bytes(wikisource_page("es", source["spanish"]))
        (args.dest / "pl" / f"{gospel}.json").write_bytes(wikisource_page("pl", source["polish"]))
    print(f"sources written to {args.dest}")


if __name__ == "__main__":
    main()
