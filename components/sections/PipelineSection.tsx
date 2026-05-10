import { PipelineFlowDiagram } from "@/components/diagrams/PipelineFlow";

export function PipelineSection() {
  return (
    <section id="pipeline" className="border-t border-ink/10 bg-[#ede6dc] px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-ink/10 bg-cream/90 px-3 py-8 sm:px-8">
          <PipelineFlowDiagram />
        </div>
      </div>
    </section>
  );
}
