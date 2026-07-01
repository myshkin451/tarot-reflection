<script setup lang="ts">
import { computed } from "vue";
import { getMinorVisual } from "@/lib/minorVisuals";
import { list, text } from "@/lib/locale";
import type { Locale, Orientation, TarotCard } from "@/lib/types";

const props = defineProps<{
  card: TarotCard;
  locale: Locale;
  orientation?: Orientation;
  position?: string;
  compact?: boolean;
}>();

const visual = computed(() => getMinorVisual(props.card));
const keywords = computed(() => list(props.card.keywords[props.orientation || "upright"], props.locale).slice(0, props.compact ? 2 : 3));
const pipItems = computed(() => Array.from({ length: visual.value.rank.pipCount }, (_, index) => index));
</script>

<template>
  <div
    class="minor-card-face"
    :class="[`suit-${visual.suit.id}`, `rank-${visual.rank.id}`, `layout-${visual.rank.layout}`, { compact, reversed: orientation === 'reversed' }]"
    :style="{
      '--minor-accent': visual.suit.accent,
      '--minor-lowlight': visual.suit.lowlight,
      '--minor-glow': visual.suit.glow
    }"
  >
    <div class="minor-border" aria-hidden="true" />
    <div class="minor-corner top">
      <span>{{ card.symbol }}</span>
      <i>{{ text(card.suit || card.name, locale) }}</i>
    </div>
    <div class="minor-material" aria-hidden="true" />

    <div v-if="visual.rank.court" class="court-sigil" aria-hidden="true">
      <span class="court-orbit" />
      <span class="court-figure">{{ card.symbol }}</span>
      <span class="court-line" />
    </div>
    <div v-else class="pip-field" :class="`pip-${visual.rank.pipCount}`" aria-hidden="true">
      <span v-for="index in pipItems" :key="index" class="pip" :style="{ '--pip-index': index, '--pip-angle': `${(index - 4) * 8}deg` }" />
    </div>

    <div class="minor-title">
      <span>{{ visual.themeLine[locale === "zh-CN" ? "zh" : "en"] }}</span>
      <strong>{{ text(card.name, locale) }}</strong>
      <i v-if="position">{{ position }}</i>
      <i v-if="orientation">{{ orientation === "reversed" ? (locale === "zh-CN" ? "逆位" : "Reversed") : (locale === "zh-CN" ? "正位" : "Upright") }}</i>
    </div>

    <div v-if="!compact" class="minor-keywords">
      <span v-for="keyword in keywords" :key="keyword">{{ keyword }}</span>
    </div>
  </div>
</template>

<style scoped>
.minor-card-face {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  gap: 10px;
  overflow: hidden;
  padding: 16px 14px;
  color: #efe2c7;
  background:
    radial-gradient(circle at 50% 34%, var(--minor-glow), transparent 34%),
    linear-gradient(155deg, rgba(239, 226, 199, 0.12), rgba(239, 226, 199, 0.02)),
    linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.34)),
    #111012;
}

.minor-card-face.compact {
  gap: 6px;
  padding: 12px 10px;
}

.minor-card-face.reversed {
  background:
    radial-gradient(circle at 50% 66%, var(--minor-glow), transparent 34%),
    linear-gradient(25deg, rgba(239, 226, 199, 0.12), rgba(239, 226, 199, 0.02)),
    linear-gradient(180deg, rgba(0, 0, 0, 0.24), transparent),
    #111012;
}

.minor-border {
  position: absolute;
  inset: 7px;
  border: 1px solid color-mix(in srgb, var(--minor-accent), #d8b36f 42%);
  box-shadow:
    inset 0 0 0 1px rgba(248, 240, 222, 0.05),
    inset 0 0 42px rgba(0, 0, 0, 0.28);
  pointer-events: none;
}

.minor-border::before,
.minor-border::after {
  position: absolute;
  inset: 8px;
  border: 1px solid rgba(216, 179, 111, 0.16);
  content: "";
}

.minor-border::after {
  inset: 18px;
  border-color: rgba(248, 240, 222, 0.07);
}

.minor-material {
  position: absolute;
  inset: 0;
  opacity: 0.36;
  pointer-events: none;
}

.suit-wands .minor-material {
  background:
    linear-gradient(118deg, transparent 0 33%, rgba(196, 106, 63, 0.14) 33.4% 34%, transparent 34.3%),
    radial-gradient(circle at 76% 20%, rgba(196, 106, 63, 0.16), transparent 22%);
}

.suit-cups .minor-material {
  background:
    repeating-radial-gradient(circle at 50% 42%, rgba(120, 167, 160, 0.14) 0 1px, transparent 1px 18px),
    radial-gradient(circle at 24% 78%, rgba(120, 167, 160, 0.2), transparent 26%);
}

.suit-swords .minor-material {
  background:
    repeating-linear-gradient(126deg, transparent 0 18px, rgba(158, 178, 192, 0.09) 19px, transparent 20px),
    radial-gradient(circle at 72% 25%, rgba(158, 178, 192, 0.16), transparent 24%);
}

.suit-pentacles .minor-material {
  background:
    radial-gradient(circle at 26% 22%, rgba(164, 130, 85, 0.18), transparent 20%),
    radial-gradient(circle at 72% 76%, rgba(164, 130, 85, 0.16), transparent 22%),
    linear-gradient(90deg, rgba(164, 130, 85, 0.1) 1px, transparent 1px);
  background-size: auto, auto, 18px 18px;
}

.minor-corner {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 8px;
  align-items: baseline;
  justify-content: space-between;
  color: rgba(216, 179, 111, 0.86);
  font: 800 12px/1 var(--font-ui);
}

.minor-corner span {
  color: var(--minor-accent);
}

.minor-corner i {
  max-width: 64%;
  overflow: hidden;
  color: rgba(248, 240, 222, 0.48);
  font-style: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pip-field,
.court-sigil {
  position: relative;
  z-index: 1;
  display: grid;
  min-height: 0;
  place-items: center;
}

.pip-field {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: repeat(4, minmax(0, 1fr));
  gap: 4px;
  padding: 6px 12px;
}

.pip {
  position: relative;
  width: clamp(16px, 4vw, 28px);
  aspect-ratio: 1;
  place-self: center;
  border: 1px solid color-mix(in srgb, var(--minor-accent), #d8b36f 35%);
  background:
    radial-gradient(circle, color-mix(in srgb, var(--minor-accent), #f8f0de 18%) 0 16%, transparent 17%),
    radial-gradient(circle, rgba(248, 240, 222, 0.16), transparent 54%),
    rgba(0, 0, 0, 0.14);
  transform: rotate(var(--pip-angle));
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.26);
}

.suit-wands .pip {
  border-radius: 999px;
  width: clamp(8px, 2vw, 12px);
  height: clamp(32px, 8vw, 54px);
}

.suit-cups .pip {
  border-radius: 50% 50% 42% 42%;
}

.suit-swords .pip {
  width: clamp(8px, 2vw, 12px);
  height: clamp(36px, 8vw, 58px);
  clip-path: polygon(50% 0, 72% 68%, 100% 100%, 50% 86%, 0 100%, 28% 68%);
}

.suit-pentacles .pip {
  border-radius: 50%;
}

.pip-1 .pip {
  grid-column: 2;
  grid-row: 2 / 4;
  width: clamp(36px, 8vw, 58px);
  height: auto;
}

.pip-2 .pip:nth-child(1),
.pip-6 .pip:nth-child(1) {
  grid-column: 1;
  grid-row: 2;
}

.pip-2 .pip:nth-child(2),
.pip-6 .pip:nth-child(6) {
  grid-column: 3;
  grid-row: 3;
}

.pip-3 .pip:nth-child(1),
.pip-7 .pip:nth-child(1) {
  grid-column: 2;
  grid-row: 1;
}

.pip-3 .pip:nth-child(2),
.pip-7 .pip:nth-child(4) {
  grid-column: 1;
  grid-row: 3;
}

.pip-3 .pip:nth-child(3),
.pip-7 .pip:nth-child(7) {
  grid-column: 3;
  grid-row: 3;
}

.pip-4 .pip:nth-child(1),
.pip-5 .pip:nth-child(1),
.pip-8 .pip:nth-child(1),
.pip-9 .pip:nth-child(1),
.pip-10 .pip:nth-child(1) {
  grid-column: 1;
  grid-row: 1;
}

.pip-4 .pip:nth-child(2),
.pip-5 .pip:nth-child(2),
.pip-8 .pip:nth-child(2),
.pip-9 .pip:nth-child(3),
.pip-10 .pip:nth-child(3) {
  grid-column: 3;
  grid-row: 1;
}

.pip-4 .pip:nth-child(3),
.pip-5 .pip:nth-child(3),
.pip-8 .pip:nth-child(7),
.pip-9 .pip:nth-child(7),
.pip-10 .pip:nth-child(8) {
  grid-column: 1;
  grid-row: 4;
}

.pip-4 .pip:nth-child(4),
.pip-5 .pip:nth-child(4),
.pip-8 .pip:nth-child(8),
.pip-9 .pip:nth-child(9),
.pip-10 .pip:nth-child(10) {
  grid-column: 3;
  grid-row: 4;
}

.pip-5 .pip:nth-child(5),
.pip-7 .pip:nth-child(5),
.pip-9 .pip:nth-child(5),
.pip-10 .pip:nth-child(5) {
  grid-column: 2;
  grid-row: 2 / 4;
}

.pip-6 .pip:nth-child(2),
.pip-8 .pip:nth-child(3),
.pip-9 .pip:nth-child(2),
.pip-10 .pip:nth-child(2) {
  grid-column: 2;
  grid-row: 1;
}

.pip-6 .pip:nth-child(3),
.pip-8 .pip:nth-child(4),
.pip-9 .pip:nth-child(4),
.pip-10 .pip:nth-child(4) {
  grid-column: 3;
  grid-row: 2;
}

.pip-6 .pip:nth-child(4),
.pip-8 .pip:nth-child(5),
.pip-9 .pip:nth-child(6),
.pip-10 .pip:nth-child(6) {
  grid-column: 1;
  grid-row: 3;
}

.pip-6 .pip:nth-child(5),
.pip-8 .pip:nth-child(6),
.pip-9 .pip:nth-child(8),
.pip-10 .pip:nth-child(9) {
  grid-column: 2;
  grid-row: 4;
}

.pip-7 .pip:nth-child(2) {
  grid-column: 1;
  grid-row: 2;
}

.pip-7 .pip:nth-child(3) {
  grid-column: 3;
  grid-row: 2;
}

.pip-7 .pip:nth-child(6) {
  grid-column: 2;
  grid-row: 4;
}

.pip-8 .pip:nth-child(9),
.pip-9 .pip:nth-child(9) {
  grid-column: 3;
  grid-row: 4;
}

.pip-10 .pip:nth-child(7) {
  grid-column: 2;
  grid-row: 3;
}

.court-sigil {
  padding: 12px;
}

.court-orbit {
  position: absolute;
  width: min(82%, 190px);
  aspect-ratio: 1;
  border: 1px solid rgba(216, 179, 111, 0.18);
  border-radius: 50%;
  box-shadow:
    inset 0 0 0 20px rgba(216, 179, 111, 0.04),
    0 0 44px var(--minor-glow);
}

.court-figure {
  position: relative;
  color: color-mix(in srgb, var(--minor-accent), #d8b36f 38%);
  font: 600 clamp(38px, 8vw, 78px) / 0.86 var(--font-display);
  text-shadow: 0 16px 34px rgba(0, 0, 0, 0.44);
}

.court-line {
  position: absolute;
  width: 1px;
  height: 72%;
  background: linear-gradient(transparent, rgba(216, 179, 111, 0.56), transparent);
}

.minor-title {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 4px;
  text-align: center;
}

.minor-title span {
  color: color-mix(in srgb, var(--minor-accent), #f8f0de 18%);
  font: 750 9px/1 var(--font-ui);
  text-transform: uppercase;
}

.minor-title strong {
  color: #f8f0de;
  font: 650 clamp(16px, 2.7vw, 21px) / 1 var(--font-display);
}

.compact .minor-title strong {
  font-size: clamp(13px, 2vw, 16px);
}

.minor-title i {
  color: rgba(248, 240, 222, 0.52);
  font: 650 10px/1.1 var(--font-ui);
  font-style: normal;
}

.minor-keywords {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: center;
}

.minor-keywords span {
  border-top: 1px solid rgba(216, 179, 111, 0.22);
  padding-top: 5px;
  color: rgba(248, 240, 222, 0.62);
  font: 650 10px/1 var(--font-ui);
}
</style>
