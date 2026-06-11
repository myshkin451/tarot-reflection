<script setup lang="ts">
import { computed, ref } from "vue";
import { buildPrompt } from "@/lib/promptBuilder";
import type { Depth, Locale, ReadingSession } from "@/lib/types";

const props = defineProps<{
  session: ReadingSession;
  locale: Locale;
}>();

const depth = ref<Depth>("deep");
const tone = ref<"calm" | "practical" | "gentle">("calm");
const copied = ref(false);

const prompt = computed(() =>
  buildPrompt(props.session, {
    locale: props.locale,
    depth: depth.value,
    outputLanguage: props.locale === "zh-CN" ? "Simplified Chinese" : "English",
    tone: tone.value
  })
);

async function copyPrompt() {
  await navigator.clipboard.writeText(prompt.value);
  copied.value = true;
  window.setTimeout(() => {
    copied.value = false;
  }, 1400);
}

function downloadPrompt() {
  const blob = new Blob([prompt.value], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `arcana-mirror-prompt-${props.session.id}.md`;
  link.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <section class="prompt-builder" aria-labelledby="prompt-heading">
    <div class="prompt-toolbar">
      <h2 id="prompt-heading">{{ locale === "zh-CN" ? "AI 提示词生成器" : "AI Prompt Builder" }}</h2>
      <div class="prompt-actions">
        <button type="button" @click="depth = depth === 'deep' ? 'compact' : 'deep'">
          {{ depth === "deep" ? (locale === "zh-CN" ? "深度版" : "Deep") : (locale === "zh-CN" ? "紧凑版" : "Compact") }}
        </button>
        <button type="button" @click="copyPrompt">
          {{ copied ? (locale === "zh-CN" ? "已复制" : "Copied") : (locale === "zh-CN" ? "复制" : "Copy") }}
        </button>
        <button type="button" @click="downloadPrompt">
          {{ locale === "zh-CN" ? "下载" : "Download" }}
        </button>
      </div>
    </div>
    <label>
      <span>{{ locale === "zh-CN" ? "语气" : "Tone" }}</span>
      <select v-model="tone">
        <option value="calm">{{ locale === "zh-CN" ? "克制反思" : "Calm reflective" }}</option>
        <option value="practical">{{ locale === "zh-CN" ? "务实行动" : "Practical" }}</option>
        <option value="gentle">{{ locale === "zh-CN" ? "温和细腻" : "Gentle" }}</option>
      </select>
    </label>
    <textarea :value="prompt" readonly />
  </section>
</template>

<style scoped>
.prompt-builder {
  display: grid;
  gap: 14px;
  border-top: 1px solid rgba(20, 16, 12, 0.16);
  padding-top: 22px;
}

.prompt-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

h2 {
  margin: 0;
  color: #20180f;
  font: 650 26px/1.1 var(--font-display);
  letter-spacing: 0;
}

.prompt-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

button,
select {
  min-height: 36px;
  border: 1px solid rgba(32, 24, 15, 0.18);
  padding: 0 12px;
  color: #20180f;
  background: rgba(255, 255, 255, 0.34);
  font: 700 12px/1 var(--font-ui);
  letter-spacing: 0;
}

button {
  cursor: pointer;
}

label {
  display: grid;
  max-width: 260px;
  gap: 7px;
  color: rgba(32, 24, 15, 0.7);
  font: 700 12px/1 var(--font-ui);
}

textarea {
  width: 100%;
  min-height: 300px;
  resize: vertical;
  border: 1px solid rgba(32, 24, 15, 0.16);
  padding: 16px;
  color: #20180f;
  background: rgba(255, 255, 255, 0.42);
  font: 500 13px/1.65 var(--font-ui);
  letter-spacing: 0;
}
</style>
