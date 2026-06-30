import { buildReadingInsight } from "./interpretation";
import { list, text } from "./locale";
import type { Locale, ReadingSession } from "./types";

export interface AiReadingPayload {
  version: 1;
  sessionId: string;
  locale: Locale;
  question: string;
  spreadId: string;
  spreadName: string;
  cards: Array<{
    cardId: string;
    cardName: string;
    positionId: string;
    positionName: string;
    orientation: "upright" | "reversed";
    keywords: string[];
    meaning: string;
    advice: string;
    shadow: string;
    reflection: string;
  }>;
  localInsight: {
    title: string;
    overview: string;
    pattern: string;
    nextStep: string;
    questions: string[];
  };
}

export interface AiReadingResponse {
  id: string;
  createdAt: string;
  model: string;
  response: string;
  remaining?: number;
}

export function getAiReadingEndpoint() {
  return import.meta.env.PUBLIC_TAROT_AI_ENDPOINT?.trim() ?? "";
}

export function buildAiReadingPayload(session: ReadingSession, locale: Locale): AiReadingPayload {
  const insight = buildReadingInsight(session, locale);

  return {
    version: 1,
    sessionId: session.id,
    locale,
    question: session.question,
    spreadId: session.spreadId,
    spreadName: text(session.spreadName, locale),
    cards: session.cards.map((drawn) => ({
      cardId: drawn.card.id,
      cardName: text(drawn.card.name, locale),
      positionId: drawn.position.id,
      positionName: text(drawn.position.name, locale),
      orientation: drawn.orientation,
      keywords: list(drawn.card.keywords[drawn.orientation], locale),
      meaning: text(drawn.card.meaning[drawn.orientation], locale),
      advice: text(drawn.card.advice, locale),
      shadow: text(drawn.card.shadow, locale),
      reflection: list(drawn.card.reflection, locale)[0] ?? ""
    })),
    localInsight: {
      title: insight.title,
      overview: insight.overview,
      pattern: insight.pattern,
      nextStep: insight.nextStep,
      questions: insight.questions
    }
  };
}

export async function requestAiReading(session: ReadingSession, locale: Locale): Promise<AiReadingResponse> {
  const endpoint = getAiReadingEndpoint();

  if (!endpoint) {
    throw new Error("AI reading endpoint is not configured.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(buildAiReadingPayload(session, locale))
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const fallback = response.status === 429 ? "Daily AI reading limit reached." : "AI reading failed.";
    throw new Error(typeof data?.message === "string" ? data.message : typeof data?.error === "string" ? data.error : fallback);
  }

  if (typeof data?.response !== "string") {
    throw new Error("AI reading returned an invalid response.");
  }

  return {
    id: String(data.id ?? ""),
    createdAt: String(data.createdAt ?? new Date().toISOString()),
    model: String(data.model ?? ""),
    response: data.response,
    remaining: typeof data.remaining === "number" ? data.remaining : undefined
  };
}
