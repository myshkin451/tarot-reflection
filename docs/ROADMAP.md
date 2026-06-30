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

- Add local first-pass reading summary logic
- Add position-specific interpretation helpers
- Show advice and shadow notes in the card library
- Polish card meanings so local reading stays useful without AI

## V1.2 Visual Deck And Motion

- Design an original Arcana Mirror card back
- Add a tactile deck stack with visible card depth
- Replace the current abstract draw moment with shuffle, fan, deal, flip, and settle motion
- Create 3 major-arcana sample assets to lock the art direction
- Move toward a result layout where cards remain visually present while interpretation appears
- Keep UI copy natural and user-facing; remove developer-facing positioning phrases

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

See [AI Backend Plan](AI_BACKEND.md) for the recommended DeepSeek proxy shape.

## V1.4 Deck Expansion

- Generate or hand-curate the 22 major-arcana card faces after the first samples are approved
- Build a code-native suit/rank system for minor arcana
- Decide later whether all 56 minor arcana need full illustrations
- Keep the deck original rather than copying commercial or Rider-Waite-Smith artwork

## Possible Personal Website Integration

The tool can later be moved into a personal Astro/Vue site by preserving:

- `src/data`
- `src/lib`
- `src/components/tarot`

The first migration target should be a tool page, not a marketing landing page.

See [Next Phase Direction](NEXT_PHASE_DIRECTION.md) for the current visual, backend, hosting, and cost decisions.
