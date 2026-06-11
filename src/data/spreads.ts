import type { Spread } from "@/lib/types";

export const spreads: Spread[] = [
  {
    id: "one-card",
    name: {
      en: "Focus",
      zh: "单张聚焦"
    },
    description: {
      en: "A single card for the clearest signal in the present moment.",
      zh: "用一张牌捕捉当下最值得看见的信号。"
    },
    positions: [
      {
        id: "focus",
        name: {
          en: "Focus",
          zh: "聚焦"
        },
        prompt: {
          en: "What deserves your attention now?",
          zh: "此刻最值得你注意的是什么？"
        }
      }
    ]
  },
  {
    id: "three-card",
    name: {
      en: "Situation / Challenge / Advice",
      zh: "状态 / 阻碍 / 建议"
    },
    description: {
      en: "A balanced spread for understanding a current question and the next useful move.",
      zh: "适合厘清当前问题、阻力和下一步行动。"
    },
    positions: [
      {
        id: "situation",
        name: {
          en: "Situation",
          zh: "当前状态"
        },
        prompt: {
          en: "What is the real shape of the situation?",
          zh: "这个局面的真实形状是什么？"
        }
      },
      {
        id: "challenge",
        name: {
          en: "Challenge",
          zh: "主要阻碍"
        },
        prompt: {
          en: "What tension, pattern, or blind spot is asking to be noticed?",
          zh: "有哪些张力、惯性或盲点正在要求被看见？"
        }
      },
      {
        id: "advice",
        name: {
          en: "Advice",
          zh: "行动建议"
        },
        prompt: {
          en: "What practical orientation would help now?",
          zh: "此刻怎样的行动方向更有帮助？"
        }
      }
    ]
  },
  {
    id: "five-card",
    name: {
      en: "Core / Energy / Hidden / Advice / Outcome",
      zh: "核心 / 能量 / 隐因 / 建议 / 可能结果"
    },
    description: {
      en: "A deeper reading for questions with several moving parts.",
      zh: "适合处理更复杂、牵涉多个层面的提问。"
    },
    positions: [
      {
        id: "core",
        name: {
          en: "Core",
          zh: "问题核心"
        },
        prompt: {
          en: "What sits at the center of this question?",
          zh: "这个问题真正的核心是什么？"
        }
      },
      {
        id: "present-energy",
        name: {
          en: "Present Energy",
          zh: "当前能量"
        },
        prompt: {
          en: "What atmosphere or momentum is active now?",
          zh: "现在正在运作的氛围或动能是什么？"
        }
      },
      {
        id: "hidden-factor",
        name: {
          en: "Hidden Factor",
          zh: "隐藏因素"
        },
        prompt: {
          en: "What may be under the surface?",
          zh: "水面下可能藏着什么？"
        }
      },
      {
        id: "advice",
        name: {
          en: "Advice",
          zh: "行动建议"
        },
        prompt: {
          en: "What response is most constructive?",
          zh: "怎样回应会更有建设性？"
        }
      },
      {
        id: "possible-outcome",
        name: {
          en: "Possible Outcome",
          zh: "可能结果"
        },
        prompt: {
          en: "What is likely if the current pattern continues?",
          zh: "如果当前模式延续，可能走向哪里？"
        }
      }
    ]
  }
];

export function getSpread(id: Spread["id"]): Spread {
  const spread = spreads.find((item) => item.id === id);
  if (!spread) {
    throw new Error(`Unknown spread: ${id}`);
  }

  return spread;
}
