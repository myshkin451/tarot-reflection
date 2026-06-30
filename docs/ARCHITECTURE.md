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

There is no server runtime in v1. All application state is local to the browser.

## Important Files

- `src/pages/index.astro`: home and reading app entry
- `src/pages/cards/index.astro`: card meaning browser
- `src/components/tarot/ReadingWizard.vue`: main reading workflow
- `src/components/tarot/ReadingResult.vue`: result display and actions
- `src/components/tarot/PromptBuilder.vue`: prompt generation UI
- `src/components/tarot/JournalPanel.vue`: local journal
- `src/data/tarotCards.ts`: full 78-card dataset
- `src/data/spreads.ts`: supported spreads and positions
- `src/lib/draw.ts`: random drawing logic
- `src/lib/interpretation.ts`: local first-pass reading interpretation
- `src/lib/promptBuilder.ts`: prompt and Markdown export logic
- `src/lib/storage.ts`: localStorage wrapper

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

## Storage

Saved readings use the browser key:

```text
arcana-mirror-readings
```

The app catches storage errors and fails softly. There is no sync, account, or remote persistence in v1.

## Security Boundary

The app must not include API keys, secrets, or direct AI provider calls in browser code. Future AI analysis should be routed through a server endpoint controlled by the site owner.

GitHub Pages can keep serving the static app. If DeepSeek or another model provider is added, the model call should live in a separate backend surface such as a Cloudflare Worker, Vercel Function, or small API service.
