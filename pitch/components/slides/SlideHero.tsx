export function SlideHero() {
  return (
    <section className="paper-texture flex h-full w-full flex-col items-center justify-center px-16">
      <div className="flex max-w-5xl flex-col items-center text-center">
        <p className="font-mono-term text-sm tracking-[0.35em] text-ink/45">CAREER WAR ROOM</p>
        <h1 className="mt-6 text-6xl font-bold tracking-tight text-ink xl:text-7xl">
          Career War Room
        </h1>
        <p className="mt-8 max-w-2xl text-2xl font-semibold leading-relaxed text-ink/85 xl:text-3xl">
          为应届生打造的多 Agent 求职作战指挥部
        </p>
        <div className="mt-16 h-px w-24 bg-ink/15" />
        <p className="mt-8 max-w-xl text-base leading-relaxed text-ink/55 xl:text-lg">
          目标用户：迷茫中的应届生 · 场景：校招全流程 · 问题：信息过载却无人帮你看清自己
        </p>
      </div>
    </section>
  );
}
