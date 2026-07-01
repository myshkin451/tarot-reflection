import type { TarotCard } from "./types";

export type MinorSuitId = "wands" | "cups" | "swords" | "pentacles";
export type MinorRankId =
  | "ace"
  | "two"
  | "three"
  | "four"
  | "five"
  | "six"
  | "seven"
  | "eight"
  | "nine"
  | "ten"
  | "page"
  | "knight"
  | "queen"
  | "king";

export interface MinorSuitVisual {
  id: MinorSuitId;
  accent: string;
  lowlight: string;
  glow: string;
  label: {
    en: string;
    zh: string;
  };
}

export interface MinorRankVisual {
  id: MinorRankId;
  pipCount: number;
  court: boolean;
  layout: string;
  title: {
    en: string;
    zh: string;
  };
}

export interface MinorCardVisual {
  suit: MinorSuitVisual;
  rank: MinorRankVisual;
  symbol: string;
  themeLine: {
    en: string;
    zh: string;
  };
}

export const minorSuitVisuals: Record<MinorSuitId, MinorSuitVisual> = {
  wands: {
    id: "wands",
    accent: "#c46a3f",
    lowlight: "#3b1810",
    glow: "rgba(196, 106, 63, 0.3)",
    label: { en: "Ember wood", zh: "余烬木纹" }
  },
  cups: {
    id: "cups",
    accent: "#78a7a0",
    lowlight: "#12302f",
    glow: "rgba(120, 167, 160, 0.28)",
    label: { en: "Moon water", zh: "月水" }
  },
  swords: {
    id: "swords",
    accent: "#9eb2c0",
    lowlight: "#18242c",
    glow: "rgba(158, 178, 192, 0.28)",
    label: { en: "Cold steel", zh: "冷钢" }
  },
  pentacles: {
    id: "pentacles",
    accent: "#a48255",
    lowlight: "#25230f",
    glow: "rgba(164, 130, 85, 0.28)",
    label: { en: "Mineral gold", zh: "矿金" }
  }
};

export const minorRankVisuals: Record<MinorRankId, MinorRankVisual> = {
  ace: { id: "ace", pipCount: 1, court: false, layout: "seed", title: { en: "Seed", zh: "种子" } },
  two: { id: "two", pipCount: 2, court: false, layout: "mirror", title: { en: "Mirror Pair", zh: "镜面对位" } },
  three: { id: "three", pipCount: 3, court: false, layout: "triangle", title: { en: "Triangle", zh: "三角成形" } },
  four: { id: "four", pipCount: 4, court: false, layout: "corners", title: { en: "Container", zh: "四角容器" } },
  five: { id: "five", pipCount: 5, court: false, layout: "fracture", title: { en: "Broken Symmetry", zh: "破裂对称" } },
  six: { id: "six", pipCount: 6, court: false, layout: "exchange", title: { en: "Exchange", zh: "交换" } },
  seven: { id: "seven", pipCount: 7, court: false, layout: "gate", title: { en: "Unfinished Gate", zh: "未完之门" } },
  eight: { id: "eight", pipCount: 8, court: false, layout: "spiral", title: { en: "Practice Spiral", zh: "练习螺旋" } },
  nine: { id: "nine", pipCount: 9, court: false, layout: "threshold", title: { en: "Threshold", zh: "成熟门槛" } },
  ten: { id: "ten", pipCount: 10, court: false, layout: "fullness", title: { en: "Full Array", zh: "完整阵列" } },
  page: { id: "page", pipCount: 1, court: true, layout: "messenger", title: { en: "Messenger", zh: "讯息者" } },
  knight: { id: "knight", pipCount: 1, court: true, layout: "rider", title: { en: "Pursuit", zh: "追索" } },
  queen: { id: "queen", pipCount: 1, court: true, layout: "keeper", title: { en: "Keeper", zh: "守护者" } },
  king: { id: "king", pipCount: 1, court: true, layout: "sovereign", title: { en: "Sovereign", zh: "执掌者" } }
};

const minorIdPattern =
  /^(ace|two|three|four|five|six|seven|eight|nine|ten|page|knight|queen|king)-of-(wands|cups|swords|pentacles)$/;

export function isMinorCard(card: TarotCard): boolean {
  return card.arcana === "minor" && minorIdPattern.test(card.id);
}

export function getMinorVisual(card: TarotCard): MinorCardVisual {
  const match = minorIdPattern.exec(card.id);

  if (!match || card.arcana !== "minor") {
    throw new Error(`Card is not an Arcana Mirror minor card: ${card.id}`);
  }

  const rank = minorRankVisuals[match[1] as MinorRankId];
  const suit = minorSuitVisuals[match[2] as MinorSuitId];

  return {
    suit,
    rank,
    symbol: card.symbol,
    themeLine: {
      en: `${rank.title.en} in ${suit.label.en}`,
      zh: `${suit.label.zh}中的${rank.title.zh}`
    }
  };
}
