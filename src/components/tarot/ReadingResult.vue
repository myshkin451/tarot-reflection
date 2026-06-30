<script setup lang="ts">
import { computed, ref } from "vue";
import CardFace from "./CardFace.vue";
import PromptBuilder from "./PromptBuilder.vue";
import { AiReadingRequestError, getAiReadingEndpoint, requestAiReading, requestAiReadingStream } from "@/lib/aiReading";
import { buildReadingInsight } from "@/lib/interpretation";
import { text } from "@/lib/locale";
import { renderSafeMarkdown } from "@/lib/markdown";
import { readingToMarkdown } from "@/lib/promptBuilder";
import type { Locale, ReadingSession } from "@/lib/types";

const props = defineProps<{
  session: ReadingSession;
  locale: Locale;
  saved: boolean;
}>();

const emit = defineEmits<{
  save: [];
  aiResponse: [response: string];
}>();

const insight = computed(() => buildReadingInsight(props.session, props.locale));
const aiEnabled = Boolean(getAiReadingEndpoint());
const aiLoading = ref(false);
const aiResponse = ref(props.session.aiResponse ?? "");
const aiError = ref("");
const aiRemaining = ref<number | undefined>(undefined);
const aiResponseHtml = computed(() => renderSafeMarkdown(aiResponse.value));

function exportMarkdown() {
  const blob = new Blob([readingToMarkdown(props.session, props.locale)], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `arcana-mirror-reading-${props.session.id}.md`;
  link.click();
  URL.revokeObjectURL(url);
}

async function generateAiReading() {
  if (!aiEnabled || aiLoading.value) {
    return;
  }

  aiLoading.value = true;
  aiError.value = "";
  aiResponse.value = "";

  try {
    const result = await requestAiReadingStream(props.session, props.locale, {
      onMeta(meta) {
        aiRemaining.value = meta.remaining;
      },
      onDelta(text) {
        aiResponse.value += text;
      }
    }).catch((error) => {
      if (error instanceof AiReadingRequestError && (error.status === 404 || error.status === 405)) {
        return requestAiReading(props.session, props.locale);
      }

      throw error;
    });

    aiResponse.value = result.response;
    aiRemaining.value = result.remaining;
    emit("aiResponse", result.response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const limited = message.includes("limit") || message.includes("次数") || message.includes("429");

    aiError.value = limited
      ? props.locale === "zh-CN"
        ? "今天的生成次数已经用完了。可以先看牌面初读，明天再继续。"
        : "The daily reading limit has been reached. Use the card reading for now and try again tomorrow."
      : props.locale === "zh-CN"
        ? "这次没有生成成功。可以稍后再试，或先使用下面的提示词。"
        : "This reading could not be generated. Try again later, or use the prompt below.";
  } finally {
    aiLoading.value = false;
  }
}
</script>

<template>
  <section class="result-panel" aria-live="polite">
    <div class="result-chamber">
      <div class="spread-table" :class="`count-${session.cards.length}`">
        <div class="spread-meta">
          <p>{{ new Date(session.createdAt).toLocaleString(locale) }}</p>
          <h2>{{ text(session.spreadName, locale) }}</h2>
          <p v-if="session.question" class="question">“{{ session.question }}”</p>
        </div>

        <div class="drawn-constellation" :class="`count-${session.cards.length}`">
          <article
            v-for="(drawn, index) in session.cards"
            :key="`${drawn.position.id}-${drawn.card.id}`"
            class="drawn-card"
            :style="{ '--card-index': index, '--card-count': session.cards.length }"
          >
            <CardFace
              :card="drawn.card"
              :locale="locale"
              :orientation="drawn.orientation"
              :position="text(drawn.position.name, locale)"
              reveal
              :reveal-index="index"
            />
            <div class="card-caption">
              <span>{{ text(drawn.position.name, locale) }}</span>
              <strong>{{ text(drawn.card.name, locale) }}</strong>
            </div>
          </article>
        </div>
      </div>

      <aside class="reading-sheet" aria-labelledby="insight-title">
        <div class="result-actions">
          <button type="button" @click="emit('save')">
            {{ saved ? (locale === "zh-CN" ? "已保存" : "Saved") : (locale === "zh-CN" ? "保存" : "Save") }}
          </button>
          <button type="button" @click="exportMarkdown">
            {{ locale === "zh-CN" ? "导出" : "Export" }}
          </button>
        </div>

        <section class="reading-insight">
          <div class="insight-lead">
            <span>{{ insight.label }}</span>
            <h3 id="insight-title">{{ insight.title }}</h3>
            <p>{{ insight.overview }}</p>
          </div>
          <div class="insight-grid">
            <div>
              <span>{{ locale === "zh-CN" ? "牌面结构" : "Pattern" }}</span>
              <p>{{ insight.pattern }}</p>
            </div>
            <div>
              <span>{{ locale === "zh-CN" ? "落点" : "Landing point" }}</span>
              <p>{{ insight.nextStep }}</p>
            </div>
          </div>
        </section>
      </aside>
    </div>

    <section class="interpretation-ledger" :class="`count-${session.cards.length}`">
      <article v-for="note in insight.cardNotes" :key="`${note.drawn.position.id}-${note.drawn.card.id}`" class="interpretation">
        <div>
          <span>{{ note.positionName }} · {{ note.orientationLabel }}</span>
          <h3>{{ note.cardName }}</h3>
        </div>
        <p class="meaning">{{ note.meaning }}</p>
        <p>{{ note.positionRead }}</p>
        <p class="advice">{{ locale === "zh-CN" ? "建议：" : "Advice: " }}{{ note.advice }}</p>
        <div class="keywords">
          <span v-for="keyword in note.keywords" :key="keyword">{{ keyword }}</span>
        </div>
        <p class="shadow">{{ locale === "zh-CN" ? "需要留意：" : "Watch for: " }}{{ note.shadow }}</p>
      </article>
    </section>

    <section v-if="aiEnabled || aiResponse || aiError" class="ai-reading" aria-labelledby="ai-reading-title">
      <div class="ai-reading-heading">
        <div>
          <span>{{ locale === "zh-CN" ? "AI 解读" : "AI reading" }}</span>
          <h3 id="ai-reading-title">{{ locale === "zh-CN" ? "看这组牌更深的一层" : "Read the deeper layer" }}</h3>
        </div>
        <button type="button" :disabled="aiLoading" @click="generateAiReading">
          {{
            aiLoading
              ? locale === "zh-CN"
                ? "生成中"
                : "Generating"
              : aiResponse
                ? locale === "zh-CN"
                  ? "重新生成"
                  : "Regenerate"
                : locale === "zh-CN"
                  ? "生成解读"
                  : "Generate reading"
          }}
        </button>
      </div>

      <p v-if="typeof aiRemaining === 'number'" class="ai-reading-meta">
        {{ locale === "zh-CN" ? `今天还可生成 ${aiRemaining} 次` : `${aiRemaining} AI readings left today` }}
      </p>

      <div v-if="aiResponse" class="ai-reading-body" v-html="aiResponseHtml" />
      <p v-else-if="aiError" class="ai-reading-error">{{ aiError }}</p>
      <p v-else class="ai-reading-empty">
        {{ locale === "zh-CN" ? "根据当前问题和牌面生成一段完整读牌。" : "Generate a fuller reading from the current question and spread." }}
      </p>
    </section>

    <div class="prompt-dock">
      <PromptBuilder :session="session" :locale="locale" />
    </div>
  </section>
</template>

<style scoped>
.result-panel {
  display: grid;
  gap: clamp(22px, 3vw, 34px);
  scroll-margin-top: 100px;
  color: #f8f0de;
}

.result-chamber {
  display: grid;
  grid-template-columns: minmax(0, 1.28fr) minmax(330px, 0.72fr);
  gap: clamp(18px, 2.4vw, 28px);
  align-items: start;
}

.spread-table,
.reading-sheet,
.ai-reading,
.prompt-dock {
  border: 1px solid rgba(216, 179, 111, 0.18);
  box-shadow: 0 34px 90px rgba(0, 0, 0, 0.28);
}

.spread-table {
  position: sticky;
  top: 84px;
  overflow: hidden;
  min-height: clamp(560px, 66vw, 760px);
  padding: clamp(20px, 3vw, 34px);
  background:
    radial-gradient(circle at 50% 48%, rgba(216, 179, 111, 0.12), transparent 30%),
    radial-gradient(circle at 20% 80%, rgba(111, 136, 150, 0.14), transparent 34%),
    linear-gradient(90deg, rgba(248, 240, 222, 0.036) 1px, transparent 1px),
    linear-gradient(180deg, rgba(248, 240, 222, 0.028) 1px, transparent 1px),
    #0d0d0f;
  background-size:
    auto,
    auto,
    48px 48px,
    48px 48px,
    auto;
}

.spread-table::before,
.spread-table::after {
  position: absolute;
  content: "";
  pointer-events: none;
}

.spread-table::before {
  inset: 14%;
  border: 1px solid rgba(216, 179, 111, 0.18);
  border-radius: 50%;
  background:
    radial-gradient(circle, transparent 45%, rgba(216, 179, 111, 0.08) 46%, transparent 47%),
    radial-gradient(circle, transparent 66%, rgba(216, 179, 111, 0.08) 67%, transparent 68%);
}

.spread-table::after {
  inset: 0;
  background:
    linear-gradient(180deg, rgba(248, 240, 222, 0.07), transparent 17%, transparent 78%, rgba(0, 0, 0, 0.36)),
    radial-gradient(circle at 50% 42%, transparent 0 43%, rgba(216, 179, 111, 0.08) 43.4%, transparent 44%);
  opacity: 0.84;
}

.spread-meta,
.drawn-constellation {
  position: relative;
  z-index: 1;
}

.spread-meta {
  display: flex;
  gap: 14px;
  align-items: end;
  justify-content: space-between;
  border-bottom: 1px solid rgba(216, 179, 111, 0.16);
  padding-bottom: 18px;
}

.spread-meta p {
  margin: 0 0 8px;
  color: rgba(216, 179, 111, 0.72);
  font: 650 12px/1 var(--font-ui);
}

.spread-meta .question {
  max-width: 320px;
  margin: 0;
  color: rgba(248, 240, 222, 0.68);
  font: 500 14px/1.5 var(--font-ui);
  text-align: right;
}

h2,
h3 {
  margin: 0;
  letter-spacing: 0;
}

h2 {
  color: #f8f0de;
  font: 700 clamp(30px, 4vw, 48px) / 0.98 var(--font-display);
}

h3 {
  font: 700 24px/1.05 var(--font-display);
}

.drawn-constellation {
  display: grid;
  gap: clamp(14px, 2vw, 20px);
  align-items: center;
  min-height: clamp(430px, 54vw, 610px);
  padding-top: clamp(24px, 4vw, 48px);
}

.drawn-constellation.count-1 {
  grid-template-columns: minmax(230px, 330px);
  justify-content: center;
}

.drawn-constellation.count-3 {
  grid-template-columns: repeat(3, minmax(150px, 1fr));
}

.drawn-constellation.count-5 {
  grid-template-columns: repeat(5, minmax(112px, 1fr));
}

.drawn-card {
  --card-index: 0;
  --card-count: 1;
  display: grid;
  gap: 12px;
  align-self: center;
  animation: card-settle 720ms cubic-bezier(0.18, 0.85, 0.18, 1) both;
  animation-delay: calc(var(--card-index) * 95ms);
}

.drawn-card:nth-child(even) {
  transform: translateY(28px);
}

.drawn-card :deep(.tarot-card) {
  min-height: 0;
  filter: drop-shadow(0 30px 34px rgba(0, 0, 0, 0.42));
}

.drawn-card :deep(.card-frame) {
  box-shadow:
    0 1px 0 rgba(248, 240, 222, 0.2),
    0 28px 70px rgba(0, 0, 0, 0.48);
}

.card-caption {
  display: grid;
  gap: 4px;
  text-align: center;
}

.card-caption span {
  color: rgba(216, 179, 111, 0.74);
  font: 800 10px/1 var(--font-ui);
  text-transform: uppercase;
}

.card-caption strong {
  color: rgba(248, 240, 222, 0.9);
  font: 650 18px/1 var(--font-display);
}

.reading-sheet,
.prompt-dock {
  color: #20180f;
  background:
    linear-gradient(110deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0.1)),
    radial-gradient(circle at 15% 10%, rgba(255, 255, 255, 0.24), transparent 28%),
    #efe2c7;
}

.reading-sheet {
  display: grid;
  gap: 22px;
  padding: clamp(20px, 3vw, 28px);
}

.result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: end;
}

button {
  min-height: 38px;
  border: 1px solid rgba(32, 24, 15, 0.18);
  padding: 0 14px;
  color: #20180f;
  background: rgba(255, 255, 255, 0.32);
  font: 750 12px/1 var(--font-ui);
  cursor: pointer;
}

.reading-insight {
  display: grid;
  gap: 20px;
}

.insight-lead {
  display: grid;
  gap: 10px;
  max-width: 880px;
}

.insight-lead > span,
.insight-grid span {
  color: rgba(151, 89, 52, 0.82);
  font: 850 11px/1 var(--font-ui);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.insight-lead p,
.insight-grid p {
  margin: 0;
  color: rgba(32, 24, 15, 0.76);
  font: 500 15px/1.62 var(--font-ui);
}

.insight-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  background: rgba(32, 24, 15, 0.12);
}

.insight-grid > div {
  display: grid;
  gap: 9px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.25);
}

.interpretation-ledger {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1px;
  overflow: hidden;
  border: 1px solid rgba(216, 179, 111, 0.16);
  background: rgba(216, 179, 111, 0.16);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.2);
}

.interpretation {
  display: grid;
  gap: 12px;
  align-content: start;
  padding: clamp(18px, 2.3vw, 24px);
  color: #20180f;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.27), rgba(255, 255, 255, 0.08)),
    #efe2c7;
}

.interpretation span {
  display: block;
  margin-bottom: 6px;
  color: rgba(32, 24, 15, 0.58);
  font: 800 11px/1 var(--font-ui);
  text-transform: uppercase;
}

.interpretation p {
  margin: 0;
  color: rgba(32, 24, 15, 0.72);
  font: 500 14px/1.55 var(--font-ui);
}

.interpretation .meaning {
  color: #20180f;
  font-weight: 650;
}

.interpretation .advice {
  color: rgba(32, 24, 15, 0.84);
  font-weight: 650;
}

.interpretation .shadow {
  color: rgba(83, 49, 31, 0.76);
}

.keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keywords span {
  margin: 0;
  border: 1px solid rgba(32, 24, 15, 0.14);
  padding: 7px 9px;
  color: rgba(32, 24, 15, 0.74);
  font: 700 12px/1 var(--font-ui);
  text-transform: none;
}

.ai-reading {
  display: grid;
  gap: 16px;
  padding: clamp(18px, 3vw, 24px);
  color: #20180f;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.28), rgba(151, 89, 52, 0.08)),
    #efe2c7;
}

.ai-reading-heading {
  display: flex;
  gap: 14px;
  align-items: start;
  justify-content: space-between;
}

.ai-reading-heading span {
  display: block;
  margin-bottom: 8px;
  color: rgba(151, 89, 52, 0.82);
  font: 850 11px/1 var(--font-ui);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.ai-reading-heading button {
  flex: 0 0 auto;
  border-color: rgba(151, 89, 52, 0.32);
  color: #f8f0de;
  background: #20180f;
}

.ai-reading-heading button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.ai-reading-meta,
.ai-reading-empty,
.ai-reading-error {
  margin: 0;
  color: rgba(32, 24, 15, 0.68);
  font: 600 13px/1.5 var(--font-ui);
}

.ai-reading-error {
  color: #7d2c1f;
}

.ai-reading-body {
  display: grid;
  gap: 12px;
  color: rgba(32, 24, 15, 0.82);
  font: 500 15px/1.72 var(--font-ui);
}

.ai-reading-body :deep(h2),
.ai-reading-body :deep(h3),
.ai-reading-body :deep(h4) {
  margin: 8px 0 0;
  color: #20180f;
  font-family: var(--font-display);
  letter-spacing: 0;
}

.ai-reading-body :deep(h2) {
  font-size: 24px;
  line-height: 1.12;
}

.ai-reading-body :deep(h3),
.ai-reading-body :deep(h4) {
  font-size: 19px;
  line-height: 1.18;
}

.ai-reading-body :deep(p),
.ai-reading-body :deep(ul),
.ai-reading-body :deep(ol) {
  margin: 0;
}

.ai-reading-body :deep(ul),
.ai-reading-body :deep(ol) {
  display: grid;
  gap: 8px;
  padding-left: 20px;
}

.ai-reading-body :deep(strong) {
  color: #20180f;
  font-weight: 800;
}

.prompt-dock {
  padding: clamp(18px, 3vw, 24px);
}

@keyframes card-settle {
  from {
    opacity: 0;
    transform: translateY(42px) rotateX(14deg) scale(0.96);
  }

  to {
    opacity: 1;
    transform: translateY(0) rotateX(0deg) scale(1);
  }
}

@media (max-width: 900px) {
  .result-chamber,
  .spread-meta {
    grid-template-columns: 1fr;
  }

  .result-chamber,
  .spread-meta,
  .ai-reading-heading {
    display: grid;
  }

  .spread-table {
    position: relative;
    top: auto;
    min-height: auto;
  }

  .spread-meta .question {
    max-width: none;
    text-align: left;
  }

  .drawn-constellation,
  .drawn-constellation.count-3,
  .drawn-constellation.count-5 {
    grid-template-columns: repeat(auto-fit, minmax(136px, 1fr));
    min-height: auto;
  }

  .drawn-card:nth-child(even) {
    transform: none;
  }

  .insight-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .drawn-card {
    animation: none;
  }
}
</style>
