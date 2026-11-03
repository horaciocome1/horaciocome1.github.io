# Horácio Comé

Personal portfolio for `https://horacioco.me/`.

Built as a progressively enhanced static site with plain `HTML`, `CSS`, and `JavaScript`.

The page uses a terminal-inspired visual style with a linear, scrolling document. Work, experience, skills, and contact remain readable without JavaScript. Native fragment links preserve browser Back/Forward navigation; JavaScript adds a mobile navigation disclosure, section indicators, a persistent theme preference, and email copying.

## Main Files

- `index.html` - introduction, work summaries, experience, skills, and contact
- `work/truevue-android-migration/index.html` - TrueVUE migration case study
- `work/mpesa-android/index.html` - M-Pesa Android case study
- `resume/index.html` - accessible online CV
- `assets/horacio-come-cv.pdf` - supplied PDF CV, maintained separately from the online version
- `css/styles.css` - responsive layout, both themes, and print styles
- `app.js` - mobile navigation, theme, section indicators, and email copying
- `assets/` - original SVG project diagrams, PNG social previews, and PDF CV
- `scripts/export-assets.mjs` - exports raster social previews with Chromium
- `docs/content-notes.md` - sources and scope of professional claims

## Local Preview

Serve the repository root with a static file server, for example `python3 -m http.server 4173`. Open `http://localhost:4173/` so root-relative page links resolve correctly.

## Validation

Install the dev tooling with `npm ci` and the test browser with `npx playwright install chromium`. Run `npm test` to lint all four HTML pages, CSS, and JavaScript, then test accessibility, internal links, responsive layouts, browser history, keyboard navigation, print layout, enlarged text, and the CV download.

Run `npm run build:assets` after changing the SVG artwork and commit the exported PNG files with their sources. To update the downloadable CV, replace `assets/horacio-come-cv.pdf` with the supplied PDF directly. Asset exports do not regenerate or overwrite the CV. The site requires no build step or JavaScript framework at runtime.

The validation workflow runs for pull requests and pushes to `develop` and `master`.
