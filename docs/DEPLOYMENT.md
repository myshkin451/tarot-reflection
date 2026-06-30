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

## Optional AI Worker

The direct AI reading feature is served by a Cloudflare Worker. It is optional: if the frontend build does not receive `PUBLIC_TAROT_AI_ENDPOINT`, the AI section stays hidden and the static app continues to work.

First-time Worker setup:

```bash
npx wrangler login
npx wrangler d1 create tarot_reflection_readings
```

Copy the returned `database_id` into `wrangler.toml`, replacing:

```text
replace-with-cloudflare-d1-database-id
```

Apply the D1 migration to the remote database:

```bash
npx wrangler d1 migrations apply tarot_reflection_readings --remote
```

Set secrets. Paste the values into the terminal prompts, not into source files:

```bash
npx wrangler secret put DEEPSEEK_API_KEY
npx wrangler secret put IP_HASH_SALT
```

Deploy the Worker:

```bash
npx wrangler deploy
```

Set the GitHub Pages build variable to the Worker endpoint:

```bash
gh variable set PUBLIC_TAROT_AI_ENDPOINT --body "https://tarot-reflection-api.<your-workers-subdomain>.workers.dev/api/tarot/analyze"
```

Then rerun the Pages workflow or push a new commit.

To inspect recent AI readings:

```bash
npx wrangler d1 execute tarot_reflection_readings --remote --command "SELECT created_at, locale, question, spread_name, model FROM ai_readings ORDER BY created_at DESC LIMIT 20;"
```
