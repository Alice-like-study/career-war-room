import type { ReactNode } from "react";
import {
  IconArena,
  IconBalance,
  IconLumen,
  IconPrism,
  IconScalpel,
  IconScope,
} from "@/components/agent-icons";
import { AGENT_DEMOS, type AgentDemoId } from "@/components/agent-demo-contents";
import { AgentDemoFold } from "@/components/AgentDemoFold";
import { WhiteboardCard } from "@/components/ui/WhiteboardCard";

const agents: {
  icon: ReactNode;
  title: string;
  demoId: AgentDemoId;
  demoName: string;
  canDo: string;
  principles: string;
  tags: string[];
  slogan: string;
}[] = [
  {
    icon: <IconPrism />,
    title: "Prism · 棱镜 · 自我画像官",
    demoId: "prism",
    demoName: "Prism",
    canDo:
      "5 轮情景化追问 / 挖掘真实兴趣 / 提取核心能力 / 排序价值观 / 锁定不可妥协项",
    principles:
      '不问「你的兴趣是什么」这种废话 / 用具体行为追问 / 5-7 轮内出报告 / 报告要有可被引用的细节',
    tags: ["画像挖掘", "价值观", "能力盘点"],
    slogan: '把模糊的「我不知道我适合什么」，变成清晰的「你是 X 型选手」',
  },
  {
    icon: <IconScope />,
    title: "Scope · 望远镜 · 行业匹配官",
    demoId: "scope",
    demoName: "Scope",
    canDo:
      "基于画像匹配 Top3 赛道 / 提供起薪和成长路径 / 标注风险点 / 揭穿「看似适合实则不推荐」陷阱 / 推荐 2 个野路子方向",
    principles:
      "必须用画像里的具体证据 / 起薪数据基于近 1 年校招行情 / 不和稀泥不无脑推荐互联网",
    tags: ["行业研究", "起薪", "路径规划"],
    slogan: '把「我不知道选哪行」，变成「这 3 个赛道，你最该去这个」',
  },
  {
    icon: <IconScalpel />,
    title: "Scalpel · 手术刀 · 简历医生",
    demoId: "scalpel",
    demoName: "Scalpel",
    canDo:
      "诊断原简历 5 大硬伤 / STAR 法则重写 / 主动追问数字 / 针对 3 个不同行业产出 3 版简历 / 配套投递策略",
    principles:
      '数字必须真实不编造 / 每版简历可一键复制 / 不超过 1 页 / 不写「性格开朗」这种废话',
    tags: ["简历重写", "STAR", "行业差异化"],
    slogan: '把「投 80 份只回 8 个」，变成「每一份都精准命中招聘视角」',
  },
  {
    icon: <IconArena />,
    title: "Arena · 沙盘 · 模拟面试官",
    demoId: "arena",
    demoName: "Arena",
    canDo:
      "扮演目标行业面试官 / 5 轮模拟面试 / 三段式反馈（优点/硬伤/改写示范） / 至少 1 道压力面 / 输出《面试通关手册》",
    principles:
      "一次只出一题 / 不无意义鼓励 / 先听用户答再给改写 / 改写必须用 STAR 框架",
    tags: ["模拟面试", "STAR", "压力测试"],
    slogan: '把「面试一紧张就背稿子」，变成「结构化作答的肌肉记忆」',
  },
  {
    icon: <IconBalance />,
    title: "Balance · 天平 · Offer 决策官",
    demoId: "balance",
    demoName: "Balance",
    canDo:
      '7 维度权重表收集 / 加权评分计算 / 给出「理性最优解」 / 反直觉提醒（看穿真实内心） / 引导冷静 24 小时',
    principles:
      '数字必须算清楚 / 不替用户做决定 / 反直觉提醒必须给 / 绝不说「两个都不错你自己选」',
    tags: ["Offer 决策", "加权评分", "内心矛盾"],
    slogan: '把「我妈让我选 A 但我想选 B」，变成「看见你内心真正的权重」',
  },
  {
    icon: <IconLumen />,
    title: "Lumen · 暖灯 · 情绪陪跑官",
    demoId: "lumen",
    demoName: "Lumen",
    canDo:
      "全程异步监测 / 识别 4 类情绪信号 / CBT 三步法介入（命名→拆解→最小行动） / 极端信号引导专业资源",
    principles:
      '不哄不教训 / 一次只给一个最小行动 / 不刷「加油宝宝你最棒」鸡汤 / 短句无感叹号',
    tags: ["情绪陪跑", "CBT", "异步监测"],
    slogan: '把「凌晨 2 点改简历的崩溃瞬间」，变成「10 分钟之内可以做的小事」',
  },
];

export function AgentsSection() {
  return (
    <section id="agents" className="px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <header className="text-center">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">6 位专职角色，各有绝活</h2>
          <p className="mx-auto mt-3 max-w-3xl text-base font-semibold text-ink/80 sm:text-lg">
            每位都基于 EasyClaw 框架训练，自由组合，精准协作
          </p>
        </header>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((a) => (
            <WhiteboardCard key={a.title} icon={a.icon}>
              <>
                <div className="flex min-h-0 flex-1 flex-col gap-3">
                  <h3 className="text-center text-lg font-bold leading-snug text-ink">{a.title}</h3>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-cta">能干什么</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink/85">{a.canDo}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-cta">工作原则</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink/85">{a.principles}</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {a.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-ink/20 bg-white/60 px-3 py-1 text-xs font-semibold text-ink/80"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="border-t border-ink/10 pt-3 text-center text-sm font-semibold italic leading-relaxed text-ink">
                    {a.slogan}
                  </p>
                </div>
                <AgentDemoFold agentName={a.demoName}>{AGENT_DEMOS[a.demoId]}</AgentDemoFold>
              </>
            </WhiteboardCard>
          ))}
        </div>
      </div>
    </section>
  );
}
