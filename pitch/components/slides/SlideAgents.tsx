"use client";

import { useState } from "react";
import { AGENT_CARDS, AGENT_SAMPLE_OUTPUTS, type AgentKey } from "@/pitch/lib/agents-data";

export function SlideAgents() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<AgentKey>(AGENT_CARDS[0].key);
  const selectedAgent = AGENT_CARDS.find((agent) => agent.key === selected) ?? AGENT_CARDS[0];
  const selectedSamples = AGENT_SAMPLE_OUTPUTS[selectedAgent.key];
  const capabilityList = selectedAgent.methodology
    .split("，")
    .slice(0, 3)
    .map((item) => item.replace(/。/g, "").trim())
    .filter(Boolean);

  return (
    <section className="paper-texture flex h-full w-full flex-col px-8 py-8 xl:px-10">
      <header className="shrink-0 text-center">
        <h2 className="text-2xl font-bold text-ink xl:text-3xl">6 位专职 Agent · 各有绝活</h2>
        <p className="mt-2 text-sm text-ink/55">点击左侧卡片，右侧查看详细作战机制</p>
      </header>

      <div className="mt-5 grid min-h-0 flex-1 grid-cols-[1.25fr_0.95fr] gap-4 xl:gap-5">
        <div className="grid min-h-0 grid-cols-2 grid-rows-3 gap-3 xl:gap-4">
          {AGENT_CARDS.map((agent) => {
            const isHovered = hovered === agent.key;
            const isSelected = selected === agent.key;
            return (
              <article
                key={agent.key}
                onMouseEnter={() => setHovered(agent.key)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(agent.key)}
                className={`relative flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-paper shadow-card transition-all duration-200 ${
                  isSelected
                    ? "border-[#8b2c2c] shadow-[8px_10px_0_rgba(139,44,44,0.2)]"
                    : "border-[#c9a876]"
                } ${isHovered ? "z-10 scale-[1.02]" : ""}`}
              >
                <div className="flex items-center gap-3 border-b border-[#d4b690] px-4 py-2.5">
                  <span className="text-2xl">{agent.icon}</span>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-ink">
                      <span className="font-mono-term">{agent.name}</span> · {agent.cn.split(" · ")[1] ?? agent.cn}
                    </h3>
                    <p className="truncate text-xs italic text-ink/60">{agent.oneLiner}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 px-4 py-2">
                  {agent.keywords.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#8b2c2c]/60 px-2 py-0.5 font-mono-term text-[10px] text-[#8b2c2c]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="px-4 py-1.5 font-mono-term text-[11px] text-ink/55">人设：{agent.personaKeywords}</p>

                <div className="mt-auto border-t border-[#d4b690] bg-[#f7efe1] px-4 py-1.5">
                  <p className="font-mono-term text-[10px] text-ink/50">
                    {isSelected ? "已选中，右侧查看完整详情" : "点击打开右侧抽屉"}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="min-h-0 overflow-hidden rounded-2xl border-2 border-[#c9a876] bg-paper shadow-card">
          <div className="border-b border-[#d4b690] bg-[#f7efe1] px-5 py-4">
            <p className="font-mono-term text-xs tracking-[0.2em] text-ink/45">AGENT DRAWER</p>
            <h3 className="mt-1 text-xl font-bold text-ink">
              {selectedAgent.icon} <span className="font-mono-term">{selectedAgent.name}</span> ·{" "}
              {selectedAgent.cn.split(" · ")[1] ?? selectedAgent.cn}
            </h3>
            <p className="mt-1 text-sm italic text-ink/65">{selectedAgent.oneLiner}</p>
          </div>

          <div className="h-full min-h-0 space-y-3 overflow-y-auto px-5 py-4">
            <div className="rounded-lg border border-[#d4b690] bg-[#fffaf2] px-3.5 py-3">
              <p className="text-xs font-bold tracking-wide text-[#8b2c2c]">角色定位</p>
              <p className="mt-1.5 text-sm text-ink/80">{selectedAgent.personaKeywords}</p>
            </div>

            <div className="rounded-lg border border-[#d4b690] bg-[#fffaf2] px-3.5 py-3">
              <p className="text-xs font-bold tracking-wide text-[#8b2c2c]">能干什么</p>
              <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-ink/85">
                {capabilityList.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedAgent.keywords.map((tag) => (
                  <span
                    key={`drawer-${tag}`}
                    className="rounded-full border border-ink/20 bg-paper px-2 py-0.5 font-mono-term text-[10px] text-ink/65"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[#d4b690] bg-[#fffaf2] px-3.5 py-3">
              <p className="text-xs font-bold tracking-wide text-[#8b2c2c]">方法论</p>
              <p className="mt-2 text-sm leading-relaxed text-ink/85">{selectedAgent.methodology}</p>
            </div>

            <div className="rounded-lg border border-[#c9a876] bg-[#f7efe1] px-3.5 py-3">
              <p className="font-mono-term text-[10px] tracking-[0.18em] text-[#8b2c2c]/70">SAMPLE OUTPUTS</p>
              <div className="mt-2 space-y-2">
                {selectedSamples.map((sample) => (
                  <p key={sample} className="text-xs leading-relaxed text-ink/85">
                    · {sample}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
