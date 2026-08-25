# Horácio Comé

Personal portfolio for `https://horacioco.me/`.

Built as a progressively enhanced static site with plain `HTML`, `CSS`, and `JavaScript`.

The page keeps a terminal-dashboard presentation while preserving native keyboard navigation. Without JavaScript, every portfolio section is displayed in a linear document; with JavaScript, the sections become an accessible horizontal carousel.

## Main Files

- `index.html` - page structure and content
- `css/styles.css` - layout and visual styling
- `app.js` - accessible rail navigation, responsive sizing, menu, and theme behavior
- `og-image.png` - social preview image

## Local Preview

Open `index.html` in a browser, or serve the repo with any static file server.

## Validation

Install the dev tooling with `npm install` and the test browser with `npx playwright install chromium`. Run `npm test` to validate the source, accessibility, responsive behavior, and browser interactions.
