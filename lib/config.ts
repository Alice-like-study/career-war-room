export type ModelProvider = 'kimi' | 'doubao' | 'deepseek' | 'claude';

export const MODEL_CONFIG = {
  provider: 'kimi' as ModelProvider,
  kimi: {
    baseURL: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k',
    apiKey: process.env.KIMI_API_KEY!,
  },
  // 预留其他供应商配置位
  // doubao: { baseURL: '...', model: '...', apiKey: process.env.DOUBAO_API_KEY! },
  // deepseek: { baseURL: '...', model: '...', apiKey: process.env.DEEPSEEK_API_KEY! },
  // claude: { ... },
} as const;
