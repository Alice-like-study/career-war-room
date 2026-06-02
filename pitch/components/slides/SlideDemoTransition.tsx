export function SlideDemoTransition() {
  return (
    <section className="paper-texture flex h-full w-full flex-col items-center justify-center px-12">
      <h2 className="text-center text-4xl font-bold text-ink xl:text-5xl">
        接下来看真实运行效果 →
      </h2>
      <a
        href="https://career-war-room-omega.vercel.app"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-12 inline-flex min-h-[56px] items-center justify-center rounded-full bg-cta px-10 py-3 text-lg font-bold text-white shadow-[3px_5px_0_rgba(61,40,23,0.12)] transition hover:brightness-105 active:translate-y-px"
      >
        打开真产品
      </a>
      <p className="mt-8 font-mono-term text-xs text-ink/40">新标签页打开 · 演示完 Alt+Tab 切回继续</p>
    </section>
  );
}
