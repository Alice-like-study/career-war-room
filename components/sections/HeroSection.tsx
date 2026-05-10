import Link from "next/link";
import { links } from "@/components/links";

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
        <p className="mx-auto mt-5 max-w-2xl text-balance text-lg font-semibold text-ink/90 sm:text-xl">
          7 位 AI 军师，30 分钟生成你的《校招作战地图》
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          <Link
            href={links.skill}
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
