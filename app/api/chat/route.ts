import type OpenAI from 'openai';

import { askLLM } from '@/lib/llm';

export const maxDuration = 60;

function formatLlmError(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: string }).message;
    if (typeof m === 'string' && m.trim()) return m.trim();
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
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
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
