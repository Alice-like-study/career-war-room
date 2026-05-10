const rows = [
  { dim: "简历版本数", traditional: "1 版打天下", warRoom: "3 版精准命中" },
  { dim: "决策依据", traditional: "父母意见 + 直觉", warRoom: "7 维度加权评分 + 内心矛盾识别" },
  { dim: "面试准备度", traditional: "背稿子", warRoom: "STAR 肌肉记忆 + 压力面演练" },
  { dim: "情绪支持", traditional: "自己扛", warRoom: "24/7 异步陪跑" },
  { dim: "总耗时", traditional: "30-60 天", warRoom: "30 分钟出地图 + 持续陪跑" },
  { dim: "成本", traditional: "焦虑 + 5000-30000 元顾问", warRoom: "0 元 + 一次 EasyClaw Skill 安装" },
];

export function CompareSection() {
  return (
    <section id="compare" className="px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <header className="text-center">
          <p className="text-sm font-bold tracking-wide text-cta">有了作战部，你的求职会变成什么样</p>
          <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">传统求职 VS 作战部求职</h2>
        </header>

        <div className="mt-10 hidden overflow-x-auto rounded-xl border border-ink/15 bg-paper shadow-card sm:block">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm sm:text-base">
            <thead>
              <tr className="border-b-2 border-ink/20 bg-[#ebe4d9]">
                <th className="px-4 py-4 font-bold text-ink sm:px-6">维度</th>
                <th className="px-4 py-4 font-bold text-ink sm:px-6">传统求职</th>
                <th className="px-4 py-4 font-bold text-cta sm:px-6">作战部求职</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.dim} className="border-b border-ink/10 odd:bg-white/50 even:bg-cream/40">
                  <th scope="row" className="px-4 py-4 font-semibold text-ink sm:px-6">
                    {r.dim}
                  </th>
                  <td className="px-4 py-4 text-ink/85 sm:px-6">{r.traditional}</td>
                  <td className="px-4 py-4 font-semibold text-ink sm:px-6">{r.warRoom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 移动端堆叠卡片视图 */}
        <div className="mt-10 space-y-3 sm:hidden">
          {rows.map((r) => (
            <div key={r.dim} className="paper-texture marker-border-soft p-4">
              <p className="text-xs font-bold text-cta">{r.dim}</p>
              <p className="mt-2 text-sm text-ink/80">
                <span className="font-semibold text-ink">传统：</span>
                {r.traditional}
              </p>
              <p className="mt-1 text-sm">
                <span className="font-semibold text-cta">作战部：</span>
                {r.warRoom}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
