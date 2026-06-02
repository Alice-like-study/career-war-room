/**
 * Scalpel 简历分析辅助：判断简历是否已含关键信息，避免重复追问。
 */

export type ScalpelGap = "target" | "quant" | "differentiation";

export type ScalpelStepDef = {
  focus: string;
  question: string;
};

export const SCALPEL_STEP_BY_GAP: Record<ScalpelGap, ScalpelStepDef> = {
  target: {
    focus: "确认目标方向",
    question: "你想投的是什么岗位/行业？",
  },
  quant: {
    focus: "挖成果量化",
    question: "简历里最相关的那段经历，有能量化的结果吗？用户量/时间/成本各是多少？",
  },
  differentiation: {
    focus: "挖差异化",
    question: "同样的事别人也能做，你做得有什么不一样？",
  },
};

/** 简历是否已写明目标岗位/求职意向 */
export function resumeHasTargetPosition(text: string): boolean {
  return (
    /(?:求职意向|目标岗位|应聘岗位|意向岗位|求职方向|应聘职位|求职岗位|意向职位)/i.test(text) ||
    /(?:Position|Target\s*Role)[：:\s]/i.test(text) ||
    /(?:^|[\n|｜\s])岗位[：:\s]\S+/m.test(text) ||
    /意向[：:\s].{2,40}(?:工程师|经理|专员|分析师|产品|运营|开发|销售|设计)/i.test(text)
  );
}

/** 简历是否已包含可识别的量化表述 */
export function resumeHasQuantData(text: string): boolean {
  return (
    /\d+\s*[%％]/.test(text) ||
    /\d+\s*(?:万|千|百|人|次|个|倍|天|月|年|条|项|台|款|家|单)/.test(text) ||
    /(?:提升|增长|降低|减少|节省|优化|转化|覆盖|达成|完成|提高|实现).{0,20}\d/.test(text) ||
    /\d.{0,16}(?:提升|增长|降低|减少|节省|人|次|个|%|％|万|千)/.test(text)
  );
}

/** 根据简历内容判断还需追问哪些维度（仅真正缺失的才追问） */
export function getScalpelGaps(text: string): ScalpelGap[] {
  const gaps: ScalpelGap[] = [];
  if (!resumeHasTargetPosition(text)) gaps.push("target");
  if (!resumeHasQuantData(text)) gaps.push("quant");
  // 长简历且岗位+量化已齐，不再强制追问差异化
  const detailed = text.length >= 2000 && resumeHasTargetPosition(text) && resumeHasQuantData(text);
  if (!detailed && gaps.length <= 1) {
    gaps.push("differentiation");
  }
  return gaps;
}

/** 按缺口动态生成有效追问步骤 */
export function getScalpelEffectiveSteps(resumeText: string): ScalpelStepDef[] {
  return getScalpelGaps(resumeText).map((gap) => SCALPEL_STEP_BY_GAP[gap]);
}

export function getScalpelEffectiveStepCount(resumeText: string): number {
  return getScalpelEffectiveSteps(resumeText).length;
}

/** 信息足够时可直接生成报告，无需多轮追问 */
export function resumeReadyForReport(text: string): boolean {
  return getScalpelGaps(text).length === 0;
}

/** 确认类短答视为有效回答（Scalpel 专用） */
export function isScalpelAffirmative(text: string): boolean {
  const t = text.trim();
  return /^(是的|对|没错|嗯|是|好的|好|可以|OK|ok|yes|yeah|yep)[。.!！?？~～]*$/i.test(t);
}

/** AI 回复是否表示追问结束、应触发报告生成 */
export function detectScalpelFinishSignal(assistantText: string): boolean {
  return /(?:报告正在生成|信息够了|素材.*(?:已|收集)|开始生成|请稍候.*报告|请查看右侧面板)/.test(
    assistantText,
  );
}

/** 简历一级模块（不含 bullet 内小标题，如「荣誉奖项」「核心课程」） */
const RESUME_TOP_SECTIONS = [
  "个人信息",
  "教育背景",
  "实习经历",
  "工作经历",
  "项目经历",
  "校园经历",
  "科研经历",
  "社会实践",
  "技能证书",
  "专业技能",
  "技能特长",
  "获奖情况",
  "自我评价",
] as const;

const TOP_SECTION_RE = RESUME_TOP_SECTIONS.join("|");

/**
 * 将粘连的模块标题拆成独立行，统一为 ## 标题（兜底 LLM 把标题与正文写在一行）
 */
export function normalizeResumeSectionBreaks(markdown: string): string {
  let text = markdown;

  // ## 教育背景 南京师范大学… → 标题与正文分行
  text = text.replace(
    new RegExp(`^(#{1,3})\\s*(${TOP_SECTION_RE})\\s+(.+)$`, "gm"),
    (_m, hashes: string, title: string, rest: string) => {
      const level = hashes.length <= 2 ? "##" : "###";
      return `${level} ${title}\n\n${rest.trim()}`;
    },
  );

  // 行首 **实习经历** 京东… → ## 实习经历 + 正文
  text = text.replace(
    new RegExp(`^\\s*\\*\\*(${TOP_SECTION_RE})\\*\\*(?!\\s*[:：])\\s*(.+)$`, "gm"),
    "## $1\n\n$2",
  );

  // 行内 **教育背景**（排除 **荣誉奖项:** 等带冒号的小标题）
  text = text.replace(
    new RegExp(`([^\\n#])\\s*\\*\\*(${TOP_SECTION_RE})\\*\\*(?!\\s*[:：])\\s*`, "g"),
    "$1\n\n## $2\n\n",
  );

  // 单独一行的纯文本模块名 → ## 模块名
  text = text.replace(new RegExp(`^(${TOP_SECTION_RE})\\s*$`, "gm"), "## $1");

  return text;
}

/** 移除 STAR 英文标签，转为正常 bullet（兜底清洗 LLM 输出） */
export function sanitizeResumeMarkdown(markdown: string): string {
  let text = markdown.trim();
  if (!text) return "";

  // **Situation:** / Situation: 等标签（含列表项内联形式）
  text = text.replace(
    /\*\*(?:Situation|Task|Action|Result)[：:.]*\*\*[：:.]*\s*/gi,
    "",
  );
  text = text.replace(/(?:^|[\n\r]|[-*•]\s*)\s*(?:Situation|Task|Action|Result)[：:.]\s*/gim, (m) =>
    m.startsWith("-") || m.startsWith("*") ? "- " : "\n- ",
  );
  text = text.replace(/(?:Situation|Task|Action|Result)[：:.]\s*/gi, "");
  // 中文标签（若模型用了）
  text = text.replace(
    /\*\*(?:背景|任务|行动|结果)[：:.]*\*\*\s*/g,
    "",
  );

  text = normalizeResumeSectionBreaks(text);

  return text.replace(/\n{3,}/g, "\n\n").trim();
}

/** 是否为与页眉重复的「姓名 | 手机 | 邮箱」个人信息行 */
function isDuplicatePersonalInfoLine(line: string): boolean {
  const t = line.trim();
  if (!t || /^#{1,6}\s/.test(t)) return false;
  const pipeCount = (t.match(/[｜|]/g) ?? []).length;
  if (pipeCount < 2) return false;
  return /\d{11}/.test(t) || /@[\w.-]+\.[A-Za-z]{2,}/.test(t);
}

/** 去掉正文开头重复的联系方式行（模板页眉已展示） */
export function stripDuplicateContactLines(markdown: string): string {
  const lines = markdown.split("\n");
  let i = 0;
  while (i < lines.length && lines[i]?.trim() === "") i++;
  while (i < lines.length && isDuplicatePersonalInfoLine(lines[i] ?? "")) i++;
  while (i < lines.length && lines[i]?.trim() === "") i++;
  return lines.slice(i).join("\n").trim();
}

/** 从正文中剥离与模板层重复的页眉（姓名/联系方式） */
export function stripLeadingResumeHeader(markdown: string): string {
  const lines = markdown.split("\n");
  let i = 0;

  // 跳过首个 # / ## 标题（姓名 | 岗位）
  if (lines[i]?.match(/^#{1,2}\s+.+/)) i++;
  while (i < lines.length && lines[i]?.trim() === "") i++;

  // 跳过联系方式行（标签式或 pipe 分隔个人信息行）
  while (
    i < lines.length &&
    (/(?:手机|邮箱|电话|Email|Tel|年龄|微信)[：:]/i.test(lines[i] ?? "") ||
      isDuplicatePersonalInfoLine(lines[i] ?? ""))
  ) {
    i++;
  }
  while (i < lines.length && lines[i]?.trim() === "") i++;

  return lines.slice(i).join("\n").trim();
}

/** 从标题行解析「姓名 | 岗位」 */
export function parseResumeTitleLine(content: string): { name: string; position: string } {
  const h1 = content.match(/^#{1,2}\s+(.+?)$/m);
  if (!h1) return { name: "", position: "" };
  const parts = h1[1].split("|").map((s) => s.trim());
  return { name: parts[0] ?? "", position: parts.slice(1).join(" | ") };
}

/** 导出图片前完整清洗 */
export function prepareResumeForRender(markdown: string): string {
  const cleaned = sanitizeResumeMarkdown(markdown);
  return stripDuplicateContactLines(stripLeadingResumeHeader(cleaned));
}

/** 从 Scalpel 报告 Markdown 中提取改写后的简历正文（供图片导出） */
export function extractRewrittenResumeFromReport(report: string): string {
  let content = report.trim();
  if (!content) return "";

  const sectionMatch = content.match(
    /##\s*[^\n]*(?:STAR|重写|改写)[^\n]*\n[\s\S]*?```(?:markdown)?\n?([\s\S]*?)```/i,
  );
  if (sectionMatch?.[1]) {
    return prepareResumeForRender(sectionMatch[1].trim());
  }

  const blockRegex = /```(?:markdown)?\n?([\s\S]*?)```/g;
  let last: string | undefined;
  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(content)) !== null) {
    last = match[1]?.trim();
  }
  if (last && !last.startsWith("{")) return prepareResumeForRender(last);

  content = content
    .replace(/^#\s*[^\n]+\n/, "")
    .replace(/##\s*[^\n]*(?:硬伤|诊断)[\s\S]*?(?=##|$)/i, "")
    .replace(/##\s*[^\n]*(?:投递|策略)[\s\S]*$/i, "")
    .replace(/---[\s\S]*$/, "")
    .trim();

  return prepareResumeForRender(content);
}

/** 将 Scalpel 结构化产出格式化为抽屉展示的 Markdown 报告 */
export function formatScalpelReportMarkdown(output: {
  diagnosis: Array<{ type: string; original: string; problem: string; fix: string }>;
  overallVerdict?: string;
  versions: Array<{
    targetTrack: string;
    resumeMarkdown: string;
    companies?: { mustApply?: string[]; canApply?: string[]; avoid?: string[] };
  }>;
  recommendedVersionIndex?: number;
}): string {
  const idx = output.recommendedVersionIndex ?? 0;
  const version = output.versions[idx] ?? output.versions[0];
  if (!version) return "";

  const typeLabels: Record<string, string> = {
    cliche: "套话",
    noData: "缺量化",
    keywordMissing: "缺关键词",
    wrongOrder: "顺序不当",
    visualMess: "视觉杂乱",
  };

  const diagnosisBlock = output.diagnosis
    .slice(0, 5)
    .map(
      (d, i) =>
        `${i + 1}. **${typeLabels[d.type] ?? d.type}**："${d.original}"\n   - 问题：${d.problem}\n   - 改进：${d.fix}`,
    )
    .join("\n");

  const companies = version.companies;
  const strategyBlock = companies
    ? `- **必投**：${(companies.mustApply ?? []).join("、") || "—"}
- **可投**：${(companies.canApply ?? []).join("、") || "—"}
- **暂缓**：${(companies.avoid ?? []).join("、") || "—"}`
    : "";

  const resumeBody = prepareResumeForRender(version.resumeMarkdown.trim());

  return `# 🔪 简历优化报告

## 🩺 原简历硬伤诊断
${diagnosisBlock || "（暂无）"}

${output.overallVerdict ? `## 📋 总体诊断\n${output.overallVerdict}\n` : ""}
## ✅ 重写后的完整简历（${version.targetTrack}）

\`\`\`markdown
${resumeBody}
\`\`\`

## 🎯 投递策略
${strategyBlock}

---
*由 Scalpel · 简历医生 基于简历原文与追问生成*`;
}
