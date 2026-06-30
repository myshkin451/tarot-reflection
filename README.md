# Arcana Mirror

Arcana Mirror is a static-first tarot reading app. It draws cards, gives an immediate local card reading, saves local journal entries, and can generate a deeper AI reading through a small Cloudflare Worker.

It is not positioned as deterministic fortune telling. The product goal is quieter and more useful: help a person ask a question, read the cards, notice the pattern on the table, and get a richer AI-assisted interpretation when they want one.

## Live Site

After deployment, the default GitHub Pages URL is:

```text
https://myshkin451.github.io/tarot-reflection/
```

## Features

- One-card, three-card, and five-card spreads
- Optional reversed cards
- No duplicate cards in one reading
- 78-card structured tarot dataset with upright, reversed, advice, and shadow notes
- Local card reading before any AI step
- English and Simplified Chinese UI
- CSS/SVG-style card faces, no copyrighted tarot image dependency
- Shuffle and reveal motion for the draw flow
- AI Prompt Builder with compact and deep-analysis prompts
- Optional Cloudflare Worker + DeepSeek direct AI reading flow
- Streaming AI reading endpoint for progressive output
- Copy prompt and download Markdown
- Local journal powered by `localStorage`
- Export saved readings as JSON or Markdown
- Static GitHub Pages deployment through GitHub Actions

## Privacy And Safety

- No login or account system
- No browser-side AI API calls
- No API keys or secrets in the frontend
- Reading history stays in the user's browser storage
- Successful AI readings are stored in Cloudflare D1 for owner-side inspection and rate-limit/debug context
- Prompts instruct AI tools not to present readings as fixed fate and not to give medical, legal, investment, or financial certainty

## Tech Stack

- Astro 6
- Vue 3
- TypeScript
- Tailwind CSS through PostCSS
- Vitest
- GitHub Actions + GitHub Pages

## Local Development

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run test
npm run build
npm run preview
```

## Project Structure

```text
src/
  components/tarot/   Vue UI components
  data/               tarot card and spread data
  lib/                draw logic, prompt builder, storage, i18n helpers
  locales/            UI copy
  pages/              Astro routes
  styles/             global CSS and design tokens
  test/               Vitest tests
docs/                 product, architecture, deployment, content, roadmap docs
```

## Documentation

- [Product Spec](docs/PRODUCT_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Content And Safety](docs/CONTENT_AND_SAFETY.md)
- [AI Backend Plan](docs/AI_BACKEND.md)
- [Next Phase Direction](docs/NEXT_PHASE_DIRECTION.md)
- [Roadmap](docs/ROADMAP.md)

## Deployment

The repository includes `.github/workflows/deploy.yml`. Push to `main`, enable GitHub Pages with the GitHub Actions source, and the workflow will build and publish `dist`.

The Astro config automatically sets the correct base path when `GITHUB_PAGES=true`, so the app works under `/tarot-reflection/` on GitHub Pages.

## License

Code is released under the MIT License. The written tarot meanings in `src/data/tarotCards.ts` are original concise project content; do not copy commercial tarot site text into this dataset.
