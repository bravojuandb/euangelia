import { useEffect, useState } from "react";

// public/data/<gospel>/verses.json lists [chapter, verse] in reading order;
// <gospel>/<text>.json holds one string per verse in the same order.

// One request per file for the whole visit: "john/greek" → Promise of its JSON.
const requests = new Map();

function request(gospel, name) {
  const key = `${gospel}/${name}`;
  if (!requests.has(key)) {
    const promise = fetch(`${import.meta.env.BASE_URL}data/${key}.json`).then((response) => {
      if (!response.ok) {
        throw new Error(`${key}: HTTP ${response.status}`);
      }
      return response.json();
    });
    // A failed request is forgotten so that asking again retries it.
    promise.catch(() => requests.delete(key));
    requests.set(key, promise);
  }
  return requests.get(key);
}

// Loads a Gospel's verse list and the given texts, and keeps every text
// already loaded, so a column can show its previous text until a new one
// arrives. A batch is applied at once: the page never shows half of it.
// With no Gospel yet (the day's is still being looked up), nothing loads.
export function useGospelData(gospel, textNames) {
  const [loaded, setLoaded] = useState({});
  const [failure, setFailure] = useState(null);
  const wanted = ["verses", ...textNames].join(",");

  useEffect(() => {
    if (!gospel) {
      return undefined;
    }
    let cancelled = false;
    const names = wanted.split(",");
    Promise.all(names.map((name) => request(gospel, name)))
      .then((results) => {
        const [verses, ...texts] = results;
        if (texts.some((text) => text.length !== verses.length)) {
          throw new Error(`${gospel}: a text does not match the verse list`);
        }
        if (!cancelled) {
          setLoaded((previous) => {
            const next = { ...previous };
            names.forEach((name, i) => {
              next[`${gospel}/${name}`] = results[i];
            });
            return next;
          });
          setFailure(null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setFailure({ gospel, error });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [gospel, wanted]);

  return {
    verses: loaded[`${gospel}/verses`] ?? null,
    text: (name) => loaded[`${gospel}/${name}`] ?? null,
    error: failure?.gospel === gospel ? failure.error : null,
  };
}

let lectionaryRequest = null;

// The Gospel of each day (public/data/lectionary.json), loaded the first time
// it is wanted.
export function useLectionary(wanted) {
  const [state, setState] = useState({ entries: null, error: null });

  useEffect(() => {
    if (!wanted || state.entries) {
      return undefined;
    }
    let cancelled = false;
    lectionaryRequest ??= fetch(`${import.meta.env.BASE_URL}data/lectionary.json`).then(
      (response) => {
        if (!response.ok) {
          throw new Error(`lectionary: HTTP ${response.status}`);
        }
        return response.json();
      },
    );
    lectionaryRequest.then(
      (entries) => !cancelled && setState({ entries, error: null }),
      (error) => {
        lectionaryRequest = null;
        if (!cancelled) {
          setState({ entries: null, error });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [wanted, state.entries]);

  return state;
}

// The Catena Aurea on a Gospel (public/data/<gospel>/catena.json), loaded
// when the commentary is switched on.
export function useCatena(gospel, wanted) {
  const [loaded, setLoaded] = useState({});

  useEffect(() => {
    if (!wanted || !gospel || loaded[gospel]) {
      return undefined;
    }
    let cancelled = false;
    request(gospel, "catena").then(
      (catena) => !cancelled && setLoaded((previous) => ({ ...previous, [gospel]: catena })),
      // Without the commentary the text still reads; switching it off and on retries.
      () => {},
    );
    return () => {
      cancelled = true;
    };
  }, [gospel, wanted, loaded]);

  return wanted && gospel ? (loaded[gospel] ?? null) : null;
}
