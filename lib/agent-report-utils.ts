/**
 * 各 Agent 结构化产出 → 抽屉 Markdown 报告
 * 以及 Lumen 情绪信号检测
 */

import type {
  ScopeOutput,
  ArenaOutput,
  BalanceOutput,
  LumenOutput,
  LumenSignal,
} from './agent-outputs';

// ─── Lumen 信号检测 ───────────────────────────────────────────────────────────

const EXTREME_SIGNAL_PATTERNS = [
  /不想活/,
  /活不下去/,
  /想死/,
  /去死/,
  /自杀/,
  /自残/,
  /割腕/,
  /结束生命/,
  /了结/,
  /跳楼/,
  /吞药/,
  /一了百了/,
];

const NEGATIVE_WORD_PATTERNS = [
  /没人要我/,
  /我废了/,
  /我太烂了/,
  /白读了/,
  /想躺平/,
  /撑不住/,
  /没希望/,
  /完了/,
  /全完了/,
  /不如别人/,
  /好焦虑/,
  /好崩溃/,
  /受不了/,
];

const USER_CALL_PATTERNS = [
  /想倾诉/,
  /说说话/,
  /好难过/,
  /好难受/,
  /心里堵/,
  /情绪/,
  /焦虑/,
  /抑郁/,
];

export const LUMEN_HOTLINE = '400-161-9995';
export const LUMEN_HOTLINE_BEIJING = '010-82951332';

export function detectExtremeSignal(text: string): boolean {
  return EXTREME_SIGNAL_PATTERNS.some((p) => p.test(text));
}

/** 用户想对比/选择 Offer（应走 Balance，而非 Lumen 情绪陪跑） */
export function detectOfferDecisionIntent(text: string): boolean {
  const t = text.trim();
  if (!t) return false;

  if (/offer/i.test(t) && /纠结|选择|选哪|选哪个|对比|二选一|三选一|拿不准|犹豫|怎么选|哪个好|offer选择/i.test(t)) {
    return true;
  }
  if (/offer/i.test(t) && /(几个|多个|两份|三份|两个|三个)/.test(t)) {
    return true;
  }
  if (/(录用|意向|校招).{0,12}(纠结|选择|选哪|犹豫)/.test(t) || /(纠结|犹豫).{0,12}(录用|意向|offer|工作|岗位)/i.test(t)) {
    return true;
  }
  if (/(几个|多份|两个|三个).{0,10}(offer|工作|岗位|机会).{0,10}(纠结|选|犹豫)/i.test(t)) {
    return true;
  }
  return false;
}

/** 用户想分析/优化简历（应走 Scalpel 并弹出上传区） */
export function detectResumeIntent(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (/简历|履历|\bCV\b/i.test(t)) return true;
  if (/(分析|改|优化|看看|帮我看|审|诊断|润色).{0,10}简历/.test(t)) return true;
  if (/简历.{0,10}(分析|优化|修改|看看|诊断|润色|怎么写)/.test(t)) return true;
  return false;
}

/** 求职方向迷茫（Prism 自我画像） */
export function detectCareerConfusionIntent(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return /迷茫|不知道.{0,8}(适合|做什|干什|选什)|适合什么|做什么工作|没方向|找不到方向|自我画像|了解自己/i.test(
    t,
  );
}

/** 模拟面试练习（Arena） */
export function detectInterviewIntent(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return /面试|一面|二面|群面|模拟面|练一练|面经/i.test(t);
}

/** 实务问题已明确时，句中的纠结/焦虑等（与 Lumen 并联，不挡 Balance/Prism） */
export function detectEmotionalOverlay(text: string): LumenSignal | null {
  const t = text.trim();
  if (!t || detectExtremeSignal(t)) return null;
  const hasPractical =
    detectOfferDecisionIntent(t) ||
    detectResumeIntent(t) ||
    detectCareerConfusionIntent(t) ||
    detectInterviewIntent(t);
  if (!hasPractical) return null;

  const overlay = t.match(
    /纠结|挣扎|心累|压力大|很烦|焦虑|难受|慌|睡不着|崩溃|撑不住|不知道怎么办/,
  );
  if (!overlay) return null;
  return {
    type: "userCall",
    detected: overlay[0],
    meaning: "在现实抉择/任务压力下伴随情绪消耗，需先简短接住再交实务军师",
  };
}

export type WarRoomFlowMode =
  | "prism_flow"
  | "balance"
  | "scalpel"
  | "arena"
  | "lumen";

export function orderPracticalFlowModes(modes: WarRoomFlowMode[]): WarRoomFlowMode[] {
  const rank: Record<string, number> = {
    prism_flow: 0,
    balance: 1,
    scalpel: 2,
    arena: 3,
  };
  return [...modes].sort((a, b) => (rank[a] ?? 9) - (rank[b] ?? 9));
}

/** 一条消息里可能同时包含情绪诉求 + 一个或多个实务路径 */
export function analyzeWarRoomIntents(text: string): {
  emotional: LumenSignal | null;
  practicalModes: WarRoomFlowMode[];
} {
  const practicalModes: WarRoomFlowMode[] = [];
  if (detectCareerConfusionIntent(text)) practicalModes.push("prism_flow");
  if (detectOfferDecisionIntent(text)) practicalModes.push("balance");
  if (detectResumeIntent(text)) practicalModes.push("scalpel");
  if (detectInterviewIntent(text)) practicalModes.push("arena");

  const ordered = orderPracticalFlowModes(practicalModes);

  let emotional = detectEmotionSignal(text);
  if (!emotional) {
    emotional = detectEmotionalOverlay(text);
  }

  return { emotional, practicalModes: ordered };
}

export function detectEmotionSignal(text: string): LumenSignal | null {
  if (detectExtremeSignal(text)) {
    return {
      type: 'negativeWords',
      detected: text.slice(0, 80),
      meaning: '识别到极端情绪信号，需立即推送专业心理援助',
    };
  }
  for (const p of NEGATIVE_WORD_PATTERNS) {
    if (p.test(text)) {
      return {
        type: 'negativeWords',
        detected: text.match(p)?.[0] ?? text.slice(0, 40),
        meaning: '处于自我否定或挫败状态，需要重新锚定事实',
      };
    }
  }
  for (const p of USER_CALL_PATTERNS) {
    if (p.test(text)) {
      return {
        type: 'userCall',
        detected: text.match(p)?.[0] ?? text.slice(0, 40),
        meaning: '用户主动表达情绪诉求，需要陪伴介入',
      };
    }
  }
  return null;
}

export function formatExtremeAlertMarkdown(): string {
  return `

---

⚠️ **重要提醒**

如果你正在经历非常艰难的时刻，请立即联系专业心理援助：

- 全国心理援助热线：**${LUMEN_HOTLINE}**
- 北京心理危机研究与干预中心：**${LUMEN_HOTLINE_BEIJING}**

你不是一个人。`;
}

// ─── Scope 行业匹配报告 ───────────────────────────────────────────────────────

export function formatScopeReportMarkdown(output: ScopeOutput): string {
  const tracks = output.topTracks
    .map(
      (t) => `### 推荐 ${t.rank}：${t.name}

- **为什么适合你**：${t.why}
- **画像证据**：${t.evidenceFromPrism}
- **应届生起薪**：${t.startingSalary}
- **3年路径**：${t.threeYearPath}
- **风险点**：${t.risks}
- **典型公司**：${t.targetCompanies.join('、')}`,
    )
    .join('\n\n');

  const wildCards = output.wildCards
    .map((w) => `- **${w.name}**：${w.whyConsider}`)
    .join('\n');

  const top1 = output.topTracks[0];

  return `# 🔭 行业匹配报告

## TL;DR
基于你的画像，你最该关注的方向是：**${top1?.name ?? '待定'}**。
${top1 ? `原因：${top1.why}` : ''}

## Top 3 推荐方向
${tracks}

## ⚠️ 看似适合但不推荐
**${output.misleadingTrack.name}**
- 误导证据：${output.misleadingTrack.misleadingEvidence}
- 隐形地雷：${output.misleadingTrack.hiddenRisk}

## 💡 野路子但值得考虑
${wildCards}

## 🎯 给 Scalpel 的交接
${output.handoffNote}

---
*由 Scope · 行业匹配官 基于 Prism 画像生成*`;
}

// ─── Arena 面试通关手册 ───────────────────────────────────────────────────────

export function formatArenaReportMarkdown(output: ArenaOutput): string {
  const reviews = output.reviews
    .map((r) => {
      const good = r.goodPoints.map((g) => `- ✅ ${g}`).join('\n');
      const problems = r.problems
        .map((p) => `- ❌ 【${p.type}】"${p.sentence}" — ${p.whyBad}`)
        .join('\n');
      return `### 第 ${r.round} 题：${r.question}

**你的原答：** ${r.userAnswer}

**优点 ✅**
${good || '- （暂无）'}

**硬伤 ❌**
${problems || '- （暂无）'}

**改写示范 🎯**
${r.starRewrite}`;
    })
    .join('\n\n');

  const focus = output.practiceFocus.map((f, i) => `${i + 1}. ${f}`).join('\n');

  return `# ⚔️ 面试通关手册

## 📋 5 道题复盘
${reviews}

## 📊 面试段位评估
- **当前段位**：${output.level.current} / ${output.level.max} 段
- **最大硬伤**：${output.biggestWeakness}
- **最容易提分**：${output.easiestFix}

## 🎯 提分建议
${focus}

## 总评
${output.handoffNote}

---
*由 Arena · 模拟面试官 基于 5 轮模拟面试生成*`;
}

// ─── Balance Offer 决策报告 ───────────────────────────────────────────────────

export function formatBalanceReportMarkdown(output: BalanceOutput): string {
  const dimHeader = output.dimensions.map((d) => d.name).join(' | ');
  const dimWeights = output.dimensions.map((d) => `${d.weight}%`).join(' | ');

  const weightRows = output.dimensions
    .map((d) => {
      const cells = output.offerScores
        .map((o) => {
          const score = o.scores[d.name] ?? '-';
          const weighted = ((score as number) * d.weight) / 100;
          return `${score} | ${typeof score === 'number' ? weighted.toFixed(1) : '-'}`;
        })
        .join(' | ');
      return `| ${d.name} | ${d.weight}% | ${cells} |`;
    })
    .join('\n');

  const offerHeaders = output.offerScores.map((o) => o.offerName).join(' | ');
  const totalRow = output.offerScores
    .map((o) => o.weightedTotal.toFixed(1))
    .join(' | ');

  return `# ⚖️ Offer 决策报告

## 📊 你的权重表

| 维度 | 权重 |
|------|------|
${output.dimensions.map((d) => `| ${d.name} | ${d.weight}% |`).join('\n')}
| **总计** | **100%** |

## 📋 各 Offer 加权对比

| 维度 | 权重 | ${offerHeaders} |
|------|------|${'------|'.repeat(output.offerScores.length + 1)}
${weightRows}
| **加权总分** | 100% | ${totalRow} |

## 🎯 理性最优解
**${output.rationalChoice}**

核心驱动维度：${output.keyDriver}

## ⚠️ 反直觉提醒
${output.counterIntuitiveWarning}

## 建议
${output.handoffNote}

---
*由 Balance · Offer 决策官 生成 · 维度：${dimHeader} · 权重：${dimWeights}*`;
}

// ─── Lumen 情绪小结 ───────────────────────────────────────────────────────────

const SIGNAL_LABELS: Record<LumenSignal['type'], string> = {
  negativeWords: '高频负面词',
  stuckLoop: '反复循环',
  timeAnomaly: '时间异常',
  userCall: '用户主动呼叫',
};

export function formatLumenReportMarkdown(output: LumenOutput): string {
  const alertBlock = output.extremeAlert
    ? formatExtremeAlertMarkdown()
    : '';

  return `# 💡 情绪小结

**识别信号：** ${SIGNAL_LABELS[output.signal.type]} — ${output.signal.detected}

**这意味着：** ${output.signal.meaning}

---

**此刻状态：** ${output.cbt.emotionNamed}

**事实 vs 解读**
- 事实是：${output.cbt.fact}
- 你的解读：${output.cbt.interpretation}
${output.cbt.leaps.map((l, i) => `- 跳跃 ${i + 1}：${l}`).join('\n')}

**接下来 10 分钟：** ${output.cbt.minAction}

${output.handoffNote ? `\n---\n${output.handoffNote}` : ''}
${alertBlock}

---
*由 Lumen · 情绪陪跑官 陪伴生成*`;
}

/** 根据 agentKey 选择对应格式化函数 */
export function formatAgentReportMarkdown(
  agentKey: 'scope' | 'arena' | 'balance' | 'lumen',
  output: ScopeOutput | ArenaOutput | BalanceOutput | LumenOutput,
): string {
  switch (agentKey) {
    case 'scope':
      return formatScopeReportMarkdown(output as ScopeOutput);
    case 'arena':
      return formatArenaReportMarkdown(output as ArenaOutput);
    case 'balance':
      return formatBalanceReportMarkdown(output as BalanceOutput);
    case 'lumen':
      return formatLumenReportMarkdown(output as LumenOutput);
    default:
      return '';
  }
}
