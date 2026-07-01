<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { tarotCards } from "@/data/tarotCards";
import { getSpread, spreads } from "@/data/spreads";
import { getDeckBackAsset } from "@/lib/deckAssets";
import { drawCards } from "@/lib/draw";
import { sitePath } from "@/lib/paths";
import { upsertReading } from "@/lib/storage";
import { t } from "@/lib/i18n";
import { list, text } from "@/lib/locale";
import type { Locale, ReadingSession, Spread } from "@/lib/types";
import CardFace from "./CardFace.vue";
import JournalPanel from "./JournalPanel.vue";
import LanguageSwitcher from "./LanguageSwitcher.vue";
import ReadingResult from "./ReadingResult.vue";
import SpreadSelector from "./SpreadSelector.vue";

type ReadingFlowState = "idle" | "shuffling" | "cutting" | "dealing" | "awaitingReveal" | "revealing" | "complete";

const locale = ref<Locale>("en");
const question = ref("");
const selectedSpreadId = ref<Spread["id"]>("three-card");
const includeReversed = ref(true);
const session = ref<ReadingSession | null>(null);
const pendingSession = ref<ReadingSession | null>(null);
const flowState = ref<ReadingFlowState>("idle");
const revealedCount = ref(0);
const saved = ref(false);
const journalVersion = ref(0);
const reducedMotion = ref(false);
const previewCards = tarotCards.slice(0, 3);
const shuffleCards = Array.from({ length: 10 }, (_, index) => index);
const deckBack = getDeckBackAsset();
let drawToken = 0;
let timers: number[] = [];
let motionQuery: MediaQueryList | null = null;

const selectedSpread = computed(() => getSpread(selectedSpreadId.value));
const tableSession = computed(() => pendingSession.value ?? session.value);
const firstCard = computed(() => tableSession.value?.cards[0]);
const spreadCount = computed(() => selectedSpread.value.positions.length);
const flowBusy = computed(() => ["shuffling", "cutting", "dealing", "revealing"].includes(flowState.value));
const canStartReading = computed(() => !flowBusy.value);
const activeStepIndex = computed(() => {
  const indexByState: Record<ReadingFlowState, number> = {
    idle: 0,
    shuffling: 0,
    cutting: 1,
    dealing: 2,
    awaitingReveal: 3,
    revealing: 3,
    complete: 4
  };

  return indexByState[flowState.value];
});
const ritualSteps = computed(() =>
  locale.value === "zh-CN"
    ? ["洗牌", "切牌", "发牌", "揭示", "初读"]
    : ["Shuffle", "Cut", "Deal", "Reveal", "Read"]
);
const flowMessage = computed(() => {
  const messages: Record<ReadingFlowState, { en: string; zh: string }> = {
    idle: {
      en: "Write the question, choose a spread, then begin the table ritual.",
      zh: "写下问题，选择牌阵，然后开始这次牌桌仪式。"
    },
    shuffling: {
      en: "The cards are already locked; the table is giving the draw a visible shape.",
      zh: "牌已经锁定；牌桌正在让这次抽牌显形。"
    },
    cutting: {
      en: "Cutting the deck. The ritual changes the pace, not the locked result.",
      zh: "正在切牌。仪式改变节奏，不改变已经锁定的结果。"
    },
    dealing: {
      en: "Cards are moving into their positions.",
      zh: "牌正在落到各自的位置。"
    },
    awaitingReveal: {
      en: "Reveal each card when you are ready.",
      zh: "准备好时，逐张揭示牌面。"
    },
    revealing: {
      en: "The next layer is turning over.",
      zh: "下一层正在翻开。"
    },
    complete: {
      en: "The spread is open. Read the pattern before asking AI to go deeper.",
      zh: "牌阵已经打开。先看牌面结构，再让 AI 进入更深一层。"
    }
  };

  return messages[flowState.value][locale.value === "zh-CN" ? "zh" : "en"];
});
const primaryActionLabel = computed(() => {
  if (pendingSession.value && flowState.value === "awaitingReveal") {
    return locale.value === "zh-CN" ? "揭示下一张" : "Reveal next";
  }

  if (flowBusy.value) {
    return locale.value === "zh-CN" ? "仪式进行中" : "Ritual in motion";
  }

  if (session.value) {
    return t(locale.value, "flow.redraw");
  }

  return t(locale.value, "flow.draw");
});
const drawSlots = computed(() => {
  const positions = selectedSpread.value.positions;
  const center = (positions.length - 1) / 2;

  return positions.map((position, index) => {
    const offset = index - center;

    return {
      id: position.id,
      x: offset * (positions.length >= 5 ? 82 : 118),
      y: Math.abs(offset) * (positions.length >= 5 ? 4 : 12),
      angle: offset * (positions.length >= 5 ? 4 : 6),
      index
    };
  });
});

function makeId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildReadingSession(): ReadingSession {
  const spread = selectedSpread.value;
  const cards = drawCards({
    deck: tarotCards,
    spread,
    includeReversed: includeReversed.value
  });

  return {
    id: makeId(),
    createdAt: new Date().toISOString(),
    question: question.value.trim(),
    spreadId: spread.id,
    spreadName: spread.name,
    cards,
    locale: locale.value
  };
}

function clearFlowTimers() {
  timers.forEach((timer) => window.clearTimeout(timer));
  timers = [];
}

function waitFor(ms: number) {
  if (reducedMotion.value || ms <= 0) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const timer = window.setTimeout(() => {
      timers = timers.filter((item) => item !== timer);
      resolve();
    }, ms);
    timers.push(timer);
  });
}

function flowDurations(cardCount: number) {
  return {
    shuffle: 840,
    cut: 420,
    deal: 540 + cardCount * 95,
    reveal: 460,
    revealAll: 640
  };
}

async function createReading() {
  if (!canStartReading.value) {
    return;
  }

  const token = ++drawToken;
  const nextSession = buildReadingSession();
  const durations = flowDurations(nextSession.cards.length);

  clearFlowTimers();
  pendingSession.value = nextSession;
  session.value = null;
  flowState.value = "shuffling";
  revealedCount.value = 0;
  saved.value = false;

  await waitFor(durations.shuffle);
  if (token !== drawToken) return;
  flowState.value = "cutting";

  await waitFor(durations.cut);
  if (token !== drawToken) return;
  flowState.value = "dealing";

  await waitFor(durations.deal);
  if (token !== drawToken) return;
  flowState.value = "awaitingReveal";
}

function completePendingReading() {
  if (!pendingSession.value) {
    return;
  }

  session.value = pendingSession.value;
  pendingSession.value = null;
  flowState.value = "complete";
}

async function revealTo(count: number) {
  if (!pendingSession.value || flowState.value !== "awaitingReveal") {
    return;
  }

  const token = drawToken;
  const nextCount = Math.min(count, pendingSession.value.cards.length);
  const durations = flowDurations(pendingSession.value.cards.length);

  flowState.value = "revealing";
  revealedCount.value = nextCount;

  await waitFor(nextCount >= pendingSession.value.cards.length ? durations.revealAll : durations.reveal);
  if (token !== drawToken || !pendingSession.value) return;

  if (nextCount >= pendingSession.value.cards.length) {
    completePendingReading();
    return;
  }

  flowState.value = "awaitingReveal";
}

function revealCard(index: number) {
  if (index !== revealedCount.value) {
    return;
  }

  void revealTo(index + 1);
}

function revealNextCard() {
  void revealTo(revealedCount.value + 1);
}

function revealAllCards() {
  if (!pendingSession.value) {
    return;
  }

  void revealTo(pendingSession.value.cards.length);
}

function handlePrimaryAction() {
  if (pendingSession.value && flowState.value === "awaitingReveal") {
    revealNextCard();
    return;
  }

  void createReading();
}

function saveCurrentReading() {
  if (!session.value) {
    return;
  }

  saved.value = upsertReading(session.value);
  journalVersion.value += 1;
}

function attachAiResponse(response: string) {
  if (!session.value) {
    return;
  }

  const nextSession = {
    ...session.value,
    aiResponse: response
  };

  session.value = nextSession;

  if (saved.value) {
    saved.value = upsertReading(nextSession);
    journalVersion.value += 1;
  }
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

  motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  reducedMotion.value = motionQuery.matches;
  motionQuery.addEventListener("change", (event) => {
    reducedMotion.value = event.matches;
  });
});

onBeforeUnmount(() => {
  drawToken += 1;
  clearFlowTimers();
  motionQuery = null;
});
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <a class="brand" :href="sitePath()">
        <span class="brand-mark">AM</span>
        <span>Arcana Mirror</span>
      </a>
      <nav>
        <a :href="sitePath('cards')">{{ t(locale, "nav.cards") }}</a>
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
            <h2 id="reading-form-title">{{ locale === "zh-CN" ? "牌桌准备" : "Table setup" }}</h2>

            <label class="field">
              <span>{{ t(locale, "flow.question") }}</span>
              <textarea v-model="question" :placeholder="t(locale, 'flow.questionPlaceholder')" :disabled="flowBusy" />
            </label>

            <div class="field">
              <span>{{ t(locale, "flow.spread") }}</span>
              <SpreadSelector v-model:selected="selectedSpreadId" :spreads="spreads" :locale="locale" />
            </div>

            <label class="toggle-row">
              <input v-model="includeReversed" type="checkbox" :disabled="flowBusy" />
              <span>{{ t(locale, "flow.reversed") }}</span>
            </label>

            <button class="primary-action" type="button" :disabled="!canStartReading" @click="handlePrimaryAction">
              {{ primaryActionLabel }}
            </button>

            <p class="control-note">{{ flowMessage }}</p>
          </section>

          <section class="deck-stage" :class="[`flow-${flowState}`, `spread-${spreadCount}`]" aria-label="Tarot table">
            <div class="table-orbit" aria-hidden="true" />

            <div class="ritual-rail" aria-label="Reading ritual progress">
              <span
                v-for="(step, index) in ritualSteps"
                :key="step"
                :class="{ active: index === activeStepIndex, complete: index < activeStepIndex }"
              >
                {{ step }}
              </span>
            </div>

            <div v-if="flowState === 'shuffling' || flowState === 'cutting' || flowState === 'dealing'" class="ritual-motion" aria-live="polite">
              <div class="deck-pile" :class="{ cutting: flowState === 'cutting' }" aria-hidden="true">
                <span
                  v-for="index in shuffleCards"
                  :key="index"
                  class="pile-card"
                  :style="{
                    '--pile-index': index,
                    '--pile-angle': `${(index - 4.5) * 2.4}deg`,
                    '--pile-angle-alt': `${(index - 4.5) * -4}deg`,
                    '--pile-x': `${(index - 4.5) * 1.7}px`,
                    '--pile-x-alt': `${(index - 4.5) * 8}px`,
                    '--pile-y': `${index * -0.7}px`,
                    '--edge-x': `${index * -0.6}px`,
                    '--edge-y': `${index * 0.7}px`,
                    '--pile-delay': `${index * -72}ms`,
                    '--deck-back-image': `url(${deckBack.image})`
                  }"
                />
              </div>

              <div v-if="flowState === 'dealing'" class="deal-run" aria-hidden="true">
                <span
                  v-for="slot in drawSlots"
                  :key="slot.id"
                  class="deal-card"
                  :style="{
                    '--slot-index': slot.index,
                    '--slot-x': `${slot.x}px`,
                    '--slot-y': `${slot.y}px`,
                    '--slot-angle': `${slot.angle}deg`,
                    '--deal-delay': `${180 + slot.index * 95}ms`,
                    '--deck-back-image': `url(${deckBack.image})`
                  }"
                />
              </div>

              <p>{{ flowMessage }}</p>
            </div>

            <div v-else-if="pendingSession" class="reveal-stage">
              <div class="spread-stage" :class="`count-${pendingSession.cards.length}`">
                <article
                  v-for="(drawn, index) in pendingSession.cards"
                  :key="`${drawn.position.id}-${drawn.card.id}`"
                  class="table-slot"
                  :class="{ revealed: index < revealedCount, next: index === revealedCount, locked: index > revealedCount }"
                  role="button"
                  :tabindex="index === revealedCount && flowState === 'awaitingReveal' ? 0 : -1"
                  :aria-label="locale === 'zh-CN' ? `揭示${text(drawn.position.name, locale)}` : `Reveal ${text(drawn.position.name, locale)}`"
                  :aria-disabled="index !== revealedCount || flowState !== 'awaitingReveal'"
                  @click="revealCard(index)"
                  @keydown.enter.prevent="revealCard(index)"
                  @keydown.space.prevent="revealCard(index)"
                >
                  <CardFace
                    :card="drawn.card"
                    :locale="locale"
                    :orientation="drawn.orientation"
                    :position="text(drawn.position.name, locale)"
                    :compact="pendingSession.cards.length >= 5"
                    :facedown="index >= revealedCount"
                    :reveal="index < revealedCount"
                    :reveal-index="index"
                  />
                  <div class="slot-caption">
                    <span>{{ text(drawn.position.name, locale) }}</span>
                    <strong>{{ index < revealedCount ? text(drawn.card.name, locale) : locale === "zh-CN" ? "未揭示" : "Face down" }}</strong>
                  </div>
                </article>
              </div>

              <div class="reveal-controls">
                <button type="button" :disabled="flowState !== 'awaitingReveal'" @click="revealNextCard">
                  {{ locale === "zh-CN" ? "揭示下一张" : "Reveal next" }}
                </button>
                <button type="button" :disabled="flowState !== 'awaitingReveal'" @click="revealAllCards">
                  {{ locale === "zh-CN" ? "全部揭示" : "Reveal all" }}
                </button>
              </div>
            </div>

            <div v-else-if="session" class="live-focus" :key="session.id">
              <div class="spread-stage complete" :class="`count-${session.cards.length}`">
                <article v-for="(drawn, index) in session.cards" :key="`${drawn.position.id}-${drawn.card.id}`" class="table-slot revealed">
                  <CardFace
                    :card="drawn.card"
                    :locale="locale"
                    :orientation="drawn.orientation"
                    :position="text(drawn.position.name, locale)"
                    :compact="session.cards.length >= 5"
                    reveal
                    :reveal-index="index"
                  />
                  <div class="slot-caption">
                    <span>{{ text(drawn.position.name, locale) }}</span>
                    <strong>{{ text(drawn.card.name, locale) }}</strong>
                  </div>
                </article>
              </div>

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

            <div v-else class="idle-table">
              <div class="idle-deck" :style="{ '--deck-back-image': `url(${deckBack.image})` }" aria-hidden="true">
                <span v-for="index in 7" :key="index" />
              </div>
              <div class="preview-fan">
                <CardFace v-for="card in previewCards" :key="card.id" :card="card" :locale="locale" compact />
              </div>
            </div>
          </section>
        </div>
      </section>

      <ReadingResult
        v-if="session"
        :key="session.id"
        :session="session"
        :locale="locale"
        :saved="saved"
        @save="saveCurrentReading"
        @ai-response="attachAiResponse"
      />

      <section v-else-if="!pendingSession" class="empty-result">
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
  width: min(1280px, calc(100vw - 32px));
  margin: 0 auto;
  border: 1px solid rgba(239, 226, 199, 0.08);
  border-top: 0;
  padding: 12px 14px;
  background:
    linear-gradient(180deg, rgba(10, 10, 10, 0.94), rgba(10, 10, 10, 0.72)),
    rgba(10, 10, 10, 0.82);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(16px);
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
  width: min(1280px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 28px 0 70px;
}

.reading-hero {
  display: grid;
  gap: 18px;
  min-height: calc(100svh - 112px);
  align-content: start;
}

.reading-copy {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(260px, 0.7fr);
  gap: 34px;
  align-items: end;
}

h1 {
  margin: 0;
  max-width: 780px;
  color: #f8f0de;
  font: 650 clamp(42px, 5vw, 72px) / 0.94 var(--font-display);
  letter-spacing: 0;
}

.reading-copy p {
  margin: 0 0 10px;
  max-width: 460px;
  color: rgba(248, 240, 222, 0.68);
  font: 500 17px/1.6 var(--font-ui);
}

.reading-board {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: clamp(18px, 2.6vw, 30px);
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
  gap: 16px;
  align-content: start;
  padding: clamp(20px, 3vw, 28px);
}

.control-panel h2 {
  margin: 0;
  color: #f8f0de;
  font: 650 29px/1 var(--font-display);
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
  min-height: 96px;
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

textarea:disabled {
  opacity: 0.64;
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

.primary-action:disabled {
  cursor: wait;
  opacity: 0.78;
  transform: none;
}

.control-note {
  margin: 0;
  border-top: 1px solid rgba(216, 179, 111, 0.18);
  padding-top: 14px;
  color: rgba(248, 240, 222, 0.58);
  font: 550 13px/1.55 var(--font-ui);
}

.deck-stage {
  position: relative;
  min-height: clamp(500px, 50vw, 620px);
  overflow: hidden;
  padding: clamp(18px, 2.5vw, 30px);
  isolation: isolate;
  background:
    radial-gradient(circle at 14% 10%, rgba(216, 179, 111, 0.14), transparent 19%),
    radial-gradient(circle at 86% 18%, rgba(151, 89, 52, 0.12), transparent 24%),
    radial-gradient(circle at 24% 78%, rgba(111, 136, 150, 0.14), transparent 32%),
    linear-gradient(135deg, rgba(239, 226, 199, 0.075), rgba(239, 226, 199, 0.018)),
    #0b0b0d;
}

.deck-stage::before,
.deck-stage::after,
.table-orbit {
  position: absolute;
  content: "";
  pointer-events: none;
}

.deck-stage::before {
  inset: 0;
  z-index: -2;
  background:
    linear-gradient(90deg, rgba(248, 240, 222, 0.032) 1px, transparent 1px),
    linear-gradient(180deg, rgba(248, 240, 222, 0.022) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(circle at 52% 48%, black, transparent 78%);
  opacity: 0.5;
}

.deck-stage::after {
  inset: auto 0 0;
  z-index: -1;
  height: 42%;
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.46));
}

.table-orbit {
  z-index: -1;
  inset: 15% 12%;
  border: 1px solid rgba(216, 179, 111, 0.16);
  border-radius: 50%;
  background:
    radial-gradient(circle, transparent 42%, rgba(216, 179, 111, 0.08) 43%, transparent 44%),
    radial-gradient(circle, transparent 64%, rgba(216, 179, 111, 0.07) 65%, transparent 66%);
  box-shadow:
    inset 0 0 0 44px rgba(216, 179, 111, 0.018),
    0 0 110px rgba(216, 179, 111, 0.05);
}

.ritual-rail {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: clamp(16px, 2vw, 24px);
}

.ritual-rail span {
  border-bottom: 1px solid rgba(216, 179, 111, 0.18);
  padding-bottom: 8px;
  color: rgba(248, 240, 222, 0.36);
  font: 750 11px/1 var(--font-ui);
  text-align: center;
}

.ritual-rail span.complete,
.ritual-rail span.active {
  color: rgba(216, 179, 111, 0.9);
  border-bottom-color: rgba(216, 179, 111, 0.62);
}

.ritual-rail span.active {
  color: #f8f0de;
}

.ritual-motion,
.idle-table,
.reveal-stage,
.live-focus {
  position: relative;
  z-index: 1;
  min-height: calc(100% - 42px);
}

.ritual-motion {
  display: grid;
  gap: 22px;
  place-items: center;
  align-content: center;
}

.ritual-motion p {
  max-width: 420px;
  margin: 0;
  color: rgba(248, 240, 222, 0.7);
  font: 650 14px/1.5 var(--font-ui);
  text-align: center;
}

.deck-pile {
  position: relative;
  width: clamp(150px, 19vw, 220px);
  aspect-ratio: 2 / 3.18;
  perspective: 900px;
}

.deck-pile::after,
.idle-deck::after {
  position: absolute;
  top: 100%;
  left: 50%;
  width: 84%;
  height: 24px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.48);
  filter: blur(10px);
  transform: translate(-50%, -34%);
  content: "";
}

.pile-card {
  --pile-index: 0;
  --pile-angle: 0deg;
  --pile-x: 0px;
  position: absolute;
  inset: 0;
  border: 1px solid rgba(216, 179, 111, 0.68);
  background:
    linear-gradient(180deg, rgba(11, 10, 9, 0.03), rgba(11, 10, 9, 0.18)),
    var(--deck-back-image),
    #111012;
  background-position: center;
  background-size: cover;
  box-shadow:
    var(--edge-x) var(--edge-y) 0 rgba(239, 226, 199, 0.28),
    0 24px 60px rgba(0, 0, 0, 0.32);
  transform: translateX(var(--pile-x)) translateY(var(--pile-y)) rotate(var(--pile-angle));
  animation: shuffle-card 820ms cubic-bezier(0.22, 0.88, 0.2, 1) infinite;
  animation-delay: var(--pile-delay);
}

.deck-pile.cutting .pile-card:nth-child(n + 6) {
  animation: cut-upper 420ms cubic-bezier(0.2, 0.88, 0.22, 1) both;
}

.deck-pile.cutting .pile-card:nth-child(-n + 5) {
  animation: cut-lower 420ms cubic-bezier(0.2, 0.88, 0.22, 1) both;
}

.deal-run {
  position: absolute;
  right: 8%;
  bottom: clamp(78px, 14%, 100px);
  left: 8%;
  height: 180px;
}

.deal-card {
  --slot-index: 0;
  --slot-x: 0px;
  --slot-y: 0px;
  --slot-angle: 0deg;
  position: absolute;
  top: 45%;
  left: 50%;
  width: clamp(56px, 8vw, 84px);
  aspect-ratio: 2 / 3.18;
  border: 1px solid rgba(216, 179, 111, 0.66);
  background:
    linear-gradient(180deg, rgba(11, 10, 9, 0.04), rgba(11, 10, 9, 0.2)),
    var(--deck-back-image),
    #111012;
  background-position: center;
  background-size: cover;
  box-shadow:
    0 1px 0 rgba(248, 240, 222, 0.16),
    0 16px 38px rgba(0, 0, 0, 0.36);
  opacity: 0;
  transform: translate(-50%, -120%) scale(0.7) rotate(-8deg);
  animation: deal-card 980ms cubic-bezier(0.18, 0.9, 0.18, 1) both;
  animation-delay: var(--deal-delay);
}

.idle-table {
  display: grid;
  grid-template-columns: minmax(150px, 220px) 1fr;
  gap: clamp(22px, 4vw, 42px);
  align-items: center;
}

.idle-deck {
  --deck-back-image: none;
  position: relative;
  width: min(190px, 40vw);
  aspect-ratio: 2 / 3.18;
  justify-self: center;
}

.idle-deck span {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(216, 179, 111, 0.68);
  background:
    linear-gradient(180deg, rgba(11, 10, 9, 0.03), rgba(11, 10, 9, 0.18)),
    var(--deck-back-image),
    #111012;
  background-position: center;
  background-size: cover;
  box-shadow:
    -4px 5px 0 rgba(239, 226, 199, 0.2),
    0 28px 70px rgba(0, 0, 0, 0.38);
  transform: none;
}

.idle-deck span:nth-child(1) {
  transform: translate(-7px, 7px);
}

.idle-deck span:nth-child(2) {
  transform: translate(-5px, 5px);
}

.idle-deck span:nth-child(3) {
  transform: translate(-3px, 3px);
}

.preview-fan {
  display: grid;
  grid-template-columns: repeat(3, minmax(100px, 180px));
  gap: 14px;
  align-items: center;
  justify-content: center;
}

.preview-fan :deep(.tarot-card) {
  min-height: 0;
  filter: drop-shadow(0 24px 34px rgba(0, 0, 0, 0.34));
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

.reveal-stage {
  display: grid;
  gap: 20px;
  align-content: center;
}

.spread-stage {
  display: grid;
  gap: clamp(12px, 1.6vw, 18px);
  align-items: end;
  justify-content: center;
}

.spread-stage.count-1 {
  grid-template-columns: minmax(180px, 260px);
}

.spread-stage.count-3 {
  grid-template-columns: repeat(3, minmax(128px, 190px));
}

.spread-stage.count-5 {
  grid-template-columns: repeat(5, minmax(90px, 150px));
}

.table-slot {
  display: grid;
  gap: 10px;
  min-width: 0;
  color: inherit;
  cursor: pointer;
  outline: 0;
  transform: translateY(0);
  transition:
    opacity 180ms ease,
    transform 220ms ease,
    filter 220ms ease;
}

.table-slot.locked {
  cursor: default;
  opacity: 0.78;
}

.table-slot.next {
  filter: drop-shadow(0 0 22px rgba(216, 179, 111, 0.16));
}

.table-slot:focus-visible {
  outline: 2px solid #d8b36f;
  outline-offset: 5px;
}

.table-slot:nth-child(even) {
  transform: translateY(22px);
}

.spread-stage.count-5 .table-slot:nth-child(even),
.spread-stage.complete .table-slot:nth-child(even) {
  transform: none;
}

.table-slot :deep(.tarot-card) {
  min-height: 0;
  filter: drop-shadow(0 30px 34px rgba(0, 0, 0, 0.42));
}

.slot-caption {
  display: grid;
  gap: 4px;
  text-align: center;
}

.slot-caption span {
  color: rgba(216, 179, 111, 0.74);
  font: 800 10px/1 var(--font-ui);
  text-transform: uppercase;
}

.slot-caption strong {
  min-height: 18px;
  color: rgba(248, 240, 222, 0.9);
  font: 650 clamp(14px, 1.8vw, 18px) / 1 var(--font-display);
}

.reveal-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.reveal-controls button {
  min-height: 40px;
  border: 1px solid rgba(216, 179, 111, 0.34);
  padding: 0 16px;
  color: #f8f0de;
  background: rgba(0, 0, 0, 0.28);
  font: 780 12px/1 var(--font-ui);
  cursor: pointer;
}

.reveal-controls button:disabled {
  cursor: wait;
  opacity: 0.58;
}

.live-focus {
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 24px;
  align-content: center;
  animation: live-focus-in 520ms cubic-bezier(0.22, 0.88, 0.2, 1) both;
}

.live-summary {
  display: grid;
  gap: 12px;
  max-width: 680px;
  justify-self: center;
  text-align: center;
}

.live-summary span {
  color: rgba(216, 179, 111, 0.9);
  font: 800 12px/1 var(--font-ui);
}

.live-summary h2 {
  margin: 0;
  color: #f8f0de;
  font: 650 clamp(34px, 4.8vw, 58px) / 0.92 var(--font-display);
  letter-spacing: 0;
}

.live-summary p {
  margin: 0;
  color: rgba(248, 240, 222, 0.68);
  font: 500 15px/1.58 var(--font-ui);
}

.live-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
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

@media (max-width: 1040px) {
  .reading-copy,
  .reading-board,
  .idle-table {
    grid-template-columns: 1fr;
  }

  .reading-hero {
    min-height: auto;
  }

  .deck-stage {
    min-height: 520px;
  }
}

@media (max-width: 900px) {
  .site-header {
    position: static;
    grid-template-columns: 1fr auto;
  }

  nav {
    grid-column: 1 / -1;
    justify-content: start;
  }

  .site-header :deep(.language-switcher) {
    justify-self: end;
  }

  h1 {
    font-size: clamp(48px, 14vw, 84px);
  }

  .spread-stage.count-3,
  .spread-stage.count-5 {
    grid-template-columns: repeat(auto-fit, minmax(118px, 1fr));
  }

  .table-slot:nth-child(even) {
    transform: none;
  }
}

@media (max-width: 600px) {
  main,
  .site-header {
    width: min(100vw - 22px, 1280px);
  }

  .site-header {
    gap: 14px;
  }

  .deck-stage {
    min-height: 500px;
    padding: 14px;
  }

  .ritual-rail {
    gap: 4px;
  }

  .ritual-rail span {
    font-size: 9px;
  }

  .preview-fan {
    grid-template-columns: repeat(3, minmax(74px, 1fr));
  }
}

@keyframes shuffle-card {
  0% {
    transform: translateX(var(--pile-x)) translateY(var(--pile-y)) rotate(var(--pile-angle)) rotateY(0deg);
  }

  48% {
    transform: translateX(var(--pile-x-alt)) translateY(calc(var(--pile-y) - 12px)) rotate(var(--pile-angle-alt)) rotateY(14deg);
  }

  100% {
    transform: translateX(var(--pile-x)) translateY(var(--pile-y)) rotate(var(--pile-angle)) rotateY(0deg);
  }
}

@keyframes cut-upper {
  0% {
    transform: translateX(var(--pile-x)) translateY(var(--pile-y)) rotate(var(--pile-angle));
  }

  58% {
    transform: translateX(86px) translateY(-20px) rotate(7deg);
  }

  100% {
    transform: translateX(12px) translateY(var(--pile-y)) rotate(1deg);
  }
}

@keyframes cut-lower {
  0%,
  100% {
    transform: translateX(var(--pile-x)) translateY(var(--pile-y)) rotate(var(--pile-angle));
  }

  58% {
    transform: translateX(-42px) translateY(18px) rotate(-4deg);
  }
}

@keyframes deal-card {
  0% {
    opacity: 0;
    transform: translate(-50%, -130%) scale(0.7) rotate(-12deg) rotateY(58deg);
  }

  28% {
    opacity: 1;
  }

  74% {
    opacity: 1;
    transform: translate(calc(-50% + var(--slot-x)), calc(-50% + var(--slot-y))) scale(1.02) rotate(var(--slot-angle)) rotateY(0deg);
  }

  100% {
    opacity: 0.86;
    transform: translate(calc(-50% + var(--slot-x)), calc(-50% + var(--slot-y))) scale(1) rotate(var(--slot-angle)) rotateY(0deg);
  }
}

@keyframes live-focus-in {
  from {
    opacity: 0;
    transform: translateY(18px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pile-card,
  .deal-card,
  .live-focus {
    animation: none;
  }
}
</style>
