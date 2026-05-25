export type ModelProvider = 'kimi' | 'doubao' | 'deepseek' | 'claude';

/** 与 Kimi 开放平台文档一致；国内若需 .cn 可在 Vercel 设 KIMI_BASE_URL */
const KIMI_BASE_DEFAULT = 'https://api.moonshot.ai/v1';

export const MODEL_CONFIG = {
  provider: 'kimi' as ModelProvider,
  kimi: {
    baseURL: process.env.KIMI_BASE_URL?.trim() || KIMI_BASE_DEFAULT,
    model: process.env.KIMI_MODEL?.trim() || 'moonshot-v1-8k',
    apiKey: process.env.KIMI_API_KEY ?? '',
  },
  // 预留其他供应商配置位
  // doubao: { baseURL: '...', model: '...', apiKey: process.env.DOUBAO_API_KEY! },
  // deepseek: { baseURL: '...', model: '...', apiKey: process.env.DEEPSEEK_API_KEY! },
  // claude: { ... },
} as const;
