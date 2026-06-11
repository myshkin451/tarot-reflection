import type { Locale, LocalizedList, LocalizedText } from "./types";

export function languageKey(locale: Locale): "en" | "zh" {
  return locale === "zh-CN" ? "zh" : "en";
}

export function text(value: LocalizedText, locale: Locale): string {
  return value[languageKey(locale)];
}

export function list(value: LocalizedList, locale: Locale): string[] {
  return value[languageKey(locale)];
}
