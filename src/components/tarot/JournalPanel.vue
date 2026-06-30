<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { deleteReading, loadReadings } from "@/lib/storage";
import { readingToMarkdown } from "@/lib/promptBuilder";
import { text } from "@/lib/locale";
import type { Locale, ReadingSession } from "@/lib/types";

const props = defineProps<{
  locale: Locale;
  refreshKey: number;
}>();

const readings = ref<ReadingSession[]>([]);

function refresh() {
  readings.value = loadReadings();
}

function remove(id: string) {
  deleteReading(id);
  refresh();
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

function exportJson() {
  download("arcana-mirror-journal.json", JSON.stringify(readings.value, null, 2), "application/json;charset=utf-8");
}

function exportMarkdown() {
  const markdown = readings.value.map((session) => readingToMarkdown(session, props.locale)).join("\n\n---\n\n");
  download("arcana-mirror-journal.md", markdown, "text/markdown;charset=utf-8");
}

onMounted(refresh);
watch(() => props.refreshKey, refresh);
</script>

<template>
  <section id="journal" class="journal-panel">
    <div class="journal-heading">
      <h2>{{ locale === "zh-CN" ? "日志" : "Journal" }}</h2>
      <div v-if="readings.length" class="journal-actions">
        <button type="button" @click="exportJson">JSON</button>
        <button type="button" @click="exportMarkdown">Markdown</button>
      </div>
    </div>

    <p v-if="!readings.length" class="empty">{{ locale === "zh-CN" ? "保存的抽牌会显示在这里。" : "Saved readings will appear here." }}</p>

    <div v-else class="journal-list">
      <article v-for="session in readings" :key="session.id" class="journal-item">
        <div>
          <span>{{ new Date(session.createdAt).toLocaleString(locale) }}</span>
          <h3>{{ text(session.spreadName, locale) }}</h3>
          <p>{{ session.question || (locale === "zh-CN" ? "未命名牌阵" : "Untitled reading") }}</p>
        </div>
        <button type="button" @click="remove(session.id)">
          {{ locale === "zh-CN" ? "删除" : "Delete" }}
        </button>
      </article>
    </div>
  </section>
</template>

<style scoped>
.journal-panel {
  display: grid;
  gap: 18px;
  border-top: 1px solid rgba(239, 226, 199, 0.14);
  padding-top: 34px;
}

.journal-heading {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
}

h2,
h3,
p {
  margin: 0;
}

h2 {
  color: #f8f0de;
  font: 650 clamp(30px, 4vw, 46px) / 1 var(--font-display);
}

.journal-actions {
  display: flex;
  gap: 8px;
}

button {
  min-height: 36px;
  border: 1px solid rgba(239, 226, 199, 0.18);
  padding: 0 12px;
  color: #f8f0de;
  background: rgba(239, 226, 199, 0.06);
  font: 750 12px/1 var(--font-ui);
  cursor: pointer;
}

.empty {
  color: rgba(248, 240, 222, 0.58);
  font: 500 14px/1.5 var(--font-ui);
}

.journal-list {
  display: grid;
  gap: 10px;
}

.journal-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: center;
  border: 1px solid rgba(239, 226, 199, 0.12);
  padding: 16px;
  background: rgba(239, 226, 199, 0.045);
}

.journal-item span {
  display: block;
  margin-bottom: 6px;
  color: rgba(216, 179, 111, 0.8);
  font: 700 11px/1 var(--font-ui);
}

h3 {
  color: #f8f0de;
  font: 650 22px/1 var(--font-display);
}

.journal-item p {
  margin-top: 7px;
  color: rgba(248, 240, 222, 0.6);
  font: 500 13px/1.4 var(--font-ui);
}
</style>
