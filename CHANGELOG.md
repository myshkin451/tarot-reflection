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

## 0.1.0

- Initial static release of Arcana Mirror.
- Added tarot reading workflow with one-card, three-card, and five-card spreads.
- Added full 78-card structured dataset.
- Added English and Simplified Chinese UI.
- Added AI Prompt Builder.
- Added local journal with JSON and Markdown export.
- Added GitHub Pages deployment workflow.
