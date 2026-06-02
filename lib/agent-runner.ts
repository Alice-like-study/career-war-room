/**
 * Agent Runner - 核心运行引擎
 * 负责流式调用LLM、提取结构化JSON、判断任务完成状态
 * 【新增】集成Evaluator质量审核，不达标自动打回重做（最多2次）
 */

import { AgentKey } from './agents';
import { AgentOutput, AgentOutputMap, UPSTREAM_DEPENDENCY, AGENT_UPSTREAM_DEPENDENCY, EvaluationRecord } from './agent-outputs';
import { buildFullSystemPrompt } from './agent-instructions';
import { AGENTS } from './agents';
import { evaluate, isEvaluableAgent, shouldAcceptOutput, buildRetrySystemPrompt, EvaluationResult } from './evaluator';
import {
  extractFromExistingText,
  getUpstreamOutput,
  getOutputSummary,
  type OutputSummary,
} from './agent-client-utils';

export { extractFromExistingText, getUpstreamOutput, getOutputSummary, type OutputSummary };

/**
 * Agent输入参数
 */
export interface RunAgentInput {
  /** 用户最新输入 */
  userInput: string;
  /** 上游Agent产出（下游Agent启动时传入） */
  upstreamOutput?: AgentOutput | null;
  /** 当前Agent的对话历史 */
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  /** 【新增】当前重做次数（默认为0） */
  retryCount?: number;
  /** 【新增】上一次审核结果（重做时传入，用于构建system prompt） */
  lastEvaluation?: EvaluationResult | null;
}

/**
 * Agent运行结果
 */
export interface RunAgentResult<T extends AgentOutput = AgentOutput> {
  /** 给用户的对话回复（已移除隐藏JSON） */
  reply: string;
  /** 结构化产出（任务完成时才有） */
  structuredOutput?: T;
  /** 是否完成任务 */
  isComplete: boolean;
  /** 原始完整响应（含JSON，调试用） */
  rawResponse?: string;
  /** 【新增】质量审核记录（仅结构化产出时存在） */
  evaluation?: EvaluationRecord;
  /** 【新增】是否强制接受（重做2次后仍不达标） */
  isForcedAccept?: boolean;
}

/**
 * 流式回调函数类型
 */
export type OnStreamChunk = (chunk: string, accumulated: string) => void;

/**
 * JSON提取正则
 * 匹配 ```json-output\n{...}\n``` 格式
 */
const JSON_OUTPUT_REGEX = /```json-output\n([\s\S]*?)\n```$/;

/**
 * 从完整响应中提取结构化JSON
 * @param rawResponse 完整响应文本
 * @returns 提取结果
 */
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
    console.error('[AgentRunner] JSON解析失败:', e);
    return {
      cleanReply: rawResponse.trim(),
      structuredData: null,
      hasJsonOutput: false,
    };
  }
}

/**
 * 验证结构化数据是否符合指定Agent的输出类型
 * @param data 解析后的数据
 * @param agentKey Agent标识
 * @returns 是否有效
 */
function validateStructuredOutput(
  data: Record<string, unknown>,
  agentKey: AgentKey
): boolean {
  // 基础验证：必须有 agentKey 字段
  if (!data.agentKey || data.agentKey !== agentKey) {
    console.warn(`[AgentRunner] 验证失败: agentKey不匹配或缺失，期望${agentKey}，实际${data.agentKey}`);
    return false;
  }

  // 基础验证：必须有 completedAt 字段
  if (!data.completedAt || typeof data.completedAt !== 'string') {
    console.warn('[AgentRunner] 验证失败: completedAt缺失或类型错误');
    return false;
  }

  // 根据Agent类型做特定验证
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

/**
 * 构建完整system prompt，包含上游产出上下文和审核反馈
 * @param agentKey 当前Agent
 * @param upstreamOutput 上游产出
 * @param retryCount 重做次数
 * @param lastEvaluation 上次审核结果（重做时传入）
 * @returns 完整的system prompt
 */
function buildSystemWithContext(
  agentKey: AgentKey,
  upstreamOutput?: AgentOutput | null,
  retryCount: number = 0,
  lastEvaluation?: EvaluationResult | null
): string {
  const soul = AGENTS[agentKey].soul;
  let fullPrompt = buildFullSystemPrompt(soul, agentKey);

  // 如果有上游产出，附加到system prompt中
  if (upstreamOutput) {
    const upstreamAgent = AGENT_UPSTREAM_DEPENDENCY[agentKey];
    if (upstreamAgent) {
      fullPrompt += `\n\n【上游产出上下文 - ${upstreamAgent}】\n`;
      fullPrompt += `以下是你需要依赖的上游Agent（${upstreamAgent}）产出的结构化数据：\n`;
      fullPrompt += `\`\`\`json\n${JSON.stringify(upstreamOutput, null, 2)}\n\`\`\`\n`;
      fullPrompt += `\n请基于以上上游产出进行你的工作，确保引用其中的证据。`;
    }
  }

  // 【Evaluator集成】如果是重做，注入审核反馈
  if (retryCount > 0 && lastEvaluation) {
    fullPrompt += `\n\n【质量审核反馈 · 第${retryCount}次重做】\n`;
    fullPrompt += `你的上一版产出未通过质量审核，评分：${lastEvaluation.score}/100。\n\n`;
    fullPrompt += `审核发现的问题：\n`;
    lastEvaluation.issues.forEach((issue, idx) => {
      fullPrompt += `${idx + 1}. ${issue}\n`;
    });
    fullPrompt += `\n修改建议：${lastEvaluation.suggestion}\n`;
    fullPrompt += `\n请根据以上反馈重新生成产出，确保解决所有问题。这是第${retryCount}次重做（最多2次），请认真对待。`;
  }

  return fullPrompt;
}

/**
 * 运行Agent，流式接收回复并提取结构化产出
 * 【Evaluator集成】产出后会自动触发质量审核，不达标打回重做（最多2次）
 * @param agentKey 运行的Agent
 * @param input 输入参数
 * @param onStream 流式回调（可选）
 * @returns 运行结果
 */
export async function runAgent<T extends AgentOutput = AgentOutput>(
  agentKey: AgentKey,
  input: RunAgentInput,
  onStream?: OnStreamChunk
): Promise<RunAgentResult<T>> {
  const { userInput, upstreamOutput, conversationHistory, retryCount = 0, lastEvaluation = null } = input;

  // 【Evaluator集成】构建system prompt时注入审核反馈（如果是重做）
  const system = buildSystemWithContext(agentKey, upstreamOutput, retryCount, lastEvaluation);
  const messages = [
    ...conversationHistory,
    { role: 'user' as const, content: userInput },
  ];

  try {
    // 发起API请求
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system,
        messages,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '请求失败');
      throw new Error(`API请求失败: ${res.status} - ${errorText}`);
    }

    // 流式读取响应
    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
    }

    const decoder = new TextDecoder();
    let accumulated = '';

    // 流式读取
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      accumulated += chunk;

      // 调用流式回调（如果提供了）
      if (onStream) {
        onStream(chunk, accumulated);
      }
    }

    // 提取结构化数据
    const { cleanReply, structuredData, hasJsonOutput } =
      extractStructuredOutput(accumulated);

    // 【Evaluator集成】如果提取到JSON，先验证，再触发质量审核
    if (hasJsonOutput && structuredData) {
      const isValid = validateStructuredOutput(structuredData, agentKey);

      if (!isValid) {
        console.warn('[AgentRunner] 结构化数据验证失败，视为未完成');
        return {
          reply: cleanReply,
          isComplete: false,
          rawResponse: accumulated,
        };
      }

      // 【Evaluator集成】验证通过，进行质量审核（只对需要审核的Agent）
      if (isEvaluableAgent(agentKey)) {
        console.log(`[AgentRunner] ${agentKey} 产出验证通过，触发Evaluator审核...`);

        // 通知UI开始审核（通过特殊的流式回调）
        if (onStream) {
          onStream('\n[Evaluator] 正在审核产出质量...', accumulated + '\n[Evaluator] 正在审核产出质量...');
        }

        const evalResult = await evaluate(agentKey, structuredData as unknown as AgentOutput, upstreamOutput);

        // 根据审核结果和重做次数，决定是否接受
        const { accept, isForced } = shouldAcceptOutput(evalResult, retryCount);

        // 构建审核记录
        const evaluationRecord: EvaluationRecord = {
          evaluatedAt: new Date().toISOString(),
          pass: evalResult.pass,
          score: evalResult.score,
          issues: evalResult.issues,
          retryCount,
          isForcedAccept: isForced,
        };

        if (accept) {
          // 接受产出（通过审核 或 强制接受）
          if (isForced) {
            console.warn(`[AgentRunner] ${agentKey} 重做${retryCount}次后仍不达标，强制接受`);
          } else {
            console.log(`[AgentRunner] ${agentKey} 审核通过，评分: ${evalResult.score}`);
          }

          return {
            reply: cleanReply,
            structuredOutput: structuredData as T,
            isComplete: true,
            rawResponse: accumulated,
            evaluation: evaluationRecord,
            isForcedAccept: isForced,
          };
        } else {
          // 不接受，需要重做
          console.log(`[AgentRunner] ${agentKey} 审核未通过，评分: ${evalResult.score}，开始第${retryCount + 1}次重做`);

          // 通知UI需要重做
          if (onStream) {
            onStream(
              `\n[Evaluator] 审核未通过（评分: ${evalResult.score}/100），开始第${retryCount + 1}次优化...`,
              accumulated + `\n[Evaluator] 审核未通过（评分: ${evalResult.score}/100），开始第${retryCount + 1}次优化...`
            );
          }

          // 递归调用runAgent进行重做，传入当前审核结果作为反馈
          return runAgent(agentKey, {
            userInput: `（根据审核反馈重新生成产出，解决以下问题：${evalResult.issues.join('；')}）`,
            upstreamOutput,
            conversationHistory: [
              ...conversationHistory,
              { role: 'assistant' as const, content: cleanReply },
            ],
            retryCount: retryCount + 1,
            lastEvaluation: evalResult,
          }, onStream);
        }
      }

      // 不需要审核的Agent（如compass），直接返回
      return {
        reply: cleanReply,
        structuredOutput: structuredData as T,
        isComplete: true,
        rawResponse: accumulated,
      };
    }

    // 没有提取到JSON，视为未完成
    return {
      reply: cleanReply,
      isComplete: false,
      rawResponse: accumulated,
    };
  } catch (err) {
    console.error('[AgentRunner] 运行失败:', err);
    throw err;
  }
}

/**
 * 创建agent outputs存储对象
 * 用于前端状态管理
 */
export function createAgentOutputsStore(): Partial<AgentOutputMap> {
  return {};
}

/**
 * 检查是否可以启动指定Agent
 * 检查上游产出是否已就绪
 * @param agentKey 要启动的Agent
 * @param allOutputs 现有产出记录
 * @returns 是否可以启动
 */
export function canStartAgent(
  agentKey: AgentKey,
  allOutputs: Partial<AgentOutputMap>
): { canStart: boolean; missingUpstream: AgentKey | null } {
  const upstreamKey = AGENT_UPSTREAM_DEPENDENCY[agentKey];

  if (!upstreamKey) {
    return { canStart: true, missingUpstream: null };
  }

  const hasUpstream = !!allOutputs[upstreamKey as keyof AgentOutputMap];
  return {
    canStart: hasUpstream,
    missingUpstream: hasUpstream ? null : upstreamKey,
  };
}

