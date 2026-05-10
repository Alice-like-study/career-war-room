import { AgentsSection } from "@/components/sections/AgentsSection";
import { AudienceSection } from "@/components/sections/AudienceSection";
import { ClosingSection } from "@/components/sections/ClosingSection";
import { CompassSection } from "@/components/sections/CompassSection";
import { CompareSection } from "@/components/sections/CompareSection";
import { FounderSection } from "@/components/sections/FounderSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { PipelineSection } from "@/components/sections/PipelineSection";

const painPoints = [
  "简历海投石沉大海，无法定位匹配偏差",
  "面试同类问题反复失利，无法明确薄弱环节",
  "求职方向完全迷茫，无法锚定适配赛道",
  "父母期待与自我意愿冲突，纠结延误求职窗口",
];

const solutions = [
  "Compass 总指挥 30 分钟生成个性化《校招作战地图》",
  "6 位专职军师覆盖简历 / 面试 / 方向 / 心态全链路支持",
  "Pipeline 流水线一句话驱动，无需手动协调调度",
  "4 类应届生画像精准匹配，A 计划至 Plan B 全方案覆盖",
];

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <section
        id="pain-vs-solution"
        className="border-y border-ink/10 bg-[#f7efe5]/70 px-4 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl">
          <header className="text-center">
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">为什么需要应届生求职作战部？</h2>
            <p className="mt-3 text-base font-semibold text-ink/80 sm:text-lg">
              传统校招求职的核心痛点，以及 Compass 总指挥 + 多 AI 军师如何系统性解决。
            </p>
          </header>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <article className="paper-texture rounded-2xl border-2 border-[#D4A574] p-6 sm:p-8">
              <h3 className="text-2xl font-bold text-ink sm:text-3xl">传统求职的 4 大痛点</h3>
              <ul className="mt-6 space-y-4">
                {painPoints.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#D4A574] bg-[#fff7ea] text-sm font-bold text-[#8B2C2C]"
                    >
                      !
                    </span>
                    <p className="text-base font-semibold leading-relaxed text-ink/90">{point}</p>
                  </li>
                ))}
              </ul>
            </article>

            <article className="paper-texture rounded-2xl border-2 border-[#8B2C2C] p-6 sm:p-8">
              <h3 className="text-2xl font-bold text-ink sm:text-3xl">EasyClaw 作战部的解法</h3>
              <ul className="mt-6 space-y-4">
                {solutions.map((solution) => (
                  <li key={solution} className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#8B2C2C]/45 bg-[#fff4f4] text-sm font-bold text-[#8B2C2C]"
                    >
                      √
                    </span>
                    <p className="text-base font-semibold leading-relaxed text-ink/90">{solution}</p>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>
      <CompassSection />
      <AgentsSection />
      <PipelineSection />
      <CompareSection />
      <AudienceSection />
      <FounderSection />
      <ClosingSection />
    </main>
  );
}
