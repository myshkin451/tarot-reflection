import deckManifest from "@/assets/decks/arcana-mirror/manifest.json";
import cardBackImage from "@/assets/decks/arcana-mirror/card-back.webp";

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

const cardImageModules = import.meta.glob<{ default: { src: string } }>(
  "../assets/decks/arcana-mirror/cards/*.webp",
  { eager: true }
);

const cardImages: Record<string, string | undefined> = Object.fromEntries(
  Object.entries(cardImageModules).map(([path, module]) => [
    path.split("/").pop()?.replace(".webp", ""),
    module.default.src
  ])
);

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
  const image = cardImages[cardId];

  if (!asset || !image) {
    return undefined;
  }

  return {
    ...asset,
    image
  };
}
