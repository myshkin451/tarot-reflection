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
    en: "clear, restrained, and grounded",
    zh: "清晰、沉稳、落地"
  },
  practical: {
    en: "practical, direct, and action-oriented",
    zh: "务实、直接、行动导向"
  },
  gentle: {
    en: "gentle, spacious, and emotionally precise",
    zh: "温和、留有空间、情绪准确"
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
      "请作为一位成熟、清醒、有经验的塔罗牌解读者，帮助我分析这次抽牌。",
      "",
      `用户问题：${session.question || "未填写，请围绕当下最值得看见的主题展开。"}`,
      `牌阵：${text(session.spreadName, promptLocale)}`,
      `输出语言：简体中文`,
      `语气：${toneCopy[options.tone].zh}`,
      `深度：${options.depth === "deep" ? "深度读牌，包含牌势、逐张牌义、牌与牌之间的力量和行动落点" : "紧凑读牌，重点清晰、可行动"}`,
      "",
      "抽牌结果：",
      ...lines,
      "",
      "牌面初读：",
      `- ${insight.title}`,
      `- ${insight.overview}`,
      `- 牌面结构：${insight.pattern}`,
      `- 落点：${insight.nextStep}`,
      "",
      "请按以下结构输出：",
      "1. 总体牌势",
      "2. 逐张牌义",
      "3. 牌与牌之间的力量关系",
      "4. 关键判断",
      "5. 可以怎么做",
      "",
      "边界：不要把这次抽牌说成确定命运；不要给出医疗、法律、投资或重大财务确定性建议；不要在结尾另设问题清单或免责声明小节；行动建议用陈述句写清楚，不要用问题引导。"
    ].join("\n");
  }

  return [
    "Act as a mature, clear, experienced tarot reader. Help me interpret this spread without deterministic fortune telling.",
    "",
    `Question: ${session.question || "No question was entered. Focus on the most useful present-tense theme."}`,
    `Spread: ${text(session.spreadName, promptLocale)}`,
    `Output language: English`,
    `Tone: ${toneCopy[options.tone].en}`,
    `Depth: ${options.depth === "deep" ? "deep card reading with spread shape, card-by-card meaning, force between the cards, and practical landing point" : "compact reading with clear, actionable points"}`,
    "",
    "Cards drawn:",
    ...lines,
    "",
    "First read from the card table:",
    `- ${insight.title}`,
    `- ${insight.overview}`,
    `- Pattern: ${insight.pattern}`,
    `- Landing point: ${insight.nextStep}`,
    "",
    "Please respond with:",
    "1. Overall shape",
    "2. Card-by-card reading",
    "3. The force between the cards",
    "4. Key reading",
    "5. What to do",
    "",
    "Boundary: Do not present the reading as fixed fate. Do not give medical, legal, investment, or financial certainty. Do not end with follow-up questions, journaling prompts, or a disclaimer section. Write practical guidance as declarative actions, not as questions."
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
    `- Question: ${session.question || (locale === "zh-CN" ? "未命名牌阵" : "Untitled reading")}`,
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
    session.notes ? `## Notes\n${session.notes}\n` : "",
    session.aiResponse ? `## AI Response\n${session.aiResponse}\n` : ""
  ]
    .filter(Boolean)
    .join("\n");
}
