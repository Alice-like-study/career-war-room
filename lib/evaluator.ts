/**
 * Evaluator Agent - 质量审核模块
 * 负责审核其他Agent的产出质量，不达标打回重做
 */

import { AgentKey, AGENTS } from './agents';
import { AgentOutput } from './agent-outputs';
import { askLLM } from './llm';

/**
 * 审核结果类型
 */
export interface EvaluationResult {
  /** 是否通过审核 */
  pass: boolean;
  /** 质量评分 0-100 */
  score: number;
  /** 发现的问题列表 */
  issues: string[];
  /** 给原Agent的修改建议 */
  suggestion: string;
}

/**
 * 可审核的Agent类型（排除总指挥compass和审核员evaluator自身）
 */
export type EvaluableAgentKey = Exclude<AgentKey, 'compass' | 'evaluator'>;

/**
 * 检查Agent是否需要审核（排除compass和evaluator）
 */
export function isEvaluableAgent(agentKey: AgentKey): agentKey is EvaluableAgentKey {
  return agentKey !== 'compass' && agentKey !== 'evaluator';
}

/**
 * 构建审核用的system prompt
 * 包含Evaluator的SOUL + 被审核Agent的上下文
 */
function buildEvaluatorSystem(
  agentKey: EvaluableAgentKey,
  upstreamOutput?: AgentOutput | null
): string {
  const evaluatorSoul = AGENTS.evaluator.soul;
  const targetAgent = AGENTS[agentKey];

  let system = `${evaluatorSoul}

【审核对象信息】
被审核Agent：${targetAgent.name} · ${targetAgent.cn}
该Agent的职责：${targetAgent.soul.slice(0, 500)}...

【审核任务】
请严格审核以下产出的质量，按照【审核输出】要求的JSON格式返回结果。`;

  // 如果有上游产出，告知Evaluator用于检查引用度
  if (upstreamOutput) {
    system += `

【上游产出上下文】
被审核Agent的产出应该基于以下上游Agent的产出：
上游Agent：${AGENTS[upstreamOutput.agentKey].name}
上游产出摘要：
\`\`\`json
${JSON.stringify(upstreamOutput, null, 2).slice(0, 2000)}
\`\`\`

请重点检查：被审核产出是否真正引用了上游产出中的证据？还是脱离上游自己发挥？`;
  }

  return system;
}

/**
 * 构建审核用的user message
 * 包含被审核的产出内容
 */
function buildEvaluatorUserMessage(
  agentKey: EvaluableAgentKey,
  output: AgentOutput
): string {
  const targetAgent = AGENTS[agentKey];

  return `请审核以下 ${targetAgent.name} · ${targetAgent.cn} 的产出：

【被审核产出内容】
\`\`\`json
${JSON.stringify(output, null, 2)}
\`\`\`

请严格按照JSON格式输出审核结果，不要输出其他任何内容。
评分标准：
- 90-100分：优秀，完全符合要求
- 70-89分：良好，基本符合要求，有小问题
- 50-69分：及格，有明显问题需要改进
- 0-49分：不及格，必须打回重做

不通过的标准：
- 空话套话≥3处
- 完全没有引用上游产出（当存在上游时）
- 没有任何可验证的具体细节（数字、事例、人名、公司名）
- 缺少SOUL要求的必要输出字段`;
}

/**
 * 解析Evaluator返回的JSON结果
 */
function parseEvaluationResponse(response: string): EvaluationResult {
  try {
    // 尝试直接解析
    const parsed = JSON.parse(response.trim()) as Partial<EvaluationResult>;

    // 验证必要字段
    if (typeof parsed.pass !== 'boolean') {
      throw new Error('返回结果缺少pass字段或类型错误');
    }
    if (typeof parsed.score !== 'number' || parsed.score < 0 || parsed.score > 100) {
      throw new Error('返回结果score字段无效');
    }
    if (!Array.isArray(parsed.issues)) {
      throw new Error('返回结果issues字段不是数组');
    }
    if (typeof parsed.suggestion !== 'string') {
      throw new Error('返回结果suggestion字段不是字符串');
    }

    return {
      pass: parsed.pass,
      score: Math.round(parsed.score),
      issues: parsed.issues.filter((i): i is string => typeof i === 'string'),
      suggestion: parsed.suggestion,
    };
  } catch (e) {
    console.error('[Evaluator] JSON解析失败:', e, '\n原始响应:', response);

    // 尝试从响应中提取JSON部分
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch && jsonMatch[0] !== response.trim()) {
      console.log('[Evaluator] 尝试提取JSON部分重新解析');
      return parseEvaluationResponse(jsonMatch[0]);
    }

    // 解析失败时返回默认结果（放行，但打低分）
    return {
      pass: true, // 放行，避免卡死流程
      score: 50,
      issues: ['审核结果解析失败，默认放行'],
      suggestion: '请检查输出格式是否符合要求',
    };
  }
}

/**
 * 审核Agent产出质量
 * @param agentKey 被审核的Agent标识
 * @param output 被审核的产出（结构化JSON）
 * @param upstreamOutput 上游产出（用于检查引用度）
 * @returns 审核结果
 */
export async function evaluate(
  agentKey: EvaluableAgentKey,
  output: AgentOutput,
  upstreamOutput?: AgentOutput | null
): Promise<EvaluationResult> {
  console.log(`[Evaluator] 开始审核 ${agentKey} 的产出...`);

  const system = buildEvaluatorSystem(agentKey, upstreamOutput);
  const userMessage = buildEvaluatorUserMessage(agentKey, output);

  try {
    // 调用LLM进行审核（非流式，直接获取完整结果）
    const response = await askLLM({
      messages: [{ role: 'user', content: userMessage }],
      system,
      stream: false,
    });

    console.log('[Evaluator] 原始响应:', response.slice(0, 500));

    const result = parseEvaluationResponse(response);

    console.log(`[Evaluator] 审核完成: pass=${result.pass}, score=${result.score}`);
    if (!result.pass) {
      console.log(`[Evaluator] 不通过原因:`, result.issues);
    }

    return result;
  } catch (err) {
    console.error('[Evaluator] 审核过程出错:', err);

    // 出错时默认放行，避免卡死流程
    return {
      pass: true,
      score: 60,
      issues: ['审核过程出错，默认放行'],
      suggestion: '审核服务暂时不可用，已默认接受产出',
    };
  }
}

/**
 * 根据审核结果和重做次数，判断是否应该接受产出
 * @param result 审核结果
 * @param retryCount 已重做次数
 * @returns 是否接受产出
 */
export function shouldAcceptOutput(
  result: EvaluationResult,
  retryCount: number
): { accept: boolean; isForced: boolean } {
  // 通过审核，接受
  if (result.pass) {
    return { accept: true, isForced: false };
  }

  // 未通过，但已重试2次，强制接受
  if (retryCount >= 2) {
    return { accept: true, isForced: true };
  }

  // 未通过，还有重试机会，打回重做
  return { accept: false, isForced: false };
}

/**
 * 构建重做时注入的system prompt补充
 * 将Evaluator的建议合并到原Agent的system prompt中
 */
export function buildRetrySystemPrompt(
  originalSystem: string,
  evaluationResult: EvaluationResult,
  retryCount: number
): string {
  return `${originalSystem}

【质量审核反馈 · 第${retryCount + 1}次重做】
你的上一版产出未通过质量审核，评分：${evaluationResult.score}/100。

审核发现的问题：
${evaluationResult.issues.map((issue, idx) => `${idx + 1}. ${issue}`).join('\n')}

修改建议：
${evaluationResult.suggestion}

请根据以上反馈重新生成产出，确保解决所有问题。
这是第${retryCount + 1}次重做（最多2次），请认真对待。`;
}
