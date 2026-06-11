import type { Arcana, LocalizedList, LocalizedText, TarotCard } from "@/lib/types";

type OrientationSet = {
  upright: LocalizedList;
  reversed: LocalizedList;
};

type MeaningSet = {
  upright: LocalizedText;
  reversed: LocalizedText;
};

type MajorSeed = {
  id: string;
  number: number;
  name: LocalizedText;
  symbol: string;
  keywords: OrientationSet;
  meaning: MeaningSet;
  advice: LocalizedText;
  shadow: LocalizedText;
  reflection: LocalizedList;
};

const majorArcana: MajorSeed[] = [
  {
    id: "the-fool",
    number: 0,
    name: { en: "The Fool", zh: "愚者" },
    symbol: "0",
    keywords: {
      upright: { en: ["beginning", "trust", "openness"], zh: ["开始", "信任", "开放"] },
      reversed: { en: ["recklessness", "avoidance", "unprepared"], zh: ["鲁莽", "逃避", "准备不足"] }
    },
    meaning: {
      upright: { en: "A threshold is open; curiosity matters more than certainty.", zh: "一个门槛正在打开，好奇心比确定性更重要。" },
      reversed: { en: "Freedom may be turning into avoidance or careless risk.", zh: "自由可能正在滑向逃避或轻率冒险。" }
    },
    advice: { en: "Take the first honest step, but keep your footing visible.", zh: "迈出真实的第一步，同时看清脚下。" },
    shadow: { en: "Mistaking impulse for courage.", zh: "把冲动误认成勇气。" },
    reflection: { en: ["What would I try if I did not need a perfect map?"], zh: ["如果不需要完美路线，我会先尝试什么？"] }
  },
  {
    id: "the-magician",
    number: 1,
    name: { en: "The Magician", zh: "魔术师" },
    symbol: "I",
    keywords: {
      upright: { en: ["agency", "skill", "focus"], zh: ["能动性", "技能", "聚焦"] },
      reversed: { en: ["misdirection", "scattered will", "performance"], zh: ["误导", "意志分散", "表演化"] }
    },
    meaning: {
      upright: { en: "You have usable tools; the question is where to direct them.", zh: "你已经有可用工具，关键是把它们指向哪里。" },
      reversed: { en: "Energy leaks when intention and action are not aligned.", zh: "当意图和行动不一致，能量会被耗散。" }
    },
    advice: { en: "Name the outcome and choose one tool to use well.", zh: "说清目标，并选一个工具用到位。" },
    shadow: { en: "Confusing charisma with substance.", zh: "把魅力误作实质。" },
    reflection: { en: ["Which resource am I underusing?"], zh: ["我正在低估或闲置哪种资源？"] }
  },
  {
    id: "the-high-priestess",
    number: 2,
    name: { en: "The High Priestess", zh: "女祭司" },
    symbol: "II",
    keywords: {
      upright: { en: ["intuition", "silence", "inner knowing"], zh: ["直觉", "静默", "内在知晓"] },
      reversed: { en: ["noise", "secrecy", "self-doubt"], zh: ["噪音", "遮掩", "自我怀疑"] }
    },
    meaning: {
      upright: { en: "Not every answer is ready to be spoken; listen before acting.", zh: "并非每个答案都已适合说出口，先倾听再行动。" },
      reversed: { en: "Too much noise may be muting a quiet but important signal.", zh: "过多噪音可能盖住了安静但重要的信号。" }
    },
    advice: { en: "Make space for observation before conclusion.", zh: "先为观察留空间，再下结论。" },
    shadow: { en: "Using mystery to avoid clarity.", zh: "用神秘感回避清晰。" },
    reflection: { en: ["What do I already know but keep explaining away?"], zh: ["我其实已经知道什么，却一直在替它找理由？"] }
  },
  {
    id: "the-empress",
    number: 3,
    name: { en: "The Empress", zh: "皇后" },
    symbol: "III",
    keywords: {
      upright: { en: ["nourishment", "beauty", "growth"], zh: ["滋养", "美感", "生长"] },
      reversed: { en: ["depletion", "overgiving", "stagnation"], zh: ["耗竭", "过度给予", "停滞"] }
    },
    meaning: {
      upright: { en: "The situation grows through care, patience, and embodiment.", zh: "这个局面会通过照料、耐心和身体性的投入而生长。" },
      reversed: { en: "Care becomes costly when it ignores your own needs.", zh: "若忽略自身需要，照料会变得昂贵。" }
    },
    advice: { en: "Feed what is alive and stop feeding what only drains you.", zh: "滋养真正有生命力的东西，停止喂养只会消耗你的东西。" },
    shadow: { en: "Mistaking comfort for growth.", zh: "把舒适误认为成长。" },
    reflection: { en: ["What needs steadier care rather than more pressure?"], zh: ["什么更需要稳定照料，而不是更多压力？"] }
  },
  {
    id: "the-emperor",
    number: 4,
    name: { en: "The Emperor", zh: "皇帝" },
    symbol: "IV",
    keywords: {
      upright: { en: ["structure", "authority", "boundaries"], zh: ["结构", "权威", "边界"] },
      reversed: { en: ["rigidity", "control", "weak limits"], zh: ["僵化", "控制", "边界薄弱"] }
    },
    meaning: {
      upright: { en: "A clear structure can turn intention into a stable path.", zh: "清晰结构能把意图变成稳定路径。" },
      reversed: { en: "Control may be replacing real leadership or healthy limits.", zh: "控制可能正在取代真正的领导和健康边界。" }
    },
    advice: { en: "Define the rule, role, or boundary that would reduce friction.", zh: "定义能减少摩擦的规则、角色或边界。" },
    shadow: { en: "Using order to avoid vulnerability.", zh: "用秩序回避脆弱。" },
    reflection: { en: ["Where would a firmer boundary create more freedom?"], zh: ["哪里更坚定的边界反而会创造自由？"] }
  },
  {
    id: "the-hierophant",
    number: 5,
    name: { en: "The Hierophant", zh: "教皇" },
    symbol: "V",
    keywords: {
      upright: { en: ["tradition", "learning", "shared values"], zh: ["传统", "学习", "共同价值"] },
      reversed: { en: ["dogma", "rebellion", "hollow rules"], zh: ["教条", "反叛", "空洞规则"] }
    },
    meaning: {
      upright: { en: "Established wisdom or community standards may help orient you.", zh: "既有智慧或共同规范可能会帮助你定位。" },
      reversed: { en: "A rule may have outlived its purpose or become performative.", zh: "某条规则可能已经失去目的，或变成表演。" }
    },
    advice: { en: "Learn the lineage before deciding what to keep or change.", zh: "先理解脉络，再决定保留或改变什么。" },
    shadow: { en: "Obedience without examination.", zh: "未经审视的顺从。" },
    reflection: { en: ["Which inherited rule still serves me?"], zh: ["哪条继承来的规则仍然服务于我？"] }
  },
  {
    id: "the-lovers",
    number: 6,
    name: { en: "The Lovers", zh: "恋人" },
    symbol: "VI",
    keywords: {
      upright: { en: ["choice", "alignment", "relationship"], zh: ["选择", "一致", "关系"] },
      reversed: { en: ["misalignment", "avoidance", "fragmentation"], zh: ["失衡", "逃避", "分裂"] }
    },
    meaning: {
      upright: { en: "A meaningful choice asks you to align desire, values, and action.", zh: "一个重要选择要求你让欲望、价值和行动对齐。" },
      reversed: { en: "Something is divided: words, actions, needs, or loyalties.", zh: "某些东西正在分裂：言语、行动、需求或忠诚。" }
    },
    advice: { en: "Choose what lets you remain whole.", zh: "选择那个让你保持完整的方向。" },
    shadow: { en: "Calling dependence devotion.", zh: "把依赖称作投入。" },
    reflection: { en: ["What choice would make my values visible?"], zh: ["哪个选择会让我的价值观变得可见？"] }
  },
  {
    id: "the-chariot",
    number: 7,
    name: { en: "The Chariot", zh: "战车" },
    symbol: "VII",
    keywords: {
      upright: { en: ["direction", "discipline", "momentum"], zh: ["方向", "自律", "推进"] },
      reversed: { en: ["force", "drift", "inner conflict"], zh: ["强推", "漂移", "内在冲突"] }
    },
    meaning: {
      upright: { en: "Progress comes from steering opposing forces toward one aim.", zh: "进展来自把相反力量导向同一个目标。" },
      reversed: { en: "Pushing harder will not help if the direction is split.", zh: "如果方向分裂，更用力也未必有用。" }
    },
    advice: { en: "Pick the destination before increasing speed.", zh: "先选目的地，再提高速度。" },
    shadow: { en: "Treating domination as discipline.", zh: "把支配误作自律。" },
    reflection: { en: ["Where am I moving fast without agreement inside myself?"], zh: ["我在哪件事上推进很快，但内心并未达成一致？"] }
  },
  {
    id: "strength",
    number: 8,
    name: { en: "Strength", zh: "力量" },
    symbol: "VIII",
    keywords: {
      upright: { en: ["courage", "patience", "soft power"], zh: ["勇气", "耐心", "柔性力量"] },
      reversed: { en: ["self-doubt", "pressure", "reactivity"], zh: ["自我怀疑", "压迫感", "反应性"] }
    },
    meaning: {
      upright: { en: "Real strength is steady contact with what is difficult.", zh: "真正的力量是稳定地接触困难之物。" },
      reversed: { en: "Harshness may be covering fear or fatigue.", zh: "严苛可能正在遮盖恐惧或疲惫。" }
    },
    advice: { en: "Use gentleness as a disciplined form of power.", zh: "把温柔当作一种有纪律的力量。" },
    shadow: { en: "Performing toughness instead of meeting the feeling.", zh: "表演强硬，而不是面对感受。" },
    reflection: { en: ["What would courage look like if it were quiet?"], zh: ["如果勇气是安静的，它会长什么样？"] }
  },
  {
    id: "the-hermit",
    number: 9,
    name: { en: "The Hermit", zh: "隐士" },
    symbol: "IX",
    keywords: {
      upright: { en: ["solitude", "discernment", "guidance"], zh: ["独处", "辨别", "指引"] },
      reversed: { en: ["isolation", "withdrawal", "lost signal"], zh: ["孤立", "退缩", "信号迷失"] }
    },
    meaning: {
      upright: { en: "A quieter path may reveal what public noise cannot.", zh: "更安静的路径会揭示公共噪音看不见的东西。" },
      reversed: { en: "Stepping back has become separation from useful contact.", zh: "后退可能已经变成与有益连接的断开。" }
    },
    advice: { en: "Create solitude with a lamp, not a wall.", zh: "创造带灯的独处，而不是筑墙。" },
    shadow: { en: "Confusing privacy with disappearance.", zh: "把隐私误作消失。" },
    reflection: { en: ["What can only be heard when I stop performing?"], zh: ["当我停止表演时，什么才会被听见？"] }
  },
  {
    id: "wheel-of-fortune",
    number: 10,
    name: { en: "Wheel of Fortune", zh: "命运之轮" },
    symbol: "X",
    keywords: {
      upright: { en: ["change", "cycles", "timing"], zh: ["变化", "周期", "时机"] },
      reversed: { en: ["resistance", "bad timing", "stuck cycle"], zh: ["抗拒", "时机不顺", "循环卡住"] }
    },
    meaning: {
      upright: { en: "The pattern is moving; your task is to notice the turn.", zh: "模式正在转动，你的任务是看见转向。" },
      reversed: { en: "A cycle repeats because the lesson has not been integrated.", zh: "循环重复，是因为其中的功课尚未被整合。" }
    },
    advice: { en: "Respond to timing instead of trying to freeze it.", zh: "回应时机，而不是试图冻结它。" },
    shadow: { en: "Surrendering agency to luck.", zh: "把能动性交给运气。" },
    reflection: { en: ["What pattern is asking to turn?"], zh: ["哪个模式正在要求转向？"] }
  },
  {
    id: "justice",
    number: 11,
    name: { en: "Justice", zh: "正义" },
    symbol: "XI",
    keywords: {
      upright: { en: ["truth", "accountability", "balance"], zh: ["真相", "负责", "平衡"] },
      reversed: { en: ["bias", "avoidance", "unfairness"], zh: ["偏见", "回避", "不公"] }
    },
    meaning: {
      upright: { en: "Clarity improves when facts, consequences, and values are weighed together.", zh: "当事实、后果和价值被一起衡量，清晰度会提升。" },
      reversed: { en: "A missing fact or avoided responsibility may distort the decision.", zh: "缺失的事实或被回避的责任可能正在扭曲决策。" }
    },
    advice: { en: "Look for the cleanest truth, not the most comfortable one.", zh: "寻找最清洁的真实，而不是最舒服的说法。" },
    shadow: { en: "Using fairness language to hide self-protection.", zh: "用公平话语隐藏自我保护。" },
    reflection: { en: ["What consequence am I willing to own?"], zh: ["我愿意承担哪个后果？"] }
  },
  {
    id: "the-hanged-man",
    number: 12,
    name: { en: "The Hanged Man", zh: "倒吊人" },
    symbol: "XII",
    keywords: {
      upright: { en: ["pause", "surrender", "new perspective"], zh: ["暂停", "放下", "新视角"] },
      reversed: { en: ["stalling", "martyrdom", "stubbornness"], zh: ["拖延", "受难者姿态", "固执"] }
    },
    meaning: {
      upright: { en: "A pause can become productive when it changes the angle of seeing.", zh: "当暂停改变观看角度，它就会变得有生产力。" },
      reversed: { en: "Waiting may be a disguise for fear of choosing.", zh: "等待可能是害怕选择的伪装。" }
    },
    advice: { en: "Stop forcing the old angle to solve a new problem.", zh: "别再用旧角度强解新问题。" },
    shadow: { en: "Making sacrifice into identity.", zh: "把牺牲变成身份。" },
    reflection: { en: ["What changes if I stop trying to win this moment?"], zh: ["如果我不再试图赢下此刻，会发生什么变化？"] }
  },
  {
    id: "death",
    number: 13,
    name: { en: "Death", zh: "死神" },
    symbol: "XIII",
    keywords: {
      upright: { en: ["ending", "release", "transformation"], zh: ["结束", "释放", "转化"] },
      reversed: { en: ["clinging", "delayed closure", "fear of change"], zh: ["抓取", "迟迟不收尾", "害怕改变"] }
    },
    meaning: {
      upright: { en: "Something has completed its life; release makes room for form change.", zh: "某些事物已完成生命周期，释放会为空间改形。" },
      reversed: { en: "The ending is resisted, so the transition feels heavier.", zh: "因为抗拒结束，过渡变得更沉重。" }
    },
    advice: { en: "Name what is over with respect, then stop feeding it.", zh: "带着尊重说出什么已经结束，然后停止供养它。" },
    shadow: { en: "Calling decay loyalty.", zh: "把腐坏称作忠诚。" },
    reflection: { en: ["What am I keeping alive only through effort?"], zh: ["什么只是靠我的用力才维持活着？"] }
  },
  {
    id: "temperance",
    number: 14,
    name: { en: "Temperance", zh: "节制" },
    symbol: "XIV",
    keywords: {
      upright: { en: ["integration", "moderation", "healing"], zh: ["整合", "适度", "修复"] },
      reversed: { en: ["excess", "imbalance", "fragmentation"], zh: ["过量", "失衡", "碎片化"] }
    },
    meaning: {
      upright: { en: "The next step is not intensity but integration.", zh: "下一步不是更强烈，而是更整合。" },
      reversed: { en: "Too many extremes are preventing a stable mixture.", zh: "太多极端正在阻止稳定调和。" }
    },
    advice: { en: "Blend slowly; let the system find a sustainable rhythm.", zh: "慢慢调和，让系统找到可持续的节奏。" },
    shadow: { en: "Avoiding commitment by staying in the middle forever.", zh: "用永远居中来回避承诺。" },
    reflection: { en: ["What needs to be combined rather than chosen between?"], zh: ["什么不是非选其一，而是需要被调和？"] }
  },
  {
    id: "the-devil",
    number: 15,
    name: { en: "The Devil", zh: "恶魔" },
    symbol: "XV",
    keywords: {
      upright: { en: ["attachment", "compulsion", "shadow"], zh: ["依附", "强迫性", "阴影"] },
      reversed: { en: ["release", "awareness", "breaking pattern"], zh: ["释放", "觉察", "打破模式"] }
    },
    meaning: {
      upright: { en: "A pattern has power because part of you still receives something from it.", zh: "某个模式有力量，是因为你的一部分仍从中获得东西。" },
      reversed: { en: "Awareness opens a gap between urge and action.", zh: "觉察在冲动和行动之间打开缝隙。" }
    },
    advice: { en: "Ask what the attachment costs and what it protects.", zh: "询问这份依附付出什么代价，又保护了什么。" },
    shadow: { en: "Pretending a chain is a preference.", zh: "把锁链假装成偏好。" },
    reflection: { en: ["What do I keep choosing after it stops helping me?"], zh: ["什么已经不再帮助我，我却仍反复选择？"] }
  },
  {
    id: "the-tower",
    number: 16,
    name: { en: "The Tower", zh: "高塔" },
    symbol: "XVI",
    keywords: {
      upright: { en: ["disruption", "truth", "collapse"], zh: ["扰动", "真相", "崩塌"] },
      reversed: { en: ["delayed shock", "avoidance", "private rupture"], zh: ["延迟冲击", "回避", "内在断裂"] }
    },
    meaning: {
      upright: { en: "A structure that could not hold reality is being exposed.", zh: "无法承载现实的结构正在被暴露。" },
      reversed: { en: "The rupture may be quieter, but the pressure is still real.", zh: "断裂也许更安静，但压力依然真实。" }
    },
    advice: { en: "Protect people, release the false structure.", zh: "保护人，释放虚假的结构。" },
    shadow: { en: "Rebuilding the same unstable tower.", zh: "重建同一座不稳定的塔。" },
    reflection: { en: ["What truth would simplify this, even if it hurts first?"], zh: ["哪个真相会先刺痛我，却让事情更简单？"] }
  },
  {
    id: "the-star",
    number: 17,
    name: { en: "The Star", zh: "星星" },
    symbol: "XVII",
    keywords: {
      upright: { en: ["hope", "renewal", "guidance"], zh: ["希望", "更新", "指引"] },
      reversed: { en: ["discouragement", "distance", "dimmed faith"], zh: ["受挫", "疏离", "信念变暗"] }
    },
    meaning: {
      upright: { en: "Hope returns as a quiet orientation, not a guarantee.", zh: "希望作为一种安静方向返回，而不是保证。" },
      reversed: { en: "You may be too far from the source that renews you.", zh: "你可能离滋养自己的源头太远。" }
    },
    advice: { en: "Rebuild trust through small, repeatable acts.", zh: "通过小而可重复的行动重建信任。" },
    shadow: { en: "Waiting for inspiration without tending the channel.", zh: "等待灵感，却不维护通道。" },
    reflection: { en: ["What small sign of renewal am I overlooking?"], zh: ["我忽略了哪个微小的更新迹象？"] }
  },
  {
    id: "the-moon",
    number: 18,
    name: { en: "The Moon", zh: "月亮" },
    symbol: "XVIII",
    keywords: {
      upright: { en: ["uncertainty", "dreams", "projection"], zh: ["不确定", "梦境", "投射"] },
      reversed: { en: ["revelation", "confusion lifting", "hidden fear"], zh: ["揭示", "迷雾散开", "隐藏恐惧"] }
    },
    meaning: {
      upright: { en: "The field is symbolic and uncertain; move slowly with evidence.", zh: "场域充满象征和不确定，请带着证据慢慢移动。" },
      reversed: { en: "Some fog is lifting, but the feeling still deserves care.", zh: "一些迷雾正在散开，但感受仍需要被照顾。" }
    },
    advice: { en: "Separate signal, story, and sensation.", zh: "区分信号、故事和身体感受。" },
    shadow: { en: "Letting fear narrate the whole scene.", zh: "让恐惧讲完整个故事。" },
    reflection: { en: ["What am I projecting onto the unknown?"], zh: ["我把什么投射到了未知之上？"] }
  },
  {
    id: "the-sun",
    number: 19,
    name: { en: "The Sun", zh: "太阳" },
    symbol: "XIX",
    keywords: {
      upright: { en: ["clarity", "vitality", "joy"], zh: ["清晰", "生命力", "喜悦"] },
      reversed: { en: ["dimmed joy", "overexposure", "forced optimism"], zh: ["喜悦变暗", "过度暴露", "强迫乐观"] }
    },
    meaning: {
      upright: { en: "Clarity and warmth make the next step easier to see.", zh: "清晰与温度让下一步更容易被看见。" },
      reversed: { en: "Brightness may feel blocked or performed rather than lived.", zh: "明亮可能被阻隔，或只是被表演而非被经验。" }
    },
    advice: { en: "Let what is healthy become visible.", zh: "让健康的东西变得可见。" },
    shadow: { en: "Using positivity to skip complexity.", zh: "用积极跳过复杂性。" },
    reflection: { en: ["What becomes simple when I stop hiding it?"], zh: ["当我不再隐藏时，什么会变得简单？"] }
  },
  {
    id: "judgement",
    number: 20,
    name: { en: "Judgement", zh: "审判" },
    symbol: "XX",
    keywords: {
      upright: { en: ["calling", "review", "awakening"], zh: ["召唤", "复盘", "觉醒"] },
      reversed: { en: ["self-judgment", "delay", "unanswered call"], zh: ["自我审判", "延迟", "未回应的召唤"] }
    },
    meaning: {
      upright: { en: "A larger pattern asks to be reviewed and answered.", zh: "一个更大的模式正在要求被复盘和回应。" },
      reversed: { en: "Harsh self-judgment may be blocking honest renewal.", zh: "严苛的自我审判可能阻碍诚实更新。" }
    },
    advice: { en: "Review without cruelty; answer without delay.", zh: "不带残酷地复盘，不再拖延地回应。" },
    shadow: { en: "Mistaking punishment for accountability.", zh: "把惩罚误作负责。" },
    reflection: { en: ["What call keeps returning?"], zh: ["哪个召唤一直在回来？"] }
  },
  {
    id: "the-world",
    number: 21,
    name: { en: "The World", zh: "世界" },
    symbol: "XXI",
    keywords: {
      upright: { en: ["completion", "integration", "belonging"], zh: ["完成", "整合", "归属"] },
      reversed: { en: ["unfinished cycle", "loose ends", "almost there"], zh: ["未完成周期", "收尾未清", "将近完成"] }
    },
    meaning: {
      upright: { en: "A cycle has reached wholeness; integration matters more than more effort.", zh: "一个周期已经趋于完整，整合比继续用力更重要。" },
      reversed: { en: "The ending is close, but a loose thread still needs care.", zh: "结束已经接近，但仍有线头需要处理。" }
    },
    advice: { en: "Complete the loop and let the lesson become portable.", zh: "闭合循环，让经验变得可携带。" },
    shadow: { en: "Refusing completion because identity formed around striving.", zh: "因为身份建立在奋斗上而拒绝完成。" },
    reflection: { en: ["What has already completed, even if I have not admitted it?"], zh: ["什么其实已经完成，只是我还没承认？"] }
  }
];

type SuitSeed = {
  id: "wands" | "cups" | "swords" | "pentacles";
  name: LocalizedText;
  element: LocalizedText;
  symbol: string;
  theme: LocalizedText;
  action: LocalizedText;
  shadow: LocalizedText;
  keywords: LocalizedList;
  zhMeasure: string;
};

type RankSeed = {
  id: string;
  number: number;
  name: LocalizedText;
  symbol: string;
  upright: LocalizedList;
  reversed: LocalizedList;
  movement: LocalizedText;
  blocked: LocalizedText;
};

const suits: SuitSeed[] = [
  {
    id: "wands",
    name: { en: "Wands", zh: "权杖" },
    element: { en: "Fire", zh: "火" },
    symbol: "W",
    theme: { en: "will, creativity, energy, and initiative", zh: "意志、创造力、能量与主动性" },
    action: { en: "act from the spark, but give it a shape", zh: "从火花出发，但给它形状" },
    shadow: { en: "burnout, haste, or ego heat", zh: "耗竭、仓促或自我之火" },
    keywords: { en: ["energy", "desire"], zh: ["能量", "欲望"] },
    zhMeasure: "权杖"
  },
  {
    id: "cups",
    name: { en: "Cups", zh: "圣杯" },
    element: { en: "Water", zh: "水" },
    symbol: "C",
    theme: { en: "feeling, relationship, intuition, and emotional meaning", zh: "感受、关系、直觉与情感意义" },
    action: { en: "honor the feeling and let it become clear", zh: "尊重感受，并让它逐渐清晰" },
    shadow: { en: "projection, moodiness, or emotional avoidance", zh: "投射、情绪化或情感回避" },
    keywords: { en: ["feeling", "connection"], zh: ["感受", "连接"] },
    zhMeasure: "圣杯"
  },
  {
    id: "swords",
    name: { en: "Swords", zh: "宝剑" },
    element: { en: "Air", zh: "风" },
    symbol: "S",
    theme: { en: "thought, language, conflict, and decision", zh: "思考、语言、冲突与决断" },
    action: { en: "name the thought and cut with care", zh: "说清思路，并谨慎切分" },
    shadow: { en: "overthinking, harshness, or cold distance", zh: "过度思考、严苛或冰冷距离" },
    keywords: { en: ["thought", "clarity"], zh: ["思考", "清晰"] },
    zhMeasure: "宝剑"
  },
  {
    id: "pentacles",
    name: { en: "Pentacles", zh: "星币" },
    element: { en: "Earth", zh: "土" },
    symbol: "P",
    theme: { en: "body, work, resources, skill, and material life", zh: "身体、工作、资源、技能与物质生活" },
    action: { en: "make the insight practical and repeatable", zh: "把洞察变成实际且可重复的行动" },
    shadow: { en: "scarcity, inertia, or measuring worth too narrowly", zh: "匮乏感、惯性或过度狭窄地衡量价值" },
    keywords: { en: ["resources", "practice"], zh: ["资源", "实践"] },
    zhMeasure: "星币"
  }
];

const ranks: RankSeed[] = [
  {
    id: "ace",
    number: 1,
    name: { en: "Ace", zh: "一" },
    symbol: "A",
    upright: { en: ["seed", "opening", "potential"], zh: ["种子", "开启", "潜能"] },
    reversed: { en: ["blocked start", "hesitation", "unused gift"], zh: ["开端受阻", "犹豫", "未使用的礼物"] },
    movement: { en: "a clean beginning is available", zh: "一个清洁的开始正在出现" },
    blocked: { en: "the beginning needs protection before it can move", zh: "这个开端需要先被保护，才能真正移动" }
  },
  {
    id: "two",
    number: 2,
    name: { en: "Two", zh: "二" },
    symbol: "2",
    upright: { en: ["choice", "balance", "partnership"], zh: ["选择", "平衡", "配对"] },
    reversed: { en: ["indecision", "imbalance", "split attention"], zh: ["迟疑", "失衡", "注意分裂"] },
    movement: { en: "two forces are learning how to relate", zh: "两股力量正在学习如何相互关联" },
    blocked: { en: "division or delay is clouding the next step", zh: "分裂或拖延正在遮蔽下一步" }
  },
  {
    id: "three",
    number: 3,
    name: { en: "Three", zh: "三" },
    symbol: "3",
    upright: { en: ["growth", "expression", "collaboration"], zh: ["生长", "表达", "协作"] },
    reversed: { en: ["misalignment", "thin support", "scattered growth"], zh: ["错位", "支持不足", "生长分散"] },
    movement: { en: "something begins to take shape through expression", zh: "某种东西通过表达开始成形" },
    blocked: { en: "the emerging form needs cleaner support", zh: "正在出现的形状需要更清洁的支持" }
  },
  {
    id: "four",
    number: 4,
    name: { en: "Four", zh: "四" },
    symbol: "4",
    upright: { en: ["stability", "container", "foundation"], zh: ["稳定", "容器", "基础"] },
    reversed: { en: ["stagnation", "insecurity", "tight grip"], zh: ["停滞", "不安", "抓得过紧"] },
    movement: { en: "a container can hold the work", zh: "一个容器可以承载这件事" },
    blocked: { en: "security may be turning into constraint", zh: "安全感可能正在变成束缚" }
  },
  {
    id: "five",
    number: 5,
    name: { en: "Five", zh: "五" },
    symbol: "5",
    upright: { en: ["friction", "change", "pressure"], zh: ["摩擦", "变化", "压力"] },
    reversed: { en: ["recovery", "avoidance", "unprocessed conflict"], zh: ["恢复", "回避", "未处理冲突"] },
    movement: { en: "pressure exposes what must change", zh: "压力暴露了必须改变之处" },
    blocked: { en: "the conflict needs repair instead of repetition", zh: "冲突需要修复，而不是重复" }
  },
  {
    id: "six",
    number: 6,
    name: { en: "Six", zh: "六" },
    symbol: "6",
    upright: { en: ["repair", "harmony", "exchange"], zh: ["修复", "和谐", "交换"] },
    reversed: { en: ["imbalance", "nostalgia", "uneven giving"], zh: ["失衡", "怀旧", "付出不均"] },
    movement: { en: "the system seeks a kinder exchange", zh: "系统正在寻找更温和的交换" },
    blocked: { en: "old comfort may be masking an uneven pattern", zh: "旧有舒适可能遮盖了不均衡模式" }
  },
  {
    id: "seven",
    number: 7,
    name: { en: "Seven", zh: "七" },
    symbol: "7",
    upright: { en: ["assessment", "challenge", "discernment"], zh: ["评估", "挑战", "辨别"] },
    reversed: { en: ["doubt", "defensiveness", "misread signal"], zh: ["怀疑", "防御", "误读信号"] },
    movement: { en: "discernment is needed before the next commitment", zh: "在下一次承诺前需要辨别" },
    blocked: { en: "doubt may be defending against useful feedback", zh: "怀疑可能正在抵挡有益反馈" }
  },
  {
    id: "eight",
    number: 8,
    name: { en: "Eight", zh: "八" },
    symbol: "8",
    upright: { en: ["movement", "practice", "refinement"], zh: ["移动", "练习", "精进"] },
    reversed: { en: ["delay", "busywork", "blocked flow"], zh: ["延迟", "忙碌假象", "流动受阻"] },
    movement: { en: "steady repetition creates real progress", zh: "稳定重复会制造真正进展" },
    blocked: { en: "motion may be happening without meaningful direction", zh: "行动可能很多，但缺少有意义的方向" }
  },
  {
    id: "nine",
    number: 9,
    name: { en: "Nine", zh: "九" },
    symbol: "9",
    upright: { en: ["ripeness", "solitude", "near completion"], zh: ["成熟", "独处", "接近完成"] },
    reversed: { en: ["fatigue", "overprotection", "incompletion"], zh: ["疲惫", "过度保护", "未完成"] },
    movement: { en: "the work is near a mature threshold", zh: "这件事接近成熟门槛" },
    blocked: { en: "fatigue may make the final stretch feel larger than it is", zh: "疲惫可能让最后一段显得过大" }
  },
  {
    id: "ten",
    number: 10,
    name: { en: "Ten", zh: "十" },
    symbol: "10",
    upright: { en: ["completion", "fullness", "consequence"], zh: ["完成", "充盈", "后果"] },
    reversed: { en: ["release", "burden", "unfinished integration"], zh: ["释放", "负担", "整合未完"] },
    movement: { en: "a cycle reaches fullness and asks for integration", zh: "一个周期抵达充盈，并要求整合" },
    blocked: { en: "completion may feel like burden without release", zh: "若不能释放，完成会像负担" }
  },
  {
    id: "page",
    number: 11,
    name: { en: "Page", zh: "侍从" },
    symbol: "Pg",
    upright: { en: ["learning", "message", "beginner mind"], zh: ["学习", "讯息", "初学者之心"] },
    reversed: { en: ["immaturity", "missed message", "inexperience"], zh: ["不成熟", "错过讯息", "经验不足"] },
    movement: { en: "a message or learning edge opens the path", zh: "一条讯息或学习边界打开道路" },
    blocked: { en: "the lesson needs humility before confidence", zh: "这门功课需要先有谦逊，再有自信" }
  },
  {
    id: "knight",
    number: 12,
    name: { en: "Knight", zh: "骑士" },
    symbol: "Kn",
    upright: { en: ["pursuit", "motion", "devotion"], zh: ["追求", "行动", "投入"] },
    reversed: { en: ["impulse", "restlessness", "misdirected drive"], zh: ["冲动", "躁动", "驱力错位"] },
    movement: { en: "motion seeks a worthy direction", zh: "行动正在寻找值得投入的方向" },
    blocked: { en: "drive needs guidance before speed", zh: "驱力需要先被引导，再加速" }
  },
  {
    id: "queen",
    number: 13,
    name: { en: "Queen", zh: "王后" },
    symbol: "Q",
    upright: { en: ["maturity", "receptivity", "stewardship"], zh: ["成熟", "接纳", "守护"] },
    reversed: { en: ["overextension", "withholding", "unstable care"], zh: ["过度延展", "收回", "照料不稳"] },
    movement: { en: "mature stewardship can hold complexity", zh: "成熟的守护可以承载复杂性" },
    blocked: { en: "care may need firmer boundaries to stay alive", zh: "照料需要更清楚的边界才能持续" }
  },
  {
    id: "king",
    number: 14,
    name: { en: "King", zh: "国王" },
    symbol: "K",
    upright: { en: ["mastery", "leadership", "responsibility"], zh: ["掌握", "领导", "责任"] },
    reversed: { en: ["domination", "rigidity", "misused power"], zh: ["支配", "僵化", "权力误用"] },
    movement: { en: "leadership asks for responsible embodiment", zh: "领导力要求负责任地落地" },
    blocked: { en: "authority needs humility or it becomes control", zh: "权威需要谦逊，否则会变成控制" }
  }
];

function makeMajor(seed: MajorSeed): TarotCard {
  return {
    ...seed,
    arcana: "major" satisfies Arcana
  };
}

function makeMinor(suit: SuitSeed, rank: RankSeed): TarotCard {
  const cardNameEn = `${rank.name.en} of ${suit.name.en}`;
  const cardNameZh = `${suit.zhMeasure}${rank.name.zh}`;

  return {
    id: `${rank.id}-of-${suit.id}`,
    name: { en: cardNameEn, zh: cardNameZh },
    arcana: "minor",
    suit: suit.name,
    rank: rank.name,
    number: rank.number,
    element: suit.element,
    symbol: `${rank.symbol}${suit.symbol}`,
    keywords: {
      upright: {
        en: [...rank.upright.en, ...suit.keywords.en].slice(0, 5),
        zh: [...rank.upright.zh, ...suit.keywords.zh].slice(0, 5)
      },
      reversed: {
        en: [...rank.reversed.en, suit.shadow.en.split(",")[0]],
        zh: [...rank.reversed.zh, suit.shadow.zh.split("、")[0]]
      }
    },
    meaning: {
      upright: {
        en: `${cardNameEn} suggests that ${rank.movement.en} within the realm of ${suit.theme.en}.`,
        zh: `${cardNameZh}提示：在${suit.theme.zh}的领域中，${rank.movement.zh}。`
      },
      reversed: {
        en: `${cardNameEn} reversed suggests that ${rank.blocked.en}; watch for ${suit.shadow.en}.`,
        zh: `${cardNameZh}逆位提示：${rank.blocked.zh}；也要留意${suit.shadow.zh}。`
      }
    },
    advice: {
      en: `Let ${suit.action.en}.`,
      zh: `请${suit.action.zh}。`
    },
    shadow: suit.shadow,
    reflection: {
      en: [`Where is ${suit.theme.en} asking for a ${rank.name.en.toLowerCase()}-level response?`],
      zh: [`在${suit.theme.zh}上，我需要做出怎样的“${rank.name.zh}”式回应？`]
    }
  };
}

export const tarotCards: TarotCard[] = [
  ...majorArcana.map(makeMajor),
  ...suits.flatMap((suit) => ranks.map((rank) => makeMinor(suit, rank)))
];

export const cardCount = tarotCards.length;
