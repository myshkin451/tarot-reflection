<script setup lang="ts">
import { computed, ref } from "vue";
import CardFace from "./CardFace.vue";
import PromptBuilder from "./PromptBuilder.vue";
import { getAiReadingEndpoint, requestAiReading } from "@/lib/aiReading";
import { buildReadingInsight } from "@/lib/interpretation";
import { text } from "@/lib/locale";
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

  try {
    const result = await requestAiReading(props.session, props.locale);
    aiResponse.value = result.response;
    aiRemaining.value = result.remaining;
    emit("aiResponse", result.response);
  } catch {
    aiError.value =
      props.locale === "zh-CN"
        ? "这次没有生成成功。可以稍后再试，或先使用下面的提示词。"
        : "This reading could not be generated. Try again later, or use the prompt below.";
  } finally {
    aiLoading.value = false;
  }
}
</script>

<template>
  <section class="result-panel" aria-live="polite">
    <div class="result-heading">
      <div>
        <p>{{ new Date(session.createdAt).toLocaleString(locale) }}</p>
        <h2>{{ text(session.spreadName, locale) }}</h2>
      </div>
      <div class="result-actions">
        <button type="button" @click="emit('save')">
          {{ saved ? (locale === "zh-CN" ? "已保存" : "Saved") : (locale === "zh-CN" ? "保存" : "Save") }}
        </button>
        <button type="button" @click="exportMarkdown">
          {{ locale === "zh-CN" ? "导出" : "Export" }}
        </button>
      </div>
    </div>

    <p v-if="session.question" class="question">“{{ session.question }}”</p>

    <div class="drawn-grid" :class="`count-${session.cards.length}`">
      <CardFace
        v-for="(drawn, index) in session.cards"
        :key="`${drawn.position.id}-${drawn.card.id}`"
        :card="drawn.card"
        :locale="locale"
        :orientation="drawn.orientation"
        :position="text(drawn.position.name, locale)"
        reveal
        :reveal-index="index"
      />
    </div>

    <section class="reading-insight" aria-labelledby="insight-title">
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
          <span>{{ locale === "zh-CN" ? "下一步" : "Next step" }}</span>
          <p>{{ insight.nextStep }}</p>
        </div>
      </div>
      <div class="question-list">
        <span>{{ locale === "zh-CN" ? "继续书写" : "Journal with" }}</span>
        <ol>
          <li v-for="question in insight.questions" :key="question">{{ question }}</li>
        </ol>
      </div>
    </section>

    <div class="interpretations">
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
        <p class="reflection">{{ note.reflection }}</p>
      </article>
    </div>

    <section v-if="aiEnabled || aiResponse || aiError" class="ai-reading" aria-labelledby="ai-reading-title">
      <div class="ai-reading-heading">
        <div>
          <span>{{ locale === "zh-CN" ? "AI 解读" : "AI reading" }}</span>
          <h3 id="ai-reading-title">{{ locale === "zh-CN" ? "继续深入看这组牌" : "Go deeper with this spread" }}</h3>
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
                  ? "生成 AI 解读"
                  : "Generate reading"
          }}
        </button>
      </div>

      <p v-if="typeof aiRemaining === 'number'" class="ai-reading-meta">
        {{ locale === "zh-CN" ? `今天还可生成 ${aiRemaining} 次` : `${aiRemaining} AI readings left today` }}
      </p>

      <div v-if="aiResponse" class="ai-reading-body">
        {{ aiResponse }}
      </div>
      <p v-else-if="aiError" class="ai-reading-error">{{ aiError }}</p>
      <p v-else class="ai-reading-empty">
        {{ locale === "zh-CN" ? "用当前问题、牌面和本地初步解读生成一段更完整的解释。" : "Use the question, cards, and local first-pass reading to generate a fuller interpretation." }}
      </p>
    </section>

    <PromptBuilder :session="session" :locale="locale" />
  </section>
</template>

<style scoped>
.result-panel {
  display: grid;
  gap: 26px;
  padding: clamp(22px, 3vw, 34px);
  color: #20180f;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0.1)),
    #efe2c7;
  box-shadow: 0 34px 90px rgba(0, 0, 0, 0.3);
}

.result-heading {
  display: flex;
  gap: 16px;
  align-items: start;
  justify-content: space-between;
  border-bottom: 1px solid rgba(32, 24, 15, 0.15);
  padding-bottom: 20px;
}

.result-heading p {
  margin: 0 0 8px;
  color: rgba(32, 24, 15, 0.62);
  font: 650 12px/1 var(--font-ui);
}

h2,
h3 {
  margin: 0;
  letter-spacing: 0;
}

h2 {
  font: 700 clamp(30px, 4vw, 48px) / 0.98 var(--font-display);
}

h3 {
  font: 700 24px/1.05 var(--font-display);
}

.result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

.question {
  margin: 0;
  max-width: 720px;
  color: rgba(32, 24, 15, 0.76);
  font: 500 18px/1.5 var(--font-ui);
}

.drawn-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 16px;
}

.drawn-grid.count-1 {
  max-width: 280px;
}

.reading-insight {
  display: grid;
  gap: 20px;
  border-block: 1px solid rgba(32, 24, 15, 0.14);
  padding: 24px 0;
}

.insight-lead {
  display: grid;
  gap: 10px;
  max-width: 880px;
}

.insight-lead > span,
.insight-grid span,
.question-list > span {
  color: rgba(151, 89, 52, 0.82);
  font: 850 11px/1 var(--font-ui);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.insight-lead p,
.insight-grid p,
.question-list li {
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

.question-list {
  display: grid;
  gap: 12px;
}

.question-list ol {
  display: grid;
  gap: 9px;
  margin: 0;
  padding-left: 22px;
}

.interpretations {
  display: grid;
  gap: 14px;
}

.interpretation {
  display: grid;
  gap: 12px;
  border-top: 1px solid rgba(32, 24, 15, 0.13);
  padding-top: 18px;
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

.interpretation .reflection {
  border-left: 2px solid rgba(151, 89, 52, 0.5);
  padding-left: 12px;
  color: rgba(32, 24, 15, 0.82);
}

.ai-reading {
  display: grid;
  gap: 16px;
  border: 1px solid rgba(32, 24, 15, 0.14);
  padding: clamp(18px, 3vw, 24px);
  background:
    linear-gradient(135deg, rgba(32, 24, 15, 0.06), rgba(151, 89, 52, 0.08)),
    rgba(255, 255, 255, 0.22);
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
  white-space: pre-wrap;
  color: rgba(32, 24, 15, 0.82);
  font: 500 15px/1.72 var(--font-ui);
}

@media (max-width: 700px) {
  .result-heading {
    display: grid;
  }

  .ai-reading-heading {
    display: grid;
  }

  .insight-grid {
    grid-template-columns: 1fr;
  }
}
</style>
