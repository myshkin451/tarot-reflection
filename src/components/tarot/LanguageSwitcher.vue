<script setup lang="ts">
import type { Locale } from "@/lib/types";

defineProps<{
  locale: Locale;
}>();

const emit = defineEmits<{
  "update:locale": [locale: Locale];
}>();
</script>

<template>
  <div class="language-switcher" aria-label="Language">
    <button :class="{ active: locale === 'en' }" type="button" @click="emit('update:locale', 'en')">
      EN
    </button>
    <button :class="{ active: locale === 'zh-CN' }" type="button" @click="emit('update:locale', 'zh-CN')">
      中文
    </button>
  </div>
</template>

<style scoped>
.language-switcher {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border: 1px solid rgba(239, 226, 199, 0.18);
  background: rgba(239, 226, 199, 0.06);
}

button {
  min-width: 46px;
  height: 32px;
  border: 0;
  border-radius: 0;
  color: rgba(248, 240, 222, 0.62);
  background: transparent;
  font: 600 12px/1 var(--font-ui);
  letter-spacing: 0;
  cursor: pointer;
}

button.active {
  color: #14100c;
  background: #d8b36f;
}
</style>
