# Product Spec

## Positioning

Arcana Mirror is a calm tarot reading tool. It should feel like a thoughtful card table with a good interpretation surface, not a cheap fortune-telling page.

The first version is intentionally static-first. It should remain useful without AI because its core value is giving a local card reading, then optionally packaging the user's question, cards, positions, keywords, and interpretation requirements into a reusable prompt.

The next version should add direct AI interpretation without turning the app into a heavy account product. The intended flow is still simple: ask, draw, read the local meaning, then optionally generate a deeper AI reading.

## Audience

- People who use tarot to clarify a situation or read the symbolic pattern in front of them
- People who want a better prompt for AI-assisted interpretation
- People who prefer private, no-login tools
- Future visitors to a personal website tool page

## V1 Scope

- Ask an optional user question
- Choose one of three spreads
- Toggle reversed cards
- Draw cards without duplicates
- Display card positions, names, orientations, keywords, meanings, advice, and shadow notes
- Display a local reading summary with an overall theme, pattern notes, and practical landing point
- Generate an AI prompt in English or Simplified Chinese
- Copy or download the prompt
- Save a reading to local journal storage
- Export journal entries as JSON or Markdown
- Browse all 78 card meanings

## V1.2 Scope

- Replace abstract card faces with a more tactile deck presentation
- Add an original card back design and richer major-arcana visual language
- Complete formal artwork for all 22 major-arcana cards
- Keep minor arcana on the existing fallback system until their suit/rank visual language is ready
- Make the draw flow feel physical: shuffle, fan, deal, flip, and settle
- Keep the result layout focused on cards plus interpretation, not product explanation

## V1.3 Scope

- Add a server-side AI interpretation endpoint
- Prefer streaming output through `/api/tarot/analyze/stream`
- Use DeepSeek as the first provider
- Keep frontend hosting static unless the personal website migration happens first
- Limit each IP to 20 AI readings per day
- Avoid login, payment, account state, and admin dashboards in the MVP
- Upgrade the draw flow into a table ritual with locked random draw, shuffle, cut, deal, per-card reveal, and completed spread states
- Add a code-native minor-arcana face system for all 56 minor cards, with distinct suit palettes, pip layouts, and court-card sigils
- Present AI output as a deeper reading journal, not as a generic chatbot panel

## Non-Goals In V1

- No browser-side provider keys
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
- Original Arcana Mirror deck language, starting with card backs and major-arcana samples
- Tactile paper, engraved linework, quiet texture, and visible card depth
- More dramatic shuffle/deal/flip motion when drawing cards
- User participation through ritual controls without implying that mouse movement, shuffle duration, or question wording changes the already locked random draw
- Responsive mobile-first layout

Avoid developer-facing product language in the UI. The interface should say "draw", "read", "generate AI reading", "save", and "ask again"; it should not explain that the design is restrained, modern, static-first, or structurally reflective.

## Acceptance Criteria

- `npm install` succeeds
- `npm run test` succeeds
- `npm run build` succeeds
- GitHub Pages workflow can publish the static site
- The app can draw one, three, and five card readings
- Prompt Builder includes the question, spread, every drawn card, position, orientation, keywords, meanings, and safety boundary
- Prompt Builder includes the local card reading so external AI starts from richer context
- Journal can save and display readings locally
- `/cards` displays all 78 cards
- All 22 major-arcana cards use finished Arcana Mirror artwork
- Minor-arcana cards display usable Arcana Mirror system faces
- English and Simplified Chinese UI are both usable
- Five-card readings fit desktop and mobile viewports without horizontal overflow
