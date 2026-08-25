## Portfolio Rewrite Plan

### Direction

- Rebuild the site as a compact single-screen card on desktop with natural vertical flow on mobile.
- Shift the tone from broad portfolio marketing to a more factual engineer profile.
- Use a dark, terminal-like visual language with a distinctive terminal-dashboard presentation.

### Accepted Choices

- Layout: single-screen compact card with a terminal-dashboard direction
- Visual style: dark terminal-like
- Content depth: slightly more detailed with project impact
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
   - Each entry includes scope, stack, and impact

4. Links block
   - Email
   - GitHub
   - LinkedIn
   - Medium

### Implementation Notes

- Keep the site as progressively enhanced static HTML, CSS, and JavaScript.
- Replace the current bright gradient and rounded marketing-card treatment with a denser dark panel layout.
- Use monospace selectively for labels, metadata, and small UI details.
- Keep all content readable in a linear layout without JavaScript; enhance it into an accessible carousel when JavaScript is available.
- Update only the files needed for the rewrite:
  - `index.html`
  - `css/styles.css`
  - `app.js`
  - social preview and favicon assets
  - `portfolio-rewrite-plan.md`
