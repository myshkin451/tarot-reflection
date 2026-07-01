# Architecture

## Overview

Arcana Mirror is a static Astro application with Vue islands for interactive reading flows.

```text
Astro pages
  -> Vue interactive components
  -> typed tarot data
  -> pure draw, interpretation, and prompt logic
  -> browser localStorage
```

The core app remains static-first. Reading state and the table ritual are local to the browser; the optional server surface is only for direct AI interpretation. The V1.4 interface uses project-bound raster assets for atmosphere, but all real UI text and controls remain code-native.

An optional Cloudflare Worker backend can be added for direct AI readings:

```text
Vue reading result
  -> src/lib/aiReading.ts
  -> Cloudflare Worker /api/tarot/analyze
  -> DeepSeek API
  -> Cloudflare D1 reading log and daily IP counter
```

## Important Files

- `src/pages/index.astro`: home and reading app entry
- `src/pages/cards/index.astro`: card meaning browser
- `src/assets/interface/`: generated tabletop and manuscript assets used by the immersive reading surface
- `src/components/tarot/ReadingWizard.vue`: main immersive tabletop workflow, including setup, ritual state, card table, manuscript tabs, AI reading, journal, save, and export
- `src/components/tarot/ReadingResult.vue`: result display and actions
- `src/components/tarot/CardFace.vue`: unified card rendering entry for image cards, face-down cards, and system faces
- `src/components/tarot/MinorCardFace.vue`: code-native minor-arcana system face
- `src/components/tarot/PromptBuilder.vue`: prompt generation UI
- `src/components/tarot/JournalPanel.vue`: local journal
- `src/data/tarotCards.ts`: full 78-card dataset
- `src/data/spreads.ts`: supported spreads and positions
- `src/lib/draw.ts`: random drawing logic
- `src/lib/minorVisuals.ts`: pure suit/rank visual mapping for minor arcana
- `src/lib/interpretation.ts`: local card reading interpretation
- `src/lib/promptBuilder.ts`: prompt and Markdown export logic
- `src/lib/aiReading.ts`: optional AI reading request payload and client
- `src/lib/storage.ts`: localStorage wrapper
- `worker/src/index.js`: Cloudflare Worker AI proxy
- `worker/migrations/0001_create_readings.sql`: D1 tables for AI readings and daily IP limits

## Data Model

Core TypeScript types live in `src/lib/types.ts`:

- `TarotCard`
- `Spread`
- `SpreadPosition`
- `DrawnCard`
- `ReadingSession`
- `Locale`

The UI should read display text through `src/lib/locale.ts` and `src/lib/i18n.ts` so the structure can add more languages later.

## Randomness

`src/lib/draw.ts` uses `crypto.getRandomValues` when available and falls back to `Math.random`. Draws are made from a copied deck pool, so a reading cannot contain duplicate cards.

The table ritual deliberately keeps randomness and presentation separate. `ReadingWizard.vue` locks the `ReadingSession` before the shuffle/cut/deal animation starts; later user actions reveal cards and control pacing, but they do not change the already drawn cards.

## V1.4 Interface Assets

The immersive tabletop uses:

- `src/assets/interface/tabletop-bg.png`: dark celestial table background with edge props and usable central space
- `src/assets/interface/manuscript-panel.png`: blank parchment/leather manuscript frame for local and AI readings

These are atmosphere assets only. They must not contain live app text, card names, AI output, journal entries, buttons, tabs, or other stateful content. Those remain in Vue templates so the app stays accessible, localizable, and responsive.

## Storage

Saved readings use the browser key:

```text
arcana-mirror-readings
```

The app catches storage errors and fails softly. There is no sync, account, or remote persistence in v1.

## Security Boundary

The app must not include API keys, secrets, or direct AI provider calls in browser code. Future AI analysis should be routed through a server endpoint controlled by the site owner.

GitHub Pages can keep serving the static app. If DeepSeek or another model provider is added, the model call should live in a separate backend surface such as a Cloudflare Worker, Vercel Function, or small API service.

The implemented Worker path uses server-side secrets and D1. `DEEPSEEK_API_KEY` and `IP_HASH_SALT` must be stored with `wrangler secret put`, never committed.
