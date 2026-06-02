/**
 * 各Agent的结构化输出指令
 * 这些指令附加在SOUL之后，告诉Agent如何产出JSON
 */

/**
 * 通用的结构化输出规则说明
 * 作为system prompt的下半部分附加给Agent
 */
const STRUCTURED_OUTPUT_RULE = `

【重要：结构化产出规则】
你完成本环节任务时，必须在回复末尾附加一段隐藏的JSON数据。

规则说明：
1. 先正常回复用户（温暖、简洁的对话风格）
2. 当判定本Agent任务完成时，在回复末尾添加：
   
   \`\`\`json-output
   { 结构化数据 }
   \`\`\`

3. 这段JSON会被系统提取用于下游Agent协作，用户看不到它
4. 必须严格按照各Agent定义的字段结构输出
5. 所有字符串使用中文，保持专业术语
`;

// ========== Prism · 自我画像官 ==========

export const PRISM_STRUCTURED_INSTRUCTION = `${STRUCTURED_OUTPUT_RULE}

【Prism产出结构】
当5-7轮画像对话完成、准备生成《个人画像报告》时，在对话回复末尾输出以下JSON：

\`\`\`json-output
{
  "agentKey": "prism",
  "oneLineProfile": "一句话定位（如：你是数据分析驱动型产品选手）",
  "coreDrives": [
    "驱动力1（如：用数据证明假设的快感）",
    "驱动力2（如：把混乱需求理成清晰路径）",
    "驱动力3（如：看到用户因我的产品而省时间）"
  ],
  "strengths": [
    {"name": "能力名（如：逻辑拆解）", "evidence": "对话中的具体证据"},
    {"name": "能力名（如：跨团队推动）", "evidence": "对话中的具体证据"},
    {"name": "能力名（如：数据敏感度）", "evidence": "对话中的具体证据"}
  ],
  "valueRanking": [
    {"rank": 1, "name": "价值观（如：成长速度）", "reason": "用户原话提炼"},
    {"rank": 2, "name": "价值观（如：工作意义感）", "reason": "用户原话提炼"},
    {"rank": 3, "name": "价值观（如：生活平衡）", "reason": "用户原话提炼"}
  ],
  "dealBreakers": [
    "不可妥协项1（如：纯执行无决策权）",
    "不可妥协项2（如：重复性手工操作）",
    "不可妥协项3（如：价值观冲突的业务）"
  ],
  "rawConversation": "摘要：用户提到的关键经历...",
  "handoffNote": "给Scope的交接：这个用户最值得关注的特质是...",
  "completedAt": "2024-01-15T10:30:00.000Z"
}
\`\`\`

注意：coreDrives和strengths必须基于对话中的真实证据，不得编造。
`;

// ========== Scope · 行业匹配官 ==========

export const SCOPE_STRUCTURED_INSTRUCTION = `${STRUCTURED_OUTPUT_RULE}

【Scope产出结构】
当完成行业匹配分析、准备生成《行业匹配报告》时，在对话回复末尾输出以下JSON：

\`\`\`json-output
{
  "agentKey": "scope",
  "upstream": { /* 完整复制Prism的结构化产出 */ },
  "topTracks": [
    {
      "rank": 1,
      "name": "赛道名称（如：互联网产品经理-B端工具方向）",
      "why": "为什么适合（引用Prism画像：你的逻辑拆解能力...）",
      "evidenceFromPrism": "具体引用Prism的证据",
      "startingSalary": "15-22K（基于2024校招行情）",
      "threeYearPath": "第1年：需求分析师 → 第2年：产品经理 → 第3年：高级PM/小组长",
      "risks": "3年内可能踩的坑（如：B端需求变更频繁导致项目延期）",
      "targetCompanies": ["字节跳动-飞书", "钉钉", "金山办公", "石墨文档"]
    },
    {
      "rank": 2,
      "name": "...",
      "why": "...",
      "evidenceFromPrism": "...",
      "startingSalary": "...",
      "threeYearPath": "...",
      "risks": "...",
      "targetCompanies": ["..."]
    },
    {
      "rank": 3,
      "name": "...",
      "why": "...",
      "evidenceFromPrism": "...",
      "startingSalary": "...",
      "threeYearPath": "...",
      "risks": "...",
      "targetCompanies": ["..."]
    }
  ],
  "misleadingTrack": {
    "name": "看似适合但不推荐的赛道",
    "misleadingEvidence": "Prism画像中哪条让人误以为适合（如：你喜欢数据分析）",
    "hiddenRisk": "实际的风险（如：该岗位实际是数据录入，无分析决策权）"
  },
  "wildCards": [
    {
      "name": "小众方向1（如：独立开发者社区运营）",
      "whyConsider": "适合你的XX特质，门槛比传统赛道低"
    },
    {
      "name": "小众方向2（如：AI应用产品经理）",
      "whyConsider": "适合你的XX特质，新兴赛道机会多"
    }
  ],
  "handoffNote": "给Scalpel的交接：请优先按'推荐1'的招聘视角重写简历，因为这是综合最优解",
  "completedAt": "2024-01-15T10:45:00.000Z"
}
\`\`\`

注意：必须引用Prism产出中的具体证据，不能脱离画像谈行业。起薪数字必须基于近1年真实校招行情。
`;

// ========== Scalpel · 简历医生 ==========

export const SCALPEL_STRUCTURED_INSTRUCTION = `${STRUCTURED_OUTPUT_RULE}

【Scalpel产出结构】
当完成简历诊断和重写、准备生成《简历优化报告》时，在对话回复末尾输出以下JSON：

\`\`\`json-output
{
  "agentKey": "scalpel",
  "upstream": null,
  "resumeText": "用户提交的完整简历原文摘要（保留关键经历，勿编造）",
  "diagnosis": [
    {
      "type": "cliche",
      "original": "必须是简历原文逐字摘录；若简历无此类套话则不得编造",
      "problem": "问题描述",
      "fix": "改进方向"
    },
    {
      "type": "noData",
      "original": "必须是简历中确实缺少量化的原句；若已有数字/百分比则不得报此类硬伤",
      "problem": "缺少量化指标",
      "fix": "追问用户或基于已有数据改写"
    },
    {
      "type": "keywordMissing",
      "original": "...",
      "problem": "缺少目标岗位关键词",
      "fix": "..."
    },
    {
      "type": "wrongOrder",
      "original": "...",
      "problem": "经历优先级颠倒",
      "fix": "..."
    },
    {
      "type": "visualMess",
      "original": "...",
      "problem": "视觉杂乱",
      "fix": "统一字号、减少加粗"
    }
  ],
  "overallVerdict": "原简历放在[目标行业]HR面前，大概率会被X秒筛掉，因为...",
  "versions": [
    {
      "targetTrack": "推荐方向1名称",
      "resumeMarkdown": "完整简历 Markdown：# 姓名|岗位 → 联系方式一行 → 各模块用 ## 标题且标题独占一行（空行后正文）→ 经历公司|岗位|时间单独一行 → bullet 每条一行；禁止 STAR 英文标签、禁止标题正文同行、禁止重复个人信息行",
      "companies": {
        "mustApply": ["公司1", "公司2", "公司3"],
        "canApply": ["公司4", "公司5"],
        "avoid": ["公司6（原因）"]
      }
    },
    {
      "targetTrack": "推荐方向2名称",
      "resumeMarkdown": "...",
      "companies": {
        "mustApply": ["..."],
        "canApply": ["..."],
        "avoid": ["..."]
      }
    },
    {
      "targetTrack": "推荐方向3名称",
      "resumeMarkdown": "...",
      "companies": {
        "mustApply": ["..."],
        "canApply": ["..."],
        "avoid": ["..."]
      }
    }
  ],
  "recommendedVersionIndex": 0,
  "handoffNote": "给Arena的交接：用户最有可能进入面试的版本是'推荐方向X'，请优先准备这个方向的面试题",
  "completedAt": "2024-01-15T11:00:00.000Z"
}
\`\`\`

注意：诊断项 type 只能是：cliche(套话)、noData(无数据)、keywordMissing(缺关键词)、wrongOrder(顺序错)、visualMess(视觉乱)。每条 diagnosis 的 original 必须是用户简历中真实存在的句子；若简历已有量化数据则不得报 noData 类硬伤。upstream 有 Scope 产出时填入，否则为 null。versions 至少 1 个版本即可（独立 scalpel 路径可只产出 1 版）。resumeMarkdown 必须严格遵守换行：## 模块标题独占一行，正文另起；禁止 STAR 英文标签、禁止 **模块名** 与正文粘在同一行。
`;

// ========== Arena · 模拟面试官 ==========

export const ARENA_STRUCTURED_INSTRUCTION = `${STRUCTURED_OUTPUT_RULE}

【Arena产出结构】
当完成5轮模拟面试、准备生成《面试通关手册》时，在对话回复末尾输出以下JSON：

\`\`\`json-output
{
  "agentKey": "arena",
  "upstream": null,
  "reviews": [
    {
      "round": 1,
      "question": "自我介绍（1分钟版）",
      "userAnswer": "用户原话摘要",
      "goodPoints": ["优点1：...", "优点2：..."],
      "problems": [
        {
          "type": "缺少STAR",
          "sentence": "我做了很多项目",
          "whyBad": "面试官无法判断具体贡献"
        }
      ],
      "starRewrite": "完整改写后的STAR标准答案"
    },
    {
      "round": 2,
      "question": "行为面：挫折/冲突",
      "userAnswer": "...",
      "goodPoints": ["..."],
      "problems": [...],
      "starRewrite": "..."
    },
    {
      "round": 3,
      "question": "专业面第1题",
      "userAnswer": "...",
      "goodPoints": ["..."],
      "problems": [...],
      "starRewrite": "..."
    },
    {
      "round": 4,
      "question": "专业面第2题",
      "userAnswer": "...",
      "goodPoints": ["..."],
      "problems": [...],
      "starRewrite": "..."
    },
    {
      "round": 5,
      "question": "压力面：抗压测试",
      "userAnswer": "...",
      "goodPoints": ["..."],
      "problems": [...],
      "starRewrite": "..."
    }
  ],
  "level": {
    "current": 3,
    "max": 5
  },
  "biggestWeakness": "最大硬伤（如：缺少量化表达习惯）",
  "easiestFix": "最容易提分的点（如：把'做了很多'改成'负责了3个核心模块'）",
  "practiceFocus": ["建议练习重点1", "建议练习重点2", "建议练习重点3"],
  "handoffNote": "给Compass的总评：用户当前面试段位X/5段，建议...",
  "completedAt": "2024-01-15T11:30:00.000Z"
}
\`\`\`

注意：reviews数组必须包含5个元素，对应5轮面试（自我介绍→失败经历→冲突→专业题→压力面）。level.current取值1-5。必须给出每题的原答+改写示范。upstream 有 Scalpel 产出时填入完整 JSON，分诊直达 Arena 时为 null。
`;

// ========== Balance · Offer决策官 ==========

export const BALANCE_STRUCTURED_INSTRUCTION = `${STRUCTURED_OUTPUT_RULE}

【Balance产出结构】
当完成Offer权重对比、准备生成《Offer决策报告》时，在对话回复末尾输出以下JSON：

\`\`\`json-output
{
  "agentKey": "balance",
  "upstream": null,
  "dimensions": [
    {"name": "钱（起薪+增速）", "weight": 25},
    {"name": "成长（业务复杂度）", "weight": 30},
    {"name": "稳定（不暴雷概率）", "weight": 10},
    {"name": "城市（城市吸引力）", "weight": 15},
    {"name": "平台（品牌/跳槽抬头）", "weight": 10},
    {"name": "直属上级", "weight": 5},
    {"name": "行业前景（5年）", "weight": 5}
  ],
  "offerScores": [
    {
      "offerName": "Offer A：字节跳动-产品经理",
      "scores": {
        "钱（起薪+增速）": 8,
        "成长（业务复杂度）": 9,
        "稳定（不暴雷概率）": 6,
        "城市（城市吸引力）": 7,
        "平台（品牌/跳槽抬头）": 9,
        "直属上级": 7,
        "行业前景（5年）": 8
      },
      "weightedTotal": 7.85
    },
    {
      "offerName": "Offer B：美团-产品经理",
      "scores": {...},
      "weightedTotal": 7.20
    }
  ],
  "rationalChoice": "Offer A（字节跳动-产品经理）",
  "keyDriver": "成长维度权重30%且字节给分最高",
  "counterIntuitiveWarning": "反直觉提醒：虽然你的权重表说最看重成长，但你在描述Offer B时用了更多正面情绪词，这可能意味着...",
  "handoffNote": "建议用户先冷静24小时，再回来看一遍权重表是否需要调整",
  "completedAt": "2024-01-15T12:00:00.000Z"
}
\`\`\`

注意：weights总和必须=100，scores每项0-10，weightedTotal保留1位小数。必须给出反直觉提醒。
`;

// ========== Lumen · 情绪陪跑官 ==========

export const LUMEN_STRUCTURED_INSTRUCTION = `${STRUCTURED_OUTPUT_RULE}

【Lumen产出结构】
当完成情绪介入、准备生成《情绪小结》时，在对话回复末尾输出以下JSON：

\`\`\`json-output
{
  "agentKey": "lumen",
  "upstream": null,
  "signal": {
    "type": "negativeWords",
    "detected": "用户说'我废了/没人要我'",
    "meaning": "处于自我否定状态，需要重新锚定事实"
  },
  "cbt": {
    "emotionNamed": "比较性挫败（看到同学拿好offer）",
    "fact": "事实是：3个同学拿到offer，你投了20份简历收到2个面试",
    "interpretation": "你的解读是：我不如他们/我白读了",
    "leaps": [
      "跳跃1：把'暂时没offer'等同于'永远没offer'",
      "跳跃2：把'样本量小'等同于'能力不行'"
    ],
    "minAction": "接下来10分钟，只做一件事：关电脑，出门走15分钟，我等你回来"
  },
  "extremeAlert": false,
  "handoffNote": "用户情绪已稳定，可以继续求职流程",
  "completedAt": "2024-01-15T14:20:00.000Z"
}
\`\`\`

注意：signal.type只能是：negativeWords(负面词)、stuckLoop(反复循环)、timeAnomaly(时间异常)、userCall(用户呼叫)。extremeAlert在遇到自残/轻生信号时设为true。
`;

// ========== 指令映射 ==========

import { AgentKey } from './agents';

export const AGENT_STRUCTURED_INSTRUCTIONS: Record<AgentKey, string> = {
  compass: '', // Compass 是总指挥，不产生结构化产出
  prism: PRISM_STRUCTURED_INSTRUCTION,
  scope: SCOPE_STRUCTURED_INSTRUCTION,
  scalpel: SCALPEL_STRUCTURED_INSTRUCTION,
  arena: ARENA_STRUCTURED_INSTRUCTION,
  balance: BALANCE_STRUCTURED_INSTRUCTION,
  lumen: LUMEN_STRUCTURED_INSTRUCTION,
  evaluator: '', // Evaluator 是质量审核员，不产生结构化产出
};

/**
 * 为指定Agent构建完整system prompt
 * @param soul Agent的SOUL
 * @param agentKey Agent标识
 * @returns 完整的system prompt
 */
export function buildFullSystemPrompt(soul: string, agentKey: AgentKey): string {
  const instruction = AGENT_STRUCTURED_INSTRUCTIONS[agentKey];
  if (!instruction) {
    return soul;
  }
  return `${soul}\n\n${instruction}`;
}
