# Product Spec

## Positioning

Arcana Mirror is a calm tarot-based self-reflection tool. It should feel like a thoughtful writing and interpretation surface, not a cheap fortune-telling page.

The first version is intentionally static. It does not need an AI backend to be useful because its core value is giving a local first-pass interpretation, then packaging the user's question, cards, positions, keywords, and interpretation requirements into a reusable prompt.

## Audience

- People who use tarot as a reflective or journaling practice
- People who want a better prompt for AI-assisted interpretation
- People who prefer private, no-login tools
- Future visitors to a personal website tool page

## V1 Scope

- Ask an optional user question
- Choose one of three spreads
- Toggle reversed cards
- Draw cards without duplicates
- Display card positions, names, orientations, keywords, meanings, advice, and reflection questions
- Display a local reading summary with an overall theme, pattern notes, next step, and journaling questions
- Generate an AI prompt in English or Simplified Chinese
- Copy or download the prompt
- Save a reading to local journal storage
- Export journal entries as JSON or Markdown
- Browse all 78 card meanings

## Non-Goals In V1

- No backend
- No direct AI API calls from the browser
- No account system
- No payments
- No copyrighted deck images
- No deterministic prediction language

## Design Direction

- Ink-black interface
- Warm parchment result surface
- Antique-gold accent lines
- Serif display typography with restrained UI text
- Minimal symbolic card faces generated with CSS/SVG-like layout
- Smooth but quiet interactions
- Responsive mobile-first layout

## Acceptance Criteria

- `npm install` succeeds
- `npm run test` succeeds
- `npm run build` succeeds
- GitHub Pages workflow can publish the static site
- The app can draw one, three, and five card readings
- Prompt Builder includes the question, spread, every drawn card, position, orientation, keywords, meanings, and safety boundary
- Prompt Builder includes the local first-pass interpretation so external AI starts from richer context
- Journal can save and display readings locally
- `/cards` displays all 78 cards
- English and Simplified Chinese UI are both usable
