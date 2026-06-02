export type ModelProvider = 'kimi' | 'doubao' | 'deepseek' | 'claude';

/** Moonshot 国内主域名；如需切换可在 .env.local 设 KIMI_BASE_URL 覆盖 */
const KIMI_BASE_DEFAULT = 'https://api.moonshot.cn/v1';

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const MODEL_CONFIG = {
  provider: 'kimi' as ModelProvider,
  kimi: {
    baseURL: process.env.KIMI_BASE_URL?.trim() || KIMI_BASE_DEFAULT,
    /** 简历诊断等长输出场景需 32k+ 上下文；8k 会在改写全文时截断 */
    model: process.env.KIMI_MODEL?.trim() || 'moonshot-v1-32k',
    /** 单次回复最大输出 token；完整简历改写建议 ≥8192 */
    maxTokens: parsePositiveInt(process.env.KIMI_MAX_TOKENS, 8192),
    apiKey: process.env.KIMI_API_KEY ?? '',
  },
  // 预留其他供应商配置位
  // doubao: { baseURL: '...', model: '...', apiKey: process.env.DOUBAO_API_KEY! },
  // deepseek: { baseURL: '...', model: '...', apiKey: process.env.DEEPSEEK_API_KEY! },
  // claude: { ... },
} as const;
