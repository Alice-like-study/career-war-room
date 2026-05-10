const cards = [
  {
    title: "Offer 纠结星人",
    body: "选 A 怕遗憾，选 B 怕后悔，夜夜内耗到失眠",
  },
  {
    title: "简历投递黑洞",
    body: "海投 80 份仅回 8 封，找不到问题根源",
  },
  {
    title: "面试挂科常客",
    body: "背稿式面试一紧张就翻车，同类型岗位连挂几次",
  },
  {
    title: "校招迷茫小白",
    body: "不知道适合什么、不知道从哪开始，全程手足无措",
  },
];

export function AudienceSection() {
  return (
    <section id="audience" className="border-t border-ink/10 bg-[#f3ece2]/70 px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <header className="text-center">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">应届生求职作战部适合谁</h2>
        </header>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {cards.map((c) => (
            <div key={c.title} className="paper-texture marker-border p-6">
              <h3 className="text-lg font-bold text-ink">{c.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/85 sm:text-base">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
