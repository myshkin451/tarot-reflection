<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { tarotCards } from "@/data/tarotCards";
import { getSpread, spreads } from "@/data/spreads";
import { drawCards } from "@/lib/draw";
import { upsertReading } from "@/lib/storage";
import { t } from "@/lib/i18n";
import { list, text } from "@/lib/locale";
import type { Locale, ReadingSession, Spread } from "@/lib/types";
import CardFace from "./CardFace.vue";
import JournalPanel from "./JournalPanel.vue";
import LanguageSwitcher from "./LanguageSwitcher.vue";
import ReadingResult from "./ReadingResult.vue";
import SpreadSelector from "./SpreadSelector.vue";

const locale = ref<Locale>("en");
const question = ref("");
const selectedSpreadId = ref<Spread["id"]>("three-card");
const includeReversed = ref(true);
const session = ref<ReadingSession | null>(null);
const saved = ref(false);
const journalVersion = ref(0);
const previewCards = tarotCards.slice(0, 3);

const selectedSpread = computed(() => getSpread(selectedSpreadId.value));
const firstCard = computed(() => session.value?.cards[0]);

function makeId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createReading() {
  const spread = selectedSpread.value;
  const cards = drawCards({
    deck: tarotCards,
    spread,
    includeReversed: includeReversed.value
  });

  session.value = {
    id: makeId(),
    createdAt: new Date().toISOString(),
    question: question.value.trim(),
    spreadId: spread.id,
    spreadName: spread.name,
    cards,
    locale: locale.value
  };
  saved.value = false;
}

function saveCurrentReading() {
  if (!session.value) {
    return;
  }

  saved.value = upsertReading(session.value);
  journalVersion.value += 1;
}

watch(locale, (next) => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("arcana-mirror-locale", next);
  }
});

onMounted(() => {
  const stored = localStorage.getItem("arcana-mirror-locale");
  if (stored === "zh-CN" || stored === "en") {
    locale.value = stored;
  }
});
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <a class="brand" href="/">
        <span class="brand-mark">AM</span>
        <span>Arcana Mirror</span>
      </a>
      <nav>
        <a href="/cards">{{ t(locale, "nav.cards") }}</a>
        <a href="#journal">{{ t(locale, "nav.journal") }}</a>
      </nav>
      <LanguageSwitcher v-model:locale="locale" />
    </header>

    <main>
      <section class="reading-hero">
        <div class="reading-copy">
          <h1>{{ t(locale, "hero.title") }}</h1>
          <p>{{ t(locale, "hero.subtitle") }}</p>
        </div>

        <div class="reading-board">
          <section class="control-panel" aria-labelledby="reading-form-title">
            <h2 id="reading-form-title">{{ locale === "zh-CN" ? "开始一次抽牌" : "Begin a reading" }}</h2>

            <label class="field">
              <span>{{ t(locale, "flow.question") }}</span>
              <textarea v-model="question" :placeholder="t(locale, 'flow.questionPlaceholder')" />
            </label>

            <div class="field">
              <span>{{ t(locale, "flow.spread") }}</span>
              <SpreadSelector v-model:selected="selectedSpreadId" :spreads="spreads" :locale="locale" />
            </div>

            <label class="toggle-row">
              <input v-model="includeReversed" type="checkbox" />
              <span>{{ t(locale, "flow.reversed") }}</span>
            </label>

            <button class="primary-action" type="button" @click="createReading">
              {{ session ? t(locale, "flow.redraw") : t(locale, "flow.draw") }}
            </button>
          </section>

          <section class="deck-stage" aria-label="Deck preview">
            <div v-if="!session" class="preview-fan">
              <CardFace v-for="card in previewCards" :key="card.id" :card="card" :locale="locale" compact />
            </div>
            <div v-else class="live-focus">
              <CardFace
                v-if="firstCard"
                :card="firstCard.card"
                :locale="locale"
                :orientation="firstCard.orientation"
                :position="text(firstCard.position.name, locale)"
              />
              <div class="live-summary">
                <span>{{ text(selectedSpread.name, locale) }}</span>
                <h2>{{ firstCard ? text(firstCard.card.name, locale) : "Arcana Mirror" }}</h2>
                <p v-if="firstCard">{{ text(firstCard.card.meaning[firstCard.orientation], locale) }}</p>
                <div v-if="firstCard" class="live-keywords">
                  <span v-for="keyword in list(firstCard.card.keywords[firstCard.orientation], locale)" :key="keyword">
                    {{ keyword }}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      <ReadingResult
        v-if="session"
        :session="session"
        :locale="locale"
        :saved="saved"
        @save="saveCurrentReading"
      />

      <section v-else class="empty-result">
        <p>{{ t(locale, "flow.noReading") }}</p>
      </section>

      <JournalPanel :locale="locale" :refresh-key="journalVersion" />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.site-header {
  position: sticky;
  z-index: 10;
  top: 0;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 20px;
  align-items: center;
  width: min(1180px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 18px 0;
  backdrop-filter: blur(14px);
}

.brand,
nav a {
  color: #f8f0de;
  text-decoration: none;
}

.brand {
  display: inline-flex;
  gap: 12px;
  align-items: center;
  font: 700 18px/1 var(--font-display);
}

.brand-mark {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid rgba(216, 179, 111, 0.68);
  color: #d8b36f;
  font: 800 11px/1 var(--font-ui);
}

nav {
  display: flex;
  gap: 18px;
  justify-content: end;
}

nav a {
  color: rgba(248, 240, 222, 0.68);
  font: 650 13px/1 var(--font-ui);
}

main {
  display: grid;
  gap: 42px;
  width: min(1180px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 42px 0 70px;
}

.reading-hero {
  display: grid;
  gap: 28px;
  min-height: calc(100svh - 120px);
  align-content: center;
}

.reading-copy {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(260px, 0.65fr);
  gap: 34px;
  align-items: end;
}

h1 {
  margin: 0;
  max-width: 780px;
  color: #f8f0de;
  font: 650 clamp(64px, 9vw, 142px) / 0.82 var(--font-display);
  letter-spacing: 0;
}

.reading-copy p {
  margin: 0 0 10px;
  max-width: 440px;
  color: rgba(248, 240, 222, 0.68);
  font: 500 17px/1.6 var(--font-ui);
}

.reading-board {
  display: grid;
  grid-template-columns: minmax(320px, 410px) 1fr;
  gap: clamp(20px, 3vw, 34px);
  align-items: stretch;
}

.control-panel,
.deck-stage,
.empty-result {
  border: 1px solid rgba(239, 226, 199, 0.13);
  background: rgba(239, 226, 199, 0.045);
}

.control-panel {
  display: grid;
  gap: 20px;
  align-content: start;
  padding: clamp(20px, 3vw, 28px);
}

.control-panel h2 {
  margin: 0;
  color: #f8f0de;
  font: 650 32px/1 var(--font-display);
}

.field {
  display: grid;
  gap: 10px;
}

.field > span,
.toggle-row span {
  color: rgba(216, 179, 111, 0.9);
  font: 750 12px/1 var(--font-ui);
}

textarea {
  min-height: 112px;
  resize: vertical;
  border: 1px solid rgba(239, 226, 199, 0.16);
  padding: 14px 15px;
  color: #f8f0de;
  background: rgba(0, 0, 0, 0.22);
  font: 500 15px/1.5 var(--font-ui);
  letter-spacing: 0;
}

textarea::placeholder {
  color: rgba(248, 240, 222, 0.36);
}

.toggle-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #d8b36f;
}

.primary-action {
  min-height: 54px;
  border: 0;
  color: #15110c;
  background: #d8b36f;
  font: 850 14px/1 var(--font-ui);
  letter-spacing: 0;
  cursor: pointer;
  transition:
    transform 160ms ease,
    background 160ms ease;
}

.primary-action:hover {
  background: #e4c58f;
  transform: translateY(-1px);
}

.deck-stage {
  position: relative;
  min-height: 560px;
  overflow: hidden;
  padding: clamp(18px, 3vw, 34px);
  background:
    radial-gradient(circle at 70% 20%, rgba(111, 136, 150, 0.16), transparent 28%),
    linear-gradient(135deg, rgba(239, 226, 199, 0.08), rgba(239, 226, 199, 0.02)),
    rgba(239, 226, 199, 0.035);
}

.preview-fan {
  position: absolute;
  inset: 34px;
  display: grid;
  grid-template-columns: repeat(3, minmax(130px, 220px));
  gap: 16px;
  align-items: center;
  justify-content: center;
}

.preview-fan :deep(.tarot-card:nth-child(1)) {
  transform: rotate(-8deg) translateY(28px);
}

.preview-fan :deep(.tarot-card:nth-child(2)) {
  transform: translateY(-18px);
}

.preview-fan :deep(.tarot-card:nth-child(3)) {
  transform: rotate(8deg) translateY(28px);
}

.live-focus {
  display: grid;
  grid-template-columns: minmax(190px, 260px) 1fr;
  gap: 28px;
  align-items: center;
  min-height: 100%;
}

.live-summary {
  display: grid;
  gap: 15px;
}

.live-summary span {
  color: rgba(216, 179, 111, 0.9);
  font: 800 12px/1 var(--font-ui);
}

.live-summary h2 {
  margin: 0;
  color: #f8f0de;
  font: 650 clamp(42px, 6vw, 76px) / 0.88 var(--font-display);
  letter-spacing: 0;
}

.live-summary p {
  margin: 0;
  max-width: 500px;
  color: rgba(248, 240, 222, 0.68);
  font: 500 16px/1.6 var(--font-ui);
}

.live-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.live-keywords span {
  border-top: 1px solid rgba(216, 179, 111, 0.42);
  padding-top: 6px;
  color: rgba(248, 240, 222, 0.72);
  font: 700 12px/1 var(--font-ui);
}

.empty-result {
  min-height: 116px;
  display: grid;
  place-items: center;
  padding: 24px;
}

.empty-result p {
  margin: 0;
  color: rgba(248, 240, 222, 0.58);
  font: 500 15px/1.5 var(--font-ui);
}

@media (max-width: 900px) {
  .site-header,
  .reading-copy,
  .reading-board,
  .live-focus {
    grid-template-columns: 1fr;
  }

  .site-header {
    position: static;
  }

  nav {
    justify-content: start;
  }

  .reading-hero {
    min-height: auto;
  }

  h1 {
    font-size: clamp(58px, 20vw, 96px);
  }

  .deck-stage {
    min-height: 430px;
  }
}

@media (max-width: 600px) {
  .site-header {
    gap: 14px;
  }

  .preview-fan {
    inset: 24px;
    grid-template-columns: repeat(3, minmax(84px, 1fr));
  }

  .deck-stage {
    min-height: 360px;
  }
}
</style>
