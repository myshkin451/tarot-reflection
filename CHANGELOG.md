# Changelog

## Unreleased

- Added local first-pass reading interpretation with overall theme, pattern notes, next step, and journaling questions.
- Expanded card library entries with upright and reversed meanings, advice, shadow notes, and writing prompts.
- Added shuffle and reveal motion to make the draw flow feel more intentional.
- Updated AI prompts to include local interpretation context before external model analysis.
- Added DeepSeek/backend integration planning while keeping API keys out of the static frontend.
- Added next-phase visual, deck, motion, and Cloudflare Worker direction with a generated concept reference.
- Added optional Cloudflare Worker AI endpoint, D1 reading logs, IP daily limits, and frontend AI reading client.
- Added the first Arcana Mirror Deck assets: formal card back, The Fool, The Magician, and The High Priestess samples with a deck manifest and image-aware card rendering.
- Reworked the draw table motion and result layout so the deck, dealt cards, and interpretation surface feel more tactile and visually central.
- Completed the Arcana Mirror Deck major arcana with 19 additional formal card faces, bringing all 22 major cards onto finished artwork while preserving minor-arcana fallback rendering.
- Confirmed the public Cloudflare Worker AI reading flow is deployed and connected to the GitHub Pages build.
- Tightened the five-card result layout so Chinese readings keep the card table, captions, and first interpretation sheet visible without clipping.
- Updated roadmap and next-phase docs after the AI backend and major-arcana artwork work moved past planning.
- Upgraded the primary draw experience into a table ritual with explicit shuffle, cut, deal, awaiting-reveal, per-card reveal, and complete states.
- Added a code-native minor-arcana visual system with four suit treatments, numeric pip layouts, and court-card sigils.
- Updated card rendering so true card assets stay highest priority, minor cards use the new system face, and face-down table cards use the formal card back.
- Refined the AI reading surface into a parchment journal style, added request abort handling, preserved partial streamed output on errors, and sync saved readings after AI responses.
- Verified V1.3 in local production preview with desktop and mobile screenshots, five-card interaction, no horizontal overflow, and no runtime errors.
- Rebuilt the primary reading screen as a V1.4 immersive tabletop app surface with a black-gold top bar, left ritual toolbar, central celestial card table, bottom ritual rail, and right manuscript panel.
- Added generated project-bound interface assets for the dark tarot tabletop background and blank parchment/leather manuscript frame.
- Moved setup, reveal, local interpretation, AI deep reading, journal, save, and export into a single tabletop-and-manuscript workflow while preserving the locked random draw boundary.
- Added mobile-specific tabletop behavior with compact setup controls, smaller reading cards, a fixed bottom navigation bar, and a manuscript drawer that rises into the reading surface.
- Verified V1.4 with Chrome extension desktop QA plus independent headless Chrome mobile screenshots, five-card completion, no horizontal overflow, and successful production build.
- Patched the V1.4 tabletop UI with native Chinese font stacks, explicit question switching, non-overlapping deck placement, tucked post-deal deck state, and reveal behavior that no longer replays the shuffle curtain.

## 0.1.0

- Initial static release of Arcana Mirror.
- Added tarot reading workflow with one-card, three-card, and five-card spreads.
- Added full 78-card structured dataset.
- Added English and Simplified Chinese UI.
- Added AI Prompt Builder.
- Added local journal with JSON and Markdown export.
- Added GitHub Pages deployment workflow.
