import { describe, expect, it } from "vitest";
import { tarotCards } from "@/data/tarotCards";
import { getMinorVisual, isMinorCard, minorRankVisuals, minorSuitVisuals } from "@/lib/minorVisuals";

describe("minor arcana visual system", () => {
  const minorCards = tarotCards.filter((card) => card.arcana === "minor");

  it("keeps the 56-card minor arcana organized by four suits", () => {
    expect(minorCards).toHaveLength(56);

    for (const suit of Object.values(minorSuitVisuals)) {
      const cards = minorCards.filter((card) => card.id.endsWith(`-of-${suit.id}`));

      expect(cards).toHaveLength(14);
      expect(cards.every((card) => isMinorCard(card))).toBe(true);
    }
  });

  it("maps every minor card to a stable suit and rank visual", () => {
    for (const card of minorCards) {
      const visual = getMinorVisual(card);

      expect(visual.suit.id in minorSuitVisuals).toBe(true);
      expect(visual.rank.id in minorRankVisuals).toBe(true);
      expect(visual.symbol).toBe(card.symbol);
      expect(visual.themeLine.en).toContain(visual.suit.label.en);
    }
  });

  it("uses pip layouts for numeric cards and court layouts for court cards", () => {
    expect(getMinorVisual(minorCards.find((card) => card.id === "ten-of-swords")!).rank.pipCount).toBe(10);
    expect(getMinorVisual(minorCards.find((card) => card.id === "queen-of-cups")!).rank.court).toBe(true);
    expect(getMinorVisual(minorCards.find((card) => card.id === "ace-of-pentacles")!).rank.layout).toBe("seed");
  });
});
