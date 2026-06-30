import { describe, expect, it } from "vitest";
import { tarotCards } from "@/data/tarotCards";
import { getSpread } from "@/data/spreads";
import { drawCards } from "@/lib/draw";
import { buildReadingInsight } from "@/lib/interpretation";
import type { ReadingSession } from "@/lib/types";

function makeSession(): ReadingSession {
  const spread = getSpread("three-card");

  return {
    id: "insight-test",
    createdAt: "2026-01-01T00:00:00.000Z",
    question: "How should I think about this project?",
    spreadId: spread.id,
    spreadName: spread.name,
    cards: drawCards({
      deck: tarotCards,
      spread,
      includeReversed: true,
      randomInt: () => 0,
      randomFloat: () => 0.9
    }),
    locale: "en"
  };
}

describe("buildReadingInsight", () => {
  it("builds a useful first-pass interpretation", () => {
    const session = makeSession();
    const insight = buildReadingInsight(session, "en");

    expect(insight.title).toContain("Theme");
    expect(insight.overview.length).toBeGreaterThan(80);
    expect(insight.pattern.length).toBeGreaterThan(40);
    expect(insight.nextStep.length).toBeGreaterThan(40);
    expect(insight.cardNotes).toHaveLength(session.cards.length);
    expect(insight.questions.length).toBeGreaterThanOrEqual(3);
  });
});
