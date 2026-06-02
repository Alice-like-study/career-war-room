import type { AgentKey } from "./agents-data";

export type PanelKey = "compass" | AgentKey;

export interface DemoMessage {
  role: "user" | "assistant";
  content: string;
  /** assistant 消息归属的 Agent；user 消息可省略 */
  agentKey?: PanelKey;
}

export interface PanelMeta {
  key: PanelKey;
  name: string;
  cn: string;
  icon: string;
  statusHint: string;
}

export const PANEL_ORDER: PanelKey[] = [
  "compass",
  "prism",
  "scope",
  "scalpel",
  "arena",
  "balance",
  "lumen",
];

export const PANEL_META: Record<PanelKey, PanelMeta> = {
  compass: {
    key: "compass",
    name: "Compass",
    cn: "总指挥",
    icon: "🧭",
    statusHint: "分诊调度 · 整合作战地图",
  },
  prism: {
    key: "prism",
    name: "Prism",
    cn: "自我画像官",
    icon: "🔮",
    statusHint: "5-7 轮情景追问 · 输出画像报告",
  },
  scope: {
    key: "scope",
    name: "Scope",
    cn: "行业匹配官",
    icon: "🔭",
    statusHint: "画像驱动 Top3 赛道 · 反直觉提醒",
  },
  scalpel: {
    key: "scalpel",
    name: "Scalpel",
    cn: "简历医生",
    icon: "🔪",
    statusHint: "诊断硬伤 · STAR 重写 · 三版差异化",
  },
  arena: {
    key: "arena",
    name: "Arena",
    cn: "模拟面试官",
    icon: "⚔️",
    statusHint: "行为/专业/压力面 · 逐句反馈",
  },
  balance: {
    key: "balance",
    name: "Balance",
    cn: "Offer 决策官",
    icon: "⚖️",
    statusHint: "7 维加权 · 理性最优 · 反直觉",
  },
  lumen: {
    key: "lumen",
    name: "Lumen",
    cn: "情绪陪跑官",
    icon: "💡",
    statusHint: "异步监测 · CBT 三步 · 最小行动",
  },
};

/** 默认展示：Prism 画像对话流（摘自官网 agent-demo-contents） */
export const DEFAULT_DEMO_AGENT: AgentKey = "prism";

export const CHAT_DEMOS: Record<PanelKey, DemoMessage[]> = {
  compass: [
    {
      role: "assistant",
      agentKey: "compass",
      content:
        "欢迎来到作战室。我是 Compass 总指挥——告诉我你现在卡在哪了：完全迷茫、简历没回音、要面试了、Offer 纠结，还是情绪低谷？",
    },
    {
      role: "user",
      content: "我完全迷茫，不知道自己适合什么，专业是工商管理，感觉什么都学了又什么都没学……",
    },
    {
      role: "assistant",
      agentKey: "compass",
      content:
        "收到。这种「什么都学了又什么都没学」的状态，最适合先走画像路径。我来调度 Prism——它会用情景追问帮你把真实行为拆成证据链，而不是贴标签。",
    },
  ],

  prism: [
    {
      role: "user",
      content: "我不知道自己适合做什么，专业是工商管理，感觉什么都学了，又什么都没学……",
    },
    {
      role: "assistant",
      agentKey: "prism",
      content:
        "先别急着给自己贴「没特长」的标签。问你个具体的——上一次你做某件事忘记时间，是在做什么？不用是「正事」，打游戏、整理东西、帮人改简历都算。",
    },
    {
      role: "user",
      content:
        "呃……上周室友要投外企，我帮他改中英文简历，从晚上九点改到凌晨两点，还查了好多面经。他拿到面试的时候，我比他还激动。",
    },
    {
      role: "assistant",
      agentKey: "prism",
      content:
        "那个「比他还激动」的瞬间，最爽的是什么？是他感谢你，还是你发现自己能把他的经历「翻译」成 HR 想看的样子？",
    },
    {
      role: "user",
      content: "后者吧——我发现他其实有很多被低估的亮点，只是自己不会写。",
    },
    {
      role: "assistant",
      agentKey: "prism",
      content:
        "你是一个「翻译型选手」——擅长把混沌经历翻译成高价值故事。价值观 Top1：影响力确认，工作直接改变他人结果。画像报告已生成，交给 Scope 做赛道匹配。",
    },
  ],

  scope: [
    {
      role: "user",
      content:
        "我是某 985 经管学院的，GPA 3.3，做过学生会主席，有两段券商实习但都是打杂。金融卷不动了，互联网又不了解，请问该投哪？",
    },
    {
      role: "assistant",
      agentKey: "scope",
      content:
        "收到 Prism 画像了。你画像里有个关键矛盾——「领导力标签强（学生会主席）但券商实习零成果产出」。这不是你不够努力，是赛道选错了：券商研究所要的是「能写深度报告的人」，不是「能组织活动的人」。",
    },
    {
      role: "assistant",
      agentKey: "scope",
      content:
        "推荐 1：互联网·产品运营 | 起薪 18-25W | 字节/美团/小红书。Prism 画像指出你擅长协调资源、推动跨部门合作——这正是产品运营的核心能力模型。\n\n⚠️ 地雷方向：券商研究所。两段实习让人误判，但零深度报告产出是隐形地雷。",
    },
  ],

  scalpel: [
    {
      role: "user",
      content: "我投了 80 份简历，只收到 8 个回复。是不是我真的不适合产品岗？",
    },
    {
      role: "assistant",
      agentKey: "scalpel",
      content:
        "先别怀疑你自己，先看你的文本。你简历第一行是「性格开朗，吃苦耐劳」，这在 HR 眼里等于空白。你不是没经历，是没把经历翻译成招聘方能判分的语言。",
    },
    {
      role: "user",
      content: "那我该怎么改？",
    },
    {
      role: "assistant",
      agentKey: "scalpel",
      content:
        "原句「负责校园二手交易平台运营，提升了用户活跃度」→ 诊断：动作词弱、无量化、无方法路径。\n\nSTAR 重写：DAU 200→1100（+450%），7 日留存 12%→34%，月 GMV 达 8 万。同一经历拆成产品岗版 / 运营岗版 / 金融岗版三套表达。",
    },
  ],

  arena: [
    {
      role: "user",
      content: "你好，我是应届生，想面互联网产品经理，但我从来没参加过正式面试，很紧张。",
    },
    {
      role: "assistant",
      agentKey: "arena",
      content:
        "紧张是正常的。我是 Arena，你的模拟面试官。接下来我会按真实面试流程分 5 轮考察你——行为面、专业面、压力面都会覆盖。先出题，你回答，然后我逐句反馈。",
    },
    {
      role: "user",
      content:
        "我叫小李，来自 XX 大学，学计算机的，对产品挺感兴趣的，做过一个校园二手交易小程序，希望能来贵公司学习。",
    },
    {
      role: "assistant",
      agentKey: "arena",
      content:
        "【优点】提到了具体项目，比「我很热爱产品」更有锚点。\n\n【硬伤】求职动机偏弱——公司招的是「能创造价值的人」，不是「来学习的人」；结果证据缺失，无法判定贡献。\n\n【改写示范】上线 3 周积累 1200 名用户，日均成交 40 单——把「来贵公司学习」换成「我能带来什么价值」，就是候选人与学生心态的分水岭。",
    },
  ],

  balance: [
    {
      role: "user",
      content:
        "手里有两个 offer：字节运营 base 北京 14k，AI 创业公司产品 base 上海 18k。两个都心动，但父母觉得大厂稳定……",
    },
    {
      role: "assistant",
      agentKey: "balance",
      content:
        "先别急，我帮你算一笔账。但算账之前，你得告诉我：钱 / 成长 / 稳定 / 城市 / 平台 / 直属上级 / 行业前景——这 7 个维度在你心里各占多少比重？总和必须是 100%。",
    },
    {
      role: "user",
      content: "成长 25%、钱 20%、稳定 15%、城市 10%、平台 10%、上级 10%、前景 10%。",
    },
    {
      role: "assistant",
      agentKey: "balance",
      content:
        "加权结果：字节运营 7.5 vs AI 创业产品 7.3，理性最优解是字节。\n\n反直觉提醒：如果「成长」真是你第一权重，AI 方案不应只落后 0.2——你可能在用「稳定」做最终裁决。建议冷静 24 小时，重填权重表后再决定。",
    },
  ],

  lumen: [
    {
      role: "user",
      content: "又投了一份，还是没消息。真的累了，不想改了，反正也不会有人要我。",
    },
    {
      role: "assistant",
      agentKey: "lumen",
      content:
        "我先帮你把状态拆开，不讲鸡汤。你现在不是「懒」，是连续投递后的情绪反噬。我们先把大脑从自证陷阱里拉出来，再谈下一步。",
    },
    {
      role: "assistant",
      agentKey: "lumen",
      content:
        "命名：自证陷阱——担心被拒绝 → 先否定自己 → 暂停行动。\n\n事实：你已经完成 12 次投递，这是有效行动。自动化想法：投了就必须马上有反馈。\n\n最小行动（10 分钟）：① 手机倒扣离开屏幕 3 分钟 ② 只改简历里一个动词，不做全量重写。完成后回复「done」，我再接你下一步。",
    },
  ],
};

/** 右栏状态文案 */
export function panelStatusFor(key: PanelKey, active: boolean): string {
  if (active) return `${PANEL_META[key].name} 演示中 · 点击其他军师切换对话`;
  return PANEL_META[key].statusHint;
}
