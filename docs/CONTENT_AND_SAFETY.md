# Content And Safety

## Tarot Text

The card meanings in `src/data/tarotCards.ts` are original project text. They are not copied from commercial tarot websites.

Major Arcana entries are individually written. Minor Arcana entries are generated from maintainable suit and rank templates so the dataset remains complete and consistent.

## Card Images

V1 does not use Rider-Waite-Smith scans or third-party deck art. Card faces are code-native visual designs using text, borders, and symbolic layout.

This avoids deck image licensing ambiguity and gives the product a more distinct visual identity.

The next visual pass should move toward an original Arcana Mirror deck. Use generated or hand-curated original art for the card back and major arcana samples first; do not copy commercial decks or modern recolors of traditional tarot images.

## Interpretation Style

The local first-pass interpretation should work before any AI request. It should use reflective language:

- "may suggest"
- "invites reflection"
- "possible action"
- "pattern"
- "question"

It should avoid deterministic language:

- "will happen"
- "fate says"
- "guaranteed"
- "certain outcome"

## AI Prompt Safety

Prompt Builder includes a safety boundary:

- Do not present the reading as fixed fate.
- Do not give medical, legal, investment, or financial certainty.
- Focus on reflection, perspective, and possible actions.
- Include the local first-pass interpretation as context, but ask the model to keep it provisional rather than absolute.

## Privacy

Journal entries stay in the browser through `localStorage`. There is no remote database, analytics system, account login, or server-side reading storage in v1.

If a future backend is added, it should remain no-login and AI requests should be optional. The MVP should not add a user database or long-term raw-question storage. UI copy should stay natural and lightweight rather than adding a large privacy explanation wall.
