import { buildReadingInsight } from "./interpretation";
import { list, text } from "./locale";
import type { Depth, Locale, ReadingSession } from "./types";

export interface PromptOptions {
  locale: Locale;
  depth: Depth;
  outputLanguage: "English" | "Simplified Chinese";
  tone: "calm" | "practical" | "gentle";
}

const toneCopy = {
  calm: {
    en: "clear, reflective, and grounded",
    zh: "清晰、反思性、落地"
  },
  practical: {
    en: "practical, direct, and action-oriented",
    zh: "务实、直接、行动导向"
  },
  gentle: {
    en: "gentle, spacious, and emotionally careful",
    zh: "温和、留有空间、照顾情绪"
  }
};

export function buildPrompt(session: ReadingSession, options: PromptOptions): string {
  const isZh = options.outputLanguage === "Simplified Chinese";
  const promptLocale: Locale = isZh ? "zh-CN" : "en";
  const insight = buildReadingInsight(session, promptLocale);
  const lines = session.cards.map((drawn, index) => {
    const cardName = text(drawn.card.name, promptLocale);
    const positionName = text(drawn.position.name, promptLocale);
    const keywords = list(drawn.card.keywords[drawn.orientation], promptLocale).join(", ");
    const meaning = text(drawn.card.meaning[drawn.orientation], promptLocale);

    return isZh
      ? `${index + 1}. ${positionName}: ${cardName}（${drawn.orientation === "reversed" ? "逆位" : "正位"}）\n   关键词：${keywords}\n   牌义：${meaning}`
      : `${index + 1}. ${positionName}: ${cardName} (${drawn.orientation})\n   Keywords: ${keywords}\n   Meaning: ${meaning}`;
  });

  if (isZh) {
    return [
      "请作为一位成熟、清醒、以自我反思为核心的塔罗解读助手，帮助我分析这次抽牌。",
      "",
      `用户问题：${session.question || "未填写，请围绕当下最值得反思的主题展开。"}`,
      `牌阵：${text(session.spreadName, promptLocale)}`,
      `输出语言：简体中文`,
      `语气：${toneCopy[options.tone].zh}`,
      `深度：${options.depth === "deep" ? "深度分析，包含结构化洞察、行动建议和反思问题" : "紧凑分析，重点清晰、可行动"}`,
      "",
      "抽牌结果：",
      ...lines,
      "",
      "本地初步解读：",
      `- ${insight.title}`,
      `- ${insight.overview}`,
      `- 牌面结构：${insight.pattern}`,
      `- 下一步：${insight.nextStep}`,
      "",
      "请按以下结构输出：",
      "1. 整体主题",
      "2. 每张牌在其位置上的含义",
      "3. 牌与牌之间的关系",
      "4. 可采取的具体行动",
      "5. 3 个值得继续书写或思考的问题",
      "",
      "安全边界：不要把这次抽牌说成确定命运；不要给出医疗、法律、投资或重大财务确定性建议；请把它作为反思、视角整理和行动可能性的工具。"
    ].join("\n");
  }

  return [
    "Act as a mature, clear tarot reflection guide. Help me interpret this reading as a tool for self-inquiry, not deterministic fortune telling.",
    "",
    `Question: ${session.question || "No question was entered. Focus on the most useful present-tense reflection."}`,
    `Spread: ${text(session.spreadName, promptLocale)}`,
    `Output language: English`,
    `Tone: ${toneCopy[options.tone].en}`,
    `Depth: ${options.depth === "deep" ? "deep analysis with structured insight, practical actions, and reflection questions" : "compact analysis with clear, actionable points"}`,
    "",
    "Cards drawn:",
    ...lines,
    "",
    "First-pass local interpretation:",
    `- ${insight.title}`,
    `- ${insight.overview}`,
    `- Pattern: ${insight.pattern}`,
    `- Next step: ${insight.nextStep}`,
    "",
    "Please respond with:",
    "1. Overall theme",
    "2. Meaning of each card in its position",
    "3. Relationship between the cards",
    "4. Practical next actions",
    "5. Three reflection questions for journaling",
    "",
    "Safety boundary: Do not present the reading as fixed fate. Do not give medical, legal, investment, or financial certainty. Focus on reflection, perspective, and possible actions."
  ].join("\n");
}

export function readingToMarkdown(session: ReadingSession, locale: Locale): string {
  const insight = buildReadingInsight(session, locale);
  const rows = session.cards.map((drawn) => {
    const keywords = list(drawn.card.keywords[drawn.orientation], locale).join(", ");
    return `- **${text(drawn.position.name, locale)}**: ${text(drawn.card.name, locale)} (${drawn.orientation}) — ${keywords}`;
  });

  return [
    `# ${text(session.spreadName, locale)}`,
    "",
    `- Date: ${new Date(session.createdAt).toLocaleString()}`,
    `- Question: ${session.question || "Untitled reflection"}`,
    "",
    "## Cards",
    ...rows,
    "",
    `## ${insight.label}`,
    "",
    `### ${insight.title}`,
    "",
    insight.overview,
    "",
    `**${locale === "zh-CN" ? "牌面结构" : "Pattern"}:** ${insight.pattern}`,
    "",
    `**${locale === "zh-CN" ? "下一步" : "Next step"}:** ${insight.nextStep}`,
    "",
    `## ${locale === "zh-CN" ? "继续书写" : "Journal Questions"}`,
    ...insight.questions.map((question) => `- ${question}`),
    "",
    session.notes ? `## Notes\n${session.notes}\n` : "",
    session.aiResponse ? `## AI Response\n${session.aiResponse}\n` : ""
  ]
    .filter(Boolean)
    .join("\n");
}
