import { PipelineFlowDiagram } from "@/components/diagrams/PipelineFlow";

export function PipelineSection() {
  return (
    <section id="pipeline" className="border-t border-ink/10 bg-[#ede6dc] px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <header className="text-center">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">
            Pipeline 模式：一句话驱动全流水线
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-base font-semibold text-ink/80 sm:text-lg">
            最强大的协作方式不是各干各的，而是真正的串行 + 并行
          </p>
        </header>

        <div className="mt-12 rounded-2xl border border-ink/10 bg-cream/90 px-3 py-8 sm:px-8">
          <PipelineFlowDiagram />
          <p className="mx-auto mt-8 max-w-3xl text-center text-sm font-semibold leading-relaxed text-ink/75 sm:text-base">
            全程 Lumen 异步监测情绪，任何崩溃瞬间主动介入
          </p>
        </div>
      </div>
    </section>
  );
}
