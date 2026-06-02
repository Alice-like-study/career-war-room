"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const heroMetrics = [
  { value: "7", label: "专属 Agent" },
  { value: "30min", label: "生成作战地图" },
  { value: "7×24", label: "全天候响应" },
  { value: "4 类", label: "应届生画像覆盖" },
];

const ROTATING_LINES = [
  "我不知道自己适合什么…",
  "简历投了80份没回音…",
  "面试一紧张就大脑空白…",
] as const;

const FIXED_SUFFIX = "→ 让 7 位 AI 军师帮你";
const TYPE_MS = 72;
const HOLD_MS = 2000;
const DELETE_MS = 36;

export function HeroSection() {
  const [lineIndex, setLineIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting">("typing");

  useEffect(() => {
    const full = ROTATING_LINES[lineIndex];
    let t: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (displayed.length < full.length) {
        t = setTimeout(() => {
          setDisplayed(full.slice(0, displayed.length + 1));
        }, TYPE_MS);
      } else {
        t = setTimeout(() => setPhase("holding"), 0);
      }
    } else if (phase === "holding") {
      t = setTimeout(() => setPhase("deleting"), HOLD_MS);
    } else {
      if (displayed.length > 0) {
        t = setTimeout(() => {
          setDisplayed((d) => d.slice(0, -1));
        }, DELETE_MS);
      } else {
        t = setTimeout(() => {
          setLineIndex((i) => (i + 1) % ROTATING_LINES.length);
          setPhase("typing");
        }, 0);
      }
    }

    return () => clearTimeout(t);
  }, [displayed, lineIndex, phase]);

  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-14 sm:pb-20 sm:pt-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(196,30,58,0.06),transparent_55%)]" />
      <div className="relative mx-auto max-w-4xl text-center">
        <Link
          href="/pitch"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-0 top-0 inline-flex h-8 items-center justify-center rounded-full border border-ink/20 bg-white/90 px-3 text-xs font-semibold text-ink/75 transition hover:border-ink/40 hover:text-ink"
        >
          演示
        </Link>
        <p className="mb-3 text-sm font-semibold tracking-widest text-ink/60">
          Career War Room · EasyClaw
        </p>
        <h1 className="text-balance text-3xl font-bold leading-tight text-ink sm:text-5xl sm:leading-tight">
          应届生求职作战部
        </h1>
        <p className="mx-auto mt-6 flex min-h-[3.25rem] max-w-3xl flex-wrap items-baseline justify-center gap-x-1 text-balance text-lg font-semibold text-ink/90 sm:min-h-[3.5rem] sm:text-xl">
          <span className="text-[#8B2C2C]">
            {displayed}
            <span className="animate-warroom-caret inline-block w-[2px] translate-y-[0.12em] border-l-2 border-[#8B2C2C] sm:border-l-[3px]" />
          </span>
          <span className="text-ink/88">{FIXED_SUFFIX}</span>
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
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap sm:gap-6">
          <Link
            href="/chat"
            className="hero-cta-primary-glow inline-flex min-h-[48px] min-w-[240px] items-center justify-center rounded-full bg-cta px-8 py-3 text-base font-bold text-white"
          >
            🚀 立即体验作战部
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
