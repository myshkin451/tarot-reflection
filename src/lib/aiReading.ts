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

export interface AiReadingStreamHandlers {
  onDelta?: (text: string) => void;
  onMeta?: (meta: Omit<AiReadingResponse, "response">) => void;
  signal?: AbortSignal;
}

export class AiReadingRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AiReadingRequestError";
    this.status = status;
  }
}

export function getAiReadingEndpoint() {
  return import.meta.env.PUBLIC_TAROT_AI_ENDPOINT?.trim() ?? "";
}

export function getAiReadingStreamEndpoint() {
  const endpoint = getAiReadingEndpoint();

  if (!endpoint) {
    return "";
  }

  return endpoint.endsWith("/stream") ? endpoint : `${endpoint.replace(/\/$/, "")}/stream`;
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

export async function requestAiReading(
  session: ReadingSession,
  locale: Locale,
  options: { signal?: AbortSignal } = {}
): Promise<AiReadingResponse> {
  const endpoint = getAiReadingEndpoint();

  if (!endpoint) {
    throw new Error("AI reading endpoint is not configured.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    signal: options.signal,
    body: JSON.stringify(buildAiReadingPayload(session, locale))
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const fallback = response.status === 429 ? "Daily AI reading limit reached." : "AI reading failed.";
    throw new AiReadingRequestError(
      typeof data?.message === "string" ? data.message : typeof data?.error === "string" ? data.error : fallback,
      response.status
    );
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

export async function requestAiReadingStream(
  session: ReadingSession,
  locale: Locale,
  handlers: AiReadingStreamHandlers = {}
): Promise<AiReadingResponse> {
  const endpoint = getAiReadingStreamEndpoint();

  if (!endpoint) {
    throw new Error("AI reading endpoint is not configured.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(buildAiReadingPayload(session, locale)),
    signal: handlers.signal
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const fallback = response.status === 429 ? "Daily AI reading limit reached." : "AI reading failed.";
    throw new AiReadingRequestError(
      typeof data?.message === "string" ? data.message : typeof data?.error === "string" ? data.error : fallback,
      response.status
    );
  }

  if (!response.body) {
    throw new Error("AI reading stream is not available.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const result: AiReadingResponse = {
    id: "",
    createdAt: new Date().toISOString(),
    model: "",
    response: ""
  };
  let buffer = "";
  let streamError = "";

  const handleBlock = (block: string) => {
    const event = parseSseBlock(block);

    if (!event) {
      return;
    }

    if (event.event === "meta") {
      result.id = String(event.data?.id ?? result.id);
      result.createdAt = String(event.data?.createdAt ?? result.createdAt);
      result.model = String(event.data?.model ?? result.model);
      result.remaining = typeof event.data?.remaining === "number" ? event.data.remaining : result.remaining;
      handlers.onMeta?.({
        id: result.id,
        createdAt: result.createdAt,
        model: result.model,
        remaining: result.remaining
      });
      return;
    }

    if (event.event === "delta") {
      const text = typeof event.data?.text === "string" ? event.data.text : "";
      result.response += text;
      handlers.onDelta?.(text);
      return;
    }

    if (event.event === "done") {
      result.id = String(event.data?.id ?? result.id);
      result.createdAt = String(event.data?.createdAt ?? result.createdAt);
      result.model = String(event.data?.model ?? result.model);
      result.remaining = typeof event.data?.remaining === "number" ? event.data.remaining : result.remaining;
      return;
    }

    if (event.event === "error") {
      streamError = typeof event.data?.message === "string" ? event.data.message : "AI reading failed.";
    }
  };

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() ?? "";
    blocks.forEach(handleBlock);
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    handleBlock(buffer);
  }

  if (streamError) {
    throw new Error(streamError);
  }

  if (!result.response.trim()) {
    throw new Error("AI reading returned an invalid response.");
  }

  result.response = result.response.trim();
  return result;
}

function parseSseBlock(block: string) {
  const lines = block.split(/\r?\n/);
  let event = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  try {
    return {
      event,
      data: JSON.parse(dataLines.join("\n"))
    };
  } catch {
    return null;
  }
}
