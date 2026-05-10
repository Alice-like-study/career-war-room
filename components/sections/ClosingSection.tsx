import Link from "next/link";
import { links } from "@/components/links";

export function ClosingSection() {
  return (
    <section id="cta" className="border-t border-ink/15 bg-[#ebe4d9] px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-balance text-2xl font-bold leading-snug text-ink sm:text-4xl">
          应届生求职，从单兵作战到 AI 数字军团
        </h2>

        <div className="mt-10 flex flex-col items-stretch gap-4 sm:mx-auto sm:max-w-lg">
          <Link
            href={links.easyclawDownload}
            className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-cta px-8 py-3 text-base font-bold text-white shadow-[3px_5px_0_rgba(61,40,23,0.12)] transition hover:brightness-105 active:translate-y-px"
          >
            立即下载 EasyClaw 客户端
          </Link>
          <Link
            href={links.skill}
            className="inline-flex min-h-[52px] items-center justify-center rounded-full border-2 border-ink bg-paper px-8 py-3 text-base font-bold text-ink shadow-warm transition hover:bg-white active:translate-y-px"
          >
            一键安装作战部 Skill 包
          </Link>
          <Link
            href={links.github}
            className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-ink/25 bg-transparent px-8 py-3 text-base font-semibold text-ink/90 underline-offset-4 hover:underline"
          >
            GitHub 源码
          </Link>
        </div>

        <p className="mt-12 text-xs font-medium text-ink/55 sm:text-sm">
          本作品参加傅盛 AI 战队青少年黑客松，2026.5.10
        </p>
      </div>
    </section>
  );
}
