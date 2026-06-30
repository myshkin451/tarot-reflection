import { describe, expect, it } from "vitest";
import { tarotCards } from "@/data/tarotCards";
import { getSpread } from "@/data/spreads";
import { drawCards } from "@/lib/draw";
import { buildAiReadingPayload } from "@/lib/aiReading";
import type { ReadingSession } from "@/lib/types";

describe("buildAiReadingPayload", () => {
  it("serializes the current reading for the backend", () => {
    const spread = getSpread("three-card");
    const session: ReadingSession = {
      id: "ai-reading-test",
      createdAt: "2026-01-01T00:00:00.000Z",
      question: "What should I understand before moving forward?",
      spreadId: spread.id,
      spreadName: spread.name,
      cards: drawCards({
        deck: tarotCards,
        spread,
        includeReversed: false,
        randomInt: () => 0,
        randomFloat: () => 0.9
      }),
      locale: "en"
    };

    const payload = buildAiReadingPayload(session, "en");

    expect(payload.version).toBe(1);
    expect(payload.sessionId).toBe(session.id);
    expect(payload.question).toBe(session.question);
    expect(payload.spreadName).toBe(spread.name.en);
    expect(payload.cards).toHaveLength(3);
    expect(payload.cards[0]).toMatchObject({
      orientation: "upright",
      positionName: spread.positions[0].name.en
    });
    expect(payload.localInsight.overview.length).toBeGreaterThan(80);
  });
});
