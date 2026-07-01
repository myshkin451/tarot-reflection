# Roadmap

## V1 Static Release

- Static GitHub Pages app
- Three reading spreads
- Full 78-card dataset
- English and Simplified Chinese UI
- Prompt Builder
- Local journal
- Markdown and JSON exports

## V1.1 Content Polish

- Add local card reading summary logic
- Add position-specific interpretation helpers
- Show advice and shadow notes in the card library
- Polish card meanings so local reading stays useful without AI

## V1.2 Visual Deck And Motion

- Design an original Arcana Mirror card back
- Add a tactile deck stack with visible card depth
- Replace the current abstract draw moment with shuffle, fan, deal, flip, and settle motion
- Create 3 major-arcana sample assets to lock the art direction
- Complete the 22 major-arcana formal card faces after the sample direction is stable
- Move toward a result layout where cards remain visually present while interpretation appears
- Keep UI copy natural and user-facing; remove developer-facing positioning phrases

Status as of 2026-06-30: the card back, draw motion, result layout, and all 22 major-arcana formal card faces are complete.

Status as of 2026-07-01: the five-card Chinese result view was tightened so the spread table, captions, and first interpretation sheet stay readable on normal desktop and mobile viewports. This was followed by a V1.3 table ritual upgrade that turns the primary draw flow into explicit shuffle, cut, deal, reveal, and read states.

## V1.3 Backend-Assisted Analysis

Do not call AI providers directly from the browser.

When AI analysis is added, use a controlled backend endpoint. The current preferred path is GitHub Pages plus a Cloudflare Worker:

```text
/api/tarot/analyze
/api/tarot/analyze/stream
```

The backend should include:

- Provider API keys stored only in server environment variables
- IP-based rate limiting, default 20 AI readings per IP per day
- Abuse protection
- A simple budget cap
- DeepSeek as the first provider
- A local interpretation fallback when the provider fails
- Streaming output for the generated reading
- Natural UI copy that does not overexplain backend mechanics

Status as of 2026-07-01: the Cloudflare Worker endpoint is deployed, the GitHub Pages build is compiled with the public endpoint, streaming output is used first, and JSON output remains as a fallback. The remaining backend work is not a second implementation pass; it is operational hardening, especially explicit daily budget monitoring, owner-side usage inspection, and better failure observability.

See [AI Backend Plan](AI_BACKEND.md) for the recommended DeepSeek proxy shape.

## V1.4 Immersive Tabletop Rebuild

- Replace the page-like reading layout with an immersive tabletop application surface
- Use generated raster assets for the dark celestial table and parchment manuscript frame
- Keep all live UI text, controls, tabs, buttons, readings, and journal actions code-native
- Preserve the locked random draw boundary: the cards are selected before shuffle/cut/deal animation begins
- Keep the right-side manuscript as the home for local reading, AI deep reading, journal, save, and export
- Translate mobile into table-first interaction plus a bottom manuscript drawer, not a squeezed desktop layout

Status as of 2026-07-01: V1.4 is implemented in the main reading screen. Desktop uses a black-gold top bar, left ritual toolbar, central celestial table, bottom ritual rail, and right parchment manuscript panel. Mobile uses compact setup controls, smaller table cards, fixed bottom navigation, and a manuscript drawer. Chrome extension desktop QA and headless Chrome mobile QA passed with no horizontal overflow.

## V1.5 Deck Expansion And Operations

- Refine the code-native suit/rank system for minor arcana after real use
- Decide later whether all 56 minor arcana need full illustrations
- Keep the deck original rather than copying commercial or Rider-Waite-Smith artwork
- Add owner-side D1 usage inspection queries or a lightweight internal usage view
- Add explicit model budget monitoring and clearer Worker failure diagnostics

Status as of 2026-07-01: the first code-native minor-arcana face system is implemented. The next practical deck step is not generating all 56 full illustrations; it is reviewing the system cards in real readings, then deciding which Aces/court cards deserve full artwork first.

## Possible Personal Website Integration

The tool can later be moved into a personal Astro/Vue site by preserving:

- `src/data`
- `src/lib`
- `src/components/tarot`

The first migration target should be a tool page, not a marketing landing page.

See [Next Phase Direction](NEXT_PHASE_DIRECTION.md) for the current visual, backend, hosting, and cost decisions.
