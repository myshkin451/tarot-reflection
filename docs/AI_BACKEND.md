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

Keep GitHub Pages for the frontend and add one small backend endpoint:

```text
POST /api/tarot/analyze
```

Good hosting options:

- Cloudflare Worker
- Vercel Function
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

## Controls Needed Before Launch

- Store provider keys only in server environment variables
- Rate limit by IP or anonymous session
- Set a daily owner budget cap
- Limit request body size
- Limit model output tokens
- Add timeout and retry behavior
- Keep a local interpretation fallback in the UI
- Avoid storing raw user questions unless the user explicitly opts in

## DeepSeek Fit

DeepSeek is a reasonable first provider because the API can be inexpensive for low traffic. The risk is not cost at the start; the risk is exposing the key, accidentally creating an unlimited public endpoint, or letting model output become the only value of the product.

Recommended launch sequence:

1. Keep the current local interpretation and prompt builder.
2. Add a backend proxy with strict limits.
3. Add an optional "Generate deeper reading" button after the local result.
4. Show the AI response under the local reading, never instead of it.
5. Keep copy/download/export working even when AI fails.
