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

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (url.pathname !== "/api/tarot/analyze") {
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
    const day = now.toISOString().slice(0, 10);
    const ipHash = await hashClientIp(request, env);
    const dailyLimit = readPositiveInt(env.DAILY_LIMIT, DEFAULT_DAILY_LIMIT);
    const limitResult = await incrementDailyLimit(env.READINGS_DB, ipHash, day, now.toISOString());

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

    try {
      const deepSeekResult = await callDeepSeek({
        apiKey: env.DEEPSEEK_API_KEY,
        model,
        prompt,
        locale: payload.locale
      });

      await saveReading(env.READINGS_DB, {
        id: readingId,
        createdAt: now.toISOString(),
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
          createdAt: now.toISOString(),
          model,
          response: deepSeekResult.response,
          remaining: Math.max(dailyLimit - limitResult.count, 0)
        },
        200,
        corsHeaders
      );
    } catch (error) {
      return jsonResponse(
        {
          error: "AI reading failed",
          message: error instanceof Error ? error.message : "Unknown provider error",
          remaining: Math.max(dailyLimit - limitResult.count, 0)
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
      "你是一位清醒、成熟、擅长把塔罗转化为自我理解的解读者。请给出有帮助、具体、自然的中文解读。",
      "",
      `用户问题：${payload.question || "未填写，请围绕当下最值得看见的主题展开。"}`,
      `牌阵：${payload.spreadName}`,
      "",
      "抽牌结果：",
      ...cardLines,
      "",
      "本地初步解读：",
      `标题：${payload.localInsight.title}`,
      `概览：${payload.localInsight.overview}`,
      `牌面结构：${payload.localInsight.pattern}`,
      `下一步：${payload.localInsight.nextStep}`,
      "",
      "请按以下结构输出：",
      "1. 整体主题",
      "2. 每张牌在当前位置上的含义",
      "3. 牌与牌之间的关系",
      "4. 今天可以采取的具体行动",
      "5. 3 个继续追问或书写的问题",
      "",
      "不要把抽牌说成确定命运；不要给医疗、法律、投资或重大财务确定性建议。"
    ].join("\n");
  }

  return [
    "You are a clear, mature tarot reflection guide. Give a useful, concrete, natural interpretation in English.",
    "",
    `Question: ${payload.question || "No question was entered. Focus on the most useful present-tense theme."}`,
    `Spread: ${payload.spreadName}`,
    "",
    "Cards drawn:",
    ...cardLines,
    "",
    "Local first-pass interpretation:",
    `Title: ${payload.localInsight.title}`,
    `Overview: ${payload.localInsight.overview}`,
    `Pattern: ${payload.localInsight.pattern}`,
    `Next step: ${payload.localInsight.nextStep}`,
    "",
    "Respond with:",
    "1. Overall theme",
    "2. Meaning of each card in its position",
    "3. Relationship between the cards",
    "4. Practical next actions for today",
    "5. Three follow-up or journaling questions",
    "",
    "Do not present the reading as fixed fate. Do not give medical, legal, investment, or major financial certainty."
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
          content:
            locale === "zh-CN"
              ? "你提供塔罗相关的反思型解读，语气自然、有分寸、具体，不制造恐吓或确定性预言。"
              : "You provide reflective tarot interpretations with natural, concrete, measured language and no deterministic claims."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1600
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
