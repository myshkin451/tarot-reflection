<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import tabletopBg from "@/assets/interface/tabletop-bg.png";
import manuscriptPanel from "@/assets/interface/manuscript-panel.png";
import { spreads, getSpread } from "@/data/spreads";
import { tarotCards } from "@/data/tarotCards";
import { AiReadingRequestError, getAiReadingEndpoint, requestAiReading, requestAiReadingStream } from "@/lib/aiReading";
import { getDeckBackAsset } from "@/lib/deckAssets";
import { drawCards } from "@/lib/draw";
import { buildReadingInsight } from "@/lib/interpretation";
import { t } from "@/lib/i18n";
import { list, text } from "@/lib/locale";
import { renderSafeMarkdown } from "@/lib/markdown";
import { sitePath } from "@/lib/paths";
import { readingToMarkdown } from "@/lib/promptBuilder";
import { deleteReading, loadReadings, upsertReading } from "@/lib/storage";
import type { DrawnCard, Locale, ReadingSession, Spread } from "@/lib/types";
import CardFace from "./CardFace.vue";
import LanguageSwitcher from "./LanguageSwitcher.vue";

type ReadingFlowState = "idle" | "shuffling" | "cutting" | "dealing" | "awaitingReveal" | "revealing" | "complete";
type ManuscriptTab = "initial" | "ai" | "journal" | "export";

interface SlotStyle {
  x: number;
  y: number;
  angle: number;
  scale?: number;
}

const locale = ref<Locale>("en");
const question = ref("");
const selectedSpreadId = ref<Spread["id"]>("five-card");
const includeReversed = ref(true);
const session = ref<ReadingSession | null>(null);
const pendingSession = ref<ReadingSession | null>(null);
const flowState = ref<ReadingFlowState>("idle");
const revealedCount = ref(0);
const selectedCardIndex = ref(0);
const activeTab = ref<ManuscriptTab>("initial");
const saved = ref(false);
const journalReadings = ref<ReadingSession[]>([]);
const reducedMotion = ref(false);
const aiLoading = ref(false);
const aiResponse = ref("");
const aiError = ref("");
const aiRemaining = ref<number | undefined>(undefined);
const deckBack = getDeckBackAsset();
const aiEndpointEnabled = Boolean(getAiReadingEndpoint());
const shuffleCards = Array.from({ length: 13 }, (_, index) => index);
let drawToken = 0;
let timers: number[] = [];
let motionQuery: MediaQueryList | null = null;
let aiController: AbortController | null = null;

const assetUrl = (asset: string | { src: string }) => (typeof asset === "string" ? asset : asset.src);
const tabletopBgUrl = assetUrl(tabletopBg);
const manuscriptPanelUrl = assetUrl(manuscriptPanel);

const selectedSpread = computed(() => getSpread(selectedSpreadId.value));
const displaySession = computed(() => pendingSession.value ?? session.value);
const tableDraws = computed(() => displaySession.value?.cards ?? []);
const spreadCount = computed(() => selectedSpread.value.positions.length);
const flowBusy = computed(() => ["shuffling", "cutting", "dealing", "revealing"].includes(flowState.value));
const settingsLocked = computed(() => Boolean(pendingSession.value) || flowBusy.value);
const setupCondensed = computed(() => Boolean(displaySession.value));
const canStartReading = computed(() => !pendingSession.value && !flowBusy.value);
const insight = computed(() => (session.value ? buildReadingInsight(session.value, locale.value) : null));
const aiResponseHtml = computed(() => renderSafeMarkdown(aiResponse.value));
const activeDrawn = computed(() => {
  const source = session.value?.cards ?? pendingSession.value?.cards ?? [];
  return source[Math.min(selectedCardIndex.value, Math.max(source.length - 1, 0))];
});
const visibleQuestion = computed(() => question.value.trim() || (locale.value === "zh-CN" ? "我现在需要看见什么？" : "What should I notice now?"));

const activeStepIndex = computed(() => {
  const indexByState: Record<ReadingFlowState, number> = {
    idle: 0,
    shuffling: 1,
    cutting: 2,
    dealing: 2,
    awaitingReveal: 3,
    revealing: 3,
    complete: 4
  };

  return indexByState[flowState.value];
});

const ritualSteps = computed(() =>
  locale.value === "zh-CN"
    ? [
        { label: "问题", icon: "?" },
        { label: "洗牌", icon: "◎" },
        { label: "切牌", icon: "◇" },
        { label: "揭示", icon: "◉" },
        { label: "解读", icon: "✦" }
      ]
    : [
        { label: "Question", icon: "?" },
        { label: "Shuffle", icon: "◎" },
        { label: "Cut", icon: "◇" },
        { label: "Reveal", icon: "◉" },
        { label: "Read", icon: "✦" }
      ]
);

const manuscriptTabs = computed(() =>
  locale.value === "zh-CN"
    ? [
        { id: "initial" as const, label: "初读", icon: "☼" },
        { id: "ai" as const, label: "AI 深读", icon: "✺" },
        { id: "journal" as const, label: "日志", icon: "✎" },
        { id: "export" as const, label: "导出", icon: "⌑" }
      ]
    : [
        { id: "initial" as const, label: "Initial", icon: "☼" },
        { id: "ai" as const, label: "AI Deep", icon: "✺" },
        { id: "journal" as const, label: "Journal", icon: "✎" },
        { id: "export" as const, label: "Export", icon: "⌑" }
      ]
);

const sideTools = computed(() =>
  locale.value === "zh-CN"
    ? [
        { label: "牌桌", icon: "◎", active: true },
        { label: "牌库", icon: "▧", href: sitePath("cards") },
        { label: "日志", icon: "✎", tab: "journal" as const },
        { label: "深读", icon: "✺", tab: "ai" as const },
        { label: "设置", icon: "⚙" }
      ]
    : [
        { label: "Table", icon: "◎", active: true },
        { label: "Decks", icon: "▧", href: sitePath("cards") },
        { label: "Journal", icon: "✎", tab: "journal" as const },
        { label: "Insight", icon: "✺", tab: "ai" as const },
        { label: "Settings", icon: "⚙" }
      ]
);

const flowMessage = computed(() => {
  const messages: Record<ReadingFlowState, { en: string; zh: string }> = {
    idle: {
      en: "Set the question, choose a spread, then touch the deck to begin.",
      zh: "写下问题，选择牌阵，然后触碰牌堆开始。"
    },
    shuffling: {
      en: "The cards are locked. The deck is only giving the draw a visible ritual.",
      zh: "牌已经锁定。洗牌只是让结果以仪式显形。"
    },
    cutting: {
      en: "Cutting the deck. The pace changes; the draw does not.",
      zh: "正在切牌。节奏在改变，抽牌结果不会改变。"
    },
    dealing: {
      en: "Cards are moving into their places on the table.",
      zh: "牌正在落到牌桌上的位置。"
    },
    awaitingReveal: {
      en: "Reveal each card when you are ready.",
      zh: "准备好时，逐张揭示。"
    },
    revealing: {
      en: "The next card is turning over.",
      zh: "下一张牌正在翻开。"
    },
    complete: {
      en: "The spread is open. Read the table before asking AI to go deeper.",
      zh: "牌阵已经打开。先读牌桌，再让 AI 进入更深层。"
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
    return locale.value === "zh-CN" ? "重新开始牌桌" : "Begin a new table";
  }

  return locale.value === "zh-CN" ? "触碰牌堆" : "Touch the deck";
});

const primaryCardTitle = computed(() => {
  if (!activeDrawn.value) {
    return locale.value === "zh-CN" ? "等待牌面" : "Awaiting the cards";
  }

  if (pendingSession.value && selectedCardIndex.value >= revealedCount.value) {
    return locale.value === "zh-CN" ? "牌面仍然朝下" : "Cards remain face down";
  }

  return `${text(activeDrawn.value.card.name, locale.value)} · ${orientationLabel(activeDrawn.value)}`;
});

const tableStyle = computed(() => ({
  "--tabletop-bg": `url(${tabletopBgUrl})`,
  "--deck-back-image": `url(${deckBack.image})`
}));

const manuscriptStyle = computed(() => ({
  "--manuscript-bg": `url(${manuscriptPanelUrl})`
}));

const slotStyles = computed(() => {
  const count = tableDraws.value.length || selectedSpread.value.positions.length;
  const maps: Record<number, SlotStyle[]> = {
    1: [{ x: 0, y: 0, angle: -2, scale: 1.08 }],
    3: [
      { x: -142, y: 14, angle: -4 },
      { x: 0, y: -24, angle: 1, scale: 1.08 },
      { x: 142, y: 14, angle: 4 }
    ],
    5: [
      { x: 0, y: -58, angle: -2 },
      { x: 124, y: -72, angle: 0 },
      { x: 248, y: -58, angle: 2 },
      { x: 40, y: 110, angle: -4 },
      { x: 196, y: 110, angle: 5 }
    ]
  };

  return maps[count] ?? maps[5];
});

const previewSlots = computed(() =>
  selectedSpread.value.positions.map((position, index) => ({
    position,
    style: slotStyles.value[index] ?? { x: 0, y: 0, angle: 0 }
  }))
);

function makeId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function orientationLabel(drawn: DrawnCard) {
  return drawn.orientation === "reversed"
    ? locale.value === "zh-CN"
      ? "逆位"
      : "Reversed"
    : locale.value === "zh-CN"
      ? "正位"
      : "Upright";
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
    shuffle: 980,
    cut: 520,
    deal: 720 + cardCount * 110,
    reveal: 460,
    revealAll: 720
  };
}

function resetAiState() {
  aiController?.abort();
  aiController = null;
  aiLoading.value = false;
  aiResponse.value = session.value?.aiResponse ?? "";
  aiError.value = "";
  aiRemaining.value = undefined;
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
  saved.value = false;
  revealedCount.value = 0;
  selectedCardIndex.value = 0;
  activeTab.value = "initial";
  resetAiState();
  flowState.value = "shuffling";

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
  selectedCardIndex.value = 0;
  aiResponse.value = session.value.aiResponse ?? "";
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
  selectedCardIndex.value = Math.max(0, nextCount - 1);

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
    if (index < revealedCount.value || session.value) {
      selectedCardIndex.value = index;
    }
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

function resetTable() {
  drawToken += 1;
  clearFlowTimers();
  pendingSession.value = null;
  session.value = null;
  flowState.value = "idle";
  revealedCount.value = 0;
  selectedCardIndex.value = 0;
  saved.value = false;
  activeTab.value = "initial";
  resetAiState();
}

function saveCurrentReading() {
  if (!session.value) {
    return;
  }

  saved.value = upsertReading(session.value);
  refreshJournal();
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
    refreshJournal();
  }
}

async function generateAiReading() {
  const currentSession = session.value;
  if (!aiEndpointEnabled || !currentSession || aiLoading.value) {
    return;
  }

  aiController?.abort();
  aiController = new AbortController();
  aiLoading.value = true;
  aiError.value = "";
  aiResponse.value = "";
  activeTab.value = "ai";

  try {
    const result = await requestAiReadingStream(currentSession, locale.value, {
      signal: aiController.signal,
      onMeta(meta) {
        aiRemaining.value = meta.remaining;
      },
      onDelta(delta) {
        aiResponse.value += delta;
      }
    }).catch((error) => {
      if (error instanceof AiReadingRequestError && (error.status === 404 || error.status === 405)) {
        return requestAiReading(currentSession, locale.value, { signal: aiController?.signal });
      }

      throw error;
    });

    aiResponse.value = result.response;
    aiRemaining.value = result.remaining;
    attachAiResponse(result.response);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return;
    }

    const message = error instanceof Error ? error.message : "";
    const limited = message.includes("limit") || message.includes("次数") || message.includes("429");

    aiError.value = limited
      ? locale.value === "zh-CN"
        ? "今天的生成次数已经用完。先读本地手札，明天再继续。"
        : "The daily reading limit has been reached. Use the local manuscript for now and try again tomorrow."
      : locale.value === "zh-CN"
        ? "这次没有生成成功。可以稍后再试，或先导出提示词。"
        : "This reading could not be generated. Try again later, or export the prompt for now.";
  } finally {
    aiLoading.value = false;
    aiController = null;
  }
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportCurrentMarkdown() {
  if (!session.value) {
    return;
  }

  download(`arcana-mirror-reading-${session.value.id}.md`, readingToMarkdown(session.value, locale.value), "text/markdown;charset=utf-8");
}

function exportJournalMarkdown() {
  const markdown = journalReadings.value.map((item) => readingToMarkdown(item, locale.value)).join("\n\n---\n\n");
  download("arcana-mirror-journal.md", markdown, "text/markdown;charset=utf-8");
}

function refreshJournal() {
  journalReadings.value = loadReadings();
}

function removeJournalReading(id: string) {
  deleteReading(id);
  refreshJournal();
}

function selectTab(tab: ManuscriptTab) {
  activeTab.value = tab;
}

function selectSideTool(tool: { href?: string; tab?: ManuscriptTab }) {
  if (tool.tab) {
    activeTab.value = tool.tab;
  }
}

watch(locale, (next) => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("arcana-mirror-locale", next);
  }
});

watch(
  () => session.value?.id,
  () => {
    resetAiState();
  }
);

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

  refreshJournal();
});

onBeforeUnmount(() => {
  drawToken += 1;
  clearFlowTimers();
  aiController?.abort();
  motionQuery = null;
});
</script>

<template>
  <div class="immersive-shell" :style="tableStyle">
    <header class="mystic-topbar">
      <div class="topbar-cluster">
        <button class="icon-button" type="button" :aria-label="locale === 'zh-CN' ? '打开菜单' : 'Open menu'">
          <span>☰</span>
        </button>
        <a class="icon-button" :href="sitePath('cards')" :aria-label="t(locale, 'nav.cards')">
          <span>◎</span>
        </a>
        <button class="icon-button" type="button" :aria-label="locale === 'zh-CN' ? '查看日志' : 'View journal'" @click="selectTab('journal')">
          <span>▤</span>
        </button>
      </div>

      <a class="brand-title" :href="sitePath()">
        <span aria-hidden="true">✦</span>
        <strong>Arcana Mirror</strong>
        <span aria-hidden="true">✦</span>
      </a>

      <div class="topbar-cluster right">
        <button class="icon-button" type="button" :aria-label="locale === 'zh-CN' ? '主题' : 'Theme'">
          <span>☼</span>
        </button>
        <LanguageSwitcher v-model:locale="locale" />
        <button class="icon-button" type="button" :aria-label="locale === 'zh-CN' ? '更多' : 'More'">
          <span>⋮</span>
        </button>
      </div>
    </header>

    <div class="ritual-workspace">
      <aside class="ritual-sidebar" aria-label="Arcana Mirror tools">
        <div class="sidebar-mark" aria-hidden="true">✺</div>
        <component
          :is="tool.href ? 'a' : 'button'"
          v-for="tool in sideTools"
          :key="tool.label"
          class="side-tool"
          :class="{ active: tool.active || activeTab === tool.tab }"
          :href="tool.href"
          type="button"
          @click="selectSideTool(tool)"
        >
          <span aria-hidden="true">{{ tool.icon }}</span>
          <small>{{ tool.label }}</small>
        </component>
        <div class="sidebar-orbit" aria-hidden="true">✵</div>
      </aside>

      <main class="tabletop-stage" aria-label="Arcana Mirror tabletop">
        <section class="setup-card" :class="{ locked: settingsLocked, condensed: setupCondensed }" aria-labelledby="setup-title">
          <div class="setup-heading">
            <span id="setup-title">{{ locale === "zh-CN" ? "你的问题" : "Your Question" }}</span>
            <button type="button" :disabled="settingsLocked && !session" :aria-label="locale === 'zh-CN' ? '编辑问题' : 'Edit question'" @click="setupCondensed && session ? resetTable() : undefined">✎</button>
          </div>

          <textarea v-model="question" :placeholder="t(locale, 'flow.questionPlaceholder')" :disabled="settingsLocked || Boolean(session)" />

          <div v-if="!setupCondensed" class="spread-palette" aria-label="Spread">
            <span>{{ t(locale, "flow.spread") }}</span>
            <div class="spread-buttons">
              <button
                v-for="spread in spreads"
                :key="spread.id"
                type="button"
                :disabled="settingsLocked"
                :class="{ active: selectedSpreadId === spread.id }"
                @click="selectedSpreadId = spread.id"
              >
                <strong>{{ text(spread.name, locale) }}</strong>
                <small>{{ spread.positions.length }}</small>
              </button>
            </div>
          </div>

          <label v-if="!setupCondensed" class="reversed-toggle">
            <input v-model="includeReversed" type="checkbox" :disabled="settingsLocked" />
            <span>{{ t(locale, "flow.reversed") }}</span>
          </label>
        </section>

        <section class="table-surface" :class="[`flow-${flowState}`, `spread-${spreadCount}`]">
          <button class="deck-stack" type="button" :disabled="!canStartReading && flowState !== 'awaitingReveal'" @click="handlePrimaryAction">
            <span v-for="index in 12" :key="index" :style="{ '--deck-layer': index }" />
            <strong>{{ primaryActionLabel }}</strong>
          </button>

          <div v-if="flowBusy" class="ritual-motion" aria-live="polite">
            <span
              v-for="index in shuffleCards"
              :key="index"
              class="motion-card"
              :style="{
                '--motion-index': index,
                '--motion-angle': `${(index - 6) * 3.8}deg`,
                '--motion-delay': `${index * -84}ms`
              }"
            />
            <p>{{ flowMessage }}</p>
          </div>

          <div v-else class="spread-orbit" :class="[`count-${tableDraws.length || selectedSpread.positions.length}`]">
            <template v-if="tableDraws.length">
              <article
                v-for="(drawn, index) in tableDraws"
                :key="`${drawn.position.id}-${drawn.card.id}`"
                class="table-card-slot"
                :class="{
                  revealed: session || index < revealedCount,
                  next: pendingSession && index === revealedCount,
                  locked: pendingSession && index > revealedCount,
                  selected: selectedCardIndex === index
                }"
                :style="{
                  '--slot-x': `${slotStyles[index]?.x ?? 0}px`,
                  '--slot-y': `${slotStyles[index]?.y ?? 0}px`,
                  '--slot-angle': `${slotStyles[index]?.angle ?? 0}deg`,
                  '--slot-scale': slotStyles[index]?.scale ?? 1
                }"
              >
                <button
                  type="button"
                  :disabled="Boolean(pendingSession && (index !== revealedCount || flowState !== 'awaitingReveal'))"
                  :aria-label="locale === 'zh-CN' ? `揭示${text(drawn.position.name, locale)}` : `Reveal ${text(drawn.position.name, locale)}`"
                  @click="revealCard(index)"
                >
                  <CardFace
                    :card="drawn.card"
                    :locale="locale"
                    :orientation="drawn.orientation"
                    :position="text(drawn.position.name, locale)"
                    :compact="tableDraws.length >= 5"
                    :facedown="Boolean(pendingSession && index >= revealedCount)"
                    :reveal="Boolean(session || index < revealedCount)"
                    :reveal-index="index"
                  />
                </button>
                <div class="slot-token">
                  <span>{{ index + 1 }}</span>
                  <strong>
                    {{
                      session || index < revealedCount
                        ? text(drawn.card.name, locale)
                        : locale === "zh-CN"
                          ? "未揭示"
                          : "Face down"
                    }}
                  </strong>
                </div>
              </article>
            </template>

            <template v-else>
              <article
                v-for="(slot, index) in previewSlots"
                :key="slot.position.id"
                class="empty-slot"
                :style="{
                  '--slot-x': `${slot.style.x}px`,
                  '--slot-y': `${slot.style.y}px`,
                  '--slot-angle': `${slot.style.angle}deg`,
                  '--slot-scale': slot.style.scale ?? 1
                }"
              >
                <span>{{ index + 1 }}</span>
                <strong>{{ text(slot.position.name, locale) }}</strong>
              </article>
            </template>
          </div>

          <div v-if="flowState !== 'idle' && flowState !== 'complete'" class="table-status">
            <span>{{ text(selectedSpread.name, locale) }}</span>
            <strong>{{ primaryCardTitle }}</strong>
            <p>{{ flowMessage }}</p>
          </div>
        </section>

        <section class="ritual-progress" aria-label="Reading ritual progress">
          <button
            v-for="(step, index) in ritualSteps"
            :key="step.label"
            type="button"
            :class="{ active: index === activeStepIndex, complete: index < activeStepIndex }"
            :aria-current="index === activeStepIndex ? 'step' : undefined"
          >
            <span>{{ step.icon }}</span>
            <strong>{{ step.label }}</strong>
          </button>
        </section>

        <div v-if="pendingSession && flowState === 'awaitingReveal'" class="reveal-dock">
          <button type="button" @click="revealNextCard">{{ locale === "zh-CN" ? "揭示下一张" : "Reveal next" }}</button>
          <button type="button" @click="revealAllCards">{{ locale === "zh-CN" ? "全部揭示" : "Reveal all" }}</button>
        </div>
      </main>

      <aside class="manuscript-shell" :style="manuscriptStyle" aria-label="Reading manuscript">
        <nav class="manuscript-tabs" aria-label="Manuscript tabs">
          <button
            v-for="tab in manuscriptTabs"
            :key="tab.id"
            type="button"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <span>{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        </nav>

        <div class="manuscript-scroll">
          <section v-if="activeTab === 'initial'" class="manuscript-page">
            <template v-if="insight">
              <div class="lead-block">
                <span>{{ insight.label }}</span>
                <h1>{{ insight.title }}</h1>
                <p>{{ insight.overview }}</p>
              </div>

              <div class="influence-grid">
                <article>
                  <span>{{ locale === "zh-CN" ? "牌面结构" : "Pattern" }}</span>
                  <p>{{ insight.pattern }}</p>
                </article>
                <article>
                  <span>{{ locale === "zh-CN" ? "行动建议" : "Landing point" }}</span>
                  <p>{{ insight.nextStep }}</p>
                </article>
              </div>

              <div class="card-notes">
                <button
                  v-for="(note, index) in insight.cardNotes"
                  :key="`${note.drawn.position.id}-${note.drawn.card.id}`"
                  type="button"
                  :class="{ active: selectedCardIndex === index }"
                  @click="selectedCardIndex = index"
                >
                  <span>{{ note.positionName }}</span>
                  <strong>{{ note.cardName }}</strong>
                </button>
              </div>

              <article v-if="activeDrawn" class="selected-note">
                <span>{{ text(activeDrawn.position.name, locale) }} · {{ orientationLabel(activeDrawn) }}</span>
                <h2>{{ text(activeDrawn.card.name, locale) }}</h2>
                <p>{{ text(activeDrawn.card.meaning[activeDrawn.orientation], locale) }}</p>
                <div class="keyword-row">
                  <span v-for="keyword in list(activeDrawn.card.keywords[activeDrawn.orientation], locale).slice(0, 4)" :key="keyword">
                    {{ keyword }}
                  </span>
                </div>
              </article>

              <button class="save-reading" type="button" @click="saveCurrentReading">
                {{ saved ? (locale === "zh-CN" ? "已保存" : "Saved") : (locale === "zh-CN" ? "保存手札" : "Save Reading") }}
              </button>
            </template>

            <template v-else>
              <div class="lead-block dormant">
                <span>
                  {{
                    pendingSession
                      ? locale === "zh-CN"
                        ? "揭示阶段"
                        : "Reveal step"
                      : locale === "zh-CN"
                        ? "牌桌待命"
                        : "Table waiting"
                  }}
                </span>
                <h1>
                  {{
                    pendingSession
                      ? locale === "zh-CN"
                        ? "现在逐张揭示"
                        : "Reveal the cards"
                      : locale === "zh-CN"
                        ? "先让问题落到桌面"
                        : "Let the question land on the table"
                  }}
                </h1>
                <p>{{ flowMessage }}</p>
              </div>
              <div class="question-plate">
                <span>{{ locale === "zh-CN" ? "当前问题" : "Current question" }}</span>
                <strong>{{ visibleQuestion }}</strong>
              </div>
            </template>
          </section>

          <section v-else-if="activeTab === 'ai'" class="manuscript-page ai-page">
            <div class="lead-block">
              <span>{{ locale === "zh-CN" ? "AI 深读" : "AI deep reading" }}</span>
              <h1>{{ locale === "zh-CN" ? "把这组牌读到更深一层" : "Read the deeper layer" }}</h1>
              <p>
                {{
                  session
                    ? locale === "zh-CN"
                      ? "AI 会基于问题、牌阵、正逆位和本地初读生成更完整的解读。"
                      : "AI uses the question, spread, orientations, and local reading to generate a deeper interpretation."
                    : locale === "zh-CN"
                      ? "牌阵完成后，这里会出现深读入口。"
                      : "Complete the spread to open the deeper reading."
                }}
              </p>
            </div>

            <button class="save-reading ai-trigger" type="button" :disabled="!session || !aiEndpointEnabled || aiLoading" @click="generateAiReading">
              {{
                aiLoading
                  ? locale === "zh-CN"
                    ? "生成中"
                    : "Writing"
                  : aiResponse
                    ? locale === "zh-CN"
                      ? "重新生成"
                      : "Regenerate"
                    : locale === "zh-CN"
                      ? "生成 AI 解读"
                      : "Generate AI Reading"
              }}
            </button>

            <p v-if="!aiEndpointEnabled" class="muted-note">
              {{ locale === "zh-CN" ? "这个构建没有配置 AI 端点。" : "This build does not have the AI endpoint configured." }}
            </p>
            <p v-if="typeof aiRemaining === 'number'" class="muted-note">
              {{ locale === "zh-CN" ? `今天还可生成 ${aiRemaining} 次` : `${aiRemaining} readings left today` }}
            </p>

            <div v-if="aiResponse" class="ai-response" v-html="aiResponseHtml" />
            <p v-else-if="aiError" class="ai-error">{{ aiError }}</p>
            <p v-else class="empty-ai">
              {{ locale === "zh-CN" ? "等待墨迹落下。" : "Waiting for ink to settle." }}
            </p>
          </section>

          <section v-else-if="activeTab === 'journal'" class="manuscript-page journal-page">
            <div class="lead-block">
              <span>{{ locale === "zh-CN" ? "日志" : "Journal" }}</span>
              <h1>{{ locale === "zh-CN" ? "保存过的牌桌" : "Saved tables" }}</h1>
              <p>{{ locale === "zh-CN" ? "这里记录本机保存的抽牌。" : "These readings are stored locally in this browser." }}</p>
            </div>

            <div v-if="journalReadings.length" class="journal-list">
              <article v-for="item in journalReadings" :key="item.id">
                <span>{{ new Date(item.createdAt).toLocaleString(locale) }}</span>
                <strong>{{ text(item.spreadName, locale) }}</strong>
                <p>{{ item.question || (locale === "zh-CN" ? "未命名问题" : "Untitled question") }}</p>
                <button type="button" @click="removeJournalReading(item.id)">
                  {{ locale === "zh-CN" ? "删除" : "Delete" }}
                </button>
              </article>
            </div>
            <p v-else class="muted-note">{{ locale === "zh-CN" ? "还没有保存的牌桌。" : "No saved readings yet." }}</p>
          </section>

          <section v-else class="manuscript-page export-page">
            <div class="lead-block">
              <span>{{ locale === "zh-CN" ? "导出" : "Export" }}</span>
              <h1>{{ locale === "zh-CN" ? "带走这次手札" : "Carry the manuscript out" }}</h1>
              <p>{{ locale === "zh-CN" ? "保存、导出当前牌桌，或导出全部本地日志。" : "Save and export the current table, or export the full local journal." }}</p>
            </div>

            <div class="export-actions">
              <button type="button" :disabled="!session" @click="saveCurrentReading">
                {{ saved ? (locale === "zh-CN" ? "当前已保存" : "Current saved") : (locale === "zh-CN" ? "保存当前" : "Save current") }}
              </button>
              <button type="button" :disabled="!session" @click="exportCurrentMarkdown">Markdown</button>
              <button type="button" :disabled="!journalReadings.length" @click="exportJournalMarkdown">
                {{ locale === "zh-CN" ? "导出全部日志" : "Export journal" }}
              </button>
            </div>
          </section>
        </div>
      </aside>
    </div>

    <nav class="mobile-nav" aria-label="Mobile navigation">
      <button type="button" class="active"><span>◎</span>{{ locale === "zh-CN" ? "牌桌" : "Table" }}</button>
      <a :href="sitePath('cards')"><span>▧</span>{{ locale === "zh-CN" ? "牌库" : "Decks" }}</a>
      <button type="button" @click="selectTab('journal')"><span>✎</span>{{ locale === "zh-CN" ? "日志" : "Journal" }}</button>
      <button type="button" @click="selectTab('ai')"><span>✺</span>{{ locale === "zh-CN" ? "深读" : "AI" }}</button>
    </nav>
  </div>
</template>

<style scoped>
.immersive-shell {
  --brass: #b98a4b;
  --brass-bright: #e0bd78;
  --ink-black: #050505;
  --panel-black: rgba(9, 8, 7, 0.9);
  --vellum-ink: #2e2113;
  min-height: 100vh;
  overflow-x: hidden;
  color: #f7ead0;
  background:
    radial-gradient(circle at 50% 0%, rgba(185, 138, 75, 0.14), transparent 30%),
    linear-gradient(180deg, #050505, #0a0908 60%, #050505);
}

button,
a,
textarea {
  font: inherit;
}

button,
a {
  color: inherit;
}

.mystic-topbar {
  position: sticky;
  z-index: 20;
  top: 0;
  display: grid;
  grid-template-columns: minmax(180px, 1fr) auto minmax(180px, 1fr);
  align-items: center;
  min-height: 72px;
  border: 1px solid rgba(185, 138, 75, 0.42);
  border-top: 0;
  padding: 8px clamp(12px, 2vw, 28px);
  background:
    linear-gradient(180deg, rgba(8, 8, 7, 0.98), rgba(8, 8, 7, 0.84)),
    #050505;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(14px);
}

.topbar-cluster {
  display: flex;
  gap: 12px;
  align-items: center;
}

.topbar-cluster.right {
  justify-content: flex-end;
}

.icon-button {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border: 1px solid rgba(185, 138, 75, 0.24);
  color: rgba(224, 189, 120, 0.88);
  background: rgba(255, 255, 255, 0.015);
  text-decoration: none;
  cursor: pointer;
}

.icon-button:hover {
  border-color: rgba(224, 189, 120, 0.74);
  background: rgba(185, 138, 75, 0.1);
}

.brand-title {
  display: inline-flex;
  gap: 24px;
  align-items: center;
  justify-content: center;
  color: #d7ad69;
  text-decoration: none;
}

.brand-title strong {
  font: 650 clamp(32px, 3.2vw, 48px) / 0.95 var(--font-display);
}

.brand-title span {
  color: rgba(185, 138, 75, 0.68);
  font-size: 18px;
}

.ritual-workspace {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr) minmax(360px, 33vw);
  min-height: calc(100svh - 72px);
}

.ritual-sidebar {
  position: sticky;
  top: 72px;
  display: grid;
  grid-template-rows: 76px repeat(5, minmax(74px, auto)) 1fr;
  min-height: calc(100svh - 72px);
  border-right: 1px solid rgba(185, 138, 75, 0.35);
  border-left: 1px solid rgba(185, 138, 75, 0.28);
  background: linear-gradient(180deg, rgba(12, 11, 10, 0.98), rgba(8, 8, 7, 0.92));
}

.sidebar-mark,
.sidebar-orbit {
  display: grid;
  place-items: center;
  color: rgba(224, 189, 120, 0.86);
  font-size: 36px;
}

.sidebar-orbit {
  align-self: end;
  min-height: 96px;
  border-top: 1px solid rgba(185, 138, 75, 0.18);
  color: rgba(185, 138, 75, 0.45);
}

.side-tool {
  display: grid;
  gap: 7px;
  place-items: center;
  border: 0;
  border-top: 1px solid rgba(185, 138, 75, 0.12);
  color: rgba(224, 189, 120, 0.64);
  background: transparent;
  text-decoration: none;
  cursor: pointer;
}

.side-tool span {
  font-size: 26px;
}

.side-tool small {
  font: 650 12px/1 var(--font-ui);
}

.side-tool:hover,
.side-tool.active {
  color: #f4d99a;
  background: linear-gradient(90deg, rgba(185, 138, 75, 0.18), transparent);
  box-shadow: inset 3px 0 0 rgba(224, 189, 120, 0.82);
}

.tabletop-stage {
  position: relative;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  min-height: calc(100svh - 72px);
  overflow: hidden;
  background-image:
    linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.26)),
    var(--tabletop-bg);
  background-size: cover;
  background-position: center;
}

.tabletop-stage::after {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: "";
  background:
    radial-gradient(circle at 50% 44%, transparent 0 33%, rgba(4, 4, 4, 0.2) 58%, rgba(0, 0, 0, 0.78) 100%),
    linear-gradient(90deg, rgba(0, 0, 0, 0.4), transparent 14%, transparent 82%, rgba(0, 0, 0, 0.45));
}

.setup-card {
  position: absolute;
  z-index: 3;
  top: clamp(18px, 2vw, 30px);
  left: clamp(18px, 2vw, 30px);
  display: grid;
  gap: 14px;
  width: min(330px, 32vw);
  border: 1px solid rgba(185, 138, 75, 0.52);
  padding: 18px;
  background:
    linear-gradient(145deg, rgba(13, 11, 9, 0.94), rgba(13, 11, 9, 0.76)),
    rgba(0, 0, 0, 0.68);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
}

.setup-card.locked,
.setup-card.condensed {
  width: min(280px, 28vw);
  opacity: 0.82;
}

.setup-card.locked textarea,
.setup-card.condensed textarea {
  min-height: 46px;
  font-size: 18px;
}

.setup-heading,
.spread-palette > span {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #d7ad69;
  font: 750 13px/1 var(--font-ui);
}

.setup-heading button {
  border: 0;
  color: rgba(224, 189, 120, 0.84);
  background: transparent;
  cursor: pointer;
}

.setup-card textarea {
  min-height: 74px;
  resize: vertical;
  border: 0;
  border-bottom: 1px solid rgba(185, 138, 75, 0.35);
  padding: 0 0 12px;
  color: #fbefd4;
  background: transparent;
  font: 620 20px/1.25 var(--font-display);
}

.setup-card textarea::placeholder {
  color: rgba(247, 234, 208, 0.48);
}

.spread-palette {
  display: grid;
  gap: 10px;
}

.spread-buttons {
  display: grid;
  gap: 7px;
}

.spread-buttons button {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
  min-height: 38px;
  border: 1px solid rgba(185, 138, 75, 0.2);
  padding: 8px 10px;
  color: rgba(247, 234, 208, 0.7);
  background: rgba(255, 255, 255, 0.025);
  text-align: left;
  cursor: pointer;
}

.spread-buttons button.active,
.spread-buttons button:hover {
  border-color: rgba(224, 189, 120, 0.72);
  color: #f7ead0;
  background: rgba(185, 138, 75, 0.12);
}

.spread-buttons strong {
  overflow: hidden;
  font: 680 12px/1.25 var(--font-ui);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spread-buttons small {
  color: #d7ad69;
  font: 760 12px/1 var(--font-ui);
}

.reversed-toggle {
  display: flex;
  gap: 10px;
  align-items: center;
  color: rgba(247, 234, 208, 0.68);
  font: 650 12px/1.2 var(--font-ui);
}

.reversed-toggle input {
  accent-color: var(--brass);
}

.table-surface {
  position: relative;
  z-index: 2;
  display: grid;
  min-height: 0;
  place-items: center;
  padding: 58px clamp(18px, 3vw, 54px) 34px;
}

.deck-stack {
  position: absolute;
  z-index: 4;
  bottom: clamp(92px, 13vh, 148px);
  left: clamp(44px, 6vw, 86px);
  display: block;
  width: clamp(150px, 15vw, 210px);
  aspect-ratio: 2 / 2.65;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.deck-stack span {
  position: absolute;
  inset: calc(var(--deck-layer) * -1px) calc(var(--deck-layer) * 0.7px) calc(var(--deck-layer) * 1px) calc(var(--deck-layer) * -0.7px);
  border: 1px solid rgba(224, 189, 120, 0.38);
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.08), transparent 18%, transparent 84%, rgba(0, 0, 0, 0.34)),
    var(--deck-back-image);
  background-size: cover;
  background-position: center;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.38);
  transform: rotate(-4deg);
}

.deck-stack strong {
  position: absolute;
  right: -22px;
  bottom: -42px;
  left: -22px;
  color: #f7d990;
  font: 760 12px/1 var(--font-ui);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.9);
}

.deck-stack:hover span:last-of-type {
  box-shadow:
    0 20px 62px rgba(0, 0, 0, 0.54),
    0 0 28px rgba(224, 189, 120, 0.28);
  transform: translateY(-7px) rotate(-2deg);
}

.ritual-motion {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: grid;
  place-items: center;
  pointer-events: none;
}

.motion-card {
  position: absolute;
  width: clamp(104px, 9vw, 138px);
  aspect-ratio: 2 / 3.18;
  border: 1px solid rgba(224, 189, 120, 0.55);
  background: var(--deck-back-image);
  background-size: cover;
  background-position: center;
  box-shadow: 0 20px 54px rgba(0, 0, 0, 0.48);
  animation: shuffle-arc 980ms cubic-bezier(0.2, 0.8, 0.22, 1) infinite;
  animation-delay: var(--motion-delay);
  transform: rotate(var(--motion-angle));
}

.flow-cutting .motion-card {
  animation-name: cut-shift;
}

.flow-dealing .motion-card {
  animation-name: deal-pulse;
}

.ritual-motion p {
  position: absolute;
  bottom: 20%;
  max-width: min(520px, 70%);
  margin: 0;
  color: rgba(247, 234, 208, 0.84);
  text-align: center;
  font: 650 14px/1.45 var(--font-ui);
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.9);
}

.spread-orbit {
  position: relative;
  width: min(590px, calc(100% - 250px));
  height: min(346px, calc(100svh - 310px));
  margin-left: clamp(78px, 8vw, 126px);
}

.table-card-slot,
.empty-slot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: clamp(120px, 10.4vw, 160px);
  transform:
    translate(calc(-50% + var(--slot-x)), calc(-50% + var(--slot-y)))
    rotate(var(--slot-angle))
    scale(var(--slot-scale));
}

.count-1 .table-card-slot,
.count-1 .empty-slot {
  width: clamp(150px, 13vw, 188px);
}

.spread-5 .table-card-slot {
  width: clamp(106px, 8.8vw, 136px);
}

.table-card-slot button {
  display: block;
  width: 100%;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
}

.table-card-slot.locked {
  opacity: 0.74;
}

.table-card-slot.next :deep(.card-frame),
.table-card-slot.selected :deep(.card-frame) {
  border-color: rgba(250, 218, 137, 0.95);
  box-shadow:
    0 26px 70px rgba(0, 0, 0, 0.6),
    0 0 32px rgba(224, 189, 120, 0.36);
}

.slot-token {
  display: grid;
  gap: 4px;
  justify-items: center;
  margin-top: 10px;
  color: rgba(247, 234, 208, 0.76);
  text-align: center;
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.9);
}

.slot-token span,
.empty-slot span {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border: 1px solid rgba(224, 189, 120, 0.5);
  border-radius: 999px;
  background: rgba(8, 7, 6, 0.82);
  color: #e0bd78;
  font: 760 12px/1 var(--font-ui);
}

.slot-token strong {
  max-width: 160px;
  overflow: hidden;
  font: 720 12px/1.2 var(--font-ui);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-slot {
  display: grid;
  gap: 8px;
  place-items: center;
  min-height: 184px;
  border: 1px dashed rgba(224, 189, 120, 0.36);
  color: rgba(247, 234, 208, 0.56);
  background: rgba(0, 0, 0, 0.18);
  box-shadow: inset 0 0 44px rgba(224, 189, 120, 0.04);
}

.empty-slot strong {
  max-width: 130px;
  text-align: center;
  font: 650 12px/1.25 var(--font-ui);
}

.table-status {
  position: absolute;
  z-index: 4;
  right: clamp(26px, 3vw, 44px);
  bottom: 92px;
  display: grid;
  gap: 6px;
  width: min(340px, 30vw);
  border-left: 1px solid rgba(224, 189, 120, 0.34);
  padding-left: 18px;
  color: rgba(247, 234, 208, 0.76);
  text-shadow: 0 2px 14px rgba(0, 0, 0, 0.8);
}

.table-status span {
  color: #d7ad69;
  font: 760 11px/1 var(--font-ui);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.table-status strong {
  color: #fff0c8;
  font: 650 22px/1 var(--font-display);
}

.table-status p {
  margin: 0;
  font: 560 13px/1.45 var(--font-ui);
}

.ritual-progress {
  position: relative;
  z-index: 4;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
  width: min(760px, calc(100% - 68px));
  margin: 0 auto 16px;
  border: 1px solid rgba(185, 138, 75, 0.38);
  padding: 11px 20px;
  background: linear-gradient(180deg, rgba(11, 10, 9, 0.94), rgba(11, 10, 9, 0.78));
  box-shadow: 0 28px 74px rgba(0, 0, 0, 0.46);
  backdrop-filter: blur(12px);
}

.ritual-progress button {
  position: relative;
  display: grid;
  gap: 8px;
  place-items: center;
  border: 0;
  color: rgba(224, 189, 120, 0.54);
  background: transparent;
}

.ritual-progress button:not(:last-child)::after {
  position: absolute;
  top: 17px;
  right: calc(-50% + 22px);
  width: calc(100% - 44px);
  height: 1px;
  content: "";
  background: rgba(185, 138, 75, 0.32);
}

.ritual-progress span {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid currentColor;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.32);
  font-size: 18px;
}

.ritual-progress strong {
  font: 690 12px/1 var(--font-ui);
}

.ritual-progress .active {
  color: #ffe6a5;
  text-shadow: 0 0 18px rgba(224, 189, 120, 0.46);
}

.ritual-progress .active span {
  box-shadow:
    0 0 0 4px rgba(224, 189, 120, 0.1),
    0 0 22px rgba(224, 189, 120, 0.46);
}

.ritual-progress .complete {
  color: rgba(224, 189, 120, 0.82);
}

.reveal-dock {
  position: absolute;
  z-index: 8;
  right: clamp(24px, 3vw, 42px);
  bottom: 104px;
  display: flex;
  gap: 10px;
}

.reveal-dock button,
.save-reading,
.export-actions button {
  min-height: 44px;
  border: 1px solid rgba(67, 42, 18, 0.45);
  padding: 0 18px;
  color: #f4d99a;
  background: linear-gradient(180deg, #2a1f15, #14100c);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.3);
  font: 760 13px/1 var(--font-ui);
  cursor: pointer;
}

.manuscript-shell {
  position: sticky;
  z-index: 10;
  top: 72px;
  align-self: start;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: calc(100svh - 72px);
  min-width: 0;
  padding: clamp(28px, 2.6vw, 44px) clamp(24px, 2.2vw, 36px) clamp(30px, 2.5vw, 42px);
  color: var(--vellum-ink);
  background-image: var(--manuscript-bg);
  background-size: 100% 100%;
  background-position: center;
  filter: drop-shadow(-24px 0 48px rgba(0, 0, 0, 0.44));
}

.manuscript-tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 8px 12px 0;
  border: 1px solid rgba(86, 54, 25, 0.24);
  background: rgba(108, 79, 43, 0.18);
}

.manuscript-tabs button {
  display: grid;
  gap: 4px;
  min-height: 62px;
  place-items: center;
  border: 0;
  border-right: 1px solid rgba(86, 54, 25, 0.2);
  color: rgba(50, 34, 19, 0.72);
  background: transparent;
  font: 760 12px/1.1 var(--font-ui);
  cursor: pointer;
}

.manuscript-tabs button:last-child {
  border-right: 0;
}

.manuscript-tabs button.active {
  color: #3b2413;
  background: linear-gradient(180deg, rgba(106, 45, 34, 0.28), rgba(198, 152, 89, 0.18));
  box-shadow: inset 0 -3px 0 rgba(95, 38, 29, 0.7);
}

.manuscript-scroll {
  overflow: auto;
  min-height: 0;
  margin: 8px 16px 10px;
  padding: clamp(16px, 2.1vw, 28px);
  border: 1px solid rgba(86, 54, 25, 0.16);
  background:
    linear-gradient(180deg, rgba(238, 210, 157, 0.9), rgba(220, 183, 124, 0.82)),
    rgba(238, 210, 157, 0.86);
  box-shadow:
    inset 0 0 38px rgba(97, 58, 22, 0.16),
    0 18px 38px rgba(32, 19, 10, 0.14);
  scrollbar-color: rgba(85, 52, 24, 0.4) transparent;
}

.manuscript-page {
  display: grid;
  gap: 18px;
  min-height: 100%;
}

.lead-block {
  display: grid;
  gap: 12px;
}

.lead-block span,
.influence-grid span,
.selected-note > span,
.journal-list span,
.question-plate span {
  color: #7a4b25;
  font: 800 12px/1 var(--font-ui);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.lead-block h1 {
  margin: 0;
  color: #2e2113;
  font: 680 clamp(28px, 2.5vw, 40px) / 1 var(--font-display);
}

.lead-block p,
.influence-grid p,
.selected-note p,
.question-plate strong,
.journal-list p,
.muted-note,
.empty-ai {
  margin: 0;
  color: rgba(46, 33, 19, 0.78);
  font: 650 15px/1.62 var(--font-ui);
}

.lead-block.dormant {
  margin-top: 20%;
}

.influence-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid rgba(93, 61, 28, 0.18);
  background: rgba(116, 82, 42, 0.08);
}

.influence-grid article {
  display: grid;
  gap: 10px;
  padding: 16px;
}

.influence-grid article + article {
  border-left: 1px solid rgba(93, 61, 28, 0.16);
}

.card-notes {
  display: grid;
  gap: 8px;
}

.card-notes button,
.journal-list article {
  display: grid;
  gap: 5px;
  border: 1px solid rgba(93, 61, 28, 0.14);
  padding: 12px;
  color: #2e2113;
  background: rgba(255, 248, 226, 0.12);
  text-align: left;
}

.card-notes button {
  cursor: pointer;
}

.card-notes button.active {
  border-color: rgba(102, 39, 29, 0.42);
  background: rgba(102, 39, 29, 0.12);
}

.card-notes strong,
.journal-list strong {
  font: 760 17px/1.1 var(--font-display);
}

.card-notes span {
  color: #7a4b25;
  font: 760 11px/1 var(--font-ui);
}

.selected-note {
  display: grid;
  gap: 10px;
  border-top: 1px solid rgba(93, 61, 28, 0.18);
  border-bottom: 1px solid rgba(93, 61, 28, 0.18);
  padding: 18px 0;
}

.selected-note h2 {
  margin: 0;
  color: #2e2113;
  font: 690 32px/1 var(--font-display);
}

.keyword-row {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.keyword-row span {
  border: 1px solid rgba(93, 61, 28, 0.16);
  border-radius: 999px;
  padding: 6px 10px;
  color: #4c321b;
  background: rgba(255, 248, 226, 0.14);
  font: 760 12px/1 var(--font-ui);
}

.save-reading {
  justify-self: center;
  min-width: 154px;
}

.ai-trigger {
  justify-self: start;
}

.ai-response {
  color: rgba(46, 33, 19, 0.82);
  font: 650 15px/1.68 var(--font-ui);
}

.ai-response :deep(p) {
  margin: 0 0 1em;
}

.ai-response :deep(h1),
.ai-response :deep(h2),
.ai-response :deep(h3) {
  color: #2e2113;
  font-family: var(--font-display);
}

.ai-error {
  margin: 0;
  color: #7a241b;
  font: 700 14px/1.5 var(--font-ui);
}

.journal-list {
  display: grid;
  gap: 10px;
}

.journal-list article {
  position: relative;
}

.journal-list button {
  justify-self: start;
  border: 1px solid rgba(93, 61, 28, 0.18);
  padding: 6px 10px;
  color: #5a281e;
  background: rgba(255, 248, 226, 0.18);
  font: 760 12px/1 var(--font-ui);
  cursor: pointer;
}

.export-actions {
  display: grid;
  gap: 12px;
  align-content: start;
}

.export-actions button:disabled,
.save-reading:disabled,
.deck-stack:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.question-plate {
  display: grid;
  gap: 10px;
  border: 1px solid rgba(93, 61, 28, 0.15);
  padding: 18px;
  background: rgba(255, 248, 226, 0.12);
}

.mobile-nav {
  display: none;
}

@keyframes shuffle-arc {
  0% {
    opacity: 0;
    transform: translate(-120px, 28px) rotate(calc(var(--motion-angle) - 28deg));
  }
  40% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(110px, -24px) rotate(calc(var(--motion-angle) + 26deg));
  }
}

@keyframes cut-shift {
  0% {
    transform: translateX(-54px) rotate(var(--motion-angle));
  }
  100% {
    transform: translateX(54px) rotate(calc(var(--motion-angle) * -1));
  }
}

@keyframes deal-pulse {
  0% {
    opacity: 0;
    transform: translate(-210px, 160px) rotate(-12deg) scale(0.9);
  }
  55% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(60px, -40px) rotate(8deg) scale(1.02);
  }
}

@media (max-width: 1180px) {
  .ritual-workspace {
    grid-template-columns: 74px minmax(0, 1fr);
  }

  .manuscript-shell {
    grid-column: 2;
    position: relative;
    top: auto;
    height: auto;
    min-height: 620px;
  }

  .setup-card {
    width: min(330px, 44vw);
  }

  .spread-orbit {
    width: min(660px, 70vw);
    margin-left: 120px;
  }
}

@media (max-width: 820px) {
  .immersive-shell {
    padding-bottom: 78px;
  }

  .mystic-topbar {
    grid-template-columns: auto 1fr auto;
    min-height: 86px;
    border-right: 0;
    border-left: 0;
    padding: 10px 14px;
  }

  .topbar-cluster .icon-button:nth-child(n + 2),
  .topbar-cluster.right .icon-button {
    display: none;
  }

  .brand-title {
    gap: 9px;
  }

  .brand-title strong {
    font-size: clamp(29px, 8vw, 42px);
  }

  .brand-title span {
    display: none;
  }

  .ritual-workspace {
    display: block;
    min-height: 0;
  }

  .ritual-sidebar {
    display: none;
  }

  .tabletop-stage {
    position: relative;
    display: block;
    min-height: 650px;
    background-position: center top;
  }

  .setup-card {
    position: absolute;
    z-index: 8;
    top: 14px;
    right: 14px;
    left: 14px;
    width: auto;
    margin: 0;
    padding: 12px;
  }

  .setup-card textarea {
    min-height: 42px;
    max-height: 72px;
    font-size: 20px;
  }

  .table-surface {
    min-height: 650px;
    padding: 220px 16px 112px;
  }

  .deck-stack {
    bottom: 46px;
    left: 20px;
    width: 112px;
  }

  .spread-orbit {
    width: 100%;
    height: 420px;
    margin: 0;
  }

  .table-card-slot,
  .empty-slot {
    width: clamp(92px, 25vw, 118px);
  }

  .count-1 .table-card-slot,
  .count-1 .empty-slot {
    width: clamp(118px, 31vw, 146px);
  }

  .spread-orbit.count-5 .table-card-slot,
  .spread-orbit.count-5 .empty-slot {
    transform:
      translate(
        calc(-50% + (var(--slot-x) * 0.62)),
        calc(-50% + (var(--slot-y) * 0.72))
      )
      rotate(var(--slot-angle))
      scale(var(--slot-scale));
  }

  .spread-orbit.count-5 .table-card-slot {
    width: 76px;
  }

  .table-card-slot :deep(.tarot-card) {
    min-height: 0;
  }

  .setup-card.condensed {
    right: auto;
    width: min(230px, 56vw);
  }

  .setup-card.condensed textarea {
    max-height: 78px;
    overflow: hidden;
    font-size: 17px;
  }

  .spread-orbit.count-3 .table-card-slot,
  .spread-orbit.count-3 .empty-slot {
    transform:
      translate(
        calc(-50% + (var(--slot-x) * 0.55)),
        calc(-50% + (var(--slot-y) * 0.85))
      )
      rotate(var(--slot-angle))
      scale(var(--slot-scale));
  }

  .table-status {
    right: 18px;
    bottom: 38px;
    width: min(220px, 54vw);
  }

  .table-status strong {
    font-size: 18px;
  }

  .ritual-progress {
    width: calc(100% - 28px);
    margin-bottom: 10px;
    padding: 12px 10px;
  }

  .ritual-progress button:not(:last-child)::after {
    display: none;
  }

  .ritual-progress strong {
    font-size: 10px;
  }

  .reveal-dock {
    right: 14px;
    bottom: 86px;
  }

  .manuscript-shell {
    min-height: 620px;
    margin: -260px 8px 22px;
    padding: 24px 18px 28px;
    background-size: 100% 100%;
  }

  .manuscript-tabs {
    margin: 4px 6px 0;
  }

  .manuscript-tabs button {
    min-height: 56px;
    font-size: 11px;
  }

  .manuscript-scroll {
    margin: 6px 8px;
    padding: 18px 14px 24px;
  }

  .influence-grid {
    grid-template-columns: 1fr;
  }

  .influence-grid article + article {
    border-top: 1px solid rgba(93, 61, 28, 0.16);
    border-left: 0;
  }

  .lead-block h1 {
    font-size: clamp(28px, 9vw, 36px);
  }

  .mobile-nav {
    position: fixed;
    z-index: 30;
    right: 0;
    bottom: 0;
    left: 0;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    border-top: 1px solid rgba(185, 138, 75, 0.38);
    background: rgba(8, 7, 6, 0.94);
    backdrop-filter: blur(16px);
  }

  .mobile-nav button,
  .mobile-nav a {
    display: grid;
    gap: 4px;
    min-height: 66px;
    place-items: center;
    border: 0;
    color: rgba(224, 189, 120, 0.62);
    background: transparent;
    text-decoration: none;
    font: 700 11px/1 var(--font-ui);
  }

  .mobile-nav span {
    font-size: 22px;
  }

  .mobile-nav .active {
    color: #f4d99a;
  }
}

@media (max-width: 520px) {
  .setup-card {
    gap: 12px;
    padding: 14px;
  }

  .spread-buttons {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .spread-buttons button {
    grid-template-columns: 1fr;
    min-height: 44px;
    padding: 8px;
  }

  .spread-buttons strong {
    display: -webkit-box;
    overflow: hidden;
    font-size: 12px;
    line-height: 1.15;
    white-space: normal;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .slot-token strong {
    max-width: 72px;
    font-size: 10px;
  }

  .reveal-dock {
    flex-direction: column;
  }
}
</style>
