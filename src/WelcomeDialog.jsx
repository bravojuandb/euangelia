import { useEffect, useRef } from "react";
import { LANG, VERNACULARS } from "./config.js";
import { UI } from "./i18n.js";

// Shown on the first visit: the reader picks the language to start in. Each
// choice is written in its own language, since the page cannot know yet which
// one its reader speaks; the one the browser prefers has the focus.
// `current`: the translation chosen from the browser's languages.
// `onChoose(id)`: a translation was picked. `onClose()`: the window closed,
// by a choice or by Escape (which keeps `current`).
export function WelcomeDialog({ current, onChoose, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || dialog.open) {
      return;
    }
    dialog.showModal();
    dialog.querySelector("[data-current]")?.focus();
  }, []);

  const choose = (id) => {
    onChoose(id);
    ref.current?.close();
  };

  return (
    <dialog
      ref={ref}
      className="guide welcome-dialog"
      aria-labelledby="welcome-title"
      onClose={onClose}
    >
      <div className="welcome-body">
        <h2 id="welcome-title" className="welcome-title">
          Euangelia
        </h2>
        <p className="welcome-subtitle">
          <span lang={LANG.greekCaps}>ΕΥΑΓΓΕΛΙΑ</span>
          <span aria-hidden="true"> · </span>
          <span lang={LANG.latin}>EVANGELIA</span>
        </p>
        <ul className="welcome-choices">
          {VERNACULARS.map((vernacular) => (
            <li key={vernacular.id}>
              <button
                type="button"
                className="welcome-choice"
                lang={vernacular.lang}
                data-current={vernacular.id === current || undefined}
                onClick={() => choose(vernacular.id)}
              >
                <span className="welcome-language">{vernacular.label}</span>
                <span className="welcome-edition">{vernacular.note}</span>
                <span className="welcome-line">{UI[vernacular.lang].welcome}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}
