 "use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  IconArena,
  IconBalance,
  IconLumen,
  IconPrism,
  IconScalpel,
  IconScope,
} from "@/components/agent-icons";
import { AGENT_DEMOS, type AgentDemoId } from "@/components/agent-demo-contents";

const agents: {
  key: AgentDemoId;
  icon: ReactNode;
  title: string;
  oneLiner: string;
  quote: string;
  canDo: [string, string, string];
  tags: string[];
  collaboration: {
    direction: "to" | "from" | "all";
    target: string;
    note: string;
  }[];
  preview: string;
  modalTitle?: string;
}[] = [
  {
    key: "prism",
    icon: <IconPrism />,
    title: "Prism · 棱镜 · 自我画像官",
    oneLiner: "把真实行为拆成可复用的画像证据链。",
    quote: "把「我不知道我适合什么」，变成「你是 X 型选手」。",
    canDo: ["· 5 轮追问锁定画像", "· 提炼能力与价值锚", "· 输出可引用证据链"],
    tags: ["画像挖掘", "价值锚", "证据链"],
    collaboration: [
      { direction: "to", target: "Compass", note: "画像输入" },
      { direction: "to", target: "Scope", note: "行业匹配" },
    ],
    preview: "📜 实录:小李 23 届，GPA 3.3，先从一次深夜改简历追问起...",
  },
  {
    key: "scope",
    icon: <IconScope />,
    title: "Scope · 望远镜 · 行业匹配官",
    oneLiner: "用画像证据匹配赛道，不给模糊建议。",
    quote: "把「我不知道选哪行」，变成「这 3 个赛道你该先打哪一个」。",
    canDo: ["· 画像驱动 Top3 赛道", "· 给出起薪与成长路径", "· 标注高风险误判方向"],
    tags: ["赛道匹配", "起薪图", "路径图"],
    collaboration: [
      { direction: "from", target: "Prism", note: "画像输入" },
      { direction: "to", target: "Scalpel", note: "简历优化" },
      { direction: "to", target: "Arena", note: "面试演练" },
    ],
    preview: "📜 实录:金融 vs 互联网的纠结，被拆成画像证据 + 起薪路径...",
  },
  {
    key: "scalpel",
    icon: <IconScalpel />,
    title: "Scalpel · 手术刀 · 简历医生",
    oneLiner: "把经历重写成招聘方能秒读的证据句。",
    quote: "把「经历很多但说不清」，变成「一眼可评估的成果证据」。",
    canDo: ["· 30 秒锁定简历硬伤", "· STAR 逐句重写经历", "· 追问数字补齐结果证据"],
    tags: ["简历刀", "STAR", "数字证"],
    collaboration: [
      { direction: "from", target: "Scope", note: "目标行业" },
      { direction: "to", target: "Arena", note: "面试演练" },
    ],
    preview: "📜 实录:一句「负责运营」被重写成完整 STAR 结果链条...",
  },
  {
    key: "arena",
    icon: <IconArena />,
    title: "Arena · 沙盘 · 模拟面试官",
    oneLiner: "按真实流程压测，让表达形成肌肉记忆。",
    quote: "把「临场脑空白」，变成「可复用的结构化回答」。",
    canDo: ["· 5 轮真实面试模拟", "· 三段式逐句反馈", "· 压力题与复盘手册"],
    tags: ["压力面", "逐句改", "复盘册"],
    collaboration: [
      { direction: "from", target: "Scalpel", note: "简历素材" },
      { direction: "to", target: "Lumen", note: "情绪兜底" },
    ],
    preview: "📜 实录:第 1 题自我介绍，被拆成优点/硬伤/改写示范...",
  },
  {
    key: "balance",
    icon: <IconBalance />,
    title: "Balance · 天平 · Offer 决策官",
    oneLiner: "让情绪与现实同屏，算出可解释的取舍。",
    quote: "把「别人都替我选」，变成「我看见自己真正的权重」。",
    canDo: ["· 7 维度权重:行业前景/抗压度/通勤距离", "· 薪资/学习曲线/直属上级/价值感", "· 输出理性分与反直觉提醒"],
    tags: ["权重表", "双方案", "反直觉"],
    collaboration: [
      { direction: "from", target: "Compass", note: "全局视图" },
      { direction: "to", target: "Lumen", note: "决策焦虑" },
    ],
    preview: "📜 实录:字节运营 vs AI 产品，被拆成 7 维加权评分表...",
    modalTitle: "📜 一段 Balance 给出的真实 Offer 决策表",
  },
  {
    key: "lumen",
    icon: <IconLumen />,
    title: "Lumen · 暖灯 · 情绪陪跑官",
    oneLiner: "在崩溃边缘时兜底，把人拉回可行动状态。",
    quote: "把「凌晨崩溃自我否定」，变成「10 分钟可执行的小行动」。",
    canDo: ["· 凌晨情绪信号识别", "· 12 步异步陪跑(CBT 框架)", "· 自我效能重建话术"],
    tags: ["情绪陪跑", "CBT", "异步监听", "信号识别"],
    collaboration: [{ direction: "all", target: "所有 Agent", note: "异步监听情绪信号" }],
    preview: "🌙 实录:用户凌晨发「又投了一份,还是没消息」,Lumen 拆出...",
  },
];

const agentAvatarMap: Record<string, string> = {
  Prism: "△",
  Scope: "⊙",
  Scalpel: "⚔",
  Arena: "⚒",
  Balance: "⚖",
  Lumen: "💡",
  Compass: "🧭",
  "所有 Agent": "✦",
};

function clampTwoLinesStyle() {
  return {
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
    overflow: "hidden",
  };
}

function CollaborationFlow({
  links,
}: {
  links: {
    direction: "to" | "from" | "all";
    target: string;
    note: string;
  }[];
}) {
  return (
    <div className="mt-1 flex h-[34px] items-start gap-1 overflow-hidden text-[10px] leading-tight text-ink/85 sm:text-[11px]">
      {links.map((item) => {
        const arrow = item.direction === "from" ? "←" : item.direction === "all" ? "↔" : "→";
        return (
          <div key={`${item.target}-${item.note}`} className="flex min-w-0 items-center gap-1">
            <span className="text-xs text-[#8b2c2c]">{arrow}</span>
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#8b2c2c]/35 bg-[#f7efe1] text-[11px]">
              {agentAvatarMap[item.target] ?? "✦"}
            </span>
            <span className="truncate whitespace-nowrap">
              {item.target}
              <span className="text-ink/60">({item.note})</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function AgentsSection() {
  const [activeDemo, setActiveDemo] = useState<AgentDemoId | null>(null);

  const activeAgent = useMemo(() => agents.find((agent) => agent.key === activeDemo) ?? null, [activeDemo]);

  useEffect(() => {
    if (!activeDemo) {
      return;
    }
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveDemo(null);
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("keydown", onEsc);
    };
  }, [activeDemo]);

  return (
    <section id="agents" className="px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <header className="text-center">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">6 位专职角色，各有绝活</h2>
          <p className="mx-auto mt-3 max-w-3xl text-base font-semibold text-ink/80 sm:text-lg">
            每位都基于 EasyClaw 框架训练，自由组合，精准协作
          </p>
        </header>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-6">
          {agents.map((a) => (
            <article
              key={a.title}
              className="group flex min-h-[510px] flex-col overflow-hidden rounded-xl border border-[#c9a876] bg-[#fffbf5] shadow-[6px_6px_0_rgba(139,44,44,0.15)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[8px_10px_0_rgba(139,44,44,0.2)]"
            >
              <div className="flex h-[120px] flex-col items-center justify-center border-b border-[#d4b690] px-4 text-center">
                <div className="mb-2 text-4xl text-ink">{a.icon}</div>
                <h3 className="text-[22px] font-bold leading-tight text-ink">{a.title}</h3>
                <p className="mt-1 max-w-full truncate text-[14px] italic text-ink/65">{a.oneLiner}</p>
              </div>

              <div className="h-[80px] border-b border-[#d4b690] px-4 py-3">
                <blockquote
                  className="h-full border-l-4 border-[#8b2c2c] bg-[#f7efe1] px-3 py-1.5 font-serif text-[16px] italic leading-6 text-ink/85"
                  style={clampTwoLinesStyle()}
                >
                  {a.quote}
                </blockquote>
              </div>

              <div className="h-[140px] border-b border-[#d4b690] px-4 py-3">
                <p className="font-sans text-[14px] font-bold text-[#8b2c2c]">能干什么</p>
                <ul className="mt-2 space-y-1.5 font-serif text-[14px] leading-[1.6] text-ink">
                  {a.canDo.map((item) => (
                    <li key={item} className="truncate">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="h-[50px] border-b border-[#d4b690] px-4 py-2">
                <div className="flex max-h-[34px] flex-wrap gap-1.5 overflow-hidden">
                  {a.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#8b2c2c]/70 bg-transparent px-2.5 py-0.5 text-[12px] font-semibold text-[#8b2c2c]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="h-[60px] border-b border-dashed border-[#c79a9a] px-4 py-2">
                <p className="font-sans text-[14px] font-bold text-[#8b2c2c]">协作 AGENT</p>
                <CollaborationFlow links={a.collaboration} />
              </div>

              <div className="flex h-[60px] items-center justify-between gap-3 px-4 py-2">
                <p className="min-w-0 truncate text-[13px] italic text-ink/70">{a.preview}</p>
                <button
                  type="button"
                  className="shrink-0 text-[13px] font-semibold text-[#8b2c2c] underline decoration-[#8b2c2c]/50 underline-offset-2"
                  onClick={() => setActiveDemo(a.key)}
                >
                  展开 ↓
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {activeAgent ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
          onClick={() => setActiveDemo(null)}
        >
          <div
            className="relative w-full max-w-[600px] rounded-xl border border-[#c9a876] bg-[#fffbf5] shadow-[6px_6px_0_rgba(139,44,44,0.15)]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-4 top-4 text-lg font-bold text-[#8b2c2c]"
              onClick={() => setActiveDemo(null)}
              aria-label="关闭"
            >
              ×
            </button>
            <div className="border-b border-[#d4b690] px-5 py-4 pr-12">
              <h3 className="text-lg font-bold text-ink">
                {activeAgent.modalTitle ?? `📜 一段 ${activeAgent.title.split(" · ")[0]} 的真实运行记录`}
              </h3>
            </div>
            <div className="max-h-[80vh] overflow-y-auto px-5 py-4 font-serif text-[15px] leading-[1.8] text-ink/90 [&_li]:text-[15px] [&_li]:leading-[1.8] [&_p]:text-[15px] [&_p]:leading-[1.8] [&_pre]:text-[15px] [&_strong]:text-ink">
              {AGENT_DEMOS[activeAgent.key]}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
