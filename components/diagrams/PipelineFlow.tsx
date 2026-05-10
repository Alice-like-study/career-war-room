const labels: { text: string; wide?: boolean; accent?: boolean }[] = [
  { text: '用户输入「我求职好难」' },
  { text: "Compass 分诊" },
  { text: "[Prism 画像 + Scope 行业] 并行", wide: true },
  { text: "Scalpel 改简历" },
  { text: "Arena 模拟面试" },
  { text: "Balance 决策" },
  { text: "Compass 整合输出" },
  { text: "《个人校招作战地图》", accent: true },
];

export function PipelineFlowDiagram() {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex min-w-max flex-row items-center justify-start gap-2 px-1 sm:min-w-0 sm:flex-wrap sm:justify-center sm:gap-3">
        {labels.map((item, i) => (
          <div key={item.text} className="flex items-center gap-2 sm:gap-3">
            {i > 0 ? (
              <span className="text-lg font-bold text-ink/45 sm:text-xl" aria-hidden>
                →
              </span>
            ) : null}
            <div
              className={`paper-texture marker-border-soft max-w-[11rem] shrink-0 px-3 py-2 text-center text-sm font-semibold leading-snug sm:max-w-none sm:px-4 sm:text-base ${
                item.accent ? "border-cta/70 text-cta ring-1 ring-cta/25" : ""
              } ${item.wide ? "sm:max-w-[14rem]" : ""}`}
            >
              {item.text}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-ink/55 sm:hidden">← 左右滑动查看全流程 →</p>
    </div>
  );
}
