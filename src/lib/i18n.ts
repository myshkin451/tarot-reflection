import en from "@/locales/en.json";
import zh from "@/locales/zh-CN.json";
import type { Locale } from "./types";

const dictionaries = {
  en,
  "zh-CN": zh
} as const;

export function t(locale: Locale, key: string): string {
  const parts = key.split(".");
  let current: unknown = dictionaries[locale];

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }

  return typeof current === "string" ? current : key;
}
