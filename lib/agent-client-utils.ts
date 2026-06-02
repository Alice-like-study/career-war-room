/**
 * 客户端安全的 Agent 工具函数（不依赖 LLM / OpenAI）
 * 供 app/chat/page.tsx 等 Client Component 使用
 */

import type { AgentKey } from './agents';
import {
  type AgentOutput,
  type AgentOutputMap,
  AGENT_UPSTREAM_DEPENDENCY,
} from './agent-outputs';

const JSON_OUTPUT_REGEX = /```json-output\n([\s\S]*?)\n```$/;

function extractStructuredOutput(rawResponse: string): {
  cleanReply: string;
  structuredData: Record<string, unknown> | null;
  hasJsonOutput: boolean;
} {
  const match = rawResponse.match(JSON_OUTPUT_REGEX);

  if (!match) {
    return {
      cleanReply: rawResponse.trim(),
      structuredData: null,
      hasJsonOutput: false,
    };
  }

  const jsonStr = match[1].trim();
  const cleanReply = rawResponse.slice(0, match.index).trim();

  try {
    const structuredData = JSON.parse(jsonStr) as Record<string, unknown>;
    return {
      cleanReply,
      structuredData,
      hasJsonOutput: true,
    };
  } catch (e) {
    console.error('[AgentClient] JSON解析失败:', e);
    return {
      cleanReply: rawResponse.trim(),
      structuredData: null,
      hasJsonOutput: false,
    };
  }
}

function validateStructuredOutput(
  data: Record<string, unknown>,
  agentKey: AgentKey,
): boolean {
  if (!data.agentKey || data.agentKey !== agentKey) {
    return false;
  }

  if (!data.completedAt || typeof data.completedAt !== 'string') {
    return false;
  }

  switch (agentKey) {
    case 'prism':
      return (
        typeof data.oneLineProfile === 'string' &&
        Array.isArray(data.coreDrives) &&
        Array.isArray(data.strengths) &&
        Array.isArray(data.valueRanking) &&
        Array.isArray(data.dealBreakers)
      );
    case 'scope':
      return (
        data.upstream !== undefined &&
        Array.isArray(data.topTracks) &&
        data.misleadingTrack !== undefined
      );
    case 'scalpel':
      return (
        Array.isArray(data.diagnosis) &&
        Array.isArray(data.versions) &&
        data.versions.length >= 1
      );
    case 'arena':
      return Array.isArray(data.reviews) && data.reviews.length >= 5 && data.level !== undefined;
    case 'balance':
      return (
        Array.isArray(data.dimensions) &&
        Array.isArray(data.offerScores) &&
        typeof data.rationalChoice === 'string'
      );
    case 'lumen':
      return (
        data.signal !== undefined &&
        data.cbt !== undefined &&
        typeof data.extremeAlert === 'boolean'
      );
    default:
      return true;
  }
}

/** 裸 JSON 块（模型未包在 json-output 代码块时） */
const BARE_AGENT_JSON_REGEX =
  /\n?\s*(\{[\s\S]*"agentKey"\s*:\s*"(?:prism|scope|scalpel|arena|balance|lumen)"[\s\S]*\})\s*$/;

/**
 * 从对话展示文本中移除结构化 JSON（含 ```json-output``` 与尾部裸 JSON）
 */
export function stripStructuredOutputFromReply(text: string): string {
  const { cleanReply, hasJsonOutput } = extractStructuredOutput(text);
  if (hasJsonOutput) {
    return cleanReply;
  }

  const bare = text.match(BARE_AGENT_JSON_REGEX);
  if (!bare) {
    return text.trim();
  }

  try {
    JSON.parse(bare[1]);
    return text.slice(0, bare.index).trim();
  } catch {
    return text.trim();
  }
}

export function extractFromExistingText<T extends AgentOutput = AgentOutput>(
  text: string,
  agentKey: AgentKey,
): T | null {
  const { structuredData } = extractStructuredOutput(text);

  if (!structuredData) {
    return null;
  }

  const isValid = validateStructuredOutput(structuredData, agentKey);
  return isValid ? (structuredData as T) : null;
}

export function getUpstreamOutput(
  agentKey: AgentKey,
  allOutputs: Partial<AgentOutputMap>,
): AgentOutput | null {
  const upstreamKey = AGENT_UPSTREAM_DEPENDENCY[agentKey];
  if (!upstreamKey) {
    return null;
  }

  return allOutputs[upstreamKey as keyof AgentOutputMap] ?? null;
}

export interface OutputSummary {
  title: string;
  highlights: string[];
  qualityScore?: number;
  qualityPassed?: boolean;
  retryCount?: number;
  isForcedAccept?: boolean;
  qualityIssues?: string[];
}

export function getOutputSummary(output: AgentOutput): OutputSummary {
  const evaluation = output._evaluation;
  const qualityScore = evaluation?.score;
  const qualityPassed = evaluation?.pass;
  const retryCount = evaluation?.retryCount ?? 0;
  const isForcedAccept = evaluation?.isForcedAccept;
  const qualityIssues = evaluation?.issues;

  switch (output.agentKey) {
    case 'prism':
      return {
        title: '自我画像完成',
        highlights: [
          `一句话画像：${output.oneLineProfile}`,
          `核心驱动力：${output.coreDrives.slice(0, 2).join('、')}...`,
          `能力长板：${output.strengths.map((s) => s.name).slice(0, 2).join('、')}...`,
        ],
        qualityScore,
        qualityPassed,
        retryCount,
        isForcedAccept,
        qualityIssues,
      };
    case 'scope':
      return {
        title: '行业匹配完成',
        highlights: [
          `Top1方向：${output.topTracks[0]?.name || '待定'}`,
          `起薪范围：${output.topTracks[0]?.startingSalary || '待定'}`,
          `目标公司：${output.topTracks[0]?.targetCompanies.slice(0, 3).join('、') || '待定'}`,
        ],
        qualityScore,
        qualityPassed,
        retryCount,
        isForcedAccept,
        qualityIssues,
      };
    case 'scalpel':
      return {
        title: '简历优化完成',
        highlights: [
          `诊断问题：${output.diagnosis.length}处硬伤`,
          `改写版本：${output.versions.length}个方向`,
          `推荐主攻：版本${output.recommendedVersionIndex + 1}`,
        ],
        qualityScore,
        qualityPassed,
        retryCount,
        isForcedAccept,
        qualityIssues,
      };
    case 'arena':
      return {
        title: '模拟面试完成',
        highlights: [
          `面试段位：${output.level.current}/${output.level.max}段`,
          `最大硬伤：${output.biggestWeakness}`,
          `易提分点：${output.easiestFix}`,
        ],
        qualityScore,
        qualityPassed,
        retryCount,
        isForcedAccept,
        qualityIssues,
      };
    case 'balance':
      return {
        title: 'Offer决策完成',
        highlights: [
          `理性选择：${output.rationalChoice}`,
          `核心驱动：${output.keyDriver}`,
          `对比Offer：${output.offerScores.length}个`,
        ],
        qualityScore,
        qualityPassed,
        retryCount,
        isForcedAccept,
        qualityIssues,
      };
    case 'lumen':
      return {
        title: '情绪陪伴完成',
        highlights: [
          `识别信号：${output.signal.type === 'negativeWords' ? '负面词' : output.signal.type}`,
          `命名情绪：${output.cbt.emotionNamed}`,
          `最小行动：${output.cbt.minAction}`,
        ],
        qualityScore,
        qualityPassed,
        retryCount,
        isForcedAccept,
        qualityIssues,
      };
    default:
      return {
        title: '已完成',
        highlights: [],
        qualityScore,
        qualityPassed,
        retryCount,
        isForcedAccept,
        qualityIssues,
      };
  }
}
