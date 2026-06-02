/**
 * Agent 展示数据 — 摘自 lib/agents.ts、components/sections/AgentsSection.tsx
 */

export type AgentKey = "prism" | "scope" | "scalpel" | "arena" | "balance" | "lumen";

export interface AgentCardData {
  key: AgentKey;
  name: string;
  cn: string;
  icon: string;
  oneLiner: string;
  keywords: string[];
  methodology: string;
  personaKeywords: string;
}

export const COMPASS = {
  name: "Compass",
  cn: "领航官 · 总指挥",
  icon: "🧭",
  role: "分诊用户需求 · 调度 6 位军师 · 整合《校招作战地图》",
} as const;

export const AGENT_CARDS: AgentCardData[] = [
  {
    key: "prism",
    name: "Prism",
    cn: "棱镜 · 自我画像官",
    icon: "🔮",
    oneLiner: "把真实行为拆成可复用的画像证据链。",
    keywords: ["画像挖掘", "价值锚", "证据链"],
    personaKeywords: "探索型 · 情景追问 · 5-7 轮出报告",
    methodology:
      "5-7 轮情景化追问：从「上次忘记时间是在做什么」等行为问题，挖出兴趣、能力、价值观与不可妥协项，输出带证据链的《个人画像报告》。",
  },
  {
    key: "scope",
    name: "Scope",
    cn: "望远镜 · 行业匹配官",
    icon: "🔭",
    oneLiner: "用画像证据匹配赛道，不给模糊建议。",
    keywords: ["赛道匹配", "起薪图", "路径图"],
    personaKeywords: "行业老兵 · 证据驱动 · 反直觉提醒",
    methodology:
      "基于 Prism 画像匹配 Top 3 赛道，给出起薪、3 年路径、典型公司与「看似适合但不推荐」的地雷方向，每条推荐必须引用画像证据。",
  },
  {
    key: "scalpel",
    name: "Scalpel",
    cn: "手术刀 · 简历医生",
    icon: "🔪",
    oneLiner: "把经历重写成招聘方能秒读的证据句。",
    keywords: ["简历刀", "STAR", "数字证"],
    personaKeywords: "逐字诊断 · 三版差异化 · 一页纸",
    methodology:
      "诊断 5 个硬伤（须引用简历原文），针对 Scope 推荐的 3 个行业各产出一版差异化简历，bullet 动词开头、量化结果、HR 可直接投递。",
  },
  {
    key: "arena",
    name: "Arena",
    cn: "沙盘 · 模拟面试官",
    icon: "⚔️",
    oneLiner: "按真实流程压测，让表达形成肌肉记忆。",
    keywords: ["压力面", "逐句改", "复盘册"],
    personaKeywords: "老炮面试官 · 三段反馈 · 压力测试",
    methodology:
      "5 轮模拟面试（行为面 + 专业面 + 压力面），每轮给优点/硬伤/STAR 改写示范，最终输出《面试通关手册》与段位评估。",
  },
  {
    key: "balance",
    name: "Balance",
    cn: "天平 · Offer 决策官",
    icon: "⚖️",
    oneLiner: "让情绪与现实同屏，算出可解释的取舍。",
    keywords: ["权重表", "双方案", "反直觉"],
    personaKeywords: "7 维加权 · 理性最优 · 内心一致性",
    methodology:
      "收集 7 维度权重（钱/成长/稳定/城市/平台/上级/前景），对每个 Offer 打分加权，给出理性最优解 + 反直觉提醒（嘴上排序 vs 真实排序）。",
  },
  {
    key: "lumen",
    name: "Lumen",
    cn: "暖灯 · 情绪陪跑官",
    icon: "💡",
    oneLiner: "在崩溃边缘时兜底，把人拉回可行动状态。",
    keywords: ["情绪陪跑", "CBT", "异步监听"],
    personaKeywords: "暖灯 · 不哄不教训 · 最小行动",
    methodology:
      "全程异步监测负面词/反复修改/凌晨在线等信号，CBT 三步法（命名情绪 → 拆解事实 vs 解读 → 10 分钟最小行动），不替用户做决定。",
  },
];

/** 摘自 components/agent-demo-contents.tsx 典型输出片段 */
export const AGENT_SAMPLE_OUTPUTS: Record<AgentKey, string[]> = {
  prism: [
    '你是一个"翻译型选手"——擅长把混沌经历翻译成高价值故事。',
    "价值观 Top1：影响力确认 — 工作直接改变他人结果",
    "给 Scope：优先关注其叙事重构力与跨部门协调证据",
  ],
  scope: [
    "推荐 1：互联网·产品运营 | 起薪 18-25W | 字节/美团/小红书",
    "⚠️ 券商研究所：两段实习让人误判，零深度报告是隐形地雷",
    "给 Scalpel：优先按推荐 1 的招聘视角重写简历",
  ],
  scalpel: [
    '原句"负责运营"→ DAU 200→1100（+450%），7日留存 12%→34%',
    "硬伤：套话开场、无量化、关键词缺失、经历顺序颠倒",
    "给 Arena：产品岗版最可能进面，优先准备该方向题库",
  ],
  arena: [
    '硬伤："来贵公司学习"→ 应换成"我能带来什么价值"',
    "压力面：「实习都很水，有什么真本事？」— 测抗压",
    "段位 3/5 · 最易提分：自我介绍的结果证据",
  ],
  balance: [
    "理性最优解：字节运营 7.5 vs AI 创业 7.3",
    "反直觉：嘴上说成长第一，实际用稳定做最终裁决",
    "建议冷静 24 小时，重填权重表后再决定",
  ],
  lumen: [
    "信号：连续投递后停摆 +「反正没人要我」",
    "命名：自证陷阱 — 担心被拒 → 先否定自己",
    "最小行动：只改简历里一个动词，不做全量重写",
  ],
};

export const FOUNDER_STORY = {
  quote: "你纠结的从来不是选项本身，是怕自己又一次走错方向。",
  attribution: "—— Prism · 棱镜 给作者的画像，2026.5",
  narrative: `春招最熬人的那个凌晨，我用自己真实的状态测试刚搭好的 Agent——本打算用虚拟人设，却下意识填了自己的经历。

Prism 5 轮对话后，它说对了那句话。没有任何朋友、HR 在 5 轮内准确说过。

我突然明白：作战部的价值不是把求职流程自动化，而是在被父母、KPI、同辈压力裹挟的应届生面前，用 5 轮对话告诉对方——你是谁，你想要什么。`,
} as const;

export const CLOSING = {
  tagline: "7 位 AI 军师做不到代替你做选择，但它们能让选择不再孤独。",
  author: "Alice",
  github: "https://github.com/Alice-like-study/career-war-room",
  product: "https://career-war-room-omega.vercel.app",
  contact: "GitHub @Alice-like-study",
} as const;

export const TECH_DECISIONS = [
  {
    id: "state-machine",
    title: "可执行对话状态机",
    summary: "把 Agent 方法论从提示词文档重构为代码控制的对话流",
    benefit: "追问质量可控 · 报告与对话分离 · 步骤可审计",
    detail:
      "chat/page.tsx 用 flowMode + step + followupUsed 控制每步只问一个问题；结构化 JSON 产出与 Evaluator 审核闭环，不再靠长对话碰运气。",
  },
  {
    id: "model-adapter",
    title: "模型适配层",
    summary: "业务代码与具体大模型供应商解耦",
    benefit: "切换模型只需改 lib/config.ts 一处配置",
    detail:
      "lib/llm.ts 通过 MODEL_CONFIG.provider 路由到 Kimi / 预留 Doubao·DeepSeek·Claude 位，Agent Runner 只调用 askLLM()。",
  },
  {
    id: "architecture",
    title: "架构重构判断",
    summary: "识别 EasyClaw 客户端依赖风险后，主动重构为自主 Web 架构",
    benefit: "使用门槛从「下载客户端」降为「打开网页即用」",
    detail:
      "保留 6 位 Agent 的 SOUL/IDENTITY 人设资产，将 Pipeline 迁入 Next.js + Vercel；原 Skill 包资产完整保留。",
  },
] as const;
