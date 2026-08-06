## Portfolio Rewrite Plan

### Direction

- Rebuild the site as a compact single-screen card on desktop with natural vertical flow on mobile.
- Shift the tone from broad portfolio marketing to a more factual engineer profile.
- Use a dark, terminal-like visual language with a distinctive terminal-dashboard presentation.

### Accepted Choices

- Layout: single-screen compact card with a terminal-dashboard direction
- Visual style: dark terminal-like
- Content depth: slightly more detailed with project impact
- Current work emphasis: lead with Markado
- Secondary project emphasis: keep TrueVUE Cloud in selected work
- Link priority: primary links are Email, GitHub, and LinkedIn; store links remain secondary
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
   - Markado backend
   - TrueVUE Cloud migration
   - M-Pesa Android delivery
   - Each entry includes scope, stack, and impact

4. Links block
   - Email
   - GitHub
   - LinkedIn
   - Google Play
   - App Store
   - Medium

### Implementation Notes

- Keep the site as static HTML and CSS.
- Replace the current bright gradient and rounded marketing-card treatment with a denser dark panel layout.
- Use monospace selectively for labels, metadata, and small UI details.
- Keep the page responsive without introducing JavaScript.
- Update only the files needed for the rewrite:
  - `index.html`
  - `css/styles.css`
  - `portfolio-rewrite-plan.md`
