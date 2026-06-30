import { describe, expect, it } from "vitest";
import { tarotCards } from "@/data/tarotCards";
import { getSpread } from "@/data/spreads";
import { drawCards } from "@/lib/draw";
import { buildPrompt } from "@/lib/promptBuilder";
import type { ReadingSession } from "@/lib/types";

describe("buildPrompt", () => {
  it("contains all drawn cards and positions", () => {
    const spread = getSpread("three-card");
    const cards = drawCards({
      deck: tarotCards,
      spread,
      includeReversed: false,
      randomInt: () => 0,
      randomFloat: () => 0.9
    });
    const session: ReadingSession = {
      id: "test",
      createdAt: new Date("2026-01-01T00:00:00Z").toISOString(),
      question: "Should I keep building this project?",
      spreadId: spread.id,
      spreadName: spread.name,
      cards,
      locale: "en"
    };

    const prompt = buildPrompt(session, {
      locale: "en",
      depth: "deep",
      outputLanguage: "English",
      tone: "calm"
    });

    expect(prompt).toContain("Should I keep building this project?");
    expect(prompt).toContain("First read from the card table");
    expect(prompt).not.toContain("Three reflection questions");
    expect(prompt).not.toContain("Journal Questions");
    for (const drawn of cards) {
      expect(prompt).toContain(drawn.card.name.en);
      expect(prompt).toContain(drawn.position.name.en);
    }
  });
});
