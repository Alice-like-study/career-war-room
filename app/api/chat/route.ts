import { askLLM } from '@/lib/llm';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, system } = (await req.json()) as {
    messages: Array<{ role: string; content: string }>;
    system: string;
  };

  const stream = await askLLM({ messages, system, stream: true });
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
      } catch (error) {
        controller.error(error);
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
