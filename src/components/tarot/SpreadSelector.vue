<script setup lang="ts">
import type { Locale, Spread } from "@/lib/types";
import { text } from "@/lib/locale";

defineProps<{
  spreads: Spread[];
  selected: Spread["id"];
  locale: Locale;
}>();

const emit = defineEmits<{
  "update:selected": [id: Spread["id"]];
}>();
</script>

<template>
  <div class="spread-list">
    <button
      v-for="spread in spreads"
      :key="spread.id"
      :class="{ active: selected === spread.id }"
      type="button"
      @click="emit('update:selected', spread.id)"
    >
      <span>{{ text(spread.name, locale) }}</span>
      <small>{{ spread.positions.length }} {{ locale === "zh-CN" ? "张牌" : "cards" }}</small>
    </button>
  </div>
</template>

<style scoped>
.spread-list {
  display: grid;
  gap: 10px;
}

button {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: center;
  min-height: 56px;
  border: 1px solid rgba(239, 226, 199, 0.18);
  padding: 14px 16px;
  color: rgba(248, 240, 222, 0.78);
  background: rgba(239, 226, 199, 0.055);
  text-align: left;
  font: 600 14px/1.25 var(--font-ui);
  letter-spacing: 0;
  cursor: pointer;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    color 160ms ease;
}

button:hover,
button.active {
  border-color: rgba(216, 179, 111, 0.72);
  color: #f8f0de;
  background: rgba(216, 179, 111, 0.13);
}

small {
  color: rgba(216, 179, 111, 0.78);
  font: 600 12px/1 var(--font-ui);
}
</style>
