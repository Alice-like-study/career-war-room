"use client";

import { useEffect, useMemo, useState, type CSSProperties, type PointerEvent } from "react";

const NODES = [
  { cx: 150, cy: 86, en: "Prism", zh: "自我画像官", icon: "🔮" },
  { cx: 380, cy: 50, en: "Scope", zh: "行业匹配官", icon: "🔭" },
  { cx: 610, cy: 86, en: "Scalpel", zh: "简历医生", icon: "🔪" },
  { cx: 150, cy: 374, en: "Arena", zh: "模拟面试官", icon: "⚔️" },
  { cx: 380, cy: 410, en: "Balance", zh: "Offer 决策官", icon: "⚖️" },
  { cx: 610, cy: 374, en: "Lumen", zh: "情绪陪跑官", icon: "💡" },
] as const;

const HUB = { cx: 380, cy: 230 } as const;

const FLOW_DELAYS = [0, 0.4, 0.8, 1.2, 1.6, 2.0] as const;
const AGENT_BREATHE_DELAYS = [0, 0.6, 1.2, 1.8, 2.4, 3.0] as const;

const MONO_FULL = "sessions_send 派发 · file_share 回传 · context_inherit 继承上下文";
const MONO_MS_PER_CHAR = 30;

/** Compass 400ms + 200ms → 连线 500ms → Agent 弹出 */
const LINE_DRAW_DELAY_MS = 600;
const AGENT_POP_BASE_MS = 1100;
const AGENT_POP_STAGGER_MS = 80;
const AGENT_POP_DURATION_MS = 400;
const TYPEWRITER_EXTRA_MS = 200;

function lineD(node: (typeof NODES)[number]) {
  return `M${HUB.cx} ${HUB.cy} L${node.cx} ${node.cy}`;
}

function entranceLiveDelayMs(): number {
  const lastAgentDone =
    AGENT_POP_BASE_MS + (NODES.length - 1) * AGENT_POP_STAGGER_MS + AGENT_POP_DURATION_MS;
  const typewriterStart = lastAgentDone + TYPEWRITER_EXTRA_MS;
  return typewriterStart + MONO_FULL.length * MONO_MS_PER_CHAR + 200;
}

function ArchMonoLog({ live }: { live: boolean }) {
  const [charCount, setCharCount] = useState(0);
  const [typingDone, setTypingDone] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const typewriterStartMs = useMemo(() => {
    const lastAgentDone =
      AGENT_POP_BASE_MS + (NODES.length - 1) * AGENT_POP_STAGGER_MS + AGENT_POP_DURATION_MS;
    return lastAgentDone + TYPEWRITER_EXTRA_MS;
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (mq.matches) {
        setReducedMotion(true);
        setCharCount(MONO_FULL.length);
        setTypingDone(true);
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const startTimer = window.setTimeout(() => {
      let i = 0;
      const tick = window.setInterval(() => {
        i += 1;
        setCharCount(i);
        if (i >= MONO_FULL.length) {
          window.clearInterval(tick);
          setTypingDone(true);
        }
      }, MONO_MS_PER_CHAR);
      return () => window.clearInterval(tick);
    }, typewriterStartMs);
    return () => window.clearTimeout(startTimer);
  }, [typewriterStartMs, reducedMotion]);

  const visible = MONO_FULL.slice(0, charCount);

  if (!typingDone) {
    return <span className="arch-mono-log">{visible}</span>;
  }

  const parts = MONO_FULL.split("·");
  return (
    <span className="arch-mono-log">
      {parts.map((part, i) => (
        <span key={i}>
          {part.trimEnd()}
          {i < parts.length - 1 ? (
            <span
              className={`arch-mono-dot${live ? " arch-mono-dot--live" : ""}`}
              style={{ animationDelay: `${i * 0.5}s` }}
              aria-hidden
            >
              {" ·"}
            </span>
          ) : null}
        </span>
      ))}
    </span>
  );
}

interface CompassHubDiagramProps {
  live: boolean;
  hoveredIndex: number | null;
}

export function CompassHubDiagram({ live, hoveredIndex }: CompassHubDiagramProps) {
  return (
    <figure className="mx-auto w-full max-w-[1080px]" aria-label="作战指挥中心架构图">
      <svg viewBox="0 0 760 460" className="arch-diagram-svg h-auto w-full" role="img">
        <defs>
          <filter id="arch-hand" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.4" />
          </filter>
          <filter id="arch-dot-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 连接线 */}
        <g fill="none" strokeLinecap="round" filter="url(#arch-hand)">
          {NODES.map((n, i) => {
            const hovered = hoveredIndex === i;
            return (
              <path
                key={n.en}
                d={lineD(n)}
                pathLength={1}
                className={`arch-line-path arch-line-path--draw${hovered ? " arch-line-path--hover" : ""}`}
                style={{ animationDelay: `${LINE_DRAW_DELAY_MS}ms` }}
              />
            );
          })}
        </g>

        {/* 信号光点（连线之上、节点之下） */}
        {live
          ? NODES.map((n, i) => (
              <circle
                key={`dot-${n.en}-${hoveredIndex === i ? "fast" : "normal"}`}
                r="3"
                fill="#7B1E22"
                filter="url(#arch-dot-glow)"
                opacity={0.9}
              >
                <animateMotion
                  dur={hoveredIndex === i ? "1.2s" : "2.5s"}
                  repeatCount="indefinite"
                  path={lineD(n)}
                  begin={`${FLOW_DELAYS[i]}s`}
                />
              </circle>
            ))
          : null}

        {/* 6 位军师 */}
        {NODES.map((n, i) => {
          const hovered = hoveredIndex === i;
          const dx = HUB.cx - n.cx;
          const dy = HUB.cy - n.cy;
          return (
            <g key={n.en} transform={`translate(${n.cx}, ${n.cy})`}>
              <g
                className={`arch-agent-node${live ? " arch-agent-node--live" : ""}`}
                style={
                  {
                    ["--arch-dx" as string]: dx,
                    ["--arch-dy" as string]: dy,
                    ["--arch-breathe-delay" as string]: `${AGENT_BREATHE_DELAYS[i]}s`,
                  } as CSSProperties
                }
              >
                <g
                  className="arch-agent-motion"
                  style={{ animationDelay: `${AGENT_POP_BASE_MS + i * AGENT_POP_STAGGER_MS}ms` }}
                >
                  <g className={`arch-agent-body${hovered ? " arch-agent-body--hover" : ""}`}>
                    <circle
                      className="arch-agent-ring"
                      r="46"
                      fill="#FFFBF5"
                      stroke="#3D2817"
                      strokeWidth="2.4"
                    />
                    <text y={-12} textAnchor="middle" fontSize="22" pointerEvents="none">
                      {n.icon}
                    </text>
                    <text
                      y={10}
                      textAnchor="middle"
                      fill="#3D2817"
                      fontSize="14"
                      fontWeight="700"
                      pointerEvents="none"
                      style={{ fontFamily: "JetBrains Mono, monospace" }}
                    >
                      {n.en}
                    </text>
                    <text
                      y={27}
                      textAnchor="middle"
                      fill="#3D2817"
                      fontSize="11"
                      fontWeight="600"
                      pointerEvents="none"
                      style={{ fontFamily: "Noto Serif SC, serif" }}
                    >
                      {n.zh}
                    </text>
                  </g>
                </g>
              </g>
            </g>
          );
        })}

        {/* 中心 Compass（置于节点之上） */}
        <g transform={`translate(${HUB.cx}, ${HUB.cy})`}>
          <g className="arch-compass-hub">
            <circle className="arch-compass-core" r="68" fill="#FFFBF5" stroke="#C41E3A" strokeWidth="3" />
            <circle
              className={`arch-compass-ring${live ? " arch-compass-ring--live" : ""}`}
              r="60"
              fill="none"
              stroke="#C41E3A"
              strokeWidth="1.2"
            />
            <g className="arch-compass-labels" pointerEvents="none">
              <text y={-14} textAnchor="middle" fontSize="34">
                🧭
              </text>
              <text
                y={16}
                textAnchor="middle"
                fill="#C41E3A"
                fontSize="17"
                fontWeight="700"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                Compass
              </text>
              <text
                y={36}
                textAnchor="middle"
                fill="#3D2817"
                fontSize="12"
                fontWeight="600"
                opacity={0.7}
                style={{ fontFamily: "Noto Serif SC, serif" }}
              >
                领航官 · 总指挥
              </text>
            </g>
          </g>
        </g>

        {/* 悬停热区 */}
        {NODES.map((n, i) => (
          <circle
            key={`hit-${n.en}`}
            cx={n.cx}
            cy={n.cy}
            r="52"
            fill="transparent"
            className="arch-agent-hit"
            data-agent-index={i}
          />
        ))}
      </svg>
    </figure>
  );
}

export function SlideArchitecture() {
  const [live, setLive] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setLive(true);
      return;
    }
    const t = window.setTimeout(() => setLive(true), entranceLiveDelayMs());
    return () => window.clearTimeout(t);
  }, []);

  const onDiagramPointer = (e: PointerEvent<HTMLDivElement>) => {
    const target = (e.target as Element).closest("[data-agent-index]");
    if (!target) {
      setHoveredIndex(null);
      return;
    }
    const idx = Number.parseInt(target.getAttribute("data-agent-index") ?? "", 10);
    setHoveredIndex(Number.isNaN(idx) ? null : idx);
  };

  return (
    <section className="paper-texture flex h-full w-full flex-col items-center justify-center px-12 py-10">
      <header className="shrink-0 text-center">
        <p className="font-mono-term text-xs tracking-[0.3em] text-ink/40">SYSTEM ARCHITECTURE</p>
        <h2 className="mt-2 text-2xl font-bold text-ink xl:text-3xl">作战指挥中心 · 架构总览</h2>
      </header>

      <div
        className="arch-diagram-wrap mt-2 flex w-full max-w-6xl flex-1 flex-col items-center justify-center"
        onPointerMove={onDiagramPointer}
        onPointerLeave={() => setHoveredIndex(null)}
      >
        <CompassHubDiagram live={live} hoveredIndex={hoveredIndex} />
      </div>

      <div className="shrink-0 text-center">
        <p className="text-lg font-semibold text-ink/75 xl:text-xl">
          1 总指挥 + 6 Agent · 协作完成应届生求职全流程
        </p>
        <p className="mt-1.5 font-mono-term text-[11px] text-ink/40 xl:text-xs">
          <ArchMonoLog live={live} />
        </p>
      </div>
    </section>
  );
}
