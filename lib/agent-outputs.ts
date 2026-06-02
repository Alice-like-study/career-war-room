/**
 * 各Agent结构化产出类型定义
 * 每个Agent完成时产出结构化数据，下游Agent接收上游数据作为输入
 */

import type { AgentKey } from './agents';

// ========== Prism · 自我画像官 ==========

export interface PrismStrength {
  name: string;
  evidence: string;
}

export interface PrismValue {
  rank: number;
  name: string;
  reason: string;
}

export interface PrismOutput {
  agentKey: 'prism';
  // 核心画像
  oneLineProfile: string;
  coreDrives: string[];
  strengths: PrismStrength[];
  valueRanking: PrismValue[];
  dealBreakers: string[];
  // 原始素材
  rawConversation: string;
  // 给下游的交接
  handoffNote: string;
  // 元数据
  completedAt: string;
  // 【Evaluator】质量审核记录
  _evaluation?: EvaluationRecord;
}

// ========== Scope · 行业匹配官 ==========

export interface ScopeTrack {
  rank: number;
  name: string;
  why: string;
  evidenceFromPrism: string;
  startingSalary: string;
  threeYearPath: string;
  risks: string;
  targetCompanies: string[];
}

export interface ScopeMisleadingTrack {
  name: string;
  misleadingEvidence: string;
  hiddenRisk: string;
}

export interface ScopeWildCard {
  name: string;
  whyConsider: string;
}

export interface ScopeOutput {
  agentKey: 'scope';
  upstream: PrismOutput;
  topTracks: ScopeTrack[];
  misleadingTrack: ScopeMisleadingTrack;
  wildCards: ScopeWildCard[];
  handoffNote: string;
  completedAt: string;
  // 【Evaluator】质量审核记录
  _evaluation?: EvaluationRecord;
}

// ========== Scalpel · 简历医生 ==========

export interface ScalpelDiagnosisItem {
  type: 'cliche' | 'noData' | 'keywordMissing' | 'wrongOrder' | 'visualMess';
  original: string;
  problem: string;
  fix: string;
}

export interface ScalpelResumeVersion {
  targetTrack: string;
  resumeMarkdown: string;
  companies: {
    mustApply: string[];
    canApply: string[];
    avoid: string[];
  };
}

export interface ScalpelOutput {
  agentKey: 'scalpel';
  upstream?: ScopeOutput | null;
  /** 用户提交的简历原文（完整文本） */
  resumeText: string;
  diagnosis: ScalpelDiagnosisItem[];
  overallVerdict: string;
  versions: ScalpelResumeVersion[];
  recommendedVersionIndex: number;
  handoffNote: string;
  completedAt: string;
  // 【Evaluator】质量审核记录
  _evaluation?: EvaluationRecord;
}

// ========== Arena · 模拟面试官 ==========

export interface ArenaQuestionReview {
  round: number;
  question: string;
  userAnswer: string;
  goodPoints: string[];
  problems: {
    type: string;
    sentence: string;
    whyBad: string;
  }[];
  starRewrite: string;
}

export interface ArenaLevel {
  current: number;
  max: number;
}

export interface ArenaOutput {
  agentKey: 'arena';
  /** 走过 Scalpel 时填入；分诊直达 Arena 时为 null */
  upstream?: ScalpelOutput | null;
  reviews: ArenaQuestionReview[];
  level: ArenaLevel;
  biggestWeakness: string;
  easiestFix: string;
  practiceFocus: string[];
  handoffNote: string;
  completedAt: string;
  // 【Evaluator】质量审核记录
  _evaluation?: EvaluationRecord;
}

// ========== Balance · Offer决策官 ==========

export interface BalanceDimension {
  name: string;
  weight: number;
}

export interface BalanceOfferScore {
  offerName: string;
  scores: Record<string, number>;
  weightedTotal: number;
}

export interface BalanceOutput {
  agentKey: 'balance';
  // Balance 不依赖上游结构化数据，而是依赖用户输入的offer信息
  upstream?: ArenaOutput;
  dimensions: BalanceDimension[];
  offerScores: BalanceOfferScore[];
  rationalChoice: string;
  keyDriver: string;
  counterIntuitiveWarning: string;
  handoffNote: string;
  completedAt: string;
  // 【Evaluator】质量审核记录
  _evaluation?: EvaluationRecord;
}

// ========== Lumen · 情绪陪跑官 ==========

export interface LumenSignal {
  type: 'negativeWords' | 'stuckLoop' | 'timeAnomaly' | 'userCall';
  detected: string;
  meaning: string;
}

export interface LumenCBTStep {
  emotionNamed: string;
  fact: string;
  interpretation: string;
  leaps: string[];
  minAction: string;
}

export interface LumenOutput {
  agentKey: 'lumen';
  // Lumen 也独立工作，不依赖上游
  upstream?: ArenaOutput | BalanceOutput;
  signal: LumenSignal;
  cbt: LumenCBTStep;
  extremeAlert: boolean;
  handoffNote: string;
  completedAt: string;
  // 【Evaluator】质量审核记录
  _evaluation?: EvaluationRecord;
}

// ========== Evaluator · 质量审核 ==========

/**
 * 审核记录（存储在Agent产出中，用于追踪质量历史）
 */
export interface EvaluationRecord {
  /** 审核时间 */
  evaluatedAt: string;
  /** 是否通过 */
  pass: boolean;
  /** 评分 0-100 */
  score: number;
  /** 发现的问题 */
  issues: string[];
  /** 重做次数（0表示首次） */
  retryCount: number;
  /** 是否强制接受（已重做2次仍不通过） */
  isForcedAccept: boolean;
}

// ========== 联合类型 ==========

export type AgentOutput =
  | PrismOutput
  | ScopeOutput
  | ScalpelOutput
  | ArenaOutput
  | BalanceOutput
  | LumenOutput;

// AgentKey 对应 Output 类型的映射
export type AgentOutputMap = {
  prism: PrismOutput;
  scope: ScopeOutput;
  scalpel: ScalpelOutput;
  arena: ArenaOutput;
  balance: BalanceOutput;
  lumen: LumenOutput;
};

/**
 * 带审核记录的Agent产出包装类型
 * 用于在前端状态管理中存储审核信息
 */
export type AgentOutputWithEval<T extends AgentOutput = AgentOutput> = T & {
  _evaluation?: EvaluationRecord;
};

// ========== 流水线依赖关系 ==========

export const AGENT_PIPELINE: Record<Exclude<keyof AgentOutputMap, 'balance' | 'lumen'>, keyof AgentOutputMap | null> = {
  prism: 'scope',
  scope: 'scalpel',
  scalpel: 'arena',
  arena: null,
};

// 下游Agent启动时需要读取的上游Agent
export const UPSTREAM_DEPENDENCY: Record<keyof AgentOutputMap, keyof AgentOutputMap | null> = {
  prism: null,
  scope: 'prism',
  scalpel: 'scope',
  arena: 'scalpel',
  balance: 'prism', // Offer 权重需结合自我画像价值观
  lumen: null,   // Lumen 监测当前对话
};

// AgentKey 全集（包含不产出的 compass 和 evaluator）
export const AGENT_UPSTREAM_DEPENDENCY: Partial<Record<AgentKey, AgentKey | null>> = {
  compass: null,  // 总指挥，无上游
  prism: null,
  scope: 'prism',
  scalpel: 'scope',
  arena: 'scalpel',
  balance: 'prism',
  lumen: null,
  evaluator: null, // 质量审核员，无上游
};
