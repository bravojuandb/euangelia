# Deployment

The site is static: `npm run build` writes everything to `dist/`, and [Cloudflare Pages](https://developers.cloudflare.com/pages/) serves it at [euangelia.org](https://euangelia.org). The Pages project is connected to this repository:

| Setting | Value |
| ------- | ----- |
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js | from [.node-version](../.node-version) |

Every push to `main` is published; every other branch and pull request gets its own preview address, which search engines do not index.

## The files that shape the site

- [.env](../.env) holds `VITE_SITE_URL`, the public address, which [index.html](../index.html) uses for the absolute URLs that link previews need (`og:url`, `og:image`, the canonical link). It holds no secret.
- [public/_headers](../public/_headers) sets the response headers: a Content-Security-Policy that lets only the site's own files load (and Cloudflare Web Analytics), a year's cache for the built files in `assets/` (their names change with their content), an hour for the texts in `data/` (their names do not), and `noindex` on the `pages.dev` address.
- `public/og.png` (1200×630) is the image shown when a link is shared, and `public/apple-touch-icon.png` (180×180) the icon on a phone's home screen.

## Releasing a version

Update [CHANGELOG.md](../CHANGELOG.md) and `version` in [package.json](../package.json) (the footer shows it), merge into `main`, and tag the merge commit:

```sh
git tag -a v1.0.0 -m "Euangelia 1.0.0" && git push --tags
```
