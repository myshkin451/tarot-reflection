# AI Backend Plan

## Product Decision

Arcana Mirror should work before AI is available. The local first-pass interpretation is the primary experience; AI should be an optional deeper-analysis layer.

This keeps the product useful when:

- The model provider is unavailable
- The user does not want to send a private question to a remote API
- The site owner wants to keep cost at zero for a static release

## Do Not Call DeepSeek From GitHub Pages

Do not put `DEEPSEEK_API_KEY` or any provider key in browser code. GitHub Pages is static, so anything shipped to the frontend can be inspected and reused by other people.

## Recommended MVP Architecture

Keep GitHub Pages for the frontend and add one small backend endpoint. The fastest current path is a Cloudflare Worker, because the project only needs a thin model proxy and a daily IP counter. Vercel remains a good option if the whole app is later moved to a Vercel-hosted personal site.

```text
POST /api/tarot/analyze
```

Preferred shape:

```text
GitHub Pages frontend
  -> Cloudflare Worker
  -> DeepSeek API
  -> D1 reading log and rate-limit counter
```

Fallback hosting options:

- Vercel Function, especially if the whole Astro app moves to Vercel
- Netlify Function
- A small server under the owner's control

The endpoint receives:

- User question
- Spread id and spread name
- Drawn cards with position, orientation, keywords, meanings, advice, shadow, and local interpretation
- Desired language
- Desired depth

The endpoint returns:

- Overall theme
- Per-card position interpretation
- Card relationship analysis
- Practical next actions
- Journaling questions
- Safety note when the user asks for medical, legal, investment, or major financial certainty

The Worker stores successful AI readings in D1:

- Created time
- Hashed IP and request day
- User question
- Spread and cards
- Local first-pass interpretation
- Prompt sent to the model
- AI response
- Model name and token usage when available

This is for the owner to inspect in Cloudflare D1, not a user-facing account feature.

## Controls Needed Before Launch

- Store provider keys only in server environment variables
- Rate limit by IP, default 20 AI readings per IP per day
- Set a daily owner budget cap
- Limit request body size
- Limit model output tokens
- Add timeout and retry behavior
- Keep a local interpretation fallback in the UI
- Avoid long-term storage of raw user questions in the MVP
- Keep UI copy natural; do not overexplain backend mechanics in the product surface

## DeepSeek Fit

DeepSeek is a reasonable first provider because the API can be inexpensive for low traffic. The risk is not cost at the start; the risk is exposing the key, accidentally creating an unlimited public endpoint, or letting model output become the only value of the product.

Recommended launch sequence:

1. Keep the current local interpretation and prompt builder.
2. Add a backend proxy with strict limits.
3. Add an optional "Generate deeper reading" button after the local result.
4. Show the AI response under the local reading, never instead of it.
5. Keep copy/download/export working even when AI fails.

## Current Direction Snapshot

Checked on 2026-06-30:

- Cloudflare Workers Free includes 100,000 Worker requests per day, which is far above the expected traffic for a 20 requests/IP/day tarot endpoint.
- Vercel Hobby can host the whole app and functions, but is more useful when the entire personal website moves there.
- DeepSeek should be used through a server-side key only.
- The first AI endpoint should not require login or a database-backed user model.

See [Next Phase Direction](NEXT_PHASE_DIRECTION.md) for the current product, visual, hosting, and cost decisions.

Implementation files:

- `worker/src/index.js`
- `worker/migrations/0001_create_readings.sql`
- `wrangler.toml`
- `src/lib/aiReading.ts`
