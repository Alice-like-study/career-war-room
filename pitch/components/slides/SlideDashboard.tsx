"use client";

import { useEffect, useMemo, useState } from "react";
import { AGENT_CARDS, COMPASS, type AgentKey } from "@/pitch/lib/agents-data";
import {
  CHAT_DEMOS,
  DEFAULT_DEMO_AGENT,
  PANEL_META,
  PANEL_ORDER,
  panelStatusFor,
  type DemoMessage,
  type PanelKey,
} from "@/pitch/lib/chat-demo-data";

interface SlideDashboardProps {
  isActive: boolean;
}

const CARD_BY_KEY = Object.fromEntries(AGENT_CARDS.map((c) => [c.key, c])) as Record<
  AgentKey,
  (typeof AGENT_CARDS)[number]
>;

const REPORT_ACTIONS: Record<PanelKey, { primary: string; secondary: string }> = {
  compass: {
    primary: "🧭 开始分诊并调度军师",
    secondary: "📄 查看作战地图样例",
  },
  prism: {
    primary: "📄 生成个人画像报告",
    secondary: "🔭 继续匹配赛道",
  },
  scope: {
    primary: "📄 生成行业匹配报告",
    secondary: "🔪 交给简历医生优化",
  },
  scalpel: {
    primary: "📄 生成简历优化报告",
    secondary: "⚔️ 进入模拟面试",
  },
  arena: {
    primary: "📘 生成面试通关手册",
    secondary: "📝 继续下一轮追问",
  },
  balance: {
    primary: "📄 生成 Offer 决策报告",
    secondary: "🧮 重填 7 维权重",
  },
  lumen: {
    primary: "📄 生成情绪小结",
    secondary: "🧩 输出 10 分钟最小行动",
  },
};

export function SlideDashboard({ isActive }: SlideDashboardProps) {
  const [activePanel, setActivePanel] = useState<PanelKey>(DEFAULT_DEMO_AGENT);
  const [visibleCount, setVisibleCount] = useState(1);

  const demoMessages = CHAT_DEMOS[activePanel];
  const visibleMessages = useMemo(
    () => demoMessages.slice(0, Math.min(visibleCount, demoMessages.length)),
    [demoMessages, visibleCount]
  );

  useEffect(() => {
    if (!isActive) {
      setVisibleCount(demoMessages.length);
      return;
    }
    setVisibleCount(1);

    const timer = window.setInterval(() => {
      setVisibleCount((curr) => (curr >= demoMessages.length ? curr : curr + 1));
    }, 760);

    return () => window.clearInterval(timer);
  }, [activePanel, demoMessages.length, isActive]);

  const action = REPORT_ACTIONS[activePanel];
  const panelMeta = PANEL_META[activePanel];
  const allVisible = visibleCount >= demoMessages.length;

  return (
    <section className="relative flex h-full w-full flex-col overflow-hidden bg-cream px-6 py-4 xl:px-10 xl:py-6">
      <div className="paper-texture mb-3 flex shrink-0 items-center justify-between rounded-2xl border-2 border-ink/15 px-5 py-3 shadow-card">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{COMPASS.icon}</span>
          <div>
            <p className="font-mono-term text-base font-bold tracking-wide text-ink">{COMPASS.name}</p>
            <p className="font-mono-term text-[11px] text-ink/55">应届生求职作战部 · Chat 打开态演示</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-cta/50 bg-cta/10 px-2 py-0.5 font-mono-term text-[10px] tracking-wider text-cta">
          <span className="animate-dashboard-dot inline-block size-1.5 rounded-full bg-cta" />
          LIVE
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[1.6fr_1fr] gap-4">
        <section className="paper-texture flex min-h-0 flex-col overflow-hidden rounded-2xl border-2 border-ink/15 bg-paper shadow-card">
          <header className="flex shrink-0 items-center justify-between border-b border-ink/10 bg-paper/70 px-4 py-3">
            <h3 className="text-[15px] font-bold text-ink xl:text-base">应届生求职作战部 · 作战室</h3>
            <span className="rounded-full border border-ink/15 bg-white/70 px-2 py-0.5 font-mono-term text-[10px] text-ink/65">
              {panelMeta.name} · {panelMeta.cn}
            </span>
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {visibleMessages.map((m, idx) => (
              <ChatBubble key={`${activePanel}-${idx}`} msg={m} />
            ))}

            {!allVisible ? (
              <div className="mr-auto w-[min(100%,620px)]">
                <div className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold text-ink/75">
                  <span className="text-base leading-none">{panelMeta.icon}</span>
                  <span>{panelMeta.name}</span>
                  <span className="text-ink/45">· 思考中</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-[18px_18px_18px_6px] border-2 border-cta/30 bg-[#fff8f7] px-3 py-2.5">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-cta/70" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-cta/55 [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-cta/40 [animation-delay:240ms]" />
                </div>
              </div>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-ink/10 bg-cream/95 px-4 py-3">
            <div className="mb-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="rounded-xl border-2 border-cta/45 bg-white px-3 py-2 text-left text-[12px] font-bold text-cta shadow-warm transition hover:bg-cta/5"
              >
                {action.primary}
              </button>
              <button
                type="button"
                className="rounded-xl border-2 border-ink/20 bg-paper px-3 py-2 text-left text-[12px] font-semibold text-ink/75 transition hover:bg-white"
              >
                {action.secondary}
              </button>
            </div>
            <div className="flex items-end gap-2">
              <textarea
                rows={2}
                disabled
                value=""
                placeholder="SHIFT + 回车换行；回车发送（演示态）"
                className="min-h-[58px] flex-1 resize-none rounded-xl border-2 border-ink/15 bg-paper px-3 py-2 text-[12px] text-ink/60 placeholder:text-ink/35"
              />
              <button
                type="button"
                className="inline-flex min-h-[42px] items-center justify-center rounded-full bg-cta px-5 text-[13px] font-bold text-white shadow-[2px_3px_0_rgba(61,40,23,0.15)]"
              >
                发送
              </button>
            </div>
          </div>
        </section>

        <aside className="flex min-h-0 flex-col gap-3">
          <div className="paper-texture rounded-2xl border-2 border-ink/15 px-4 py-3 shadow-card">
            <p className="font-mono-term text-[11px] font-semibold tracking-wide text-ink/55">LIVE · 作战部状态</p>
            <p className="mt-1 text-[13px] font-semibold leading-relaxed text-ink/75">
              {panelStatusFor(activePanel, true)}
            </p>
          </div>

          <div className="min-h-0 space-y-2 overflow-y-auto pr-1">
            {PANEL_ORDER.map((panel) => (
              <AgentSelector
                key={panel}
                panel={panel}
                active={panel === activePanel}
                onSelect={setActivePanel}
              />
            ))}
          </div>
        </aside>
      </div>

      <p className="mt-2 shrink-0 text-center font-mono-term text-[10px] tracking-wide text-ink/35 xl:text-xs">
        点击右侧军师可切换左侧对话流 · 底部按钮与官网 Chat 的报告/分析动作对齐
      </p>
    </section>
  );
}

function ChatBubble({ msg }: { msg: DemoMessage }) {
  return (
    <div
      className={`${msg.role === "user" ? "ml-auto" : "mr-auto"} animate-pitch-chat-in w-[min(100%,620px)]`}
    >
      {msg.role === "user" ? (
        <div className="rounded-[18px_18px_8px_18px] border-2 border-[#D4A574] bg-[#fff7ea] px-3.5 py-2.5 shadow-warm">
          <div className="text-right text-[10px] font-semibold uppercase tracking-wide text-ink/45">你</div>
          <p className="mt-1 whitespace-pre-wrap text-right text-[13px] leading-relaxed text-ink">
            {msg.content}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold text-ink/80">
            <span className="text-base leading-none">{PANEL_META[msg.agentKey ?? "compass"].icon}</span>
            <span>{PANEL_META[msg.agentKey ?? "compass"].name}</span>
            <span className="text-ink/45">· {PANEL_META[msg.agentKey ?? "compass"].cn}</span>
          </div>
          <div className="rounded-[18px_18px_18px_8px] border-2 border-cta/30 bg-[#fff8f7] px-3.5 py-2.5 shadow-warm ring-1 ring-cta/10">
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink/95">{msg.content}</p>
          </div>
        </>
      )}
    </div>
  );
}

function AgentSelector({
  panel,
  active,
  onSelect,
}: {
  panel: PanelKey;
  active: boolean;
  onSelect: (panel: PanelKey) => void;
}) {
  const meta = PANEL_META[panel];
  const isCompass = panel === "compass";
  const card = !isCompass ? CARD_BY_KEY[panel] : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(panel)}
      className={`w-full rounded-2xl border-2 px-3.5 py-3 text-left transition ${
        active
          ? "border-cta/55 bg-[#fff7f8] shadow-warm"
          : "border-ink/12 bg-paper/90 hover:border-ink/30 hover:bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none">{meta.icon}</span>
            <span className="font-mono-term text-sm font-bold text-ink">{meta.name}</span>
          </div>
          <p className="mt-1 truncate text-[11px] font-semibold text-ink/55">{meta.cn}</p>
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-ink/68">
            {isCompass ? COMPASS.role : card?.oneLiner}
        </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 font-mono-term text-[10px] ${
            active
              ? "border-cta/45 bg-cta/12 text-cta"
              : "border-ink/20 bg-ink/[0.04] text-ink/45"
          }`}
        >
          <span
            className={`inline-block size-1.5 rounded-full ${
              active ? "animate-dashboard-dot bg-cta" : "bg-ink/35"
            }`}
          />
          {active ? "演示中" : "待命"}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/[0.08]">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            active ? "w-[82%] bg-cta" : "w-[24%] bg-ink/25"
          }`}
        />
      </div>
    </button>
  );
}
