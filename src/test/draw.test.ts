import { describe, expect, it } from "vitest";
import { tarotCards } from "@/data/tarotCards";
import { getSpread } from "@/data/spreads";
import { drawCards } from "@/lib/draw";

describe("drawCards", () => {
  it("exports a full 78-card deck", () => {
    expect(tarotCards).toHaveLength(78);
  });

  it("draws the correct spread count", () => {
    const spread = getSpread("five-card");
    const cards = drawCards({
      deck: tarotCards,
      spread,
      includeReversed: true,
      randomInt: () => 0,
      randomFloat: () => 0.9
    });

    expect(cards).toHaveLength(5);
  });

  it("does not duplicate cards in one reading", () => {
    const spread = getSpread("five-card");
    const cards = drawCards({
      deck: tarotCards,
      spread,
      includeReversed: true,
      randomInt: () => 0,
      randomFloat: () => 0.9
    });
    const ids = new Set(cards.map((drawn) => drawn.card.id));

    expect(ids.size).toBe(cards.length);
  });

  it("respects the reversed setting", () => {
    const spread = getSpread("three-card");
    const uprightOnly = drawCards({
      deck: tarotCards,
      spread,
      includeReversed: false,
      randomInt: () => 0,
      randomFloat: () => 0
    });
    const reversed = drawCards({
      deck: tarotCards,
      spread,
      includeReversed: true,
      randomInt: () => 0,
      randomFloat: () => 0
    });

    expect(uprightOnly.every((drawn) => drawn.orientation === "upright")).toBe(true);
    expect(reversed.every((drawn) => drawn.orientation === "reversed")).toBe(true);
  });
});
