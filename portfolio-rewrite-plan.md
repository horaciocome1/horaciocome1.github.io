## Portfolio Rewrite Plan

### Direction

- Present a linear, scrolling portfolio on desktop and mobile with direct work and email actions.
- Shift the tone from broad portfolio marketing to a more factual engineer profile.
- Use a dark, terminal-like visual language with a distinctive terminal-dashboard presentation.

### Accepted Choices

- Layout: scrolling page with ordinary section navigation, two linked case studies, and an online/downloadable CV
- Visual style: dark terminal-like
- Content depth: concise homepage summaries supported by detailed, resume-backed case studies
- Primary audience: Android engineering roles
- Current work emphasis: lead with the TrueVUE Cloud native Android migration
- Secondary emphasis: use M-Pesa delivery to establish scale, then Kumbase and Markado to show backend breadth
- Link priority: Email is primary, with GitHub, LinkedIn, and Medium as labeled secondary links
- Tone: slightly personal, still professional

### Content Structure

1. Intro block
   - Name
   - Role: `Android Engineer`
   - Short engineer-first summary
   - Current focus line

2. Metadata block
   - Experience level
   - Core stack
   - Current work
   - Reliability / ownership signals

3. Selected work
   - TrueVUE Cloud migration
   - M-Pesa Android delivery
   - Kumbase full-stack product
   - Markado backend
   - Each entry includes scope, technology, responsibilities, and documented outcomes

4. Links block
   - Email
   - GitHub
   - LinkedIn
   - Medium

### Implementation Notes

- Keep the site as progressively enhanced static HTML, CSS, and JavaScript.
- Preserve the terminal palette and restrained panels, with a legible light theme and generous room for content.
- Use monospace selectively for labels, metadata, and small UI details.
- Keep all content readable in a linear layout with and without JavaScript. Use native fragment links for navigation and browser history.
- Maintain the files needed for the portfolio:
  - `index.html`
  - `css/styles.css`
  - `app.js`
  - social preview and favicon assets
  - `work/*/index.html` and original project diagrams
  - `resume/index.html` and the generated PDF CV
  - `sitemap.xml`, browser regression tests, and CI validation
  - `portfolio-rewrite-plan.md`
