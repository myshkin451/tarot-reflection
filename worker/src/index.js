const DEFAULT_ALLOWED_ORIGINS = [
  "https://myshkin451.github.io",
  "http://localhost:4321",
  "http://127.0.0.1:4321"
];

const DEFAULT_MODEL = "deepseek-v4-flash";
const DEFAULT_DAILY_LIMIT = 20;
const MAX_BODY_BYTES = 80_000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = getCorsHeaders(request, env);
    const isJsonAnalyze = url.pathname === "/api/tarot/analyze";
    const isStreamAnalyze = url.pathname === "/api/tarot/analyze/stream";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (!isJsonAnalyze && !isStreamAnalyze) {
      return jsonResponse({ error: "Not found" }, 404, corsHeaders);
    }

    if (!isAllowedOrigin(request, env)) {
      return jsonResponse({ error: "Origin not allowed" }, 403, corsHeaders);
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);
    }

    if (!env.DEEPSEEK_API_KEY) {
      return jsonResponse({ error: "AI provider is not configured" }, 503, corsHeaders);
    }

    if (!env.READINGS_DB) {
      return jsonResponse({ error: "Reading database is not configured" }, 503, corsHeaders);
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > MAX_BODY_BYTES) {
      return jsonResponse({ error: "Request body is too large" }, 413, corsHeaders);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400, corsHeaders);
    }

    const payload = normalizePayload(body);
    if (!payload) {
      return jsonResponse({ error: "Invalid tarot reading payload" }, 400, corsHeaders);
    }

    const now = new Date();
    const createdAt = now.toISOString();
    const day = now.toISOString().slice(0, 10);
    const ipHash = await hashClientIp(request, env);
    const dailyLimit = readPositiveInt(env.DAILY_LIMIT, DEFAULT_DAILY_LIMIT);
    const limitResult = await incrementDailyLimit(env.READINGS_DB, ipHash, day, createdAt);

    if (limitResult.count > dailyLimit) {
      return jsonResponse(
        {
          error: "Daily AI reading limit reached",
          limit: dailyLimit,
          remaining: 0
        },
        429,
        corsHeaders
      );
    }

    const model = env.DEEPSEEK_MODEL || DEFAULT_MODEL;
    const prompt = buildPrompt(payload);
    const readingId = crypto.randomUUID();
    const remaining = Math.max(dailyLimit - limitResult.count, 0);

    if (isStreamAnalyze) {
      return streamAiReading({
        env,
        corsHeaders,
        readingId,
        createdAt,
        day,
        ipHash,
        payload,
        prompt,
        model,
        remaining
      });
    }

    try {
      const deepSeekResult = await callDeepSeek({
        apiKey: env.DEEPSEEK_API_KEY,
        model,
        prompt,
        locale: payload.locale
      });

      await saveReading(env.READINGS_DB, {
        id: readingId,
        createdAt,
        day,
        ipHash,
        payload,
        prompt,
        response: deepSeekResult.response,
        model,
        usage: deepSeekResult.usage,
        requestId: deepSeekResult.requestId
      });

      return jsonResponse(
        {
          id: readingId,
          createdAt,
          model,
          response: deepSeekResult.response,
          remaining
        },
        200,
        corsHeaders
      );
    } catch (error) {
      return jsonResponse(
        {
          error: "AI reading failed",
          message: error instanceof Error ? error.message : "Unknown provider error",
          remaining
        },
        502,
        corsHeaders
      );
    }
  }
};

function getAllowedOrigins(env) {
  const configured = typeof env.ALLOWED_ORIGINS === "string" ? env.ALLOWED_ORIGINS : "";
  const origins = configured
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : DEFAULT_ALLOWED_ORIGINS;
}

function isAllowedOrigin(request, env) {
  const origin = request.headers.get("origin");
  return !origin || getAllowedOrigins(env).includes(origin);
}

function getCorsHeaders(request, env) {
  const origin = request.headers.get("origin");
  const allowedOrigin = origin && getAllowedOrigins(env).includes(origin) ? origin : getAllowedOrigins(env)[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function jsonResponse(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function readPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function limitText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizePayload(body) {
  if (!body || typeof body !== "object") {
    return null;
  }

  const locale = body.locale === "zh-CN" ? "zh-CN" : "en";
  const cards = Array.isArray(body.cards)
    ? body.cards.slice(0, 8).map((card) => ({
        cardId: limitText(card.cardId, 80),
        cardName: limitText(card.cardName, 120),
        positionId: limitText(card.positionId, 80),
        positionName: limitText(card.positionName, 120),
        orientation: card.orientation === "reversed" ? "reversed" : "upright",
        keywords: Array.isArray(card.keywords) ? card.keywords.slice(0, 8).map((keyword) => limitText(keyword, 60)) : [],
        meaning: limitText(card.meaning, 600),
        advice: limitText(card.advice, 600),
        shadow: limitText(card.shadow, 600),
        reflection: limitText(card.reflection, 300)
      }))
    : [];

  if (cards.length === 0 || cards.some((card) => !card.cardId || !card.cardName || !card.positionName)) {
    return null;
  }

  const localInsight = body.localInsight && typeof body.localInsight === "object" ? body.localInsight : {};

  return {
    version: 1,
    sessionId: limitText(body.sessionId, 120),
    locale,
    question: limitText(body.question, 1500),
    spreadId: limitText(body.spreadId, 80) || "unknown",
    spreadName: limitText(body.spreadName, 120) || "Unknown spread",
    cards,
    localInsight: {
      title: limitText(localInsight.title, 300),
      overview: limitText(localInsight.overview, 1200),
      pattern: limitText(localInsight.pattern, 1200),
      nextStep: limitText(localInsight.nextStep, 1200),
      questions: Array.isArray(localInsight.questions)
        ? localInsight.questions.slice(0, 5).map((question) => limitText(question, 300))
        : []
    }
  };
}

async function hashClientIp(request, env) {
  const rawIp =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const salt = typeof env.IP_HASH_SALT === "string" ? env.IP_HASH_SALT : "";
  const data = new TextEncoder().encode(`${salt}:${rawIp}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function incrementDailyLimit(db, ipHash, day, updatedAt) {
  const result = await db
    .prepare(
      `INSERT INTO daily_ip_limits (ip_hash, day, count, updated_at)
       VALUES (?1, ?2, 1, ?3)
       ON CONFLICT(ip_hash, day)
       DO UPDATE SET count = count + 1, updated_at = excluded.updated_at
       RETURNING count`
    )
    .bind(ipHash, day, updatedAt)
    .first();

  return { count: Number(result?.count ?? 1) };
}

function buildPrompt(payload) {
  const isZh = payload.locale === "zh-CN";
  const cardLines = payload.cards.map((card, index) => {
    const orientation = isZh ? (card.orientation === "reversed" ? "逆位" : "正位") : card.orientation;
    const keywords = card.keywords.join(isZh ? "、" : ", ");

    if (isZh) {
      return `${index + 1}. ${card.positionName}: ${card.cardName}（${orientation}）
关键词：${keywords}
牌义：${card.meaning}
建议：${card.advice}
需要留意：${card.shadow}`;
    }

    return `${index + 1}. ${card.positionName}: ${card.cardName} (${orientation})
Keywords: ${keywords}
Meaning: ${card.meaning}
Advice: ${card.advice}
Watch for: ${card.shadow}`;
  });

  if (isZh) {
    return [
      "你是一位经验丰富的塔罗牌解读者。请像真正给来访者读牌一样，围绕牌面、位置、正逆位和牌与牌之间的力量关系展开。",
      "",
      `用户问题：${payload.question || "未填写，请围绕当下最值得看见的主题展开。"}`,
      `牌阵：${payload.spreadName}`,
      "",
      "抽牌结果：",
      ...cardLines,
      "",
      "牌面初读：",
      `标题：${payload.localInsight.title}`,
      `概览：${payload.localInsight.overview}`,
      `牌面结构：${payload.localInsight.pattern}`,
      `下一步：${payload.localInsight.nextStep}`,
      "",
      "请用 Markdown 输出，使用二级标题和自然段。建议结构：",
      "## 总体牌势",
      "## 逐张牌义",
      "## 牌与牌之间的力量",
      "## 关键判断",
      "## 可以怎么做",
      "",
      "写作要求：",
      "- 直接读牌，不要写“继续追问”“书写问题”“反思问题”这类结尾。",
      "- 全文尽量使用陈述句和判断句；行动建议写成清楚的动作，不要用问题来引导用户。",
      "- 不要出现“自我反思工具”“对话地图”“不是未来判决书”这类产品化说明。",
      "- 可以指出张力和盲点，但不要恐吓、宿命化，避免医疗、法律、投资或重大财务确定性建议。",
      "- 语言要深入、细腻、有画面感，但不要空泛鸡汤。"
    ].join("\n");
  }

  return [
    "You are an experienced tarot reader. Read the spread through card meanings, positions, reversals, and the force between the cards.",
    "",
    `Question: ${payload.question || "No question was entered. Focus on the most useful present-tense theme."}`,
    `Spread: ${payload.spreadName}`,
    "",
    "Cards drawn:",
    ...cardLines,
    "",
    "First read from the card table:",
    `Title: ${payload.localInsight.title}`,
    `Overview: ${payload.localInsight.overview}`,
    `Pattern: ${payload.localInsight.pattern}`,
    `Next step: ${payload.localInsight.nextStep}`,
    "",
    "Use Markdown with second-level headings and natural paragraphs. Suggested structure:",
    "## Overall Shape",
    "## Card by Card",
    "## The Force Between the Cards",
    "## Key Reading",
    "## What to Do",
    "",
    "Requirements:",
    "- Do not end with follow-up questions or journaling prompts.",
    "- Prefer declarative sentences. Write practical guidance as clear actions, not as questions for the user to answer.",
    "- Do not call this a self-reflection tool, a dialogue map, or a future verdict.",
    "- Name tension and blind spots without fearmongering or deterministic claims.",
    "- Avoid medical, legal, investment, or major financial certainty.",
    "- Make the reading specific, vivid, and useful rather than generic."
  ].join("\n");
}

function buildSystemPrompt(locale) {
  return locale === "zh-CN"
    ? [
        "你是一位成熟、有经验、语言准确的塔罗牌解读者。",
        "你可以深入分析关系、情绪、选择和行动，但不要恐吓、宿命化或给出医疗、法律、投资、重大财务方面的确定性建议。",
        "不要称自己为 AI，不要解释产品功能，不要把解读包装成自我反思练习。"
      ].join("\n")
    : [
        "You are a mature, experienced tarot reader with precise language.",
        "You may read relationships, emotions, choices, and practical moves in depth, but do not fearmonger, make deterministic claims, or give medical, legal, investment, or major financial certainty.",
        "Do not call yourself AI, explain product mechanics, or frame the reading as a self-reflection exercise."
      ].join("\n");
}

async function callDeepSeek({ apiKey, model, prompt, locale }) {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(locale)
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.74,
      max_tokens: 2400
    })
  });

  const requestId = response.headers.get("x-request-id") || response.headers.get("cf-ray") || "";
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error?.message || `DeepSeek request failed with status ${response.status}`;
    throw new Error(message);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("DeepSeek returned an empty response");
  }

  return {
    response: text.trim(),
    usage: data?.usage ?? null,
    requestId
  };
}

function streamAiReading({ env, corsHeaders, readingId, createdAt, day, ipHash, payload, prompt, model, remaining }) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event, data) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      send("meta", {
        id: readingId,
        createdAt,
        model,
        remaining
      });

      try {
        const deepSeekResult = await callDeepSeekStream({
          apiKey: env.DEEPSEEK_API_KEY,
          model,
          prompt,
          locale: payload.locale,
          onDelta(text) {
            send("delta", { text });
          }
        });

        await saveReading(env.READINGS_DB, {
          id: readingId,
          createdAt,
          day,
          ipHash,
          payload,
          prompt,
          response: deepSeekResult.response,
          model,
          usage: deepSeekResult.usage,
          requestId: deepSeekResult.requestId
        });

        send("done", {
          id: readingId,
          createdAt,
          model,
          remaining
        });
      } catch (error) {
        send("error", {
          message: error instanceof Error ? error.message : "Unknown provider error",
          remaining
        });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no"
    }
  });
}

async function callDeepSeekStream({ apiKey, model, prompt, locale, onDelta }) {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(locale)
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.74,
      max_tokens: 2400,
      stream: true
    })
  });

  const requestId = response.headers.get("x-request-id") || response.headers.get("cf-ray") || "";

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = data?.error?.message || `DeepSeek request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (!response.body) {
    throw new Error("DeepSeek returned an empty stream");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let usage = null;

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const chunk = parseDeepSeekSseLine(line);

      if (!chunk) {
        continue;
      }

      if (chunk.usage) {
        usage = chunk.usage;
      }

      const delta = chunk.choices?.[0]?.delta?.content ?? "";
      if (typeof delta === "string" && delta) {
        fullText += delta;
        onDelta(delta);
      }
    }
  }

  buffer += decoder.decode();
  const finalChunk = parseDeepSeekSseLine(buffer);
  const finalDelta = finalChunk?.choices?.[0]?.delta?.content ?? "";
  if (typeof finalDelta === "string" && finalDelta) {
    fullText += finalDelta;
    onDelta(finalDelta);
  }
  if (finalChunk?.usage) {
    usage = finalChunk.usage;
  }

  if (!fullText.trim()) {
    throw new Error("DeepSeek returned an empty response");
  }

  return {
    response: fullText.trim(),
    usage,
    requestId
  };
}

function parseDeepSeekSseLine(line) {
  const trimmed = line.trim();

  if (!trimmed.startsWith("data:")) {
    return null;
  }

  const payload = trimmed.slice(5).trim();
  if (!payload || payload === "[DONE]") {
    return null;
  }

  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

async function saveReading(db, record) {
  await db
    .prepare(
      `INSERT INTO ai_readings (
        id, created_at, day, ip_hash, locale, question, spread_id, spread_name,
        cards_json, local_insight_json, prompt_text, ai_response, model, usage_json, request_id
      )
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)`
    )
    .bind(
      record.id,
      record.createdAt,
      record.day,
      record.ipHash,
      record.payload.locale,
      record.payload.question,
      record.payload.spreadId,
      record.payload.spreadName,
      JSON.stringify(record.payload.cards),
      JSON.stringify(record.payload.localInsight),
      record.prompt,
      record.response,
      record.model,
      record.usage ? JSON.stringify(record.usage) : null,
      record.requestId || null
    )
    .run();
}
