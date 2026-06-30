import deckManifest from "@/assets/decks/arcana-mirror/manifest.json";
import cardBackImage from "@/assets/decks/arcana-mirror/card-back.webp";
import theFoolImage from "@/assets/decks/arcana-mirror/cards/the-fool.webp";
import theHighPriestessImage from "@/assets/decks/arcana-mirror/cards/the-high-priestess.webp";
import theMagicianImage from "@/assets/decks/arcana-mirror/cards/the-magician.webp";

type LocalizedAssetText = {
  en: string;
  zh: string;
};

type ManifestCardAsset = {
  id: string;
  src: string;
  arcana: "major" | "minor";
  alt: LocalizedAssetText;
  promptFocus: string;
};

type ManifestCardBackAsset = {
  id: string;
  src: string;
  alt: LocalizedAssetText;
  promptFocus: string;
};

export type DeckImageAsset = (ManifestCardAsset | ManifestCardBackAsset) & {
  image: string;
};

const cardImages = {
  "the-fool": theFoolImage.src,
  "the-magician": theMagicianImage.src,
  "the-high-priestess": theHighPriestessImage.src
} as const;

const manifestCards = deckManifest.cards as Record<string, ManifestCardAsset>;

export const arcanaMirrorDeckManifest = deckManifest;

export function getDeckBackAsset(): DeckImageAsset {
  return {
    ...(deckManifest.cardBack as ManifestCardBackAsset),
    image: cardBackImage.src
  };
}

export function getDeckCardAsset(cardId: string): DeckImageAsset | undefined {
  const asset = manifestCards[cardId];
  const image = cardImages[cardId as keyof typeof cardImages];

  if (!asset || !image) {
    return undefined;
  }

  return {
    ...asset,
    image
  };
}
