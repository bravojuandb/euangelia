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
export function useGospelData(gospel, textNames) {
  const [loaded, setLoaded] = useState({});
  const [failure, setFailure] = useState(null);
  const wanted = ["verses", ...textNames].join(",");

  useEffect(() => {
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
