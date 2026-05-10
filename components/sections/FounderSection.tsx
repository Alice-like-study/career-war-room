import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { founderReportMarkdown } from "./founderReportMarkdown";

const reportMarkdownComponents: Components = {
  h2: ({ children }) => (
    <h2 className="mt-8 scroll-mt-24 border-b border-ink/15 pb-2 text-lg font-bold text-ink first:mt-0 sm:text-xl">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 text-base font-bold text-ink sm:text-[17px]">{children}</h3>
  ),
  p: ({ children }) => <p className="my-3 leading-relaxed text-ink/90 last:mb-0">{children}</p>,
  ul: ({ children, className }) => (
    <ul
      className={[
        "my-3 space-y-1.5 leading-relaxed text-ink/90",
        typeof className === "string" && className.includes("contains-task-list")
          ? "list-none pl-0"
          : "list-disc pl-5 marker:text-ink/50",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1.5 pl-5 leading-relaxed text-ink/90 marker:text-ink/60">{children}</ol>
  ),
  li: ({ children, className }) => (
    <li
      className={[
        "leading-relaxed [&>p]:my-1",
        typeof className === "string" && className.includes("task-list-item")
          ? "flex items-start gap-2 [&>p]:my-0"
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-[3px] border-cta/45 bg-ink/[0.03] py-2 pl-4 pr-2 text-ink/85 [&_p]:my-2">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-8 border-ink/12" />,
  strong: ({ children }) => <strong className="font-bold text-ink">{children}</strong>,
  em: ({ children }) => <em className="italic text-ink/95">{children}</em>,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-md border border-ink/15 bg-white/40">
      <table className="min-w-full border-collapse text-left text-sm text-ink/90">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-ink/[0.06]">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-t border-ink/12 first:border-t-0">{children}</tr>,
  th: ({ children }) => (
    <th className="border border-ink/12 px-3 py-2 align-top text-[13px] font-semibold text-ink sm:text-sm">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border border-ink/12 px-3 py-2 align-top text-[13px] leading-snug sm:text-sm">{children}</td>
  ),
  input: ({ type, className, ...rest }) =>
    type === "checkbox" ? (
      <input
        type="checkbox"
        {...rest}
        readOnly
        className={["mr-0 mt-0.5 inline-block h-4 w-4 shrink-0 rounded border-ink/35 accent-cta disabled:opacity-100", className].filter(Boolean).join(" ")}
      />
    ) : (
      <input type={type} className={className} {...rest} />
    ),
};

export function FounderSection() {
  return (
    <section
      id="founder-story"
      className="border-t border-ink/10 bg-[#e8dfd2] px-4 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <header className="text-center">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">为什么我做这个产品</h2>
          <p className="mx-auto mt-3 max-w-2xl text-base font-semibold text-ink/80 sm:text-lg">
            作战部第一次跑通时,它给了作者一份意外的画像
          </p>
        </header>

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-14">
          <blockquote className="paper-texture marker-border relative px-6 py-8 sm:px-8 sm:py-10">
            <div className="relative pl-1 font-serif text-xl font-semibold leading-relaxed text-ink before:absolute before:-left-1 before:-top-1 before:font-serif before:text-6xl before:leading-none before:text-ink/20 before:content-['\201C'] sm:text-2xl sm:leading-relaxed sm:before:text-7xl">
              <p className="whitespace-pre-line">
                {`"你不是被'选对一个 offer'驱动,
而是被'终其一生找寻自己真正该走的那条路'驱动。
你纠结的从来不是选项本身,是怕自己又一次走错方向。"`}
              </p>
            </div>
            <footer className="relative mt-6 border-t border-ink/10 pt-4 text-sm font-semibold text-ink/65 sm:text-base">
              —— Prism · 棱镜 给作者的画像,2026.5
            </footer>
          </blockquote>

          <div className="space-y-5 text-base leading-relaxed text-ink/90 sm:text-[17px] sm:leading-[1.75]">
            <p>我做这个产品的契机,不是某个商业洞察,而是一次意外。</p>
            <p className="whitespace-pre-line">
              {`春招最焦灼的某个凌晨,我刚把 6 个 Agent 在 EasyClaw 上搭好,
按计划应该用一份"虚拟应届生小李"的人物设定测试整条 Pipeline。
但我没注意,Prism 第一轮提问时,我下意识用了自己的真实状态回答——
手里几个 offer 在纠结、羡慕朋友边读研边用 AI 创业、
大三才意识到校园经济做不过互联网经济、
作为数学专业的学生却选修了商学院大半课程、
帮过很多学弟学妹做就业规划但自己反而不敢决定。
5 轮对话之后,Prism 输出了一份画像。我读到上面那句话时愣住了——
我身边那么多朋友、那么多次付费咨询,没有一个人在这么短时间里
说出过这句话。但我自己心里知道:它说对了。`}
            </p>
            <p className="whitespace-pre-line">
              {`我从高中盲从、到大学深度参与组织、到做校园创业、到迫于现实选就业,
表面在"做选择",底层一直在做同一件事——找到自己真正该走的路。
那一刻我才意识到,作战部的真正价值,不是"帮你挑一个 offer",
而是它能在你被父母期待、春招 deadline、同辈压力一起裹挟的时候,
用 5 轮对话告诉你:你纠结的不是这几个 offer,是更深的那个问题。
应届生最缺的从来不是信息——我整理的就业方法论已经讲过几十遍了,
听完依然有人请不下来假去实习、有人忙毕业论文错过春招、
有人明明有能力却被自己的情绪困住。
最难的从来不是执行,是选择、是情绪、是那些"不知道自己不知道"的盲点。
7 个 AI 军师做不到代替你做选择,但它们能让选择不再孤独。`}
            </p>
          </div>
        </div>

        <details className="paper-texture marker-border-soft group mt-12 overflow-hidden">
          <summary className="cursor-pointer list-none px-6 py-4 text-center font-bold text-cta outline-none ring-cta/20 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="underline decoration-cta/40 decoration-2 underline-offset-4 group-open:no-underline">
              查看作者的完整画像报告 →
            </span>
          </summary>
          <div className="border-t border-ink/10 px-6 py-6 text-[15px] leading-relaxed text-ink/90 sm:text-base">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={reportMarkdownComponents}>
              {founderReportMarkdown}
            </ReactMarkdown>
          </div>
        </details>
      </div>
    </section>
  );
}
