# Content And Safety

## Tarot Text

The card meanings in `src/data/tarotCards.ts` are concise original project text. They are not copied from commercial tarot websites.

Major Arcana entries are individually written. Minor Arcana entries are generated from maintainable suit and rank templates so the dataset remains complete and consistent.

## Card Images

V1 does not use Rider-Waite-Smith scans or third-party deck art. Card faces are code-native visual designs using text, borders, and symbolic layout.

This avoids deck image licensing ambiguity and gives the product a more distinct visual identity.

## Interpretation Style

The app should use reflective language:

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

## Privacy

Journal entries stay in the browser through `localStorage`. There is no remote database, analytics system, account login, or server-side reading storage in v1.

If a future backend is added, the privacy model should be updated before deployment.
