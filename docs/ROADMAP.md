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
- Show advice, shadow, and journaling questions in the card library
- Add examples for good reflective questions

## V1.2 UX Polish

- Add a shareable local Markdown preview
- Improve mobile result navigation
- Tune subtle card shuffle and reveal animation
- Add import/export flow for journal backups

## V2 Backend-Assisted Analysis

Do not call AI providers directly from the browser.

When AI analysis is added, use a controlled backend endpoint:

```text
/api/tarot/analyze
```

The backend should include:

- Provider API keys stored only in server environment variables
- Rate limiting
- Abuse protection
- Clear privacy wording
- Optional model/provider selection
- A local interpretation fallback when the provider fails

See [AI Backend Plan](AI_BACKEND.md) for the recommended DeepSeek proxy shape.

## Possible Personal Website Integration

The tool can later be moved into a personal Astro/Vue site by preserving:

- `src/data`
- `src/lib`
- `src/components/tarot`

The first migration target should be a tool page, not a marketing landing page.
