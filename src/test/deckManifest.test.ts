import { describe, expect, it } from "vitest";
import deckManifest from "@/assets/decks/arcana-mirror/manifest.json";
import { tarotCards } from "@/data/tarotCards";

describe("Arcana Mirror deck manifest", () => {
  it("maps sample card assets to known tarot card ids", () => {
    const knownCardIds = new Set(tarotCards.map((card) => card.id));
    const manifestCards = deckManifest.cards as Record<string, { src: string }>;

    expect(deckManifest.cardBack.src).toBe("./card-back.webp");
    expect(deckManifest.dimensions).toEqual({
      width: 1000,
      height: 1590,
      format: "webp"
    });

    for (const [cardId, asset] of Object.entries(manifestCards)) {
      expect(knownCardIds.has(cardId)).toBe(true);
      expect(asset.src).toMatch(/^\.\/cards\/.+\.webp$/);
    }
  });
});
