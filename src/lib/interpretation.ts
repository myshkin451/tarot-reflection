import { list, text } from "./locale";
import type { DrawnCard, Locale, ReadingSession } from "./types";

export interface CardInsight {
  drawn: DrawnCard;
  cardName: string;
  positionName: string;
  orientationLabel: string;
  keywords: string[];
  meaning: string;
  positionRead: string;
  advice: string;
  shadow: string;
  reflection: string;
}

export interface ReadingInsight {
  label: string;
  title: string;
  overview: string;
  pattern: string;
  nextStep: string;
  cardNotes: CardInsight[];
  questions: string[];
}

function orientationLabel(drawn: DrawnCard, locale: Locale) {
  if (locale === "zh-CN") {
    return drawn.orientation === "reversed" ? "逆位" : "正位";
  }

  return drawn.orientation === "reversed" ? "Reversed" : "Upright";
}

function isChallengePosition(id: string) {
  return id.includes("challenge") || id.includes("hidden");
}

function isAdvicePosition(id: string) {
  return id.includes("advice") || id.includes("outcome");
}

function buildPositionRead(drawn: DrawnCard, locale: Locale) {
  const cardName = text(drawn.card.name, locale);
  const positionName = text(drawn.position.name, locale);
  const meaning = text(drawn.card.meaning[drawn.orientation], locale);
  const prompt = text(drawn.position.prompt, locale);
  const shadow = text(drawn.card.shadow, locale);

  if (locale === "zh-CN") {
    if (isChallengePosition(drawn.position.id)) {
      return `放在「${positionName}」时，${cardName}提醒你看见一个容易被忽略的卡点：${shadow}。它不是要吓唬你，而是提示这里需要更多诚实和整理。${prompt}`;
    }

    if (isAdvicePosition(drawn.position.id)) {
      return `放在「${positionName}」时，${cardName}更像一个行动方向：${meaning} 可以先从一个小而明确的动作开始，不需要马上把整件事解决完。`;
    }

    return `放在「${positionName}」时，${cardName}描述的是当前局面的入口：${meaning} 先把它当作观察角度，而不是最终判决。${prompt}`;
  }

  if (isChallengePosition(drawn.position.id)) {
    return `In the ${positionName} position, ${cardName} points to a possible knot: ${shadow}. Treat it as something to examine honestly, not as a verdict. ${prompt}`;
  }

  if (isAdvicePosition(drawn.position.id)) {
    return `In the ${positionName} position, ${cardName} works as a practical direction: ${meaning} Start with one clear move instead of trying to solve the whole situation at once.`;
  }

  return `In the ${positionName} position, ${cardName} names the doorway into the situation: ${meaning} Use it as a lens for observation, not as a final judgment. ${prompt}`;
}

function getDominantSuit(cards: DrawnCard[]) {
  const counts = new Map<string, { name: string; count: number; theme: string }>();

  cards.forEach((drawn) => {
    if (!drawn.card.suit) {
      return;
    }

    const suitId = drawn.card.suit.en;
    const existing = counts.get(suitId);
    counts.set(suitId, {
      name: drawn.card.suit.en,
      count: (existing?.count ?? 0) + 1,
      theme: drawn.card.element?.en ?? ""
    });
  });

  return [...counts.values()].sort((a, b) => b.count - a.count)[0];
}

function buildPattern(session: ReadingSession, locale: Locale) {
  const total = session.cards.length;
  const majorCount = session.cards.filter((drawn) => drawn.card.arcana === "major").length;
  const reversedCount = session.cards.filter((drawn) => drawn.orientation === "reversed").length;
  const dominantSuit = getDominantSuit(session.cards);
  const parts: string[] = [];

  if (locale === "zh-CN") {
    if (majorCount >= Math.ceil(total / 2)) {
      parts.push("大阿尔卡那比例偏高，说明这次抽牌更像在看一条人生模式或关键转折，而不只是日常细节。");
    } else if (dominantSuit && dominantSuit.count > 1) {
      parts.push(`小阿尔卡那更集中，重点会落在可处理的日常层面；其中 ${dominantSuit.name} 的重复提示你留意对应的生活领域。`);
    } else {
      parts.push("这组牌没有压倒性的单一主题，更适合逐张看它们如何拼成一条线索。");
    }

    if (reversedCount >= Math.ceil(total / 2)) {
      parts.push("逆位较多时，先把它理解成能量被堵住、尚未说清或需要回收注意力，而不是坏结果。");
    } else if (reversedCount > 0) {
      parts.push("少量逆位像提醒灯：有些地方需要慢一点、看细一点。");
    } else {
      parts.push("全正位让信息更外显，适合直接转成行动或书写。");
    }

    return parts.join("");
  }

  if (majorCount >= Math.ceil(total / 2)) {
    parts.push("Major Arcana are prominent, so this reading is pointing at a larger life pattern or turning point rather than only day-to-day detail.");
  } else if (dominantSuit && dominantSuit.count > 1) {
    parts.push(`Minor Arcana are doing most of the work here, which keeps the reading practical; repeated ${dominantSuit.name} asks you to notice that life area.`);
  } else {
    parts.push("No single suit or arcana dominates, so the most useful approach is to read the cards as a sequence of clues.");
  }

  if (reversedCount >= Math.ceil(total / 2)) {
    parts.push(" Several reversals suggest blocked, internal, or not-yet-integrated energy rather than a bad outcome.");
  } else if (reversedCount > 0) {
    parts.push(" The reversal works like a signal light: slow down and inspect that part with care.");
  } else {
    parts.push(" With all cards upright, the message is more visible and easier to turn into action or journaling.");
  }

  return parts.join("");
}

function buildQuestions(notes: CardInsight[], locale: Locale) {
  const fromCards = notes.map((note) => note.reflection).filter(Boolean);
  const fallback =
    locale === "zh-CN"
      ? ["我真正想确认的是什么？", "这组牌让我愿意承认哪件事？", "今天可以做的最小一步是什么？"]
      : ["What am I really trying to confirm?", "What does this reading help me admit?", "What is the smallest useful step today?"];

  return [...new Set([...fromCards, ...fallback])].slice(0, 3);
}

export function buildReadingInsight(session: ReadingSession, locale: Locale): ReadingInsight {
  const cardNotes = session.cards.map<CardInsight>((drawn) => ({
    drawn,
    cardName: text(drawn.card.name, locale),
    positionName: text(drawn.position.name, locale),
    orientationLabel: orientationLabel(drawn, locale),
    keywords: list(drawn.card.keywords[drawn.orientation], locale),
    meaning: text(drawn.card.meaning[drawn.orientation], locale),
    positionRead: buildPositionRead(drawn, locale),
    advice: text(drawn.card.advice, locale),
    shadow: text(drawn.card.shadow, locale),
    reflection: list(drawn.card.reflection, locale)[0]
  }));
  const first = cardNotes[0];
  const last = cardNotes[cardNotes.length - 1];
  const adviceCard = cardNotes.find((note) => isAdvicePosition(note.drawn.position.id)) ?? last;

  if (locale === "zh-CN") {
    return {
      label: "本地初步解读",
      title: cardNotes.length === 1 ? `${first.cardName}：先抓住当下最清楚的信号` : `主线：从${first.cardName}走向${last.cardName}`,
      overview:
        cardNotes.length === 1
          ? `这张牌先不急着给你一个确定答案，而是提供一个观察入口：${first.meaning} 如果你的问题是「${session.question || "当下我该看见什么"}」，可以先从这条线索开始写。`
          : `这次牌阵可以先看成一条线：${first.positionName}里的${first.cardName}打开局面，${last.positionName}里的${last.cardName}指出它可能被带向哪里。它不是命运判词，而是一份可继续追问的地图。`,
      pattern: buildPattern(session, locale),
      nextStep: `下一步可以先落实「${adviceCard.positionName}」这张牌：${adviceCard.advice} 把它压缩成一个今天能完成的小动作，读牌才会真正变成帮助。`,
      cardNotes,
      questions: buildQuestions(cardNotes, locale)
    };
  }

  return {
    label: "First-pass interpretation",
    title: cardNotes.length === 1 ? `${first.cardName}: start with the clearest signal` : `Theme: from ${first.cardName} toward ${last.cardName}`,
    overview:
      cardNotes.length === 1
        ? `This card does not need to give a fixed answer. It gives you an entry point: ${first.meaning} If your question is "${session.question || "what should I notice now"}", start writing from this clue.`
        : `Read this spread as a line of movement: ${first.cardName} in ${first.positionName} opens the situation, while ${last.cardName} in ${last.positionName} shows where the pattern may lead. It is a map for inquiry, not a verdict from fate.`,
    pattern: buildPattern(session, locale),
    nextStep: `Start by grounding the ${adviceCard.positionName} card: ${adviceCard.advice} Compress that into one action you can actually take today.`,
    cardNotes,
    questions: buildQuestions(cardNotes, locale)
  };
}
