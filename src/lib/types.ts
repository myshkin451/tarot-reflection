export type Locale = "en" | "zh-CN";
export type Orientation = "upright" | "reversed";
export type Arcana = "major" | "minor";
export type Depth = "compact" | "deep";

export interface LocalizedText {
  en: string;
  zh: string;
}

export interface LocalizedList {
  en: string[];
  zh: string[];
}

export interface TarotCard {
  id: string;
  name: LocalizedText;
  arcana: Arcana;
  suit?: LocalizedText;
  rank?: LocalizedText;
  number?: number;
  element?: LocalizedText;
  symbol: string;
  keywords: {
    upright: LocalizedList;
    reversed: LocalizedList;
  };
  meaning: {
    upright: LocalizedText;
    reversed: LocalizedText;
  };
  advice: LocalizedText;
  shadow: LocalizedText;
  reflection: LocalizedList;
}

export interface SpreadPosition {
  id: string;
  name: LocalizedText;
  prompt: LocalizedText;
}

export interface Spread {
  id: "one-card" | "three-card" | "five-card";
  name: LocalizedText;
  description: LocalizedText;
  positions: SpreadPosition[];
}

export interface DrawnCard {
  card: TarotCard;
  orientation: Orientation;
  position: SpreadPosition;
}

export interface ReadingSession {
  id: string;
  createdAt: string;
  question: string;
  spreadId: Spread["id"];
  spreadName: LocalizedText;
  cards: DrawnCard[];
  locale: Locale;
  notes?: string;
  aiResponse?: string;
}
