import type OpenAI from 'openai';

import { askLLM } from '@/lib/llm';

export const maxDuration = 120;

function formatLlmError(err: unknown): string {
  // OpenAI SDK 风格的 API 错误（Kimi/Moonshot 兼容 OpenAI 协议）
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    const status = typeof e.status === 'number' ? e.status : null;
    const msg = typeof e.message === 'string' ? e.message.trim() : null;

    if (status === 401) {
      return 'API Key 鉴权失败（401）。请前往 platform.moonshot.cn 确认 Key 仍有效、余额充足，更新 .env.local 后重启 dev server。';
    }
    if (status === 429) {
      return 'API 请求频率超限（429）。请稍等几秒后重试，或检查账户用量配额。';
    }
    if (status === 503 || status === 529) {
      return 'Kimi 服务暂时过载（' + String(status) + '），请稍后重试。';
    }
    if (msg) return msg;
  }
  if (err instanceof Error && err.message) return err.message;
  return '模型服务暂时不可用，请稍后重试。';
}

export async function POST(req: Request) {
  let body: { messages?: unknown; system?: unknown };
  try {
    body = (await req.json()) as { messages?: unknown; system?: unknown };
  } catch {
    return Response.json({ error: '请求体不是合法 JSON' }, { status: 400 });
  }

  const { messages, system } = body;
  if (!Array.isArray(messages) || typeof system !== 'string') {
    return Response.json(
      { error: '缺少 messages（数组）或 system（字符串）' },
      { status: 400 },
    );
  }

  const key = process.env.KIMI_API_KEY?.trim();
  if (!key) {
    return Response.json(
      {
        error:
          '服务端未配置 KIMI_API_KEY。请在 Vercel → Environment Variables 添加后 Redeploy。',
      },
      { status: 503 },
    );
  }

  let stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
  try {
    stream = (await askLLM({
      messages: messages as Array<{ role: string; content: string }>,
      system,
      stream: true,
    })) as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
  } catch (err) {
    return Response.json({ error: formatLlmError(err) }, { status: 502 });
  }

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      let finishReason: string | null = null;
      try {
        for await (const chunk of stream) {
          const choice = chunk.choices[0];
          const text = choice?.delta?.content;
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
          if (choice?.finish_reason) {
            finishReason = choice.finish_reason;
          }
        }
        if (finishReason === 'length') {
          controller.enqueue(
            encoder.encode(
              '\n\n---\n⚠️ 回复因长度上限被截断。可在 .env.local 设置 KIMI_MODEL=moonshot-v1-128k 或增大 KIMI_MAX_TOKENS 后重启。',
            ),
          );
        }
        controller.close();
      } catch (err) {
        const msg = formatLlmError(err);
        controller.enqueue(encoder.encode(`\n\n【服务错误】${msg}`));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
