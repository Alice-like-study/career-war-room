"use client";

import { useEffect, useMemo, useState } from "react";

type PipelineStep = {
  id: string;
  agents: string[];
  title: string;
  description: string;
};

type PipelineScene = {
  id: "full" | "urgent" | "diagnosis";
  tabLabel: string;
  icon: string;
  bannerTitle: string;
  bannerSubtitle: string;
  steps: PipelineStep[];
};

const scenes: PipelineScene[] = [
  {
    id: "full",
    tabLabel: "完整求职作战",
    icon: "🗺",
    bannerTitle: "完整求职作战 · 一句话驱动全流程",
    bannerSubtitle: "6 位 Agent 协作 · 1 张作战地图交付 · 全程闭环",
    steps: [
      {
        id: "01",
        agents: ["COMPASS"],
        title: "模糊诉求分诊",
        description:
          "用户输入「我求职好难,不知道选什么」,Compass 识别为「方向 + 简历 + 面试」复合诉求,生成分诊单并调度后续 Agent。",
      },
      {
        id: "02",
        agents: ["PRISM", "SCOPE"],
        title: "画像挖掘 + 行业匹配",
        description:
          "Prism 通过 5 轮自我探索对话,产出《X 型选手画像报告》。Scope 同步基于画像匹配 Top 3 行业,产出《行业匹配评分报告》。两个 Agent 并行执行,信息互不阻塞。",
      },
      {
        id: "03",
        agents: ["SCALPEL"],
        title: "3 版差异化简历生成",
        description:
          "基于画像和目标行业,Scalpel 用 STAR 框架重写简历,产出 3 版差异化版本(校招主投版 / 实习版 / 转专业版),每版针对不同岗位类型优化。",
      },
      {
        id: "04",
        agents: ["ARENA"],
        title: "5 轮模拟面试压测",
        description:
          "Arena 根据简历和目标公司,模拟 5 轮真实面试场景(行为面 + 技术面 + 压力面),产出《结构化反馈报告》,标注每个回答的得分点和漏洞。",
      },
      {
        id: "05",
        agents: ["LUMEN"],
        title: "情绪识别与陪跑",
        description:
          "全程异步监听,在 Arena 压测后检测到挫败情绪信号,自动触发 12 步 CBT 陪跑话术。异步触发,不打断主流程,只在情绪低谷时静默介入。",
      },
      {
        id: "06",
        agents: ["BALANCE"],
        title: "7 维 Offer 决策评分",
        description:
          "拿到多个 Offer 后,Balance 基于 7 个维度(行业前景 / 抗压度 / 通勤 / 薪资 / 学习曲线 / 直属上级 / 价值感)生成决策评分表,推荐最优解。",
      },
      {
        id: "07",
        agents: ["COMPASS"],
        title: "全量整合输出",
        description:
          "Compass 再次出场,整合所有 Agent 的输出,产出最终交付物《个人校招作战地图》(PDF · 含 4 周时间线)。",
      },
    ],
  },
  {
    id: "urgent",
    tabLabel: "紧急面试救火",
    icon: "🔥",
    bannerTitle: "紧急面试救火 · 面试前 24 小时应急方案",
    bannerSubtitle: "4 步速推演练 · 聚焦高优先级结果交付",
    steps: [
      {
        id: "01",
        agents: ["COMPASS"],
        title: "紧急分诊",
        description:
          "用户输入「明天面试,不知道怎么准备」,Compass 识别为高优先级救火请求,跳过画像环节直接调度面试相关 Agent。",
      },
      {
        id: "02",
        agents: ["SCOPE"],
        title: "公司背景速查",
        description:
          "24 小时内拉取目标公司的业务、岗位、近期动态,产出《公司速查卡》,帮助用户快速补齐信息差。",
      },
      {
        id: "03",
        agents: ["ARENA"],
        title: "3 轮压测速训",
        description: "针对该岗位生成 20 个高频面试题,执行 3 轮模拟压测并实时反馈话术问题,形成赛前提分清单。",
      },
      {
        id: "04",
        agents: ["LUMEN"],
        title: "赛前情绪稳定",
        description: "面试前夜异步触发,提供 3 句锚定话术 + 呼吸引导,产出可即刻执行的稳定节奏脚本,缓解紧张。",
      },
    ],
  },
  {
    id: "diagnosis",
    tabLabel: "方向迷茫诊断",
    icon: "🧭",
    bannerTitle: "方向迷茫诊断 · 从模糊焦虑到可选路径",
    bannerSubtitle: "3 步完成诊断 · 画像到路径一体闭环",
    steps: [
      {
        id: "01",
        agents: ["COMPASS"],
        title: "迷茫源诊断",
        description:
          "用户输入「我不知道自己适合什么」,Compass 识别为方向类问题,直接调度 Prism 并生成方向诊断起始单。",
      },
      {
        id: "02",
        agents: ["PRISM"],
        title: "深度画像挖掘",
        description:
          "通过 5 轮深度对话,挖掘用户的兴趣、能力、价值观,产出《X 型选手画像报告》,为后续路径推荐提供证据基础。",
      },
      {
        id: "03",
        agents: ["SCOPE"],
        title: "3 条路径推荐",
        description:
          "基于画像生成 3 条可走的路径,每条标注匹配度、入门难度、长期天花板,产出《方向路径建议单》供用户决策。",
      },
    ],
  },
];

const agentTagClassMap: Record<string, string> = {
  COMPASS: "bg-[#f7efe1] border-[#8b2c2c]/35 text-[#8b2c2c]",
  PRISM: "bg-[#f3ece2] border-[#8b2c2c]/35 text-[#8b2c2c]",
  SCOPE: "bg-[#fff7ea] border-[#8b2c2c]/35 text-[#8b2c2c]",
  SCALPEL: "bg-[#fffbf5] border-[#8b2c2c]/35 text-[#8b2c2c]",
  ARENA: "bg-[#fff4f4] border-[#8b2c2c]/35 text-[#8b2c2c]",
  BALANCE: "bg-[#ede6dc] border-[#8b2c2c]/35 text-[#8b2c2c]",
  LUMEN: "bg-[#ebe4d9] border-[#8b2c2c]/35 text-[#8b2c2c]",
};

export function PipelineFlowDiagram() {
  const [activeSceneId, setActiveSceneId] = useState<PipelineScene["id"]>("full");
  const [isVisible, setIsVisible] = useState(true);

  const activeScene = useMemo(() => scenes.find((scene) => scene.id === activeSceneId) ?? scenes[0], [activeSceneId]);

  useEffect(() => {
    if (isVisible) {
      return;
    }
    const timer = window.setTimeout(() => setIsVisible(true), 24);
    return () => window.clearTimeout(timer);
  }, [activeSceneId, isVisible]);

  const onSwitchScene = (sceneId: PipelineScene["id"]) => {
    if (sceneId === activeSceneId) {
      return;
    }
    setIsVisible(false);
    window.setTimeout(() => {
      setActiveSceneId(sceneId);
    }, 170);
  };

  return (
    <div className="w-full space-y-6 sm:space-y-7">
      <header className="text-center">
        <h2 className="text-2xl font-bold text-ink sm:text-3xl">三大求职场景演示</h2>
        <p className="mx-auto mt-3 max-w-3xl text-base font-semibold text-ink/80 sm:text-lg">
          点击场景,查看 6 位 Agent 如何协同完成完整求职闭环
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {scenes.map((scene) => {
          const active = scene.id === activeSceneId;
          return (
            <button
              key={scene.id}
              type="button"
              onClick={() => onSwitchScene(scene.id)}
              className={[
                "flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition-all duration-200 sm:text-base",
                active
                  ? "border-[#8B2C2C] bg-[#8B2C2C] text-[#F5EDD8] shadow-[4px_6px_0_rgba(61,40,23,0.18)]"
                  : "paper-texture border-[#8B2C2C] text-[#8B2C2C] hover:-translate-y-0.5 hover:bg-[#fff7ea]",
              ].join(" ")}
              aria-pressed={active}
            >
              <span aria-hidden className="inline-flex -rotate-6 text-[17px] leading-none">
                {scene.icon}
              </span>
              <span>{scene.tabLabel}</span>
            </button>
          );
        })}
      </div>

      <div
        className={[
          "paper-texture rounded-2xl border border-ink/10 p-3 transition-all duration-300 sm:p-4",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
        ].join(" ")}
      >
        <div className="rounded-xl bg-[#8B2C2C] px-5 py-4 text-[#F5EDD8] sm:px-6 sm:py-5">
          <h4 className="text-xl font-bold sm:text-2xl">{activeScene.bannerTitle}</h4>
          <p className="mt-2 text-sm font-semibold text-[#F5EDD8]/90 sm:text-base">{activeScene.bannerSubtitle}</p>
        </div>

        <div className="mt-3 rounded-xl border border-ink/10 bg-[#fffbf5] px-4 py-2 sm:mt-4 sm:px-6 sm:py-3">
          {activeScene.steps.map((step, index) => (
            <article
              key={`${activeScene.id}-${step.id}`}
              className={[
                "group flex gap-3 px-1 py-4 transition-colors duration-200 sm:gap-4 sm:px-2",
                "hover:bg-[#fff7ea]/60",
                index > 0 ? "border-t border-ink/10" : "",
              ].join(" ")}
            >
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8B2C2C] text-sm font-bold text-[#F5EDD8]">
                {step.id}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-1.5">
                  {step.agents.map((agent) => (
                    <span
                      key={`${step.id}-${agent}`}
                      className={[
                        "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-[0.03em] sm:text-xs",
                        agentTagClassMap[agent] ?? "bg-[#f7efe1] border-[#8b2c2c]/35 text-[#8b2c2c]",
                      ].join(" ")}
                    >
                      {agent}
                    </span>
                  ))}
                </div>
                <h5 className="mt-2 text-[16px] font-bold leading-relaxed text-ink">{step.title}</h5>
                <p className="mt-1 text-[14px] leading-relaxed text-ink/85">{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
