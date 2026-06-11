import type { DrawnCard, Spread, TarotCard } from "./types";

export interface DrawOptions {
  deck: TarotCard[];
  spread: Spread;
  includeReversed: boolean;
  reversedProbability?: number;
  randomInt?: (maxExclusive: number) => number;
  randomFloat?: () => number;
}

const UINT_MAX = 0xffffffff;

export function secureRandomFloat(): number {
  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return values[0] / (UINT_MAX + 1);
  }

  return Math.random();
}

export function secureRandomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error("maxExclusive must be a positive integer");
  }

  return Math.floor(secureRandomFloat() * maxExclusive);
}

export function drawCards({
  deck,
  spread,
  includeReversed,
  reversedProbability = 0.5,
  randomInt = secureRandomInt,
  randomFloat = secureRandomFloat
}: DrawOptions): DrawnCard[] {
  if (spread.positions.length > deck.length) {
    throw new Error("Spread requires more cards than the deck contains");
  }

  const pool = [...deck];

  return spread.positions.map((position) => {
    const index = randomInt(pool.length);
    const [card] = pool.splice(index, 1);
    const orientation = includeReversed && randomFloat() < reversedProbability ? "reversed" : "upright";

    return {
      card,
      orientation,
      position
    };
  });
}
