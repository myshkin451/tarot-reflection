# Content And Safety

## Tarot Text

The card meanings in `src/data/tarotCards.ts` are original project text. They are not copied from commercial tarot websites.

Major Arcana entries are individually written. Minor Arcana entries are generated from maintainable suit and rank templates so the dataset remains complete and consistent.

## Card Images

V1 does not use Rider-Waite-Smith scans or third-party deck art. Card faces are code-native visual designs using text, borders, and symbolic layout.

This avoids deck image licensing ambiguity and gives the product a more distinct visual identity.

The next visual pass should move toward an original Arcana Mirror deck. Use generated or hand-curated original art for the card back and major arcana samples first; do not copy commercial decks or modern recolors of traditional tarot images.

## Reading Style

The local card reading should work before any AI request. It should use clear tarot-reading language:

- "may suggest"
- "possible action"
- "pattern"
- "landing point"
- "watch for"

It should avoid deterministic language:

- "will happen"
- "fate says"
- "guaranteed"
- "certain outcome"

## AI Prompt Safety

Prompt Builder includes a safety boundary:

- Do not present the reading as fixed fate.
- Do not give medical, legal, investment, or financial certainty.
- Read the cards directly, without deterministic claims.
- Include the local card reading as context, but ask the model to keep it provisional rather than absolute.
- Do not end with a separate question list or journaling prompt section.

## Privacy

Journal entries stay in the browser through `localStorage`.

The optional AI backend remains no-login. Successful AI readings are stored in Cloudflare D1 so the owner can inspect generated results and debug the service. UI copy should stay natural and lightweight rather than adding a large privacy explanation wall.
