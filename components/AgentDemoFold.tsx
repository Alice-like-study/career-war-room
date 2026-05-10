import type { ReactNode } from "react";

type AgentDemoFoldProps = {
  agentName: string;
  children: ReactNode;
};

export function AgentDemoFold({ agentName, children }: AgentDemoFoldProps) {
  return (
    <details className="agent-demo-fold group mt-1 border-t border-ink/10 pt-4 [&_summary::-webkit-details-marker]:hidden">
      <summary className="cursor-pointer list-none text-center text-sm font-bold text-cta outline-none ring-cta/20 [&::-webkit-details-marker]:hidden">
        <span className="underline decoration-cta/40 decoration-2 underline-offset-4 group-open:no-underline">
          看一段 {agentName} 的真实输出 →
        </span>
      </summary>
      <div className="agent-demo-panel mt-3 rounded-lg bg-ink/[0.06] px-3 py-3.5 font-serif text-[13px] leading-relaxed text-ink/85 sm:text-sm">
        <p className="agent-demo-pill mb-3 text-xs font-semibold tracking-wide text-ink/55">
          ⚡ 演示样本 · 节选自真实运行记录
        </p>
        <div className="agent-demo-inner space-y-3">{children}</div>
      </div>
    </details>
  );
}
