const cards = [
  {
    title: "有 offer 纠结型",
    body: "父母让选 A 你想选 B，夜夜失眠",
  },
  {
    title: "投简历石沉大海型",
    body: "投了 80 份只回 8 个，不知道哪里出问题",
  },
  {
    title: "面试反复挂型",
    body: "一进面试就紧张到背稿子，3 次都挂",
  },
  {
    title: "完全迷茫无方向型",
    body: "不知道自己适合什么，不知道从哪开始",
  },
];

export function AudienceSection() {
  return (
    <section id="audience" className="border-t border-ink/10 bg-[#f3ece2]/70 px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <header className="text-center">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">作战部为这 4 类应届生而生</h2>
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
