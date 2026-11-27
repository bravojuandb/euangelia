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

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __LAST_REVISION__: JSON.stringify(lastRevision()),
  },
})
