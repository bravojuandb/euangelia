import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The date of the last revision, shown at the foot of the page: the day of
// the last commit (YYYY-MM-DD), so that rebuilding the same code does not
// change it. Without git or a repository, the day of the build.
function lastRevision() {
  try {
    const date = execSync('git log -1 --format=%cs', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date
    }
  } catch {
    // No git here: fall through to the day of the build.
  }
  return new Date().toISOString().slice(0, 10)
}

// The faces of EB Garamond that every page shows (the Latin alphabet in
// roman, medium and italic, and polytonic Greek), asked for together with
// the page. Otherwise the browser finds them only once the script has drawn
// the text: it shows a fallback font first, and the lines move when EB
// Garamond arrives. Their names carry a hash, so they are read from the build.
const PRELOADED_FONTS =
  /\/eb-garamond-(latin-400-normal|latin-500-normal|latin-400-italic|greek-400-normal|greek-ext-400-normal)-[\w-]+\.woff2$/

function preloadFonts() {
  let base = '/'
  return {
    name: 'euangelia-preload-fonts',
    apply: 'build',
    configResolved(config) {
      base = config.base
    },
    transformIndexHtml(html, context) {
      return Object.keys(context.bundle ?? {})
        .filter((file) => PRELOADED_FONTS.test(`/${file}`))
        .sort()
        .map((file) => ({
          tag: 'link',
          attrs: { rel: 'preload', href: `${base}${file}`, as: 'font', type: 'font/woff2', crossorigin: '' },
          injectTo: 'head',
        }))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), preloadFonts()],
  define: {
    __LAST_REVISION__: JSON.stringify(lastRevision()),
  },
})
