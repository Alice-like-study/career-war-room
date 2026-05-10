import { CompassHubDiagram } from "@/components/diagrams/CompassHub";

const steps = [
  "接收指令理解需求",
  "拆解任务分配角色",
  "验收结果向你汇报",
  "整合输出作战地图",
];

export function CompassSection() {
  return (
    <section id="compass" className="border-t border-ink/10 bg-[#f3ece2]/80 px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <header className="text-center">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">Compass · 总指挥</h2>
          <p className="mt-3 text-base font-semibold text-ink/80 sm:text-lg">
            你的 AI 求职大脑 · 团队核心枢纽
          </p>
        </header>

        <div className="mt-10">
          <CompassHubDiagram />
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((t, i) => (
            <div
              key={t}
              className="paper-texture marker-border-soft flex flex-col gap-2 px-4 py-4 text-center"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-cta">Step {i + 1}</span>
              <p className="text-sm font-semibold leading-snug text-ink sm:text-base">{t}</p>
            </div>
          ))}
        </div>

        <p className="mt-14 text-center text-2xl font-bold tracking-wide text-ink sm:text-4xl">
          你说一句，它负责全部
        </p>
      </div>
    </section>
  );
}
