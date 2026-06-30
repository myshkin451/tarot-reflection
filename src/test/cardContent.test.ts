import { describe, expect, it } from "vitest";
import { tarotCards } from "@/data/tarotCards";

describe("tarot card content", () => {
  it("keeps generated minor advice grammatically usable", () => {
    const minorCards = tarotCards.filter((card) => card.arcana === "minor");

    expect(minorCards.length).toBeGreaterThan(0);
    for (const card of minorCards) {
      expect(card.advice.en).not.toMatch(/^Let (act|honor|name|make)\b/);
      expect(card.advice.en).toMatch(/^The useful move is to /);
    }
  });
});
