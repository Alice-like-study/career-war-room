"use client";

/**
 * 「应届生求职作战部 · 作战室」—— 左栏对话 + 右栏军师状态，
 * SOUL：Compass（总指挥）+ 当前军师；流式正文解析 [Agent] 前缀调度 UI。
 * 新增「分诊预选」环节：进入页面先选路径，再进入对应对话。
 * 新增「6条路径统一结构化脚本机制」：AGENT_SCRIPTS 配置驱动，
 * 代码控制进度推进 + 追问逻辑 + 各交付物自动生成。
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toPng } from "html-to-image";
import { AGENTS, type AgentKey } from "@/lib/agents";
import { AgentOutput, AgentOutputMap } from "@/lib/agent-outputs";
import {
  getUpstreamOutput,
  getOutputSummary,
  stripStructuredOutputFromReply,
} from "@/lib/agent-client-utils";
import { buildFullSystemPrompt } from "@/lib/agent-instructions";
import {
  detectScalpelFinishSignal,
  extractRewrittenResumeFromReport,
  formatScalpelReportMarkdown,
  getScalpelEffectiveStepCount,
  getScalpelEffectiveSteps,
  getScalpelGaps,
  isScalpelAffirmative,
  resumeReadyForReport,
} from "@/lib/scalpel-resume-utils";
import type { ScalpelOutput, ScopeOutput, ArenaOutput, BalanceOutput, LumenOutput } from "@/lib/agent-outputs";
import {
  formatAgentReportMarkdown,
  detectEmotionSignal,
  detectExtremeSignal,
  analyzeWarRoomIntents,
  LUMEN_HOTLINE,
} from "@/lib/agent-report-utils";
import { ResumeInput } from "./ResumeInput";
import ResumeTemplate from "@/components/ResumeTemplate";

/**
 * 与页面外层 `pt-8` + `pb-12` 对齐：左栏对话卡总高度 = 视口高度减去垂直留白，
 * 避免消息增多时整块被内容撑长。
 */
const LEFT_CHAT_PANEL_HEIGHT = "calc(100vh - 5rem)";

/** 右栏卡片顺序（与需求一致） */
const PANEL_ORDER: AgentKey[] = [
  "compass",
  "prism",
  "scope",
  "scalpel",
  "arena",
  "balance",
  "lumen",
];

// ─── 分诊相关类型与常量 ───────────────────────────────────────────────────────

/** 分诊模式枚举：triage = 分诊中，其余为各路径入口 */
type TriageMode = "triage" | "prism_flow" | "scope_flow" | "scalpel" | "arena" | "balance" | "lumen";

/** 去掉 triage 的路径模式类型（有结构化脚本的6条路径） */
type FlowMode = Exclude<TriageMode, "triage">;

/** 分诊选项：图标 + 文案 + 对应 mode */
const TRIAGE_OPTIONS: Array<{
  icon: string;
  label: string;
  mode: FlowMode;
}> = [
  { icon: "🧭", label: "我完全迷茫，不知道自己适合什么", mode: "prism_flow" },
  { icon: "🔪", label: "我有方向了，但简历石沉大海", mode: "scalpel" },
  { icon: "⚔️", label: "我要面试了，想练一练", mode: "arena" },
  { icon: "⚖️", label: "我手上有几个offer，纠结选哪个", mode: "balance" },
  { icon: "💡", label: "我就是有点撑不住，想说说话", mode: "lumen" },
];

/**
 * 分诊 mode → 右栏高亮的 AgentKey 映射；
 * triage 时 compass 已在首条消息中，不单独高亮。
 */
const MODE_TO_AGENT: Partial<Record<TriageMode, AgentKey>> = {
  prism_flow: "prism",
  scope_flow: "scope",
  scalpel: "scalpel",
  arena: "arena",
  balance: "balance",
  lumen: "lumen",
};

// ─── 作战地图 system prompt ──────────────────────────────────────────────────

/** 《校招作战地图》专用 system：与日常对话的 buildWarRoomSystem 完全分离 */
const BATTLE_MAP_SYSTEM_PROMPT = `你是 Compass 总指挥。请根据以上完整对话内容，整合6位军师的分析，
生成一份《个人校招作战地图》。严格用以下 Markdown 结构输出，不要有多余的话：

# 🗺 你的校招作战地图

## 📍 一句话画像
[基于对话提炼一句精准的定位句]

## 🔥 核心驱动力
1. [驱动力1]
2. [驱动力2]
3. [驱动力3]

## 💪 能力长板 Top3
1. **[能力名]**：[一句话说明 + 对话中的证据]
2. **[能力名]**：[一句话说明 + 对话中的证据]
3. **[能力名]**：[一句话说明 + 对话中的证据]

## ⚠️ 当前求职短板
1. [短板 + 改进建议]
2. [短板 + 改进建议]

## 🎯 推荐赛道 Top3
1. **[赛道名]**：[为什么适合 + 起步方向]
2. **[赛道名]**：[为什么适合 + 起步方向]
3. **[赛道名]**：[为什么适合 + 起步方向]

## 📅 本周立即行动
1. [今天就能做的第一步]
2. [本周内完成的第二步]
3. [面试/投递前必须做的第三步]

---
*由应届生求职作战部 · 7位AI军师协作生成*

语气：温暖、精准、不废话。所有内容必须基于上面的真实对话，不要编造。
如果对话信息不足，就基于已有信息合理推断，但不要写空话套话。`;

// ─── 每步定义类型 ─────────────────────────────────────────────────────────────

type StepDef = {
  /** 本步挖掘方向（用于右栏进度条说明文字） */
  focus: string;
  /** 本步核心问题（注入进 system prompt，AI 可据语境微调措辞） */
  question: string;
};

// ─── 统一脚本配置 AGENT_SCRIPTS ───────────────────────────────────────────────

/**
 * 每条路径的完整配置。
 * 所有路径复用同一套「进度推进 + 追问 + 交付物生成」机制，
 * 差异仅在此处声明，代码层零重复。
 */
type AgentScriptConfig = {
  /** 对应右栏哪张卡片（走完后标记为「已完成」） */
  agentKey: AgentKey;
  /**
   * 是否需要先收集简历原文再开始追问步骤（scalpel 专用）。
   * true 时：入场后先用 SCALPEL_RESUME_SYSTEM 请求用户粘贴简历，
   * 拿到简历后 resumeCollected 置 true，再进入 steps[0]。
   */
  needResume: boolean;
  /** 追问步骤列表（每步一个方向 + 一个核心问题） */
  steps: readonly StepDef[];
  /** 抽屉标题，如《个人画像报告》 */
  reportTitle: string;
  /** 抽屉副标题（出品方描述） */
  reportDrawerSubtitle: string;
  /** 生成交付物的 system prompt（发给 /api/chat，基于完整对话生成 Markdown） */
  reportSystemPrompt: string;
  /**
   * 所有步骤走完后 AI 在对话里的收尾 system。
   * 只做简短告知（3句话内），不在对话里直接输出报告内容。
   * 报告由 handleGenerateReport 单独在抽屉里生成。
   */
  wrapSystemPrompt: string;
};

const AGENT_SCRIPTS: Record<FlowMode, AgentScriptConfig> = {

  // ━━ prism_flow：自我画像 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  prism_flow: {
    agentKey: "prism",
    needResume: false,
    steps: [
      { focus: "挖心流体验",    question: "上次你做某件事忘了时间，是在做什么？" },
      { focus: "挖解决难题",    question: "你解决过最难的问题是什么？当时是怎么一步步拆解的？" },
      { focus: "挖协作定位",    question: "团队合作时，别人最常找你做什么？" },
      { focus: "挖价值观",      question: "月薪1.5万去你不喜欢的城市，和月薪8千去你喜欢的城市，你选哪个？为什么？" },
      { focus: "挖不可妥协项",  question: "什么样的工作内容，会让你觉得是在浪费生命？" },
    ],
    reportTitle: "《个人画像报告》",
    reportDrawerSubtitle: "Prism · 自我画像官",
    reportSystemPrompt: `你是 Prism，应届生求职作战部的自我画像官。
请根据以上完整对话内容，整合用户在5轮问答中展现的真实信息，生成一份《个人画像报告》。
严格用以下 Markdown 结构输出，不要有多余的话：

# 🔮 个人画像报告

## 💫 一句话画像
你是一个 ____型选手。

## 💪 三大核心能力
1. **[能力名]**：[证据：对话中的具体行为或经历]
2. **[能力名]**：[证据：对话中的具体行为或经历]
3. **[能力名]**：[证据：对话中的具体行为或经历]

## 🧭 价值观排序 Top 3
1. ____ —— 因为____
2. ____ —— 因为____
3. ____ —— 因为____

## 🚫 三条不可妥协项
❌ 不接受 ____
❌ 不接受 ____
❌ 不接受 ____

## 🎯 给 Scope（行业匹配官）的交接备注
[一段话描述这个用户最值得 Scope 关注的特质与方向]

---
*由 Prism · 自我画像官 基于5轮深度对话生成*

语气：温暖、精准、不废话。所有内容必须基于上面的真实对话，不要编造。`,
    wrapSystemPrompt: `${AGENTS.compass.soul}

【你现在是 Prism · 自我画像官】
${AGENTS.prism.soul}

【任务完成 · 5轮画像问答全部结束】
请用温暖简洁的语气（3句话以内）告知用户：
1. 感谢他们的真诚分享
2. 5轮画像素材已全部收集完毕
3. 请点击对话区下方的「生成个人画像报告」按钮，报告将在右侧面板中呈现

不要在此处输出报告内容，也不要输出任何 JSON 或代码块。`,
  },

  // ━━ scope_flow：行业匹配（Prism 完成后，零步直接生成）━━━━━━━━━━━━━━━━━━━━━━━━
  scope_flow: {
    agentKey: "scope",
    needResume: false,
    steps: [],
    reportTitle: "《行业匹配报告》",
    reportDrawerSubtitle: "Scope · 行业匹配官",
    reportSystemPrompt: `你是 Scope，应届生求职作战部的行业匹配官。
请根据以上 Prism 画像对话与结构化产出，直接生成《行业匹配报告》。
严格用以下 Markdown 结构输出，不要有多余的话：

# 🔭 行业匹配报告

## TL;DR
基于你的画像，你最该关注的方向是：____。
原因一句话：____。

## Top 3 推荐方向
（每条含：为什么适合、画像证据、起薪、3年路径、风险、典型公司）

## ⚠️ 看似适合但不推荐
____

## 💡 野路子但值得考虑
____

## 🎯 给 Scalpel 的交接
____

---
*由 Scope · 行业匹配官 基于 Prism 画像生成*

铁律：必须引用 Prism 画像中的具体证据；起薪基于近1年校招行情；必须给出「看似适合但不推荐」方向。`,
    wrapSystemPrompt: `${AGENTS.compass.soul}

【你现在是 Scope · 行业匹配官】
${AGENTS.scope.soul}

【任务完成】
请用简洁语气（2句话内）告知用户《行业匹配报告》正在右侧面板生成。`,
  },

  // ━━ scalpel：简历医生 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  scalpel: {
    agentKey: "scalpel",
    needResume: true, // 先让用户粘贴简历，再开始4轮追问
    steps: [
      { focus: "确认目标方向",  question: "你想投的是什么岗位/行业？" },
      { focus: "挖项目数据",    question: "简历里最相关的那段经历，你具体做了什么？有数据支撑吗？" },
      { focus: "挖成果量化",    question: "这件事的结果怎么衡量？用户量/时间/成本省了多少？" },
      { focus: "挖差异化",      question: "同样的事别人也能做，你做得有什么不一样？" },
    ],
    reportTitle: "《简历优化报告》",
    reportDrawerSubtitle: "Scalpel · 简历医生",
    reportSystemPrompt: `你是 Scalpel，应届生求职作战部的简历医生。
请根据以上完整对话内容（包含用户提供的简历原文和追问回答），生成一份《简历优化报告》。
严格用以下 Markdown 结构输出，不要有多余的话：

# 🔪 简历优化报告

## 🩺 原简历5个硬伤诊断
每条「原句」必须是用户简历中逐字出现的句子；不得编造简历里没有的内容（如性格套话、不存在的项目）。
若简历某类问题不存在，换找其他真实硬伤，不足5条则如实列出。
1. **[硬伤类型]**："[原句]"
   - 问题：____
   - 改进方向：____
2. （同上格式，最多5条）

## ✅ 重写后的完整简历

> 铁律：必须输出完整简历全文，不能写"此处省略"；所有数字基于用户真实回忆，不编造。
> 格式（严格遵守换行，标题与正文不得写在同一行）：
> - 第1行：# 姓名 | 目标岗位
> - 第2行：手机：… | 邮箱：…（仅写一次；正文不要再重复「姓名|电话|邮箱」个人信息行）
> - 每个模块：先单独一行写 ## 教育背景（或实习经历/项目经历等），空一行后再写该模块正文
> - 公司｜岗位｜时间 单独一行；每条 bullet 单独一行
> - 禁止用 **教育背景** 与正文粘在同一行；禁止 Situation/Task/Action/Result 等 STAR 英文标签

\`\`\`markdown
[完整可复制的简历全文，标准中文简历 Markdown，可直接投递]
\`\`\`

## 🎯 投递策略
- **必投**：[公司列表 + 原因]
- **可投**：[公司列表]
- **暂缓**：[公司列表 + 原因]

---
*由 Scalpel · 简历医生 基于简历原文+追问生成*

语气：直接、精准。所有内容基于用户真实回忆，不编造数字。`,
    wrapSystemPrompt: `${AGENTS.compass.soul}

【你现在是 Scalpel · 简历医生】
${AGENTS.scalpel.soul}

【任务完成 · 简历素材全部收集完毕】
请用简洁直接的语气（3句话以内）告知用户：
1. 简历原文和4轮追问素材已全部收集
2. 请点击下方「生成简历优化报告」按钮，报告将在右侧面板呈现（含硬伤诊断与改写版简历）
3. 生成后可复制或下载

不要在此处输出报告内容，也不要输出任何 JSON 或代码块。`,
  },

  // ━━ arena：模拟面试官（5题：自我介绍→失败→冲突→专业→压力）━━━━━━━━━━━━━━━━
  arena: {
    agentKey: "arena",
    needResume: false,
    steps: [
      { focus: "自我介绍",          question: "请做一个1分钟的自我介绍（若尚未说明目标岗位，请先简要说明你要投的方向）。" },
      { focus: "行为面：失败经历",  question: "讲一个你失败的经历，以及你从中学到了什么。" },
      { focus: "行为面：冲突经历",  question: "讲一个你和同伴有冲突的经历，你是怎么处理的？" },
      { focus: "专业面",            question: "（根据目标岗位出1道专业题，一题即可）" },
      { focus: "压力面：抗压测试",  question: "（故意刁难）我看你的经历比较普通，能证明你和其他候选人有什么不一样吗？" },
    ],
    reportTitle: "《面试通关手册》",
    reportDrawerSubtitle: "Arena · 模拟面试官",
    reportSystemPrompt: `你是 Arena，应届生求职作战部的模拟面试官。
请根据以上完整对话内容（5轮模拟面试问答），生成一份《面试通关手册》。
严格用以下 Markdown 结构输出，不要有多余的话：

# ⚔️ 面试通关手册

## 📋 5道题复盘

### 第1题：[题目]
**你的原答：** [原话摘要]
**改写示范：** [STAR框架标准答案]
**核心提分点：** ____

### 第2题：[题目]
（同上格式）

### 第3题：[题目]
（同上格式）

### 第4题：[题目]
（同上格式）

### 第5题（压力面）：[题目]
**你的原答：** [原话摘要]
**改写示范：** [应对压力面的标准答案]
**核心提分点：** ____

## 📊 面试段位评估
当前段位：____ / 5段
最大硬伤：____
最容易提分的点：____

## 🎯 提分建议
1. ____
2. ____
3. ____

---
*由 Arena · 模拟面试官 基于5轮模拟面试生成*

铁律：每题都必须给"用户原答 + 改写示范"；压力面必须单独点评抗压表现。`,
    wrapSystemPrompt: `${AGENTS.compass.soul}

【你现在是 Arena · 模拟面试官】
${AGENTS.arena.soul}

【任务完成 · 5轮模拟面试全部结束】
请用简洁有力的语气（3句话以内）告知用户：
1. 5轮模拟面试已全部完成
2. 请点击下方「生成面试通关手册」按钮，手册将在右侧面板呈现
3. 生成后可复制或下载

不要在此处输出手册内容，也不要输出任何 JSON 或代码块。`,
  },

  // ━━ balance：Offer决策官（4步：offer→权重→打分确认→报告）━━━━━━━━━━━━━━━━━━━━
  balance: {
    agentKey: "balance",
    needResume: false,
    steps: [
      { focus: "收集offer信息",  question: "你手上几个 offer？分别什么公司、岗位、城市、薪资？每项尽量具体。" },
      { focus: "收集7维度权重",  question: "请给7个维度分配权重（总和必须=100%）：钱/成长/稳定/城市/平台/直属上级/行业前景。直接说数字即可。" },
      { focus: "逐项打分确认",   question: "我来帮你初步打分——请确认：每个 offer 在「成长」和「钱」这两维，你直觉打几分（1-10）？其他维度我基于你的描述来估，你随时纠正。" },
      { focus: "反直觉核对",     question: "基于加权对比，理性最优解是 ____。听到这个结论，你第一反应是认同、犹豫还是抗拒？诚实说。" },
    ],
    reportTitle: "《Offer决策报告》",
    reportDrawerSubtitle: "Balance · Offer决策官",
    reportSystemPrompt: `你是 Balance，应届生求职作战部的Offer决策官。
请根据以上完整对话内容（用户的offer信息和权重偏好），生成一份《Offer决策报告》。
严格用以下 Markdown 结构输出，不要有多余的话：

# ⚖️ Offer决策报告

## 📊 你的权重表

| 维度 | 你的权重 |
|------|---------|
| 钱（起薪+增速） | __% |
| 成长（业务复杂度） | __% |
| 稳定（不暴雷概率） | __% |
| 城市（城市吸引力） | __% |
| 平台（品牌/跳槽抬头） | __% |
| 直属上级 | __% |
| 行业前景（5年） | __% |
| **总计** | **100%** |

## 📋 各Offer加权对比

| 维度 | 权重 | [Offer A] 得分 | 加权 | [Offer B] 得分 | 加权 |
|------|------|--------------|------|--------------|------|
[按维度逐行列出，最后一行输出加权总分]

## 🎯 理性最优解
基于你的权重，理性最优解是：**[Offer X]**
核心驱动维度：____

## ⚠️ 反直觉提醒
[必须给出：指出用户权重与直觉可能的矛盾，或潜在隐患；
 不替用户做最终决定，只给"理性最优解+内心是否一致"的参考]

---
*由 Balance · Offer决策官 基于4轮信息收集生成*

铁律：必须给"反直觉提醒"；加权总分要给到一位小数。`,
    wrapSystemPrompt: `${AGENTS.compass.soul}

【你现在是 Balance · Offer决策官】
${AGENTS.balance.soul}

【任务完成 · Offer信息收集完毕】
请用简洁的语气（3句话以内）告知用户：
1. Offer信息和权重偏好已全部收集
2. 请点击下方「生成 Offer 决策报告」按钮，报告将在右侧面板呈现
3. 生成后可复制或下载

不要在此处输出报告内容，也不要输出任何 JSON 或代码块。`,
  },

  // ━━ lumen：情绪陪跑官 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  lumen: {
    agentKey: "lumen",
    needResume: false,
    steps: [
      { focus: "命名情绪",          question: "你现在的状态像是____，是这样吗？（用一个具体的情绪词描述你的感受）" },
      { focus: "拆解事实vs解读",    question: "我们看一下：事实是什么？你的解读可能加上了什么？" },
      { focus: "给一个最小行动",    question: "接下来10分钟，你只做这一件事——我们来定一个最小行动。" },
    ],
    reportTitle: "《情绪小结》",
    reportDrawerSubtitle: "Lumen · 情绪陪跑官",
    reportSystemPrompt: `你是 Lumen，应届生求职作战部的情绪陪跑官。
请根据以上完整对话内容，生成一份简短的《情绪小结》。
严格用以下 Markdown 结构输出，保持短小精悍，不要有多余的话：

# 💡 情绪小结

**此刻状态：** [一句话，用具体情绪词，不用抽象标签]

**一个事实提醒：** [把"事实"和"解读"分开，一句话]

**接下来10分钟：** [一个最小行动，具体到可执行]

---
*由 Lumen · 情绪陪跑官 陪伴生成*

铁律：短句，不说教，不灌鸡汤。
如在对话中识别到自残/轻生等极端信号，必须立即停止陪伴话术，推送全国心理援助热线 ${LUMEN_HOTLINE}，并在 json-output 中设 extremeAlert: true。`,
    wrapSystemPrompt: `${AGENTS.compass.soul}

【你现在是 Lumen · 情绪陪跑官】
${AGENTS.lumen.soul}

【陪伴完成 · CBT三步全部走完】
请用温柔简洁的语气（2-3句话）告知用户：
1. 陪他们走完了这3步
2. 请点击下方「生成情绪小结」按钮，小结将在右侧面板呈现
3. 一句温暖的结语（短句，不灌鸡汤）

不要在此处输出小结内容，也不要输出任何 JSON 或代码块。`,
  },
};

// ─── scalpel 简历收集阶段的专用 system ─────────────────────────────────────────

/**
 * scalpel 路径入场时的 system prompt（needResume=true 时使用）。
 * AI 先请求用户粘贴简历原文，拿到后再进入4轮追问（steps）。
 */
// 【旧版：已废弃】用于向后兼容，新版使用 ResumeInput 组件 + SCALPEL_WELCOME_SYSTEM
const SCALPEL_RESUME_SYSTEM = `${AGENTS.compass.soul}

【你现在是 Scalpel · 简历医生】
${AGENTS.scalpel.soul}

【当前任务：收集简历原文】
用户刚进入简历优化路径。请：
1. 用温暖直接的语气（2句话内）欢迎用户进入「简历手术台」
2. 请用户把简历原文粘贴进来（纯文字即可，不需要排版完美）
3. 告知拿到简历后会进行4轮深度追问，最终生成《简历优化报告》

不要提问任何其他内容，等用户粘贴简历后再开始追问。`;

/**
 * 【新版】Scalpel 欢迎语 system prompt
 * 用户通过 ResumeInput 组件提交简历，显示欢迎语并告知下一步
 */
const SCALPEL_WELCOME_SYSTEM = `${AGENTS.compass.soul}

【你现在是 Scalpel · 简历医生】
${AGENTS.scalpel.soul}

【当前任务：欢迎用户进入简历手术台】
用户刚进入简历优化路径。请用温暖直接的语气（2句话内）：
1. 欢迎用户进入「简历手术台」
2. 告知他们可以通过上方的简历输入面板上传 PDF 或粘贴简历原文
3. 说明拿到简历后会进行深度分析，识别硬伤并输出改写建议

不要提问任何其他内容，等用户在面板中提交简历后再开始工作。`;

// ─── 通用流 system builder ───────────────────────────────────────────────────

/**
 * 为指定路径的指定步骤构建 system prompt。
 * 所有路径复用同一套「单问题 + 刚性追问」执行规则，
 * 差异仅在 agentKey / steps 上。
 *
 * @param mode         当前路径
 * @param step         当前步骤（1-indexed，不超过 steps.length）
 * @param followupUsed 本步是否已经追问过一次
 */
function buildFlowSystem(mode: FlowMode, step: number, followupUsed: boolean, upstreamOutput?: AgentOutput | null): string {
  const config = AGENT_SCRIPTS[mode];
  const stepDef = config.steps[step - 1];
  const agent = AGENTS[config.agentKey];
  const totalSteps = config.steps.length;

  // 【新架构】使用带结构化输出指令的system prompt
  let system = `${AGENTS.compass.soul}

【你现在是 ${agent.name} · ${agent.cn}】
${buildFullSystemPrompt(agent.soul, config.agentKey)}

【本步任务 · 第 ${step}/${totalSteps} 步】
本步挖掘方向：${stepDef.focus}
本步核心问题：「${stepDef.question}」

【执行规则】
1. 先用一句话自然地承接用户上一步的回答（不要生硬跳转）
2. 然后把本步的核心问题问出来（可根据语境调整措辞，但不能偏离方向）
3. 一次只问这一个问题，不要问多个
4. 如果用户这步回答得很具体，就结束本步
5. 如果用户回答笼统空泛，追问一次"能举个具体例子吗/当时具体怎么做的"，
   ${followupUsed ? "（注意：本步已经追问过一次了，无论用户答得如何，这次都直接结束本步，不要再追问）" : ""}
6. 绝对不要一次问多个问题`;

  if (config.agentKey === "arena") {
    system += `

【Arena · 每轮反馈铁律】
用户回答后，必须先给三段式反馈再进入下一步：
✅ 优点（1-2条） / ❌ 硬伤（引用原话+说明） / 🎯 改写示范（STAR）
最后一步（压力面）同样必须三段式反馈。`;
  }

  if (config.agentKey === "balance" && step >= 3) {
    system += `

【Balance · 打分阶段】
基于用户描述的 offer 信息，在对话中给出各维度 1-10 分初步估计，请用户确认或纠正。`;
  }

  if (config.agentKey === "lumen") {
    system += `

【Lumen · CBT 三步】
1. 命名情绪  2. 拆解事实 vs 解读  3. 给一个最小行动（10分钟内可完成）
识别自残/轻生信号 → 立即停止陪伴，推送 ${LUMEN_HOTLINE}，extremeAlert=true。`;
  }

  // 【新架构】如果有上游产出，附加到system prompt中
  if (upstreamOutput) {
    system += `

【上游产出上下文 · ${upstreamOutput.agentKey}】
以下是你需要依赖的上游Agent产出的结构化数据：
\`\`\`json
${JSON.stringify(upstreamOutput, null, 2)}
\`\`\`

请基于以上上游产出进行你的工作，确保引用其中的证据。`;

    if (config.agentKey === "arena" && upstreamOutput.agentKey === "scalpel") {
      const scalpel = upstreamOutput as ScalpelOutput;
      const rec = scalpel.versions[scalpel.recommendedVersionIndex ?? 0];
      system += `

【Arena 专用 · Scalpel 交接】
推荐主攻方向：${rec?.targetTrack ?? "见上游产出"}
请优先按此方向出专业题；简历要点见 upstream.resumeText / versions。`;
    }

    if (config.agentKey === "scope" && upstreamOutput.agentKey === "prism") {
      system += `

【Scope 专用 · 执行规则】
画像已完整收集。请直接基于 Prism 产出 Top3 赛道推荐，不要追问用户。
仅当 oneLineProfile 或 strengths 严重缺失时，才允许问 1 个澄清问题。`;
    }
  }

  return system;
}

/**
 * 【Scalpel 专用】构建带简历原文的 system prompt
 *
 * Scalpel 需要基于真实简历内容进行分析和改写，因此需要特殊处理：
 * 1. 在 system prompt 中注入完整的简历原文
 * 2. 让 AI 先静默分析简历，识别目标岗位、关键经历和硬伤
 * 3. 根据分析结果决定：直接出报告 或 追问补充信息（最多1次）
 *
 * @param step         当前步骤（1-indexed）
 * @param followupUsed 本步是否已经追问过一次
 * @param upstreamOutput 上游 Scope 的产出（如果有）
 * @param resumeText   用户提交的完整简历原文
 */
function buildScalpelFlowSystem(
  step: number,
  followupUsed: boolean,
  upstreamOutput: AgentOutput | null,
  resumeText: string,
): string {
  const agent = AGENTS.scalpel;
  const effectiveSteps = getScalpelEffectiveSteps(resumeText);
  const totalSteps = Math.max(effectiveSteps.length, 1);
  const stepDef = effectiveSteps[step - 1] ?? effectiveSteps[effectiveSteps.length - 1] ?? AGENT_SCRIPTS.scalpel.steps[0];
  const gaps = getScalpelGaps(resumeText);
  const gapHints =
    gaps.length > 0
      ? `简历信息缺口（仅针对这些追问）：${gaps.join("、")}`
      : "简历信息已较完整";

  let system = `${AGENTS.compass.soul}

【你现在是 ${agent.name} · ${agent.cn}】
${buildFullSystemPrompt(agent.soul, "scalpel")}

【当前阶段 · 追问收集（不是出报告）】
用户已上传简历，完整原文在下方 system 中。此阶段你只做简短问答：
1. 先在心里阅读简历；简历里已写明的岗位（含「岗位：xxx」）、量化数据不要再问
2. 回复 150 字以内：一句承接 + 只问一个问题
3. 禁止粘贴/复述简历大段原文；禁止在对话里输出诊断报告或改写后的简历
4. 禁止引用 SOUL/示例里的假想句子
5. ${gapHints}
${followupUsed ? "6. 本步已追问过一次：用一句话告知「信息够了，报告正在生成」，不要再问新问题" : ""}

【本步任务 · 第 ${step}/${totalSteps} 步】
本步挖掘方向：${stepDef.focus}
本步核心问题：「${stepDef.question}」
（若该方向信息简历里已有，直接告知报告即将生成，不要再问）`;

  if (upstreamOutput) {
    system += `

【上游产出上下文 · ${upstreamOutput.agentKey}】
\`\`\`json
${JSON.stringify(upstreamOutput, null, 2)}
\`\`\`

请基于以上上游产出进行你的工作，确保推荐的岗位方向与 Scope 的分析一致。`;
  }

  system += `

【用户简历原文 · 仅作分析依据，禁止在回复中大段复述】
--- 简历开始 ---
${resumeText}
--- 简历结束 ---

铁律：分析必须基于上述真实内容；不得编造简历中没有的经历、性格描述或硬伤。`;

  return system;
}

/** 情绪 + 实务并联时：Lumen 只做简短接住，不交替代实务军师 */
function buildLumenCompanionSystem(
  nextPractical: FlowMode,
  signal: { detected: string; meaning: string },
): string {
  const nextAgent = AGENTS[AGENT_SCRIPTS[nextPractical].agentKey];
  return `${AGENTS.compass.soul}

【你现在是 Lumen · 情绪陪跑官 · 并联介入（第一步）】
${AGENTS.lumen.soul}

【识别到的信号】${signal.detected} — ${signal.meaning}

【任务】用户同时需要 ${nextAgent.name} · ${nextAgent.cn} 处理具体事务。
你只完成「情绪接住」，严格 2～4 句话：
1. 用具体情绪词命名 TA 此刻的感受
2. 肯定这种感受在 TA 情境下的合理性
3. 说明「${nextAgent.cn}」会接着处理具体事项（offer/简历/方向/面试等）

不要展开完整 CBT 三步，不要替 ${nextAgent.name} 做分析或给决策建议。
不要输出 json-output 或任何代码块。`;
}

/** Lumen 极端信号介入时的 system prompt */
function buildLumenExtremeSystem(): string {
  return `${AGENTS.compass.soul}

【你现在是 Lumen · 情绪陪跑官 · 极端信号介入】
${buildFullSystemPrompt(AGENTS.lumen.soul, "lumen")}

【铁律 · 极端信号】
用户消息中识别到自残/轻生相关信号。你必须：
1. 立即停止常规求职陪伴话术
2. 温和但明确地建议联系专业心理援助：全国 ${LUMEN_HOTLINE}
3. 不要试图做心理治疗或深度追问
4. 回复末尾 json-output 中 extremeAlert 必须为 true
5. 回复控制在 5 句话以内`;
}

/** 构建 Scope 报告生成时的补充 messages */
function buildScopeReportMessages(
  historyMsgs: Array<{ role: string; content: string }>,
  prismOutput: ScopeOutput["upstream"],
): Array<{ role: string; content: string }> {
  return [
    ...historyMsgs,
    {
      role: "user",
      content: `【Scope 任务 · 直接生成行业匹配】
基于以上 Prism 画像对话，以及以下结构化 Prism 产出，直接生成 Top3 赛道推荐。
不要追问用户（画像已完整）。

\`\`\`json
${JSON.stringify(prismOutput, null, 2)}
\`\`\`

请在对话回复末尾输出符合 Scope 结构的 json-output，并生成完整《行业匹配报告》摘要。`,
    },
  ];
}

/** 构建 Arena 报告生成时的补充 context（含 Scalpel 简历，若有） */
function buildArenaReportMessages(
  historyMsgs: Array<{ role: string; content: string }>,
  scalpelOutput: ScalpelOutput | null,
): Array<{ role: string; content: string }> {
  if (!scalpelOutput) return historyMsgs;
  return [
    ...historyMsgs,
    {
      role: "user",
      content: `【Arena 参考 · Scalpel 简历与推荐方向】
\`\`\`json
${JSON.stringify(
  {
    targetTrack: scalpelOutput.versions[scalpelOutput.recommendedVersionIndex ?? 0]?.targetTrack,
    resumeText: scalpelOutput.resumeText,
    handoffNote: scalpelOutput.handoffNote,
  },
  null,
  2,
)}
\`\`\``,
    },
  ];
}

// ─── 回答质量判断 ─────────────────────────────────────────────────────────────

/**
 * 判断用户回答是否"具体"。
 * 规则：字数 > 15 且不包含敷衍词。
 * 用于决定是否需要追问，还是直接进入下一步。
 */
function isSpecificResponse(text: string): boolean {
  if (text.trim().length <= 15) return false;
  const vagueWords = ["不知道", "没有", "还好", "一般", "不清楚", "说不好", "不太清楚", "不确定", "随便"];
  return !vagueWords.some((w) => text.includes(w));
}

// ─── 其他工具函数 ─────────────────────────────────────────────────────────────

/** 下载文件名中的日期：YYYY-MM-DD（本地时区） */
function formatMapDownloadDate(d = new Date()) {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

/** 「[括号内名字]」→ AgentKey（不区分大小写） */
const NAME_TO_AGENT: Record<string, AgentKey> = {
  compass: "compass",
  prism: "prism",
  scope: "scope",
  scalpel: "scalpel",
  arena: "arena",
  balance: "balance",
  lumen: "lumen",
};

/** 每条消息的稳定 id（避免索引当 key） */
let nextMsgId = 1;

type UserBubble = {
  role: "user";
  id: number;
  content: string;
};

type AssistantBubble = {
  role: "assistant";
  id: number;
  /** 当前气泡对应的军师（最终以流结束时的解析为准，流中用临时解析预览） */
  agentKey: AgentKey;
  /** 展示给用户的内容（去掉 [Agent] 前缀后） */
  content: string;
};

type UiMessage = UserBubble | AssistantBubble;

/** 是否在流式过程中「像」正在解析开头标签：[... 尚未闭环 */
function splitLeadingAgentTag(raw: string):
  | { kind: "pending" }
  | { kind: "plain"; display: string }
  | { kind: "tag"; agentKey: AgentKey; display: string } {
  if (!raw.startsWith("[")) {
    return { kind: "plain", display: raw };
  }

  const closeIdx = raw.indexOf("]");
  if (closeIdx === -1) {
    /** 容错：前缀过长基本可以判定不是合法的短标签头，直接整段当成正文展示 */
    if (raw.length > 48) {
      return { kind: "plain", display: raw };
    }
    return { kind: "pending" };
  }

  const inner = raw.slice(1, closeIdx).trim().toLowerCase();
  const rest = raw.slice(closeIdx + 1).replace(/^\s+/, "");
  const key = NAME_TO_AGENT[inner];
  if (!key) {
    return { kind: "plain", display: raw };
  }
  return { kind: "tag", agentKey: key, display: rest };
}

/** 拼接发送到 /api/chat 的 system（总指挥常驻 + 当前军师 SOUL） */
function buildWarRoomSystem(agent: AgentKey) {
  return `${AGENTS.compass.soul}\n\n【当前出场军师】\n${AGENTS[agent].soul}`;
}

/** `/api/chat` 非 2xx 且返回整页 HTML（如 404）时，避免把源码全文塞进错误栏 */
function shortApiFailureMessage(status: number, bodyText: string): string {
  const t = bodyText.trim();
  if (
    !t ||
    /<![Dd][Oo][Cc][Tt][Yy][Pp][Ee]\s+[Hh][Tt][Mm][Ll]/.test(t) ||
    /^<\s*html\b/i.test(t)
  ) {
    return `服务端接口不可用（HTTP ${status}）。Vercel 部署请使用默认 Next 构建（勿设 output: 'export'），并配置 KIMI_API_KEY。`;
  }
  const flat = t.replace(/\s+/g, " ");
  return flat.length <= 280 ? flat : `${flat.slice(0, 280)}…`;
}

/** 优先解析 /api/chat 返回的 JSON `{ error }`，否则再走 HTML/纯文本兜底 */
async function explainApiFailure(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    try {
      const j = JSON.parse(text) as { error?: unknown };
      if (typeof j.error === "string" && j.error.trim()) return j.error.trim();
    } catch {
      /* 使用下方兜底 */
    }
  }
  return shortApiFailureMessage(res.status, text) || `请求失败（${res.status}）`;
}

/** 军师完成一段话后的小字交接提示（学习用占位：按流程下一棒） */
function handoffSubtitle(key: AgentKey): string {
  switch (key) {
    case "compass":
      return "总指挥待命：可随时重新分诊下一步";
    case "prism":
      return "画像小结已就位，可随时进入行业匹配";
    case "scope":
      return "方向清单已就位，可随时进入简历手术台";
    case "scalpel":
      return "多版简历就绪，可随时进入模拟面试";
    case "arena":
      return "模面小节已就位，总指挥可总结或继续演练";
    case "balance":
      return "加权表已就位，总指挥可收口或复核权重";
    case "lumen":
      return "陪伴小节已就位，流程回到总指挥节拍";
    default:
      return "本环节小节已完成";
  }
}

export default function ChatPage() {
  // ─── 分诊模式欢迎语 ─────────────────────────────────────────────────────────
  const TRIAGE_WELCOME =
    "你好，我是你的求职总指挥。先告诉我，你现在最需要哪种帮助？";

  const [messages, setMessages] = useState<UiMessage[]>(() => [
    {
      role: "assistant",
      id: 0,
      agentKey: "compass",
      content: TRIAGE_WELCOME,
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** 当前线程里「最近一次确认发言的军师」（由流结束或确定性解析写入） */
  const [currentAgent, setCurrentAgent] = useState<AgentKey>("compass");
  /** 已经完整结束过一回合发言的军师（会话内标记为「已完成」，用于徽章） */
  const [completedAgents, setCompletedAgents] = useState<Set<AgentKey>>(() => new Set());
  /** 最近一次回合结束后，谁在卡片下展示交接小字（可随下一次完成而更替） */
  const [panelHandoff, setPanelHandoff] = useState<{ key: AgentKey; text: string } | null>(null);

  // ─── Agent 结构化产出状态（新架构核心）────────────────────────────────────────────
  /** 各Agent的结构化产出，用于下游Agent传递 */
  const [agentOutputs, setAgentOutputs] = useState<Partial<AgentOutputMap>>({});
  /** 报告生成 + Evaluator 审核中 */
  const [evaluatingAgent, setEvaluatingAgent] = useState<AgentKey | null>(null);
  /** 路径走完、待用户点击「生成报告」时的对话快照 */
  const [pendingReport, setPendingReport] = useState<{
    flowMode: FlowMode;
    messages: Array<{ role: string; content: string }>;
  } | null>(null);
  /** 多实务路径排队（如先 Prism 画像再 Balance 决 Offer） */
  const practicalQueueRef = useRef<FlowMode[]>([]);

  // ─── 分诊模式状态 ──────────────────────────────────────────────────────────
  /** 当前分诊阶段：triage = 选择入口中；其他值 = 已进入对应路径 */
  const [mode, setMode] = useState<TriageMode>("triage");
  /** 分诊阶段直接输入框的值（与正常聊天 input 分离，避免状态干扰） */
  const [triageInput, setTriageInput] = useState("");

  // ─── scalpel 简历输入状态（新架构 · 真实文件读取）───────────────────────────
  /** 是否显示简历输入界面（scalpel 路径专用） */
  const [showResumeInput, setShowResumeInput] = useState(false);
  /** 用户提交的简历原文（PDF 解析或粘贴文本） */
  const [collectedResumeText, setCollectedResumeText] = useState<string>("");

  // ─── 通用结构化流状态机 ──────────────────────────────────────────────────────
  /**
   * 当前活跃路径的进度状态，替代原来 Prism 专用的4个独立变量。
   * mode 切换时（useEffect 里）重置为初始值。
   *
   * step：当前步骤（1-indexed）。超过 steps.length 时 done=true。
   * followupUsed：本步是否已追问过一次（每步最多追问一次）。
   * msgCount：用户在本路径已发送的消息数（第1条是「入场语」/简历，第2条起评估质量）。
   * done：全部步骤走完的终态标记，一旦 true 则不再走脚本逻辑。
   * resumeCollected：scalpel 专用，简历原文是否已收到。
   * resumeText：scalpel 专用，存储收集到的简历原文（PDF 解析或粘贴文本）。
   */
  const [flowState, setFlowState] = useState({
    step: 1,
    followupUsed: false,
    msgCount: 0,
    done: false,
    resumeCollected: false,
    resumeText: "",
  });

  // ─── 抽屉内容类型 ───────────────────────────────────────────────────────────
  /**
   * 控制右侧抽屉展示的内容：
   * - "battle_map"：手动触发的《校招作战地图》
   * - FlowMode（prism_flow/scalpel/arena/balance/lumen）：对应路径的交付物
   */
  const [drawerMode, setDrawerMode] = useState<"battle_map" | FlowMode>("battle_map");

  /**
   * 流式缓冲区原文（含未完成标签），供渲染层判断光标（pending）
   */
  const streamRawRef = useRef("");

  /**
   * 同步 ref：这一轮里「谁在说话」（避免 setState 异步导致 map 读到旧 streamingAgent）。
   */
  const streamingSpeakerRef = useRef<AgentKey>("compass");

  /** 右栏徽章 / 光圈用：与 ref 对齐，仅在流式中用 setState 触发重绘 */
  const [streamingAgent, setStreamingAgent] = useState<AgentKey | null>(null);

  /** 作战地图/报告抽屉：是否挂载到 DOM（负责入场/退场动画） */
  const [mapOverlayMounted, setMapOverlayMounted] = useState(false);
  /** 作战地图/报告抽屉：淡入 + 右滑是否到位 */
  const [mapAnimIn, setMapAnimIn] = useState(false);
  /** 抽屉内容生成：独立 loading，与对话 loading 分离 */
  const [mapGenLoading, setMapGenLoading] = useState(false);
  /** 抽屉内容：当前展示的 Markdown 正文（复用同一变量，切换 drawerMode 时清空） */
  const [battleMapMarkdown, setBattleMapMarkdown] = useState("");
  const [mapGenError, setMapGenError] = useState<string | null>(null);
  /** 「复制全文」后的短暂文案反馈 */
  const [mapCopyFeedback, setMapCopyFeedback] = useState<string | null>(null);
  const mapCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapCopyFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** 简历模板引用，用于导出图片 */
  const resumeTemplateRef = useRef<HTMLDivElement>(null);
  const [resumeImageLoading, setResumeImageLoading] = useState(false);

  /** 中间消息滚动容器 */
  const listRef = useRef<HTMLDivElement>(null);
  /** 列表底部锚点：`scrollIntoView` 驱动内部滚动到位 */
  const listEndRef = useRef<HTMLDivElement>(null);
  /** 同步 messages，避免 sendMessage 闭包读到过期列表 */
  const messagesRef = useRef<UiMessage[]>(messages);
  messagesRef.current = messages;

  /**
   * 防止每条路径自动开场重复触发的 flag。
   * 存储「已触发过自动开场的 mode」，每个 mode 只触发一次。
   */
  const flowAutoStartedRef = useRef<TriageMode | null>(null);

  /** 抽屉挂上 DOM 后：双 rAF 再打开 animIn，首帧先 paint「未入场」再做滑入+淡入过渡 */
  useEffect(() => {
    if (!mapOverlayMounted) return;
    setMapAnimIn(false);
    let outer = 0;
    let inner = 0;
    outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        setMapAnimIn(true);
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [mapOverlayMounted]);

  /** 组件卸载：清掉抽屉与复制文案的延时，杜绝内存泄漏 */
  useEffect(() => {
    return () => {
      if (mapCloseTimerRef.current) clearTimeout(mapCloseTimerRef.current);
      if (mapCopyFeedbackTimerRef.current) clearTimeout(mapCopyFeedbackTimerRef.current);
    };
  }, []);

  /**
   * 通用路径自动开场：mode 切换到任意 FlowMode 后立即触发一次隐藏 API 调用，
   * 让对应军师主动发出开场语（+ 第1步核心问题 或 简历收集请求），
   * 无需用户先打字。
   *
   * flowAutoStartedRef 存储「已开场的 mode」，防止 re-render 重复触发。
   */
  useEffect(() => {
    if (mode === "triage" || flowAutoStartedRef.current === mode) return;
    flowAutoStartedRef.current = mode;

    const config = AGENT_SCRIPTS[mode as FlowMode];
    const label = TRIAGE_OPTIONS.find((o) => o.mode === mode)?.label ?? mode;

    // 【新架构】获取上游产出
    const upstreamOutput = getUpstreamOutput(config.agentKey, agentOutputs);

    if (config.needResume) {
      // scalpel：显示 ResumeInput 组件让用户上传 PDF 或粘贴简历
      // 不再直接发送消息，而是等待用户在 UI 中提交简历
      setShowResumeInput(true);
      // 发送一条欢迎消息，告知用户进入简历手术台
      void sendMessage(
        `（用户选择了「${label}」，请发送欢迎语告知用户进入简历手术台，等待他们提交简历）`,
        SCALPEL_WELCOME_SYSTEM,
        () => {
          // 不需要设置 msgCount，等待简历提交后才设置
        },
        true,
      );
    } else {
      // 其余路径：直接开始第1步，传递上游产出
      void sendMessage(
        `（用户选择了「${label}」，请作为 ${config.agentKey} 开始第1步）`,
        buildFlowSystem(mode as FlowMode, 1, false, upstreamOutput),
        () => {
          setFlowState((prev) => ({ ...prev, msgCount: 1 }));
        },
        true,
      );
    }
    // sendMessage 依赖 messages/currentAgent，用 ref 保证只触发一次，
    // lint 警告在此处可安全忽略（与原 Prism 逻辑一致）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const list = listRef.current;
      if (list) {
        list.scrollTop = list.scrollHeight;
      }
      listEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    });
  }, []);

  /**
   * 关闭抽屉：只隐藏面板，不清空报告内容。
   * 这样用户可以再次点击"查看报告"按钮重新打开。
   */
  const closeBattleMapDrawer = useCallback(() => {
    setMapAnimIn(false);
    if (mapCloseTimerRef.current) clearTimeout(mapCloseTimerRef.current);
    mapCloseTimerRef.current = setTimeout(() => {
      setMapOverlayMounted(false);
      mapCloseTimerRef.current = null;
    }, 300);
    // 【关键】保留 battleMapMarkdown 和 drawerMode，不清空
    // 这样用户可以重新打开查看同一份报告
  }, []);

  /**
   * 手动打开抽屉查看报告（用于"查看我的报告"按钮）。
   * 复用已有的 drawerMode 和 battleMapMarkdown，不再重新生成。
   */
  const openReportDrawer = useCallback(() => {
    if (mapCloseTimerRef.current) {
      clearTimeout(mapCloseTimerRef.current);
      mapCloseTimerRef.current = null;
    }
    setMapOverlayMounted(true);
  }, []);

  /** 点击按钮后手动生成《校招作战地图》 */
  const handleGenerateBattleMap = useCallback(async () => {
    if (mapGenLoading) return;
    if (mapCloseTimerRef.current) {
      clearTimeout(mapCloseTimerRef.current);
      mapCloseTimerRef.current = null;
    }
    setDrawerMode("battle_map");
    setMapOverlayMounted(true);
    setBattleMapMarkdown("");
    setMapGenError(null);
    setMapGenLoading(true);

    const apiMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: BATTLE_MAP_SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      });

      if (!res.ok) {
        throw new Error(await explainApiFailure(res));
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("无法读取生成流");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setBattleMapMarkdown(accumulated);
      }
    } catch (err) {
      setMapGenError(
        err instanceof Error ? err.message : "生成作战地图出错，请稍后重试",
      );
    } finally {
      setMapGenLoading(false);
    }
  }, [mapGenLoading, messages]);

  /**
   * Scope 零步流程：Prism 完成后点击「继续匹配赛道」，直接 runAgent 生成报告
   */
  const runScopeFromPrism = useCallback(
    async (prismOutput: NonNullable<AgentOutputMap["prism"]>) => {
      if (mapGenLoading) return;

      setCurrentAgent("scope");
      setMode("scope_flow");
      setFlowState((prev) => ({ ...prev, done: true }));
      setCompletedAgents((prev) => new Set(Array.from(prev).concat("scope")));
      setEvaluatingAgent("scope");

      setDrawerMode("scope_flow");
      setMapOverlayMounted(true);
      setBattleMapMarkdown("");
      setMapGenError(null);
      setMapGenLoading(true);

      const historyMsgs = messagesRef.current.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const reportMessages = buildScopeReportMessages(historyMsgs, prismOutput);

      try {
        const res = await fetch("/api/agent-run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentKey: "scope",
            messages: reportMessages.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
            upstreamOutput: prismOutput,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "请求失败" }));
          throw new Error(errorData.error || "生成行业匹配报告出错");
        }

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || "生成行业匹配报告出错");
        }

        let markdown = data.reply as string;
        if (data.structuredOutput) {
          markdown = formatAgentReportMarkdown("scope", data.structuredOutput as ScopeOutput);
        }

        setBattleMapMarkdown(markdown);

        if (data.structuredOutput && data.evaluation) {
          setAgentOutputs((prev) => ({
            ...prev,
            scope: data.structuredOutput,
          }));
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            id: nextMsgId++,
            agentKey: "scope",
            content:
              "[Scope] 已基于你的 Prism 画像完成行业匹配分析，《行业匹配报告》请在右侧面板查看。",
          },
        ]);
        setPanelHandoff({ key: "scope", text: handoffSubtitle("scope") });
      } catch (err) {
        setMapGenError(
          err instanceof Error ? err.message : "生成行业匹配报告出错，请稍后重试",
        );
      } finally {
        setMapGenLoading(false);
        setEvaluatingAgent(null);
      }
    },
    [mapGenLoading],
  );

  const handleStartScope = useCallback(() => {
    const prismOutput = agentOutputs.prism;
    if (!prismOutput) {
      setError("请先完成自我画像（Prism）后再进入行业匹配");
      return;
    }
    flowAutoStartedRef.current = "scope_flow";
    void runScopeFromPrism(prismOutput);
  }, [agentOutputs.prism, runScopeFromPrism]);

  /**
   * 通用路径交付物生成：任意路径走完后自动触发。
   * 【Evaluator集成】使用 /api/agent-run 端点，产出会经过质量审核
   *
   * @param flowMode 触发报告的路径（决定 drawerMode 和 reportSystemPrompt）
   * @param historyMsgs sendMessage 的 onComplete 回调传来的完整消息列表
   *   （包含本轮 AI 收尾语，保证报告能看到所有对话内容）
   */
  const handleGenerateReport = useCallback(
    async (flowMode: FlowMode, historyMsgs: Array<{ role: string; content: string }>) => {
      if (mapCloseTimerRef.current) {
        clearTimeout(mapCloseTimerRef.current);
        mapCloseTimerRef.current = null;
      }
      setDrawerMode(flowMode);
      setMapOverlayMounted(true);
      setBattleMapMarkdown("");
      setMapGenError(null);
      setMapGenLoading(true);

      const config = AGENT_SCRIPTS[flowMode];
      const agentKey = config.agentKey;

      setEvaluatingAgent(agentKey);

      const upstreamOutput =
        agentKey === "scope"
          ? agentOutputs.prism ?? getUpstreamOutput(agentKey, agentOutputs)
          : getUpstreamOutput(agentKey, agentOutputs);

      // Scalpel 报告必须能看到完整简历原文
      let reportMessages = historyMsgs;
      if (flowMode === "scalpel" && collectedResumeText.trim()) {
        const resumeInHistory = historyMsgs.some(
          (m) => m.role === "user" && m.content.includes(collectedResumeText.slice(0, 80)),
        );
        if (!resumeInHistory) {
          reportMessages = [
            ...historyMsgs,
            {
              role: "user",
              content: `【用户提交的完整简历原文】\n${collectedResumeText.trim()}`,
            },
          ];
        }
      }

      if (flowMode === "scope_flow" && agentOutputs.prism) {
        reportMessages = buildScopeReportMessages(historyMsgs, agentOutputs.prism);
      }

      if (flowMode === "arena") {
        const scalpelOut = agentOutputs.scalpel ?? null;
        reportMessages = buildArenaReportMessages(reportMessages, scalpelOut);
      }

      if (flowMode === "lumen" && detectExtremeSignal(historyMsgs.map((m) => m.content).join("\n"))) {
        reportMessages = [
          ...reportMessages,
          {
            role: "user",
            content: `【极端信号】请在 json-output 中设 extremeAlert: true，并推送心理热线 ${LUMEN_HOTLINE}。`,
          },
        ];
      }

      try {
        const res = await fetch("/api/agent-run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentKey,
            messages: reportMessages.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
            upstreamOutput: upstreamOutput || undefined,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: "请求失败" }));
          throw new Error(errorData.error || `生成${config.reportTitle}出错`);
        }

        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || `生成${config.reportTitle}出错`);
        }

        // Scalpel：优先用结构化产出拼装完整报告（含可导出图片的简历代码块）
        let markdown = data.reply as string;
        if (data.structuredOutput) {
          const out = data.structuredOutput;
          if (flowMode === "scalpel" && out.versions?.length) {
            markdown = formatScalpelReportMarkdown(out as ScalpelOutput);
          } else if (
            out.agentKey === "scope" ||
            out.agentKey === "arena" ||
            out.agentKey === "balance" ||
            out.agentKey === "lumen"
          ) {
            markdown = formatAgentReportMarkdown(
              out.agentKey,
              out as ScopeOutput | ArenaOutput | BalanceOutput | LumenOutput,
            );
          }
        } else if (flowMode === "scalpel" && !markdown.includes("```")) {
          // 结构化产出缺失时，用 reportSystemPrompt 兜底生成 Markdown
          const chatRes = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system: config.reportSystemPrompt,
              messages: reportMessages,
            }),
          });
          if (chatRes.ok && chatRes.body) {
            const reader = chatRes.body.getReader();
            const decoder = new TextDecoder();
            let full = "";
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              full += decoder.decode(value, { stream: true });
            }
            if (full.trim()) markdown = full.trim();
          }
        }

        setBattleMapMarkdown(markdown);

        // 【Evaluator集成】存储带审核信息的结构化产出
        if (data.structuredOutput && data.evaluation) {
          setAgentOutputs((prev) => ({
            ...prev,
            [agentKey]: data.structuredOutput,
          }));
          console.log(`[Evaluator] ${agentKey} 产出审核完成: 评分=${data.evaluation.score}/100, 通过=${data.evaluation.pass}, 重做次数=${data.evaluation.retryCount}`);

          // 如果强制接受，显示警告
          if (data.evaluation.isForcedAccept) {
            console.warn(`[Evaluator] ${agentKey} 强制接受产出（重做2次后仍不达标）`);
          }
        }
      } catch (err) {
        setMapGenError(
          err instanceof Error ? err.message : `生成${config.reportTitle}出错，请稍后重试`,
        );
      } finally {
        setMapGenLoading(false);
        setEvaluatingAgent(null);
        setPendingReport(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [agentOutputs, collectedResumeText],
  );

  /** 用户点击「生成报告」：仅此时打开抽屉并走 agent-run + Evaluator */
  const handleGeneratePendingReport = useCallback(() => {
    if (!pendingReport || mapGenLoading) return;
    void handleGenerateReport(pendingReport.flowMode, pendingReport.messages);
  }, [handleGenerateReport, mapGenLoading, pendingReport]);

  /** 当前路径是否已有结构化产出（报告已生成过） */
  const currentFlowHasReport = useCallback(() => {
    if (mode === "triage") return false;
    const key = AGENT_SCRIPTS[mode as FlowMode].agentKey;
    return Boolean(agentOutputs[key as keyof AgentOutputMap]);
  }, [mode, agentOutputs]);

  /** 复制 Markdown 正文到剪贴板 */
  const handleCopyBattleMap = useCallback(async () => {
    if (!battleMapMarkdown.trim()) return;
    try {
      await navigator.clipboard.writeText(battleMapMarkdown);
      setMapCopyFeedback("已复制✓");
      if (mapCopyFeedbackTimerRef.current) clearTimeout(mapCopyFeedbackTimerRef.current);
      mapCopyFeedbackTimerRef.current = setTimeout(() => {
        setMapCopyFeedback(null);
        mapCopyFeedbackTimerRef.current = null;
      }, 2000);
    } catch {
      setMapCopyFeedback("复制失败");
      mapCopyFeedbackTimerRef.current = setTimeout(() => {
        setMapCopyFeedback(null);
        mapCopyFeedbackTimerRef.current = null;
      }, 2000);
    }
  }, [battleMapMarkdown]);

  /** 下载 UTF-8 纯文本 · 文件名带当日日期 */
  const handleDownloadBattleMap = useCallback(() => {
    if (!battleMapMarkdown.trim()) return;
    const blob = new Blob([battleMapMarkdown], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // 根据 drawerMode 动态取文件名
    const fileName =
      drawerMode === "battle_map"
        ? "校招作战地图"
        : AGENT_SCRIPTS[drawerMode].reportTitle.replace(/[《》]/g, "");
    a.download = `${fileName}_${formatMapDownloadDate()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [battleMapMarkdown, drawerMode]);

  /**
   * 【Scalpel 专用】下载简历图片
   * 将改写后的简历渲染为高清 PNG 图片
   */
  const handleDownloadResumeImage = useCallback(async () => {
    const resumeContent = extractRewrittenResumeFromReport(battleMapMarkdown);
    if (!resumeTemplateRef.current || !resumeContent.trim()) {
      setMapCopyFeedback("请先生成含改写简历的报告");
      return;
    }

    setResumeImageLoading(true);
    try {
      // 等待离屏模板完成布局后再截图
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      const dataUrl = await toPng(resumeTemplateRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#FDFCF8",
        cacheBust: true,
      });
      
      const a = document.createElement("a");
      const date = formatMapDownloadDate();
      a.download = `简历_${date}.png`;
      a.href = dataUrl;
      a.click();
      
      setMapCopyFeedback("图片已生成✓");
      if (mapCopyFeedbackTimerRef.current) clearTimeout(mapCopyFeedbackTimerRef.current);
      mapCopyFeedbackTimerRef.current = setTimeout(() => {
        setMapCopyFeedback(null);
        mapCopyFeedbackTimerRef.current = null;
      }, 2000);
    } catch (error) {
      console.error("生成简历图片失败:", error);
      setMapCopyFeedback("图片生成失败");
      if (mapCopyFeedbackTimerRef.current) clearTimeout(mapCopyFeedbackTimerRef.current);
      mapCopyFeedbackTimerRef.current = setTimeout(() => {
        setMapCopyFeedback(null);
        mapCopyFeedbackTimerRef.current = null;
      }, 2000);
    } finally {
      setResumeImageLoading(false);
    }
  }, [battleMapMarkdown]);

  /** 推导面板里某军师的状态徽标语义 */
  const cardStateFor = useCallback(
    (key: AgentKey): "idle" | "busy" | "done" => {
      if ((loading && streamingAgent === key) || evaluatingAgent === key) return "busy";
      if (completedAgents.has(key)) return "done";
      return "idle";
    },
    [loading, streamingAgent, completedAgents, evaluatingAgent],
  );

  /** 当前「激活」用于暗红光圈：仅工作中 */
  const isActiveGlow = useCallback(
    (key: AgentKey) => (loading && streamingAgent === key) || evaluatingAgent === key,
    [loading, streamingAgent, evaluatingAgent],
  );

  /**
   * 右栏「已选入口」高亮：当 mode 不是 triage 时，对应的 agent 卡片显示入口色
   * 仅在 idle 状态下起作用（busy / done 有自己的样式优先级）
   */
  const isModeHighlighted = useCallback(
    (key: AgentKey) => mode !== "triage" && MODE_TO_AGENT[mode] === key,
    [mode],
  );

  // ─── 核心消息发送逻辑 ──────────────────────────────────────────────────────
  /**
   * 实际执行 API 调用与流式更新的函数。
   *
   * @param text 用户输入内容
   * @param systemOverride 覆盖默认 system prompt（结构化流模式传入）
   * @param onComplete 流成功结束后的回调，携带本轮完整消息列表
   *   （含刚流完的 AI 回复，用于报告等后续生成操作）
   * @param hiddenTrigger 为 true 时：text 仅作为 API messages 的最后一条发送，
   *   不在对话气泡区显示（用于各路径自动开场等"无感触发"场景）
   */
  const sendMessage = useCallback(
    async (
      text: string,
      systemOverride?: string,
      onComplete?: (finalMsgs: Array<{ role: string; content: string }>) => void,
      hiddenTrigger?: boolean,
    ) => {
      const userBubble: UiMessage = { role: "user", id: nextMsgId++, content: text };
      const prev = hiddenTrigger
        ? messagesRef.current
        : messagesRef.current.concat(userBubble);

      setError(null);
      if (!hiddenTrigger) setMessages(prev);
      setLoading(true);

      streamingSpeakerRef.current = currentAgent;
      setStreamingAgent(currentAgent);
      streamRawRef.current = "";

      const assistantDraftId = nextMsgId++;
      const nextWithPlaceholder: UiMessage[] = [
        ...prev,
        { role: "assistant", id: assistantDraftId, agentKey: currentAgent, content: "" },
      ];

      const apiMessages = hiddenTrigger
        ? [...prev.map((m) => ({ role: m.role, content: m.content })), { role: "user", content: text }]
        : prev.map((m) => ({ role: m.role, content: m.content }));

      let finalKey: AgentKey = currentAgent;
      let finalDisplay = "";
      let success = false;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system: systemOverride ?? buildWarRoomSystem(currentAgent),
            messages: apiMessages,
          }),
        });

        if (!res.ok) {
          throw new Error(await explainApiFailure(res));
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("无法读取回复流");

        setMessages(nextWithPlaceholder);

        const decoder = new TextDecoder();
        let raw = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          raw += decoder.decode(value, { stream: true });
          streamRawRef.current = raw;

          const p = splitLeadingAgentTag(raw);
          let display = "";
          let speakerKey = streamingSpeakerRef.current;

          if (p.kind === "pending") {
            display = "";
          } else if (p.kind === "plain") {
            display = stripStructuredOutputFromReply(p.display);
          } else {
            speakerKey = p.agentKey;
            streamingSpeakerRef.current = speakerKey;
            setStreamingAgent(speakerKey);
            setCurrentAgent(speakerKey);
            display = stripStructuredOutputFromReply(p.display);
          }

          setMessages((list) =>
            list.map((m) => {
              if (m.id !== assistantDraftId || m.role !== "assistant") return m;
              return { ...m, agentKey: speakerKey, content: display };
            }),
          );
          scrollToBottom();
        }

        const final = splitLeadingAgentTag(raw);
        finalKey = streamingSpeakerRef.current;
        let rawDisplay = raw;
        if (final.kind === "tag") {
          finalKey = final.agentKey;
          rawDisplay = final.display;
        } else if (final.kind === "plain") {
          rawDisplay = final.display;
          finalKey = streamingSpeakerRef.current;
        }
        finalDisplay = stripStructuredOutputFromReply(rawDisplay);

        setCurrentAgent(finalKey);
        streamingSpeakerRef.current = finalKey;
        setStreamingAgent(null);

        setCompletedAgents((prevSet) => {
          const n = new Set(prevSet);
          n.add(finalKey);
          return n;
        });
        setPanelHandoff({ key: finalKey, text: handoffSubtitle(finalKey) });

        // 结构化产出与 Evaluator 审核仅在用户点击「生成报告」时经 /api/agent-run 写入

        setMessages((list) =>
          list.map((m) =>
            m.id === assistantDraftId && m.role === "assistant"
              ? { ...m, agentKey: finalKey, content: finalDisplay }
              : m,
          ),
        );

        success = true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "发送失败，请稍后重试");
        setMessages(prev);
        setStreamingAgent(null);
      } finally {
        streamRawRef.current = "";
        setLoading(false);
        scrollToBottom();
      }

      if (success && onComplete) {
        const finalMsgs: Array<{ role: string; content: string }> = [
          ...apiMessages,
          { role: "assistant", content: finalDisplay },
        ];
        onComplete(finalMsgs);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages, currentAgent, scrollToBottom],
  );

  /**
   * 情绪信号自动调度 Lumen（极端信号立即介入，停止当前 Agent 流程）
   */
  const triggerLumenIntervention = useCallback(
    async (userText: string, extreme: boolean) => {
      flowAutoStartedRef.current = "lumen";
      setMode("lumen");
      setCurrentAgent("lumen");
      setFlowState({
        step: 1,
        followupUsed: false,
        msgCount: 1,
        done: extreme,
        resumeCollected: false,
        resumeText: "",
      });
      setShowResumeInput(false);

      const system = extreme
        ? buildLumenExtremeSystem()
        : buildFlowSystem("lumen", 1, false, null);

      if (extreme) {
        await sendMessage(userText, system, (finalMsgs) => {
          setCompletedAgents((prev) => new Set(Array.from(prev).concat("lumen")));
          void handleGenerateReport("lumen", finalMsgs);
        });
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.agentKey === "lumen") {
            const prefix = `[Lumen] 请先知道：全国心理援助热线 ${LUMEN_HOTLINE}，24小时有人接听。\n\n`;
            return prev.slice(0, -1).concat({ ...last, content: prefix + last.content });
          }
          return prev;
        });
      } else {
        await sendMessage(userText, system);
      }
    },
    [sendMessage, handleGenerateReport],
  );

  /** 进入一条实务结构化路径（Scalpel / Balance / Prism / Arena） */
  const startPracticalFlow = useCallback(
    async (
      target: FlowMode,
      userText: string,
      opts?: { skipUserBubble?: boolean; handoffFromLumen?: boolean },
    ) => {
      flowAutoStartedRef.current = target;
      setMode(target);
      setPendingReport(null);
      setCurrentAgent(AGENT_SCRIPTS[target].agentKey);

      if (target === "scalpel") {
        setShowResumeInput(true);
        setFlowState({
          step: 1,
          followupUsed: false,
          msgCount: 0,
          done: false,
          resumeCollected: false,
          resumeText: "",
        });
        if (opts?.skipUserBubble) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              id: nextMsgId++,
              agentKey: "scalpel",
              content:
                "[Scalpel] 已进入简历手术台。请在下方上传 PDF 或粘贴简历原文，我会基于真实内容帮你诊断与改写。",
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "user", id: nextMsgId++, content: userText },
            {
              role: "assistant",
              id: nextMsgId++,
              agentKey: "scalpel",
              content:
                "[Scalpel] 已进入简历手术台。请在下方上传 PDF 或粘贴简历原文，我会基于真实内容帮你诊断与改写。",
            },
          ]);
        }
        scrollToBottom();
        return;
      }

      setShowResumeInput(false);
      setFlowState({
        step: 1,
        followupUsed: false,
        msgCount: 1,
        done: false,
        resumeCollected: false,
        resumeText: "",
      });

      const upstreamOutput = getUpstreamOutput(AGENT_SCRIPTS[target].agentKey, agentOutputs);
      const handoffPrefix = opts?.handoffFromLumen
        ? `【Lumen 已做情绪接住，请接续】`
        : "";
      const apiText = `${handoffPrefix}${userText}`;

      if (opts?.skipUserBubble) {
        await sendMessage(
          apiText,
          buildFlowSystem(target, 1, false, upstreamOutput),
          () => {
            setFlowState((prev) => ({ ...prev, msgCount: 2 }));
          },
          true,
        );
      } else {
        await sendMessage(apiText, buildFlowSystem(target, 1, false, upstreamOutput), () => {
          setFlowState((prev) => ({ ...prev, msgCount: 2 }));
        });
      }
    },
    [sendMessage, agentOutputs, scrollToBottom],
  );

  /** 队列中的下一条实务路径（如 Prism 完成后接 Balance） */
  const continuePracticalQueue = useCallback(
    async (lastUserText: string) => {
      const next = practicalQueueRef.current.shift();
      if (!next) return;

      const nextMeta = AGENTS[AGENT_SCRIPTS[next].agentKey];
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          id: nextMsgId++,
          agentKey: "compass",
          content: `[Compass] 上一环节已收束。接下来由 ${nextMeta.name} · ${nextMeta.cn} 继续（基于刚才的对话）。`,
        },
      ]);

      await startPracticalFlow(next, lastUserText, {
        skipUserBubble: true,
        handoffFromLumen: false,
      });
    },
    [startPracticalFlow],
  );

  /**
   * 情绪 + 实务并联：先 Lumen 简短接住，再进入实务路径；
   * 若同时识别 Prism + Balance 等，按顺序排队依次走完。
   */
  const runCompoundWarRoomPath = useCallback(
    async (
      userText: string,
      intents: ReturnType<typeof analyzeWarRoomIntents>,
    ) => {
      const ordered = intents.practicalModes as FlowMode[];
      practicalQueueRef.current = ordered.slice(1);

      setMessages((prev) => [
        ...prev,
        { role: "user", id: nextMsgId++, content: userText },
      ]);

      if (intents.emotional) {
        setCurrentAgent("lumen");
        await sendMessage(
          userText,
          buildLumenCompanionSystem(ordered[0], intents.emotional),
          undefined,
          true,
        );
      }

      await startPracticalFlow(ordered[0], userText, {
        skipUserBubble: true,
        handoffFromLumen: Boolean(intents.emotional),
      });
    },
    [sendMessage, startPracticalFlow],
  );

  /** 仅多个实务路径、无情绪并联（如同时迷茫 + Offer 纠结） */
  const runQueuedPracticalPaths = useCallback(
    async (userText: string, modes: FlowMode[]) => {
      practicalQueueRef.current = modes.slice(1);
      setMessages((prev) => [
        ...prev,
        { role: "user", id: nextMsgId++, content: userText },
      ]);
      await startPracticalFlow(modes[0], userText, { skipUserBubble: true });
    },
    [startPracticalFlow],
  );

  /**
   * 【新版 scalpel】处理 ResumeInput 提交的简历
   * 用户通过 PDF 上传或粘贴文字提交简历后，隐藏输入界面，开始对话流程
   */
  const handleResumeSubmit = useCallback(
    async (resumeText: string) => {
      if (!resumeText.trim() || loading) return;

      const trimmed = resumeText.trim();

      setCollectedResumeText(trimmed);
      setShowResumeInput(false);

      setCurrentAgent("scalpel");
      streamingSpeakerRef.current = "scalpel";

      const userNotice = `📄 已提交简历（${trimmed.length} 字）`;
      const upstreamOutput = getUpstreamOutput("scalpel", agentOutputs);

      // 简历已含岗位+量化数据 → 跳过追问，直接生成报告
      if (resumeReadyForReport(trimmed)) {
        setFlowState((prev) => ({
          ...prev,
          resumeCollected: true,
          resumeText: trimmed,
          msgCount: 1,
          done: true,
        }));
        setCompletedAgents((prev) => new Set(Array.from(prev).concat("scalpel")));

        const historyMsgs = [
          ...messagesRef.current.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: userNotice },
          { role: "user", content: `【用户提交的完整简历原文】\n${trimmed}` },
        ];

        setMessages((prev) => [
          ...prev,
          { role: "user", id: nextMsgId++, content: userNotice },
          {
            role: "assistant",
            id: nextMsgId++,
            agentKey: "scalpel",
            content:
              "[Scalpel] 简历已收到，关键信息较完整。请点击下方「生成简历优化报告」，在右侧面板查看。",
          },
        ]);

        setPendingReport({ flowMode: "scalpel", messages: historyMsgs });
        return;
      }

      // 否则进入简短追问（只做问答，不在对话里出报告）
      const gaps = getScalpelGaps(trimmed);
      setFlowState((prev) => ({
        ...prev,
        resumeCollected: true,
        resumeText: trimmed,
        msgCount: 1,
      }));

      const system = buildScalpelFlowSystem(1, false, upstreamOutput, trimmed);
      const gapHint =
        gaps.length > 0 ? `还需补充：${gaps.join("、")}。` : "";
      const trigger = `${userNotice}。${gapHint}请只做简短问答，不要复述简历或输出报告。`;

      await sendMessage(trigger, system, undefined, false);
    },
    [loading, agentOutputs, sendMessage, handleGenerateReport],
  );

  /**
   * 取消简历输入，返回分诊界面
   */
  const handleResumeCancel = useCallback(() => {
    setShowResumeInput(false);
    setMode("triage");
    flowAutoStartedRef.current = null;
    setLoading(false);
    setStreamingAgent(null);
    setFlowState({
      step: 1,
      followupUsed: false,
      msgCount: 0,
      done: false,
      resumeCollected: false,
      resumeText: "",
    });
  }, []);

  /**
   * 普通聊天表单提交（含结构化流模式的通用状态机推进逻辑）。
   *
   * ┌─────────────────── 通用状态机（6条路径共用）──────────────────────┐
   * │ scalpel needResume：                                              │
   * │   resumeCollected=false → 收集简历 → resumeCollected=true        │
   * │   收集后重置 msgCount=1，进入 step=1 追问                         │
   * │                                                                   │
   * │ 通用路径：                                                         │
   * │   msgCount=0 → 1：入场语，不评估，AI 问第1步                      │
   * │   msgCount ≥ 2：评估用户答案质量                                  │
   * │     具体 或 本步已追问过 → step+1, followup=false                 │
   * │     笼统 且 本步未追问   → followup=true, 停在本步                │
   * │   step > totalSteps → 完成，触发交付物生成                        │
   * └────────────────────────────────────────────────────────────────┘
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    // ── 极端情绪信号：立即停止当前流程，调度 Lumen ─────────────────────────
    if (detectExtremeSignal(text) && mode !== "lumen") {
      await triggerLumenIntervention(text, true);
      return;
    }

    const intents = analyzeWarRoomIntents(text);
    const inActiveStructuredFlow =
      mode !== "triage" && !flowState.done && Boolean(AGENT_SCRIPTS[mode as FlowMode]);

    // ── 情绪 + 实务：Lumen 并联 + 实务路径（可排队 Prism → Balance 等）────────
    if (!inActiveStructuredFlow && intents.emotional && intents.practicalModes.length > 0) {
      await runCompoundWarRoomPath(text, intents);
      return;
    }

    // ── 多个实务意图、无情绪：按顺序排队（如迷茫 + Offer）────────────────────
    if (!inActiveStructuredFlow && intents.practicalModes.length >= 2) {
      await runQueuedPracticalPaths(text, intents.practicalModes as FlowMode[]);
      return;
    }

    // ── 单一实务意图 ─────────────────────────────────────────────────────────
    if (!inActiveStructuredFlow && intents.practicalModes.length === 1) {
      const sole = intents.practicalModes[0] as FlowMode;
      if (sole === "scalpel") {
        if (mode === "scalpel" && !flowState.resumeCollected) {
          if (!showResumeInput) {
            setShowResumeInput(true);
            setMessages((prev) => [
              ...prev,
              { role: "user", id: nextMsgId++, content: text },
            ]);
            scrollToBottom();
          }
          return;
        }
        await startPracticalFlow("scalpel", text);
        return;
      }
      await startPracticalFlow(sole, text);
      return;
    }

    // ── 仅情绪、无实务：完整 Lumen 陪跑 ───────────────────────────────────────
    if (
      intents.emotional &&
      intents.practicalModes.length === 0 &&
      intents.emotional.type === "userCall" &&
      mode !== "lumen" &&
      mode !== "triage"
    ) {
      await triggerLumenIntervention(text, false);
      return;
    }

    // ── 结构化流模式（mode 非 triage 且尚未完成）──────────────────────────────
    if (mode !== "triage" && !flowState.done) {
      const config = AGENT_SCRIPTS[mode as FlowMode];
      const newMsgCount = flowState.msgCount + 1;

      // 【新版 scalpel】简历已通过 ResumeInput 收集，不再在这里处理文本输入
      // 保留旧逻辑作为兜底，但理论上不会走到这里
      if (config.needResume && !flowState.resumeCollected) {
        // 用户发来了简历原文，标记已收集，重置 msgCount=1（接下来第2条起才评估质量）
        setFlowState((prev) => ({
          ...prev,
          resumeCollected: true,
          resumeText: text,
          msgCount: 1,
        }));
        const upstreamOutput = getUpstreamOutput(config.agentKey, agentOutputs);
        await sendMessage(text, buildScalpelFlowSystem(1, false, upstreamOutput, text));
        return;
      }

      let newStep = flowState.step;
      let newFollowup = flowState.followupUsed;

      /**
       * 第1条消息是「入场语」或「简历原文」（已由 msgCount=1 标记），
       * 不评估质量，直接以当前 step system 回应。
       * 从第2条起才判断"具体/笼统"，决定是否进下一步。
       */
      if (newMsgCount > 1) {
        const specific =
          mode === "scalpel"
            ? isSpecificResponse(text) || isScalpelAffirmative(text)
            : isSpecificResponse(text);

        if (specific || flowState.followupUsed) {
          // 回答具体，或本步已追问过 → 进入下一步，重置追问标记
          newStep = flowState.step + 1;
          newFollowup = false;
          setFlowState((prev) => ({
            ...prev,
            step: newStep,
            followupUsed: false,
            msgCount: newMsgCount,
          }));
        } else {
          // 回答笼统且本步尚未追问 → 标记已追问，停在本步让 AI 追问
          newFollowup = true;
          setFlowState((prev) => ({
            ...prev,
            followupUsed: true,
            msgCount: newMsgCount,
          }));
        }
      } else {
        setFlowState((prev) => ({ ...prev, msgCount: newMsgCount }));
      }

      const totalSteps =
        mode === "scalpel" && flowState.resumeText
          ? Math.max(getScalpelEffectiveStepCount(flowState.resumeText), 1)
          : config.steps.length;

        // 所有步骤走完（step 推进超出列表）
      if (newStep > totalSteps) {
        setFlowState((prev) => ({ ...prev, done: true }));
        setCompletedAgents((prev) => new Set(Array.from(prev).concat(config.agentKey)));
        const currentMode = mode as FlowMode;
        await sendMessage(text, config.wrapSystemPrompt, (finalMsgs) => {
          setPendingReport({ flowMode: currentMode, messages: finalMsgs });
          void continuePracticalQueue(text);
        });
        return;
      }

      // 还在步骤中：用包含本步信息的 system 发消息
      // 【新架构】传递上游产出
      const upstreamOutput = getUpstreamOutput(config.agentKey, agentOutputs);

      // 【Scalpel 专用】使用带简历原文的 system prompt
      const system =
        mode === "scalpel" && flowState.resumeText
          ? buildScalpelFlowSystem(newStep, newFollowup, upstreamOutput, flowState.resumeText)
          : buildFlowSystem(mode as FlowMode, newStep, newFollowup, upstreamOutput);

      const scalpelEffectiveSteps =
        mode === "scalpel" && flowState.resumeText
          ? getScalpelEffectiveStepCount(flowState.resumeText)
          : 0;

      await sendMessage(text, system, (finalMsgs) => {
        if (mode !== "scalpel" || flowState.done) return;
        const lastAssistant =
          [...finalMsgs].reverse().find((m) => m.role === "assistant")?.content ?? "";
        const shouldFinish =
          newFollowup ||
          detectScalpelFinishSignal(lastAssistant) ||
          (scalpelEffectiveSteps > 0 && newStep >= scalpelEffectiveSteps && newMsgCount > 1);
        if (!shouldFinish) return;
        setFlowState((prev) => ({ ...prev, done: true }));
        setCompletedAgents((prev) => new Set(Array.from(prev).concat("scalpel")));
        setPendingReport({ flowMode: "scalpel", messages: finalMsgs });
      });
      return;
    }

    // ── 非结构化流 或 已完成：走常规对话流 ──────────────────────────────────
    await sendMessage(text);
  };

  /**
   * 分诊阶段直接打字提交：
   * 默认路径设为 prism_flow，用户的文字本身就是「入场语」，
   * AI 会承接它并问出第 1 步核心问题。
   *
   * 注意：这里把 flowAutoStartedRef.current 设为 prism_flow，
   * 阻止 mode 切换后 useEffect 里的自动开场再次触发。
   */
  const handleTriageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = triageInput.trim();
    if (!text || loading) return;
    setTriageInput("");

    if (detectExtremeSignal(text)) {
      await triggerLumenIntervention(text, true);
      return;
    }

    const intents = analyzeWarRoomIntents(text);

    if (intents.emotional && intents.practicalModes.length > 0) {
      await runCompoundWarRoomPath(text, intents);
      return;
    }

    if (intents.practicalModes.length >= 2) {
      await runQueuedPracticalPaths(text, intents.practicalModes as FlowMode[]);
      return;
    }

    if (intents.practicalModes.length === 1) {
      await startPracticalFlow(intents.practicalModes[0] as FlowMode, text);
      return;
    }

    if (intents.emotional) {
      await triggerLumenIntervention(text, false);
      return;
    }

    flowAutoStartedRef.current = "prism_flow";
    setPendingReport(null);
    setFlowState({
      step: 1,
      followupUsed: false,
      msgCount: 1,
      done: false,
      resumeCollected: false,
      resumeText: "",
    });
    setShowResumeInput(false);
    setMode("prism_flow");
    setCurrentAgent("prism");
    await sendMessage(text, buildFlowSystem("prism_flow", 1, false, null), () => {
      setFlowState((prev) => ({ ...prev, msgCount: 2 }));
    });
  };

  /**
   * 点击分诊选项卡片：切换 mode，进入对应对话路径。
   * useEffect 会在 re-render 后触发自动开场，无需手动发消息。
   */
  const handleTriageSelect = useCallback((selected: FlowMode) => {
    flowAutoStartedRef.current = null;

    // 重置流状态，确保新路径从头开始
    setFlowState({
      step: 1,
      followupUsed: false,
      msgCount: 0,
      done: false,
      resumeCollected: false,
      resumeText: "",
    });
    // 清除简历输入状态
    setCollectedResumeText("");
    // scalpel 路径特殊处理：需要显示简历输入界面
    if (selected === "scalpel") {
      setShowResumeInput(true);
    } else {
      setShowResumeInput(false);
    }
    setPendingReport(null);
    practicalQueueRef.current = [];
    setMode(selected);
  }, []);

  /** 回车发送，Shift+Enter 换行 */
  const onKeyDownArea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return;
    if (e.shiftKey) return;
    e.preventDefault();
    const form = (e.target as HTMLElement).closest("form");
    form?.requestSubmit();
  };

  /** 分诊直接输入框的回车发送 */
  const onKeyDownTriageArea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return;
    if (e.shiftKey) return;
    e.preventDefault();
    const form = (e.target as HTMLElement).closest("form");
    form?.requestSubmit();
  };

  const subtitleForCard = useCallback(
    (key: AgentKey) => {
      if (panelHandoff && panelHandoff.key === key && !loading) {
        return panelHandoff.text;
      }
      return null;
    },
    [panelHandoff, loading],
  );

  // ─── 当前路径配置（用于右栏进度条 / 顶部说明文字） ─────────────────────────
  const activeConfig = mode !== "triage" ? AGENT_SCRIPTS[mode as FlowMode] : null;

  /** 当前路径的总步骤数（scope_flow 为零步自动生成） */
  const totalSteps = (() => {
    if (!activeConfig) return 0;
    if (activeConfig.steps.length === 0) return 0;
    if (activeConfig.agentKey === "scalpel" && flowState.resumeText) {
      return Math.max(getScalpelEffectiveStepCount(flowState.resumeText), 1);
    }
    return activeConfig.steps.length;
  })();

  // 【新架构】生成流水线状态文本
  const pipelineStatusText = (() => {
    if (mode === "triage") return null;

    const currentAgent = activeConfig?.agentKey;
    if (!currentAgent) return null;

    const upstream = getUpstreamOutput(currentAgent, agentOutputs);
    if (upstream) {
      return `基于 ${AGENTS[upstream.agentKey].name} 的上游产出继续工作`;
    }

    // 检查是否有下游Agent在等待
    const downstreamAgents = Object.entries(agentOutputs).filter(
      ([, output]) => output && 'upstream' in output && output.upstream?.agentKey === currentAgent
    );
    if (downstreamAgents.length > 0) {
      return `已有 ${downstreamAgents.length} 个下游Agent基于本产出继续工作`;
    }

    return null;
  })();

  /** 右栏说明文字（根据当前路径和进度动态生成） */
  const panelStatusText =
    mode === "triage"
      ? "请选择你的入口，总指挥 Compass 将为你调度最合适的军师。"
      : showResumeInput
        ? "📄 请上传 PDF 简历或粘贴简历原文，Scalpel 将基于真实内容进行分析"
        : flowState.done && !currentFlowHasReport()
          ? `素材已收齐，请点击下方按钮生成${activeConfig?.reportTitle ?? "报告"}。`
          : flowState.done || currentFlowHasReport()
          ? `${activeConfig?.reportTitle ?? "报告"} 已生成，可在抽屉中查看。${pipelineStatusText ? ` · ${pipelineStatusText}` : ''}`
          : mode === "scope_flow" && evaluatingAgent === "scope"
            ? "Scope 正在基于 Prism 画像生成行业匹配报告…"
          : activeConfig?.needResume && !flowState.resumeCollected
            ? `${AGENTS[activeConfig.agentKey].name} 等待简历原文中…`
            : `${AGENTS[activeConfig!.agentKey].name} 进行中…${
                totalSteps > 0
                  ? ` 第 ${Math.min(flowState.step, totalSteps)}/${totalSteps} 步`
                  : ""
              }${pipelineStatusText ? ` · ${pipelineStatusText}` : ''}`;

  return (
    <div className="relative min-h-screen px-6 pb-12 pt-8 font-serif text-ink selection:bg-cta/20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(196,30,58,0.07),transparent_55%)]" />

      <div className="relative mx-auto flex w-full max-w-[1400px] flex-row items-stretch gap-6">

        {/* ═══════════════════ 左侧 60%：对话 ═══════════════════ */}
        <section
          className="paper-texture marker-border flex min-h-[28rem] w-[60%] max-w-[60%] flex-col overflow-hidden shadow-card transition-shadow duration-300"
          style={{ height: LEFT_CHAT_PANEL_HEIGHT, maxHeight: LEFT_CHAT_PANEL_HEIGHT }}
        >
          <header className="flex shrink-0 items-center justify-between border-b border-ink/10 bg-paper/60 px-5 py-4">
            <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
              应届生求职作战部 · 作战室
            </h1>
            <Link
              href="/"
              className="marker-border-soft shrink-0 px-4 py-2 text-sm font-bold shadow-warm transition hover:bg-paper"
            >
              ← 返回官网
            </Link>
          </header>

          {/* 消息列表区 */}
          <div
            ref={listRef}
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-5 py-4"
            aria-live="polite"
          >
            {messages.map((m) => {
              const tail = messages[messages.length - 1];
              const isLastAi =
                m.role === "assistant" && tail?.role === "assistant" && tail.id === m.id;

              return m.role === "user" ? (
                <div
                  key={m.id}
                  className="animate-warroom-msg-in ml-auto w-[min(100%,520px)]"
                >
                  <div className="rounded-[20px_20px_6px_20px] border-2 border-[#D4A574] bg-[#fff7ea] px-4 py-3 shadow-warm">
                    <div className="text-right">
                      <span className="text-xs font-semibold uppercase tracking-wide text-ink/45">
                        你
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-right text-sm leading-relaxed text-ink md:text-[15px]">
                      {m.content}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  key={m.id}
                  className="animate-warroom-msg-in mr-auto w-[min(100%,620px)]"
                >
                  <div className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-ink/80">
                    <span className="text-lg leading-none">{AGENTS[m.agentKey].icon}</span>
                    <span>{AGENTS[m.agentKey].name}</span>
                    <span className="text-ink/50">· {AGENTS[m.agentKey].cn}</span>
                  </div>

                  <div className="rounded-[20px_20px_20px_6px] border-2 border-cta/30 bg-[#fff8f7] px-4 py-3 shadow-warm ring-1 ring-cta/10 transition-[border-color,box-shadow] duration-300">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/95 md:text-[15px]">
                      {m.content}
                      {loading && isLastAi ? (
                        <span
                          className="animate-warroom-caret ml-0.5 inline text-cta"
                          aria-hidden
                        >
                          ▋
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={listEndRef} className="h-px shrink-0" aria-hidden />
          </div>

          {error && (
            <div className="shrink-0 border-t border-ink/10 bg-[#fff0f2] px-5 py-2 text-sm font-semibold text-cta">
              {error}
            </div>
          )}

          {/* ─── 分诊入口 UI（mode === 'triage' 时替换正常聊天输入区） ─── */}
          {mode !== "triage" &&
            flowState.done &&
            activeConfig &&
            !currentFlowHasReport() &&
            pendingReport && (
              <div className="shrink-0 border-t border-ink/10 bg-[#fff4f6] px-5 py-3">
                <button
                  type="button"
                  onClick={handleGeneratePendingReport}
                  disabled={loading || mapGenLoading || evaluatingAgent !== null}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-cta/45 bg-white px-4 py-2.5 text-sm font-bold text-cta shadow-warm transition-all hover:bg-cta/5 disabled:cursor-wait disabled:opacity-55"
                >
                  <span>📄</span>
                  <span>
                    生成{activeConfig.reportTitle.replace(/[《》]/g, "")}
                  </span>
                  <span className="text-xs text-ink/40">
                    {evaluatingAgent
                      ? "Evaluator 审核中…"
                      : `${AGENTS[activeConfig.agentKey].name} · 含质量审核`}
                  </span>
                </button>
              </div>
            )}

          {agentOutputs.prism && !agentOutputs.scope && mode !== "scope_flow" && (
              <div className="shrink-0 border-t border-ink/10 bg-[#f0f9ff] px-5 py-3">
                <button
                  type="button"
                  onClick={handleStartScope}
                  disabled={loading || mapGenLoading || evaluatingAgent === "scope"}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-sky-500/40 bg-white px-4 py-2.5 text-sm font-bold text-sky-700 shadow-warm transition-all hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  <span>🔭</span>
                  <span>继续匹配赛道</span>
                  <span className="text-xs text-ink/40">Scope · 基于画像推荐 Top3 方向</span>
                </button>
              </div>
            )}

          {/* 【查看报告按钮】当有报告内容且抽屉关闭、不在生成中时，显示持久入口 */}
          {battleMapMarkdown.length > 0 &&
            !mapOverlayMounted &&
            !mapGenLoading &&
            mode !== "triage" && (
              <div className="shrink-0 border-t border-ink/10 bg-[#fff9f5] px-5 py-3">
                <button
                  type="button"
                  onClick={openReportDrawer}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-cta/40 bg-white px-4 py-2.5 text-sm font-bold text-cta shadow-warm transition-all hover:bg-cta/5 hover:shadow-[0_2px_12px_rgba(196,30,58,0.12)] active:translate-y-px"
                >
                  <span>📄</span>
                  <span>
                    {drawerMode === "battle_map"
                      ? "查看作战地图"
                      : `查看${AGENT_SCRIPTS[drawerMode as FlowMode].reportTitle.replace(/[《》]/g, "")}`}
                  </span>
                  <span className="text-xs text-ink/40">（点击展开）</span>
                </button>
              </div>
            )}

          {/* ─── scalpel 简历输入界面（新架构）─────────────────────────────── */}
          {showResumeInput && mode === "scalpel" ? (
            <div className="shrink-0 border-t-2 border-ink/10 bg-cream/95 px-5 py-5">
              <ResumeInput
                onSubmit={handleResumeSubmit}
                onCancel={handleResumeCancel}
                loading={loading}
              />
            </div>
          ) : mode === "triage" ? (
            <div className="relative z-10 shrink-0 border-t-2 border-ink/10 bg-cream/95 px-5 py-4">
              {/* 5 个路径选择卡片 */}
              <div className="mb-4 flex flex-col gap-2.5">
                {TRIAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.mode}
                    type="button"
                    disabled={loading}
                    onClick={() => handleTriageSelect(opt.mode)}
                    className="group flex items-center gap-3 rounded-2xl border-2 border-ink/14 bg-paper px-4 py-3 text-left shadow-warm transition-all duration-200 hover:scale-[1.015] hover:border-cta/45 hover:bg-[#fff8f7] hover:shadow-[0_2px_14px_rgba(196,30,58,0.10)] active:translate-y-px active:scale-100 disabled:cursor-wait disabled:opacity-55 disabled:hover:scale-100"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-ink/10 bg-white/80 text-xl shadow-sm transition-all duration-200 group-hover:border-cta/30 group-hover:bg-[#fff0f2]"
                      aria-hidden
                    >
                      {opt.icon}
                    </span>
                    <span className="text-[14.5px] font-bold leading-snug text-ink transition-colors duration-200 group-hover:text-cta">
                      {opt.label}
                    </span>
                    <span className="ml-auto shrink-0 text-ink/30 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-cta/60">
                      →
                    </span>
                  </button>
                ))}
              </div>

              {/* 分诊阶段直接打字区域 */}
              <form onSubmit={handleTriageSubmit}>
                <label htmlFor="triage-input" className="sr-only">
                  直接描述你的情况
                </label>
                <div className="flex flex-col gap-2 md:flex-row md:items-end">
                  <textarea
                    id="triage-input"
                    rows={2}
                    value={triageInput}
                    onChange={(e) => setTriageInput(e.target.value)}
                    onKeyDown={onKeyDownTriageArea}
                    placeholder="或者，直接说说你的情况……"
                    disabled={loading}
                    className="min-h-[64px] flex-1 resize-none rounded-xl border-2 border-ink/15 bg-paper px-4 py-2.5 text-[14px] font-semibold text-ink placeholder:text-ink/35 focus:border-[#D4A574] focus:outline-none focus:ring-2 focus:ring-[#D4A574]/30 disabled:opacity-55"
                  />
                  <button
                    type="submit"
                    disabled={loading || !triageInput.trim()}
                    className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full bg-cta px-8 text-[14px] font-bold text-white shadow-[3px_4px_0_rgba(61,40,23,0.15)] transition duration-150 hover:brightness-105 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-48"
                  >
                    {loading ? "作战部回应中…" : "发送"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* ─── 正常对话阶段 ─── */
            <form
              onSubmit={handleSubmit}
              className="shrink-0 border-t-2 border-ink/10 bg-cream/95 p-5"
            >
              <label htmlFor="chat-input-warroom" className="sr-only">
                作战室输入
              </label>
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <textarea
                  id="chat-input-warroom"
                  rows={3}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDownArea}
                  placeholder={
                    mode === "scalpel" && flowState.resumeCollected && !flowState.done
                      ? "回答 Scalpel 的问题，或补充你想投的岗位方向…"
                      : "SHIFT + 回车 换行；回车发送"
                  }
                  disabled={loading}
                  className="min-h-[104px] flex-1 resize-y rounded-xl border-2 border-ink/20 bg-paper px-4 py-3 text-[15px] font-semibold text-ink placeholder:text-ink/40 focus:border-[#D4A574] focus:outline-none focus:ring-2 focus:ring-[#D4A574]/35 disabled:opacity-55"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-full bg-cta px-10 text-[15px] font-bold text-white shadow-[3px_4px_0_rgba(61,40,23,0.15)] transition duration-150 hover:brightness-105 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-48"
                >
                  {loading ? "作战部回应中…" : "发送"}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* ═══════════════════ 右侧 40%：作战部面板 ═══════════════════ */}
        <aside className="flex min-h-0 w-[40%] min-w-[280px] flex-col gap-4 overflow-hidden">
          <div className="paper-texture marker-border-soft px-5 py-4 shadow-card transition-shadow duration-300">
            <div className="flex items-center gap-2">
              <span
                className="animate-warroom-live-dot inline-block size-2 rounded-full bg-cta"
                aria-hidden
              />
              <span className="text-sm font-bold tracking-wide text-ink">
                <span className="text-cta">LIVE</span>
                <span className="text-ink/35"> · </span>
                作战部正在为你工作
              </span>
            </div>
            <p className="mt-2 text-[13px] font-semibold leading-relaxed text-ink/58">
              {panelStatusText}
            </p>
          </div>

          {evaluatingAgent ? (
            <div className="paper-texture marker-border-soft flex items-center gap-3 rounded-2xl border-2 border-amber-500/45 bg-amber-50/80 px-4 py-3 shadow-warm">
              <span className="text-2xl leading-none" aria-hidden>
                {AGENTS.evaluator.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-amber-900">
                  Evaluator · 质量审核中
                </p>
                <p className="mt-0.5 text-[11px] font-semibold leading-snug text-ink/62">
                  正在审核 {AGENTS[evaluatingAgent].name}（{AGENTS[evaluatingAgent].cn}）的结构化产出…
                </p>
              </div>
              <span className="shrink-0 animate-pulse rounded-full bg-amber-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                审核中
              </span>
            </div>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
            {PANEL_ORDER.map((key) => {
              const meta = AGENTS[key];
              const state = cardStateFor(key);
              const active = isActiveGlow(key);
              const highlighted = isModeHighlighted(key) && state === "idle";

              const done = state === "done";
              const busy = state === "busy";

              /**
               * 是否在当前激活路径的 agent 卡片内显示进度条：
               * - 当前 mode 对应的 agentKey 与该卡片一致
               * - 路径进行中且未完成
               * - scalpel 需额外等到简历收集后才开始显示步骤进度
               * - AI 不在 busy 状态（busy 时已有脉冲光圈，进度条不与之同时显示）
               */
              const showFlowProgress =
                mode !== "triage" &&
                !flowState.done &&
                !busy &&
                totalSteps > 0 &&
                activeConfig?.agentKey === key &&
                (!activeConfig.needResume || flowState.resumeCollected);

              return (
                <div
                  key={key}
                  className={`paper-texture relative overflow-hidden rounded-2xl border-2 px-4 py-3 shadow-warm transition-all duration-500 ease-out ${
                    busy
                      ? "border-cta/70 bg-[#fff4f6] shadow-[0_0_0_1px_rgba(196,30,58,0.35)] ring-4 ring-cta/20"
                      : done
                        ? "border-emerald-600/40 bg-emerald-50/40"
                        : highlighted
                          ? "border-cta/55 bg-[#fff6f7] shadow-[0_0_0_1px_rgba(196,30,58,0.18)]"
                          : "border-ink/15 bg-paper"
                  }`}
                >
                  {active ? (
                    <span className="pointer-events-none absolute inset-0 animate-warroom-pulse-ring rounded-2xl border-2 border-cta/25" />
                  ) : null}

                  <div className="relative flex items-center gap-3">
                    <div className="text-2xl leading-none">{meta.icon}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="truncate text-[15px] font-bold">{meta.name}</span>
                        <span className="text-[13px] font-semibold text-ink/60">{meta.cn}</span>
                      </div>

                      {/* 徽章：待命 / 工作中 / 已完成 / 已选入口 */}
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-bold tracking-wide transition-colors duration-500 ${
                            busy
                              ? "bg-cta text-white animate-pulse"
                              : done
                                ? "bg-emerald-600 text-white"
                                : highlighted
                                  ? "bg-cta/15 text-cta border border-cta/30"
                                  : "border border-ink/16 bg-white/85 text-ink/55"
                          }`}
                        >
                          {evaluatingAgent === key
                            ? "Evaluator 审核中"
                            : busy
                              ? "工作中"
                              : done
                                ? "已完成"
                                : highlighted
                                  ? "已选入口"
                                  : "待命"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── 通用进度条：当前激活路径进行中时显示步骤进度 ── */}
                  {showFlowProgress ? (
                    <div className="relative mt-2.5">
                      <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-ink/60">
                        <span>进度</span>
                        <span className="text-cta">
                          {Math.min(flowState.step, totalSteps)}/{totalSteps} 步
                        </span>
                      </div>
                      {/* 进度条轨道 */}
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                        <div
                          className="h-full rounded-full bg-cta/70 transition-all duration-700 ease-out"
                          style={{ width: `${(Math.min(flowState.step, totalSteps) / totalSteps) * 100}%` }}
                        />
                      </div>
                      {/* 当前步骤焦点说明 */}
                      <p className="mt-1 text-[11px] font-semibold text-ink/50">
                        {activeConfig!.steps[Math.min(flowState.step - 1, totalSteps - 1)].focus}
                      </p>
                    </div>
                  ) : null}

                  {/* scalpel 等待简历阶段：显示提示 */}
                  {mode !== "triage" &&
                  activeConfig?.needResume &&
                  !flowState.resumeCollected &&
                  !flowState.done &&
                  !busy &&
                  activeConfig.agentKey === key ? (
                    <div className="relative mt-2.5">
                      <p className="text-[11px] font-bold text-cta/80">⏳ 等待简历原文…</p>
                    </div>
                  ) : null}

                  {/* 【新架构】已完成Agent显示JSON摘要 + 质量审核信息 */}
                  {done && agentOutputs[key as keyof typeof agentOutputs] ? (
                    <div className="relative mt-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        结构化产出
                      </p>
                      {(() => {
                        const summary = getOutputSummary(agentOutputs[key as keyof typeof agentOutputs]!);
                        return (
                          <>
                            <div className="space-y-1">
                              {summary.highlights.slice(0, 2).map((hl, idx) => (
                                <p key={idx} className="truncate text-[11px] leading-snug text-ink/75" title={hl}>
                                  • {hl.length > 35 ? hl.slice(0, 35) + '...' : hl}
                                </p>
                              ))}
                            </div>
                            {/* 【Evaluator】质量评分与状态 */}
                            {summary.qualityScore !== undefined && (
                              <div className="mt-2 flex items-center gap-2 border-t border-emerald-200/60 pt-2">
                                {/* 质量评分 */}
                                <div className="flex items-center gap-1">
                                  <span className={`
                                    text-[11px] font-bold
                                    ${summary.qualityScore >= 80 ? 'text-emerald-600' :
                                      summary.qualityScore >= 60 ? 'text-amber-600' : 'text-cta'}
                                  `}>
                                    {summary.qualityScore}/100
                                  </span>
                                  <span className="text-[10px] text-ink/50">质量分</span>
                                </div>
                                {/* 重做次数徽章 */}
                                {(summary.retryCount ?? 0) > 0 && (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                    已优化 {summary.retryCount} 次
                                  </span>
                                )}
                                {/* 质量警告图标 */}
                                {summary.isForcedAccept && (
                                  <span
                                    className="flex items-center gap-1 rounded-full bg-cta/10 px-2 py-0.5 text-[10px] font-semibold text-cta"
                                    title={summary.qualityIssues?.join('；') || '质量未达标但已强制接受'}
                                  >
                                    ⚠️ 质量警告
                                  </span>
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ) : null}

                  {/* 【Evaluator】报告生成 / 审核中 */}
                  {evaluatingAgent === key ? (
                    <div className="relative mt-2.5">
                      <p className="text-[11px] font-bold text-cta/80 animate-pulse">
                        ⚙ 生成结构化产出 · Evaluator 审核中…
                      </p>
                    </div>
                  ) : null}

                  {subtitleForCard(key) ? (
                    <p className="animate-warroom-msg-in relative mt-2 text-[12px] font-semibold leading-snug text-ink/62">
                      {subtitleForCard(key)}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          <p className="text-center text-[12px] font-semibold text-ink/43">
            内容由大模型生成，请结合自身事实核对后使用 · 不向移动端单独适配布局
          </p>
        </aside>
      </div>

      {/** 作战地图 / 各路径交付物 抽屉：固定在视口右侧，盖住两栏 */}
      {mapOverlayMounted ? (
        <>
          <div
            role="presentation"
            className={`fixed inset-0 z-[118] bg-ink/[0.38] backdrop-blur-[2px] transition-opacity duration-300 ease-out ${
              mapAnimIn ? "opacity-100" : "pointer-events-none opacity-0"
            } `}
            onClick={mapAnimIn ? closeBattleMapDrawer : undefined}
            aria-hidden={!mapAnimIn}
          />

          <aside
            className={`fixed inset-y-0 right-0 z-[119] flex w-[min(100vw,_540px)] max-w-[100vw] flex-col shadow-[-16px_0_48px_rgba(61,40,23,0.22)] ring-4 ring-black/25 transition-[transform,opacity] duration-300 ease-out ${
              mapAnimIn
                ? "translate-x-0 opacity-100"
                : "translate-x-full opacity-90"
            } `}
            role="dialog"
            aria-modal
            aria-labelledby="battle-map-title"
            aria-busy={mapGenLoading}
          >
            <div className="paper-texture marker-border-soft relative flex max-h-none min-h-0 flex-1 flex-col overflow-hidden rounded-none border-x-2 border-y-2 border-x-ink/90 border-y-ink/90 md:rounded-bl-[235px_22px] md:rounded-tl-[235px_22px]">
              {/* 顶栏标题 + 右上角关闭 */}
              <header className="flex shrink-0 items-start justify-between gap-3 border-b-2 border-ink/14 bg-[#fff9f5]/92 px-5 pb-4 pt-5 backdrop-blur-sm">
                <div className="min-w-0 pr-12">
                  {/* 副标题：根据 drawerMode 动态切换 */}
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cta">
                    {drawerMode === "battle_map"
                      ? "Confidential brief"
                      : AGENT_SCRIPTS[drawerMode].reportDrawerSubtitle}
                  </p>
                  <h2 id="battle-map-title" className="mt-1 truncate text-xl font-bold text-ink sm:text-2xl">
                    {drawerMode === "battle_map"
                      ? "《校招作战地图》"
                      : AGENT_SCRIPTS[drawerMode].reportTitle}
                  </h2>
                  <p className="mt-2 text-[13px] font-semibold text-ink/55">
                    {drawerMode === "battle_map"
                      ? "由完整对话会话流式生成的正式摘要 · 可复制或下载存档"
                      : "基于完整对话生成 · 可复制或下载存档"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeBattleMapDrawer}
                  className="absolute right-4 top-4 rounded-full border border-ink/22 bg-white/95 px-2.5 py-1.5 text-lg font-bold leading-none text-ink/70 shadow-warm ring-cta/25 transition hover:border-cta/60 hover:bg-paper hover:text-cta md:text-xl"
                  aria-label="关闭面板"
                >
                  ✕
                </button>
              </header>

              {/* 公文正文区 */}
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#fdf9f6] px-5 py-5">
                <div className="mx-auto max-w-none rounded-[222px_12px_200px_12px_/12px_200px_12px_222px] border-[1.8px] border-ink/[0.06] bg-paper px-6 py-7 shadow-inner md:rounded-[228px_16px_210px_16px_/16px_210px_16px_228px]">
                  {mapGenLoading && battleMapMarkdown.length === 0 && !mapGenError ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                      <span
                        className="inline-block size-10 animate-spin rounded-full border-[3px] border-cta/25 border-t-cta"
                        aria-hidden
                      />
                      <p className="text-sm font-semibold text-ink/72">
                        {drawerMode === "battle_map"
                          ? "⚙ 作战部整合对话中，请稍候…"
                          : `⚙ ${AGENT_SCRIPTS[drawerMode].reportDrawerSubtitle} 正在整合素材，请稍候…`}
                      </p>
                    </div>
                  ) : null}

                  {mapGenError ? (
                    <div className="rounded-xl border border-cta/40 bg-[#fff0f2] px-4 py-3 text-sm font-bold text-cta">
                      {mapGenError}
                    </div>
                  ) : null}

                  {battleMapMarkdown.length > 0 ? (
                    <div className={`battle-map-md ${mapGenLoading ? "opacity-[0.93]" : ""}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{battleMapMarkdown}</ReactMarkdown>
                      {mapGenLoading && battleMapMarkdown.length > 0 ? (
                        <span className="ml-1 inline-block size-3 animate-pulse rounded-sm bg-cta/45 align-middle" aria-hidden />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* 底栏 · 复制 + 下载 */}
              <footer className="shrink-0 border-t-2 border-ink/12 bg-[#fff7f3]/94 px-5 py-4 backdrop-blur-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        void handleCopyBattleMap();
                      }}
                      disabled={!battleMapMarkdown.trim()}
                      className="marker-border-soft inline-flex items-center rounded-full border-ink/85 bg-[#fffdf9] px-5 py-2.5 text-sm font-bold text-ink shadow-warm ring-cta/35 transition hover:border-cta hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      📋 复制{drawerMode === "battle_map" ? "全文" : "报告"}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadBattleMap}
                      disabled={!battleMapMarkdown.trim()}
                      className="rounded-full bg-cta px-5 py-2.5 text-sm font-bold text-white shadow-[3px_4px_0_rgba(61,40,23,0.12)] transition hover:brightness-105 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-42"
                    >
                      ⬇ 下载{drawerMode === "battle_map" ? "" : "报告"}
                    </button>
                    {/* 【Scalpel 专用】下载图片版简历按钮 */}
                    {drawerMode === "scalpel" && (
                      <button
                        type="button"
                        onClick={handleDownloadResumeImage}
                        disabled={!battleMapMarkdown.trim() || resumeImageLoading}
                        className="rounded-full border-2 border-cta/50 bg-white px-5 py-2.5 text-sm font-bold text-cta shadow-warm transition hover:bg-cta/5 disabled:cursor-not-allowed disabled:opacity-42"
                      >
                        {resumeImageLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="inline-block size-4 animate-spin rounded-full border-2 border-cta/30 border-t-cta" />
                            生成中…
                          </span>
                        ) : (
                          <>📄 下载图片版简历</>
                        )}
                      </button>
                    )}
                  </div>
                  {mapCopyFeedback ? (
                    <span className="animate-warroom-msg-in text-sm font-bold text-emerald-700">
                      {mapCopyFeedback}
                    </span>
                  ) : null}
                </div>
              </footer>
            </div>
          </aside>
        </>
      ) : null}

      {/* 【Scalpel 专用】离屏简历模板，用于导出图片（须保持真实尺寸，不可 width:0） */}
      {drawerMode === "scalpel" && battleMapMarkdown && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            left: "-10000px",
            top: 0,
            zIndex: -1,
            pointerEvents: "none",
          }}
        >
          <ResumeTemplate
            ref={resumeTemplateRef}
            content={extractRewrittenResumeFromReport(battleMapMarkdown) || battleMapMarkdown}
          />
        </div>
      )}
    </div>
  );
}
