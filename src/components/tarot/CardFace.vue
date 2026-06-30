<script setup lang="ts">
import type { Locale, TarotCard } from "@/lib/types";
import { list, text } from "@/lib/locale";

const props = defineProps<{
  card: TarotCard;
  locale: Locale;
  orientation?: "upright" | "reversed";
  position?: string;
  compact?: boolean;
  reveal?: boolean;
  revealIndex?: number;
}>();
</script>

<template>
  <article
    class="tarot-card"
    :class="{ reversed: orientation === 'reversed', compact, reveal }"
    :style="reveal ? { '--reveal-delay': `${(revealIndex ?? 0) * 120}ms` } : undefined"
  >
    <div class="card-frame">
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

.tarot-card:hover .card-frame {
  border-color: rgba(248, 240, 222, 0.86);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.5);
  transform: translateY(-3px);
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

.card-corner {
  font: 700 13px/1 var(--font-ui);
  color: rgba(216, 179, 111, 0.9);
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
}

.card-position {
  margin-top: 8px;
  color: rgba(248, 240, 222, 0.64);
  font: 600 12px/1.2 var(--font-ui);
}

.card-orientation {
  margin-top: 7px;
  color: rgba(216, 179, 111, 0.86);
  font: 600 11px/1 var(--font-ui);
  text-transform: uppercase;
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
