/**
 * Agent Run API - 带质量审核的 Agent 运行端点
 * 调用 LLM 生成产出，然后自动触发 Evaluator 审核
 * 审核不通过则自动打回重做（最多2次）
 */

import { NextRequest } from 'next/server';
import { askLLM } from '@/lib/llm';
import { AgentKey, AGENTS } from '@/lib/agents';
import { AgentOutput } from '@/lib/agent-outputs';
import {
  evaluate,
  isEvaluableAgent,
  shouldAcceptOutput,
  buildRetrySystemPrompt,
  EvaluationResult,
} from '@/lib/evaluator';
import { buildFullSystemPrompt } from '@/lib/agent-instructions';

// 最大流式响应时间
export const maxDuration = 120;

/**
 * 从响应中提取结构化 JSON
 */
function extractStructuredOutput(rawResponse: string): {
  cleanReply: string;
  structuredData: Record<string, unknown> | null;
  hasJsonOutput: boolean;
} {
  const JSON_OUTPUT_REGEX = /```json-output\n([\s\S]*?)\n```$/;
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
    console.error('[AgentRun API] JSON解析失败:', e);
    return {
      cleanReply: rawResponse.trim(),
      structuredData: null,
      hasJsonOutput: false,
    };
  }
}

/**
 * 验证结构化数据是否有效
 */
function validateStructuredOutput(
  data: Record<string, unknown>,
  agentKey: AgentKey
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
        data.topTracks.length >= 3 &&
        data.misleadingTrack !== undefined &&
        Array.isArray(data.wildCards)
      );
    case 'scalpel':
      return (
        Array.isArray(data.diagnosis) &&
        Array.isArray(data.versions) &&
        (data.versions as unknown[]).length >= 1
      );
    case 'arena':
      return (
        Array.isArray(data.reviews) &&
        (data.reviews as unknown[]).length >= 5 &&
        data.level !== undefined
      );
    case 'balance':
      return (
        Array.isArray(data.dimensions) &&
        Array.isArray(data.offerScores) &&
        typeof data.rationalChoice === 'string' &&
        typeof data.counterIntuitiveWarning === 'string'
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
 * 构建带上下文的 system prompt
 */
function buildSystemWithContext(
  agentKey: AgentKey,
  upstreamOutput?: AgentOutput | null,
  retryCount: number = 0,
  lastEvaluation?: EvaluationResult | null
): string {
  const soul = AGENTS[agentKey].soul;
  let fullPrompt = buildFullSystemPrompt(soul, agentKey);

  // 如果有上游产出，附加到 system prompt 中
  if (upstreamOutput) {
    fullPrompt += `\n\n【上游产出上下文 - ${upstreamOutput.agentKey}】\n`;
    fullPrompt += `以下是你需要依赖的上游Agent产出的结构化数据：\n`;
    fullPrompt += `\`\`\`json\n${JSON.stringify(upstreamOutput, null, 2)}\n\`\`\`\n`;
    fullPrompt += `\n请基于以上上游产出进行你的工作，确保引用其中的证据。`;

    if (agentKey === 'scope' && upstreamOutput.agentKey === 'prism') {
      fullPrompt += `\n\n【Scope 执行规则】直接基于 Prism 画像产出 Top3 赛道，禁止脱离画像空谈行业。`;
    }
    if (agentKey === 'arena' && upstreamOutput.agentKey === 'scalpel') {
      fullPrompt += `\n\n【Arena 执行规则】优先按 Scalpel 推荐方向出专业题；reviews 必须 5 题且含压力面。`;
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
 * 运行一次 Agent，返回完整响应
 */
async function runOnce(
  agentKey: AgentKey,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  upstreamOutput?: AgentOutput | null,
  retryCount: number = 0,
  lastEvaluation?: EvaluationResult | null
): Promise<{
  response: string;
  cleanReply: string;
  structuredData: AgentOutput | null;
  isComplete: boolean;
}> {
  const system = buildSystemWithContext(agentKey, upstreamOutput, retryCount, lastEvaluation);

  // 调用 LLM（非流式，因为我们需要完整响应进行审核）
  const response = await askLLM({
    messages,
    system,
    stream: false,
  });

  // 提取结构化数据
  const { cleanReply, structuredData, hasJsonOutput } = extractStructuredOutput(response);

  if (hasJsonOutput && structuredData && validateStructuredOutput(structuredData, agentKey)) {
    return {
      response,
      cleanReply,
      structuredData: structuredData as unknown as AgentOutput,
      isComplete: true,
    };
  }

  return {
    response,
    cleanReply,
    structuredData: null,
    isComplete: false,
  };
}

/**
 * 运行 Agent 并带 Evaluator 审核（支持重做）
 */
async function runAgentWithEvaluation(
  agentKey: AgentKey,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  upstreamOutput?: AgentOutput | null,
  onProgress?: (event: {
    type: 'generating' | 'evaluating' | 'retrying' | 'complete';
    message?: string;
    evaluation?: {
      pass: boolean;
      score: number;
      issues: string[];
      retryCount: number;
      isForcedAccept: boolean;
    };
  }) => void
): Promise<{
  cleanReply: string;
  structuredOutput: AgentOutput | null;
  isComplete: boolean;
  evaluation: {
    pass: boolean;
    score: number;
    issues: string[];
    retryCount: number;
    isForcedAccept: boolean;
  } | null;
}> {
  let retryCount = 0;
  let lastEvaluation: EvaluationResult | null = null;

  while (true) {
    // 1. 生成产出
    if (onProgress) {
      onProgress({
        type: retryCount === 0 ? 'generating' : 'retrying',
        message: retryCount === 0 ? '正在生成产出...' : `正在第${retryCount}次优化...`,
      });
    }

    const result = await runOnce(agentKey, messages, upstreamOutput, retryCount, lastEvaluation);

    if (!result.isComplete) {
      // 未完成，直接返回（不触发审核）
      return {
        cleanReply: result.cleanReply,
        structuredOutput: null,
        isComplete: false,
        evaluation: null,
      };
    }

    // 2. 触发审核（只审核特定 Agent）
    if (!isEvaluableAgent(agentKey)) {
      // 不需要审核，直接返回
      return {
        cleanReply: result.cleanReply,
        structuredOutput: result.structuredData,
        isComplete: true,
        evaluation: null,
      };
    }

    if (onProgress) {
      onProgress({ type: 'evaluating', message: '正在审核产出质量...' });
    }

    const evalResult = await evaluate(agentKey, result.structuredData!, upstreamOutput);

    // 3. 判断结果
    const { accept, isForced } = shouldAcceptOutput(evalResult, retryCount);

    if (accept) {
      // 接受产出
      if (onProgress) {
        onProgress({
          type: 'complete',
          message: isForced
            ? `审核完成（强制接受，评分: ${evalResult.score}/100）`
            : `审核通过（评分: ${evalResult.score}/100）`,
          evaluation: {
            pass: evalResult.pass,
            score: evalResult.score,
            issues: evalResult.issues,
            retryCount,
            isForcedAccept: isForced,
          },
        });
      }

      // 将审核信息附加到产出中
      const structuredOutputWithEval = {
        ...result.structuredData!,
        _evaluation: {
          evaluatedAt: new Date().toISOString(),
          pass: evalResult.pass,
          score: evalResult.score,
          issues: evalResult.issues,
          retryCount,
          isForcedAccept: isForced,
        },
      };

      return {
        cleanReply: result.cleanReply,
        structuredOutput: structuredOutputWithEval as AgentOutput,
        isComplete: true,
        evaluation: {
          pass: evalResult.pass,
          score: evalResult.score,
          issues: evalResult.issues,
          retryCount,
          isForcedAccept: isForced,
        },
      };
    }

    // 不接受，需要重做
    console.log(`[AgentRun API] ${agentKey} 审核未通过，评分: ${evalResult.score}，开始第${retryCount + 1}次重做`);
    lastEvaluation = evalResult;
    retryCount++;

    // 更新消息历史，加入上一版产出作为上下文
    messages = [
      ...messages,
      { role: 'assistant' as const, content: result.cleanReply },
    ];

    if (onProgress) {
      onProgress({
        type: 'retrying',
        message: `审核未通过（评分: ${evalResult.score}/100），开始第${retryCount}次优化...`,
        evaluation: {
          pass: evalResult.pass,
          score: evalResult.score,
          issues: evalResult.issues,
          retryCount: retryCount - 1,
          isForcedAccept: false,
        },
      });
    }
  }
}

/**
 * POST 请求处理
 * 请求体: {
 *   agentKey: AgentKey,
 *   messages: Array<{role, content}>,
 *   upstreamOutput?: AgentOutput | null
 * }
 */
export async function POST(req: NextRequest) {
  let body: {
    agentKey?: unknown;
    messages?: unknown;
    upstreamOutput?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: '请求体不是合法 JSON' }, { status: 400 });
  }

  const { agentKey, messages, upstreamOutput } = body;

  // 参数验证
  if (!agentKey || typeof agentKey !== 'string') {
    return Response.json({ error: '缺少 agentKey' }, { status: 400 });
  }

  const validAgentKeys: AgentKey[] = ['compass', 'prism', 'scope', 'scalpel', 'arena', 'balance', 'lumen'];
  if (!validAgentKeys.includes(agentKey as AgentKey)) {
    return Response.json({ error: `无效的 agentKey: ${agentKey}` }, { status: 400 });
  }

  if (!Array.isArray(messages)) {
    return Response.json({ error: 'messages 必须是数组' }, { status: 400 });
  }

  try {
    // 运行 Agent 并审核
    const result = await runAgentWithEvaluation(
      agentKey as AgentKey,
      messages as Array<{ role: 'user' | 'assistant'; content: string }>,
      upstreamOutput as AgentOutput | null | undefined
    );

    return Response.json({
      success: true,
      reply: result.cleanReply,
      structuredOutput: result.structuredOutput,
      isComplete: result.isComplete,
      evaluation: result.evaluation,
    });
  } catch (err) {
    console.error('[AgentRun API] 运行失败:', err);

    const errorMessage = err instanceof Error ? err.message : '运行失败';
    return Response.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
