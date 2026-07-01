<script setup lang="ts">
import { computed } from "vue";
import type { Locale, TarotCard } from "@/lib/types";
import { getDeckBackAsset, getDeckCardAsset } from "@/lib/deckAssets";
import { isMinorCard } from "@/lib/minorVisuals";
import { list, text } from "@/lib/locale";
import MinorCardFace from "./MinorCardFace.vue";

const props = defineProps<{
  card: TarotCard;
  locale: Locale;
  orientation?: "upright" | "reversed";
  position?: string;
  compact?: boolean;
  reveal?: boolean;
  revealIndex?: number;
  facedown?: boolean;
}>();

const cardAsset = computed(() => getDeckCardAsset(props.card.id));
const deckBack = getDeckBackAsset();
const minorFallback = computed(() => !cardAsset.value && isMinorCard(props.card));
const cardAssetAlt = computed(() => {
  const asset = cardAsset.value;

  if (!asset) {
    return text(props.card.name, props.locale);
  }

  return props.locale === "zh-CN" ? asset.alt.zh : asset.alt.en;
});
</script>

<template>
  <article
    class="tarot-card"
    :class="{ reversed: orientation === 'reversed', compact, reveal, facedown, 'has-art': cardAsset, 'minor-card': minorFallback }"
    :style="reveal ? { '--reveal-delay': `${(revealIndex ?? 0) * 120}ms` } : undefined"
  >
    <div class="card-frame">
      <template v-if="facedown">
        <img class="card-back-art" :src="deckBack.image" :alt="locale === 'zh-CN' ? deckBack.alt.zh : deckBack.alt.en" loading="lazy" decoding="async" />
        <div class="card-back-edge" aria-hidden="true" />
      </template>
      <template v-else-if="cardAsset">
        <img class="card-art" :src="cardAsset.image" :alt="cardAssetAlt" loading="lazy" decoding="async" />
        <div class="card-art-glaze" aria-hidden="true" />
        <div class="card-title-plate">
          <div class="card-name">{{ text(card.name, locale) }}</div>
          <div v-if="position" class="card-position">{{ position }}</div>
          <div v-if="orientation" class="card-orientation">
            {{ orientation === "reversed" ? (locale === "zh-CN" ? "逆位" : "Reversed") : (locale === "zh-CN" ? "正位" : "Upright") }}
          </div>
          <div v-if="!compact" class="card-keywords">
            <span v-for="keyword in list(card.keywords[orientation || 'upright'], locale).slice(0, 3)" :key="keyword">
              {{ keyword }}
            </span>
          </div>
        </div>
      </template>
      <template v-else-if="minorFallback">
        <MinorCardFace :card="card" :locale="locale" :orientation="orientation" :position="position" :compact="compact" />
      </template>
      <template v-else>
        <div class="card-corner">{{ card.symbol }}</div>
        <div class="card-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div class="card-sigil">{{ card.symbol }}</div>
        <div class="card-name">{{ text(card.name, locale) }}</div>
        <div v-if="position" class="card-position">{{ position }}</div>
        <div v-if="orientation" class="card-orientation">
          {{ orientation === "reversed" ? (locale === "zh-CN" ? "逆位" : "Reversed") : (locale === "zh-CN" ? "正位" : "Upright") }}
        </div>
        <div v-if="!compact" class="card-keywords">
          <span v-for="keyword in list(card.keywords[orientation || 'upright'], locale).slice(0, 3)" :key="keyword">
            {{ keyword }}
          </span>
        </div>
      </template>
    </div>
  </article>
</template>

<style scoped>
.tarot-card {
  --reveal-delay: 0ms;
  width: 100%;
  aspect-ratio: 2 / 3.18;
  min-height: 224px;
  color: #efe2c7;
  perspective: 900px;
}

.tarot-card.compact {
  min-height: 180px;
}

.card-frame {
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr auto auto auto;
  height: 100%;
  padding: 18px 16px;
  overflow: hidden;
  border: 1px solid rgba(216, 179, 111, 0.62);
  background:
    radial-gradient(circle at 50% 32%, rgba(216, 179, 111, 0.2), transparent 30%),
    linear-gradient(155deg, rgba(239, 226, 199, 0.11), rgba(239, 226, 199, 0.03)),
    #111012;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.42);
  transform: translateZ(0);
  transition:
    border-color 180ms ease,
    transform 220ms ease,
    box-shadow 220ms ease;
}

.tarot-card.has-art .card-frame,
.tarot-card.facedown .card-frame,
.tarot-card.minor-card .card-frame {
  display: block;
  padding: 0;
  background: #0b0a09;
}

.tarot-card.compact:not(.has-art) .card-frame {
  padding: 14px 10px;
}

.tarot-card:hover .card-frame {
  border-color: rgba(248, 240, 222, 0.86);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.5);
  transform: translateY(-3px);
}

.tarot-card.facedown:hover .card-frame {
  transform: translateY(-2px) rotateX(2deg);
}

.tarot-card.reveal .card-frame {
  animation: card-deal 680ms cubic-bezier(0.2, 0.8, 0.18, 1) both;
  animation-delay: var(--reveal-delay);
}

.tarot-card.reversed .card-frame {
  background:
    radial-gradient(circle at 50% 68%, rgba(111, 136, 150, 0.25), transparent 32%),
    linear-gradient(25deg, rgba(239, 226, 199, 0.11), rgba(239, 226, 199, 0.03)),
    #111012;
}

.tarot-card.reversed.has-art .card-art {
  transform: rotate(180deg) scale(1.03);
}

.card-back-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.card-back-edge {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(248, 240, 222, 0.12), transparent 12%, transparent 86%, rgba(0, 0, 0, 0.3)),
    radial-gradient(circle at 50% 15%, rgba(248, 240, 222, 0.08), transparent 26%);
  pointer-events: none;
}

.card-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.card-art-glaze {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(11, 10, 9, 0.02), transparent 42%, rgba(11, 10, 9, 0.2)),
    radial-gradient(circle at 50% 8%, rgba(248, 240, 222, 0.08), transparent 28%);
  pointer-events: none;
}

.card-title-plate {
  position: absolute;
  z-index: 2;
  right: clamp(18px, 8%, 28px);
  bottom: clamp(18px, 6.5%, 34px);
  left: clamp(18px, 8%, 28px);
  display: grid;
  gap: 7px;
  padding: 9px 10px 10px;
  color: #21160d;
  text-align: center;
}

.tarot-card.compact .card-title-plate {
  right: clamp(11px, 9%, 18px);
  bottom: clamp(11px, 6%, 18px);
  left: clamp(11px, 9%, 18px);
  gap: 3px;
  padding: 5px 6px;
}

.card-corner {
  font: 700 13px/1 var(--font-ui);
  color: rgba(216, 179, 111, 0.9);
}

.tarot-card.compact:not(.has-art) .card-corner {
  font-size: 11px;
}

.card-orbit {
  position: absolute;
  inset: 28px;
  display: grid;
  place-items: center;
  opacity: 0.68;
}

.card-orbit span {
  position: absolute;
  border: 1px solid rgba(216, 179, 111, 0.28);
  border-radius: 50%;
}

.card-orbit span:nth-child(1) {
  width: 62%;
  aspect-ratio: 1;
}

.card-orbit span:nth-child(2) {
  width: 42%;
  aspect-ratio: 1;
}

.card-orbit span:nth-child(3) {
  width: 1px;
  height: 65%;
  border-radius: 0;
}

.card-sigil {
  z-index: 1;
  place-self: center;
  font: 500 clamp(42px, 7vw, 72px) / 1 var(--font-display);
  color: #d8b36f;
  max-width: 100%;
  overflow-wrap: anywhere;
  text-align: center;
}

.tarot-card.compact:not(.has-art) .card-sigil {
  font-size: clamp(26px, 4vw, 36px);
}

.card-name,
.card-position,
.card-orientation {
  z-index: 1;
  text-align: center;
  letter-spacing: 0;
}

.card-name {
  margin-top: auto;
  font: 600 20px/1.05 var(--font-display);
  max-width: 100%;
  overflow-wrap: anywhere;
}

.tarot-card.compact:not(.has-art) .card-name {
  font-size: clamp(15px, 3vw, 18px);
}

.tarot-card.has-art .card-name {
  margin-top: 0;
  color: #21160d;
  font-size: clamp(16px, 2.6vw, 24px);
  text-shadow: 0 1px 0 rgba(248, 240, 222, 0.36);
}

.tarot-card.compact.has-art .card-name {
  font-size: clamp(12px, 2vw, 15px);
  line-height: 1.05;
}

.card-position {
  margin-top: 8px;
  color: rgba(248, 240, 222, 0.64);
  font: 600 12px/1.2 var(--font-ui);
}

.tarot-card.has-art .card-position {
  margin-top: 0;
  color: rgba(33, 22, 13, 0.72);
  font-size: 11px;
}

.card-orientation {
  margin-top: 7px;
  color: rgba(216, 179, 111, 0.86);
  font: 600 11px/1 var(--font-ui);
  text-transform: uppercase;
}

.tarot-card.has-art .card-orientation {
  margin-top: 0;
  color: rgba(117, 78, 29, 0.92);
  font-size: 10px;
}

.card-keywords {
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin-top: 13px;
}

.card-keywords span {
  border-top: 1px solid rgba(216, 179, 111, 0.32);
  padding-top: 5px;
  color: rgba(248, 240, 222, 0.68);
  font: 500 11px/1 var(--font-ui);
}

.tarot-card.has-art .card-keywords {
  gap: 4px;
  margin-top: 2px;
}

.tarot-card.has-art .card-keywords span {
  border-top-color: rgba(117, 78, 29, 0.32);
  color: rgba(33, 22, 13, 0.7);
  font-size: 10px;
}

@keyframes card-deal {
  from {
    opacity: 0;
    transform: translateY(32px) rotateY(72deg) scale(0.94);
  }

  to {
    opacity: 1;
    transform: translateY(0) rotateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tarot-card.reveal .card-frame {
    animation: none;
  }
}
</style>
