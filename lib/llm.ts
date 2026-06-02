import OpenAI from 'openai';
import { MODEL_CONFIG, type ModelProvider } from './config';

type Message = { role: string; content: string };

type AskLLMParams = {
  messages: Message[];
  system: string;
  stream?: boolean;
};

function createClient(provider: ModelProvider): OpenAI {
  switch (provider) {
    case 'kimi':
      return new OpenAI({
        baseURL: MODEL_CONFIG.kimi.baseURL,
        apiKey: MODEL_CONFIG.kimi.apiKey,
      });
    default:
      throw new Error(`Provider "${provider}" is not implemented yet`);
  }
}

function getModel(provider: ModelProvider): string {
  switch (provider) {
    case 'kimi':
      return MODEL_CONFIG.kimi.model;
    default:
      throw new Error(`Provider "${provider}" is not implemented yet`);
  }
}

function toOpenAIMessages(
  system: string,
  messages: Message[],
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  return [
    { role: 'system', content: system },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];
}

export async function askLLM(
  params: AskLLMParams & { stream?: false },
): Promise<string>;
export async function askLLM(
  params: AskLLMParams & { stream: true },
): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>>;
export async function askLLM(
  params: AskLLMParams,
): Promise<
  | string
  | AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
> {
  const { provider } = MODEL_CONFIG;
  const client = createClient(provider);
  const model = getModel(provider);
  const openAIMessages = toOpenAIMessages(params.system, params.messages);

  const maxTokens = MODEL_CONFIG.kimi.maxTokens;

  if (params.stream) {
    return client.chat.completions.create({
      model,
      messages: openAIMessages,
      max_tokens: maxTokens,
      stream: true,
    });
  }

  const completion = await client.chat.completions.create({
    model,
    messages: openAIMessages,
    max_tokens: maxTokens,
    stream: false,
  });

  return completion.choices[0]?.message?.content ?? '';
}
