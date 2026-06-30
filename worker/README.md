# Arcana Mirror Worker

Cloudflare Worker backend for direct AI tarot interpretation.

It handles:

- `POST /api/tarot/analyze`
- DeepSeek API proxying
- IP-based daily rate limiting
- D1 logging of AI reading requests and responses

## First Setup

Install and authenticate Wrangler:

```bash
npx wrangler login
```

Create the D1 database:

```bash
npx wrangler d1 create tarot_reflection_readings
```

Copy the returned `database_id` into `wrangler.toml`.

Apply migrations to the remote database:

```bash
npx wrangler d1 migrations apply tarot_reflection_readings --remote
```

Set secrets. Paste values only into the terminal prompts:

```bash
npx wrangler secret put DEEPSEEK_API_KEY
npx wrangler secret put IP_HASH_SALT
```

Deploy:

```bash
npx wrangler deploy
```

The deploy output will include the Worker URL, usually:

```text
https://tarot-reflection-api.<your-workers-subdomain>.workers.dev
```

The frontend endpoint should be:

```text
https://tarot-reflection-api.<your-workers-subdomain>.workers.dev/api/tarot/analyze
```

## Connect GitHub Pages

Set the repository variable:

```bash
gh variable set PUBLIC_TAROT_AI_ENDPOINT --body "https://tarot-reflection-api.<your-workers-subdomain>.workers.dev/api/tarot/analyze"
```

Then rerun the Pages workflow or push a new commit.

## Inspect Logs

Recent AI readings:

```bash
npx wrangler d1 execute tarot_reflection_readings --remote --command "SELECT created_at, locale, question, spread_name, model FROM ai_readings ORDER BY created_at DESC LIMIT 20;"
```

Latest full response:

```bash
npx wrangler d1 execute tarot_reflection_readings --remote --command "SELECT created_at, question, cards_json, ai_response FROM ai_readings ORDER BY created_at DESC LIMIT 1;"
```
