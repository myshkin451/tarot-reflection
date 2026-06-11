<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { tarotCards } from "@/data/tarotCards";
import { list, text } from "@/lib/locale";
import type { Locale } from "@/lib/types";
import CardFace from "./CardFace.vue";
import LanguageSwitcher from "./LanguageSwitcher.vue";

const locale = ref<Locale>("en");
const query = ref("");
const arcana = ref<"all" | "major" | "minor">("all");

const filteredCards = computed(() => {
  const needle = query.value.trim().toLowerCase();
  return tarotCards.filter((card) => {
    const matchesArcana = arcana.value === "all" || card.arcana === arcana.value;
    const names = `${card.name.en} ${card.name.zh}`.toLowerCase();
    return matchesArcana && (!needle || names.includes(needle));
  });
});

onMounted(() => {
  const stored = localStorage.getItem("arcana-mirror-locale");
  if (stored === "zh-CN" || stored === "en") {
    locale.value = stored;
  }
});
</script>

<template>
  <div class="library-shell">
    <header class="library-header">
      <a href="/" class="brand">Arcana Mirror</a>
      <LanguageSwitcher v-model:locale="locale" />
    </header>

    <main>
      <section class="library-title">
        <h1>{{ locale === "zh-CN" ? "牌义" : "Card Meanings" }}</h1>
        <p>
          {{ locale === "zh-CN" ? "78 张牌的简洁结构化解释，适合抽牌、写作和 AI 提示词生成。" : "Concise structured meanings for all 78 cards, built for readings, journaling, and AI prompts." }}
        </p>
      </section>

      <section class="library-controls">
        <input v-model="query" :placeholder="locale === 'zh-CN' ? '搜索牌名' : 'Search cards'" />
        <div>
          <button :class="{ active: arcana === 'all' }" type="button" @click="arcana = 'all'">
            {{ locale === "zh-CN" ? "全部" : "All" }}
          </button>
          <button :class="{ active: arcana === 'major' }" type="button" @click="arcana = 'major'">
            {{ locale === "zh-CN" ? "大阿尔卡那" : "Major" }}
          </button>
          <button :class="{ active: arcana === 'minor' }" type="button" @click="arcana = 'minor'">
            {{ locale === "zh-CN" ? "小阿尔卡那" : "Minor" }}
          </button>
        </div>
      </section>

      <section class="card-grid">
        <article v-for="card in filteredCards" :key="card.id" class="card-entry">
          <CardFace :card="card" :locale="locale" compact />
          <div class="entry-copy">
            <h2>{{ text(card.name, locale) }}</h2>
            <p>{{ text(card.meaning.upright, locale) }}</p>
            <dl>
              <div>
                <dt>{{ locale === "zh-CN" ? "正位" : "Upright" }}</dt>
                <dd>{{ list(card.keywords.upright, locale).join(" / ") }}</dd>
              </div>
              <div>
                <dt>{{ locale === "zh-CN" ? "逆位" : "Reversed" }}</dt>
                <dd>{{ list(card.keywords.reversed, locale).join(" / ") }}</dd>
              </div>
            </dl>
          </div>
        </article>
      </section>
    </main>
  </div>
</template>

<style scoped>
.library-shell {
  min-height: 100vh;
}

.library-header,
main {
  width: min(1180px, calc(100vw - 32px));
  margin: 0 auto;
}

.library-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
}

.brand {
  color: #f8f0de;
  text-decoration: none;
  font: 700 20px/1 var(--font-display);
}

main {
  display: grid;
  gap: 28px;
  padding: 44px 0 80px;
}

.library-title {
  display: grid;
  gap: 16px;
  max-width: 780px;
}

h1,
h2,
p,
dl,
dd {
  margin: 0;
}

h1 {
  color: #f8f0de;
  font: 650 clamp(58px, 9vw, 118px) / 0.85 var(--font-display);
  letter-spacing: 0;
}

.library-title p {
  color: rgba(248, 240, 222, 0.66);
  font: 500 17px/1.6 var(--font-ui);
}

.library-controls {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) auto;
  gap: 12px;
}

input,
button {
  min-height: 42px;
  border: 1px solid rgba(239, 226, 199, 0.16);
  color: #f8f0de;
  background: rgba(239, 226, 199, 0.055);
  font: 650 13px/1 var(--font-ui);
  letter-spacing: 0;
}

input {
  padding: 0 14px;
}

button {
  padding: 0 12px;
  cursor: pointer;
}

button.active {
  color: #15110c;
  background: #d8b36f;
}

.library-controls div {
  display: flex;
  gap: 8px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}

.card-entry {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 16px;
  border: 1px solid rgba(239, 226, 199, 0.12);
  padding: 14px;
  background: rgba(239, 226, 199, 0.045);
}

.card-entry :deep(.tarot-card) {
  min-height: 178px;
}

.entry-copy {
  display: grid;
  gap: 12px;
  align-content: start;
}

h2 {
  color: #f8f0de;
  font: 650 28px/1 var(--font-display);
}

.entry-copy p,
dd {
  color: rgba(248, 240, 222, 0.64);
  font: 500 13px/1.45 var(--font-ui);
}

dl {
  display: grid;
  gap: 10px;
}

dt {
  margin-bottom: 4px;
  color: rgba(216, 179, 111, 0.86);
  font: 800 11px/1 var(--font-ui);
}

@media (max-width: 720px) {
  .library-controls,
  .card-entry {
    grid-template-columns: 1fr;
  }

  .library-controls div {
    flex-wrap: wrap;
  }

  .card-entry :deep(.tarot-card) {
    max-width: 180px;
  }
}
</style>
