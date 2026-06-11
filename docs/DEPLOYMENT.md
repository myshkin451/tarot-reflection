# Deployment

## GitHub Pages

This project is designed for GitHub Pages with GitHub Actions.

Expected public URL:

```text
https://myshkin451.github.io/tarot-reflection/
```

## Repository Settings

In GitHub:

1. Open the repository settings.
2. Go to Pages.
3. Set the source to GitHub Actions.
4. Push to `main`.
5. Wait for the `Deploy to GitHub Pages` workflow to complete.

## Workflow

The workflow is `.github/workflows/deploy.yml`.

It runs:

```bash
npm ci
npm run build
```

The workflow uses Node 22 because Astro 6 requires Node `>=22.12.0`.

Then it uploads `dist` through `actions/upload-pages-artifact` and deploys with `actions/deploy-pages`.

## Astro Base Path

`astro.config.mjs` reads GitHub environment variables:

```js
GITHUB_PAGES=true
GITHUB_REPOSITORY=myshkin451/tarot-reflection
GITHUB_REPOSITORY_OWNER=myshkin451
```

When those are present, the app builds with:

```text
base: /tarot-reflection
site: https://myshkin451.github.io
```

This is required because project Pages sites are served from a repository subpath.

## Local Verification

Before deployment:

```bash
npm run test
npm run build
npm audit --omit=dev
```

After deployment:

1. Open the Pages URL.
2. Draw a reading.
3. Copy a prompt.
4. Save a reading.
5. Open `/cards` and confirm all 78 cards render.
