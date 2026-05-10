import Link from "next/link";

const heroMetrics = [
  { value: "7", label: "专属 Agent" },
  { value: "30min", label: "生成作战地图" },
  { value: "7×24", label: "全天候响应" },
  { value: "4 类", label: "应届生画像覆盖" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-14 sm:pb-20 sm:pt-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(196,30,58,0.06),transparent_55%)]" />
      <div className="relative mx-auto max-w-4xl text-center">
        <p className="mb-3 text-sm font-semibold tracking-widest text-ink/60">
          Career War Room · EasyClaw
        </p>
        <h1 className="text-balance text-3xl font-bold leading-tight text-ink sm:text-5xl sm:leading-tight">
          应届生求职作战部
        </h1>
        <p className="mx-auto mt-6 max-w-3xl text-balance text-lg font-semibold text-ink/90 sm:text-xl">
          7 位 AI 军师，30 分钟生成你的《校招作战地图》
        </p>
        <div className="mx-auto mt-9 grid w-full max-w-5xl grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-4 sm:gap-x-6 sm:gap-y-0">
          {heroMetrics.map((metric) => (
            <div
              key={`${metric.value}-${metric.label}`}
              className="flex min-h-[92px] flex-col items-center justify-center px-2 sm:px-3"
            >
              <p className="whitespace-nowrap text-4xl font-bold leading-none text-[#8B2C2C] sm:text-5xl">
                {metric.value}
              </p>
              <p className="mt-2 text-[14px] font-semibold text-[#1F1A17] sm:text-[15px]">{metric.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <Link
            href="#cta"
            className="inline-flex min-h-[48px] min-w-[240px] items-center justify-center rounded-full bg-cta px-8 py-3 text-base font-bold text-white shadow-[3px_4px_0_rgba(61,40,23,0.15)] transition hover:brightness-105 active:translate-y-px"
          >
            去 EasyClaw 安装作战部 Skill 包
          </Link>
          <a
            href="#founder-story"
            className="inline-flex min-h-[48px] items-center justify-center text-base font-semibold text-ink underline decoration-cta/50 decoration-2 underline-offset-4 hover:text-cta"
          >
            看创始人故事
          </a>
        </div>
      </div>
    </section>
  );
}
