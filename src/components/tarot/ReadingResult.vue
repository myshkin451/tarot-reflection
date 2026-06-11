<script setup lang="ts">
import CardFace from "./CardFace.vue";
import PromptBuilder from "./PromptBuilder.vue";
import { list, text } from "@/lib/locale";
import { readingToMarkdown } from "@/lib/promptBuilder";
import type { Locale, ReadingSession } from "@/lib/types";

const props = defineProps<{
  session: ReadingSession;
  locale: Locale;
  saved: boolean;
}>();

const emit = defineEmits<{
  save: [];
}>();

function exportMarkdown() {
  const blob = new Blob([readingToMarkdown(props.session, props.locale)], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `arcana-mirror-reading-${props.session.id}.md`;
  link.click();
  URL.revokeObjectURL(url);
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
        v-for="drawn in session.cards"
        :key="`${drawn.position.id}-${drawn.card.id}`"
        :card="drawn.card"
        :locale="locale"
        :orientation="drawn.orientation"
        :position="text(drawn.position.name, locale)"
      />
    </div>

    <div class="interpretations">
      <article v-for="drawn in session.cards" :key="drawn.card.id" class="interpretation">
        <div>
          <span>{{ text(drawn.position.name, locale) }}</span>
          <h3>{{ text(drawn.card.name, locale) }}</h3>
        </div>
        <p class="meaning">{{ text(drawn.card.meaning[drawn.orientation], locale) }}</p>
        <p>{{ text(drawn.position.prompt, locale) }}</p>
        <div class="keywords">
          <span v-for="keyword in list(drawn.card.keywords[drawn.orientation], locale)" :key="keyword">{{ keyword }}</span>
        </div>
        <p class="reflection">{{ list(drawn.card.reflection, locale)[0] }}</p>
      </article>
    </div>

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

@media (max-width: 700px) {
  .result-heading {
    display: grid;
  }
}
</style>
