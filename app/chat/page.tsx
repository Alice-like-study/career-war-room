"use client";



/**

 * 「应届生求职作战部 · 作战室」—— 左栏对话 + 右栏军师状态，

 * SOUL：Compass（总指挥）+ 当前军师；流式正文解析 [Agent] 前缀调度 UI。

 */



import Link from "next/link";

import { useCallback, useEffect, useRef, useState } from "react";



import ReactMarkdown from "react-markdown";



import remarkGfm from "remark-gfm";



import { AGENTS, type AgentKey } from "@/lib/agents";



/**

 * 与页面外层 `pt-8` + `pb-12` 对齐：左栏对话卡总高度 = 视口高度减去垂直留白，

 * 避免消息增多时整块被内容撑长。

 */

const LEFT_CHAT_PANEL_HEIGHT = "calc(100vh - 5rem)";



/** 右栏卡片顺序（与需求一致） */

const PANEL_ORDER: AgentKey[] = [

  "compass",

  "prism",

  "scope",

  "scalpel",

  "arena",

  "balance",

  "lumen",

];



/** 《校招作战地图》专用 system：与日常对话的 buildWarRoomSystem 完全分离 */

const BATTLE_MAP_SYSTEM_PROMPT = `你是 Compass 总指挥。请根据以上完整对话内容，整合6位军师的分析，

生成一份《个人校招作战地图》。严格用以下 Markdown 结构输出，不要有多余的话：



# 🗺 你的校招作战地图



## 📍 一句话画像

[基于对话提炼一句精准的定位句]



## 🔥 核心驱动力

1. [驱动力1]

2. [驱动力2]

3. [驱动力3]



## 💪 能力长板 Top3

1. **[能力名]**：[一句话说明 + 对话中的证据]

2. **[能力名]**：[一句话说明 + 对话中的证据]

3. **[能力名]**：[一句话说明 + 对话中的证据]



## ⚠️ 当前求职短板

1. [短板 + 改进建议]

2. [短板 + 改进建议]



## 🎯 推荐赛道 Top3

1. **[赛道名]**：[为什么适合 + 起步方向]

2. **[赛道名]**：[为什么适合 + 起步方向]

3. **[赛道名]**：[为什么适合 + 起步方向]



## 📅 本周立即行动

1. [今天就能做的第一步]

2. [本周内完成的第二步]

3. [面试/投递前必须做的第三步]



---

*由应届生求职作战部 · 7位AI军师协作生成*



语气：温暖、精准、不废话。所有内容必须基于上面的真实对话，不要编造。

如果对话信息不足，就基于已有信息合理推断，但不要写空话套话。`;



/** 下载文件名中的日期：YYYY-MM-DD（本地时区） */

function formatMapDownloadDate(d = new Date()) {

  const y = d.getFullYear();

  const mo = String(d.getMonth() + 1).padStart(2, "0");

  const da = String(d.getDate()).padStart(2, "0");

  return `${y}-${mo}-${da}`;

}



/** 「[括号内名字]」→ AgentKey（不区分大小写） */

const NAME_TO_AGENT: Record<string, AgentKey> = {

  compass: "compass",

  prism: "prism",

  scope: "scope",

  scalpel: "scalpel",

  arena: "arena",

  balance: "balance",

  lumen: "lumen",

};



/** 每条消息的稳定 id（避免索引当 key） */

let nextMsgId = 1;



type UserBubble = {

  role: "user";

  id: number;

  content: string;

};



type AssistantBubble = {

  role: "assistant";

  id: number;

  /** 当前气泡对应的军师（最终以流结束时的解析为准，流中用临时解析预览） */

  agentKey: AgentKey;

  /** 展示给用户的内容（去掉 [Agent] 前缀后） */

  content: string;

};



type UiMessage = UserBubble | AssistantBubble;



/** 是否在流式过程中「像」正在解析开头标签：[... 尚未闭环 */

function splitLeadingAgentTag(raw: string):

  | { kind: "pending" }

  | { kind: "plain"; display: string }

  | { kind: "tag"; agentKey: AgentKey; display: string } {

  if (!raw.startsWith("[")) {

    return { kind: "plain", display: raw };

  }



  const closeIdx = raw.indexOf("]");

  if (closeIdx === -1) {

    /** 容错：前缀过长基本可以判定不是合法的短标签头，直接整段当成正文展示 */

    if (raw.length > 48) {

      return { kind: "plain", display: raw };

    }

    return { kind: "pending" };

  }



  const inner = raw.slice(1, closeIdx).trim().toLowerCase();

  const rest = raw.slice(closeIdx + 1).replace(/^\s+/, "");

  const key = NAME_TO_AGENT[inner];

  if (!key) {

    return { kind: "plain", display: raw };

  }

  return { kind: "tag", agentKey: key, display: rest };

}



/** 拼接发送到 /api/chat 的 system（总指挥常驻 + 当前军师 SOUL） */

function buildWarRoomSystem(agent: AgentKey) {

  return `${AGENTS.compass.soul}\n\n【当前出场军师】\n${AGENTS[agent].soul}`;

}



/** `/api/chat` 非 2xx 且返回整页 HTML（如 404）时，避免把源码全文塞进错误栏 */

function shortApiFailureMessage(status: number, bodyText: string): string {

  const t = bodyText.trim();

  if (

    !t ||

    /<![Dd][Oo][Cc][Tt][Yy][Pp][Ee]\s+[Hh][Tt][Mm][Ll]/.test(t) ||

    /^<\s*html\b/i.test(t)

  ) {

    return `服务端接口不可用（HTTP ${status}）。Vercel 部署请使用默认 Next 构建（勿设 output: 'export'），并配置 KIMI_API_KEY。`;

  }

  const flat = t.replace(/\s+/g, " ");

  return flat.length <= 280 ? flat : `${flat.slice(0, 280)}…`;

}



/** 优先解析 /api/chat 返回的 JSON `{ error }`，否则再走 HTML/纯文本兜底 */

async function explainApiFailure(res: Response): Promise<string> {

  const text = await res.text().catch(() => "");

  const ct = res.headers.get("content-type") ?? "";

  if (ct.includes("application/json")) {

    try {

      const j = JSON.parse(text) as { error?: unknown };

      if (typeof j.error === "string" && j.error.trim()) return j.error.trim();

    } catch {

      /* 使用下方兜底 */

    }

  }

  return shortApiFailureMessage(res.status, text) || `请求失败（${res.status}）`;

}



/** 军师完成一段话后的小字交接提示（学习用占位：按流程下一棒） */

function handoffSubtitle(key: AgentKey): string {

  switch (key) {

    case "compass":

      return "总指挥待命：可随时重新分诊下一步";

    case "prism":

      return "画像小结已就位，可随时进入行业匹配";

    case "scope":

      return "方向清单已就位，可随时进入简历手术台";

    case "scalpel":

      return "多版简历就绪，可随时进入模拟面试";

    case "arena":

      return "模面小节已就位，总指挥可总结或继续演练";

    case "balance":

      return "加权表已就位，总指挥可收口或复核权重";

    case "lumen":

      return "陪伴小节已就位，流程回到总指挥节拍";

    default:

      return "本环节小节已完成";

  }

}



export default function ChatPage() {

  const WELCOME_TEXT =

    "你好，我是你的求职总指挥。接下来我会按你的卡点调度各专业军师——从最重要的一件事开始。你现在最想先搞定哪一环？";



  const [messages, setMessages] = useState<UiMessage[]>(() => [

    {

      role: "assistant",

      id: 0,

      agentKey: "compass",

      content: WELCOME_TEXT,

    },

  ]);



  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);



  /** 当前线程里「最近一次确认发言的军师」（由流结束或确定性解析写入） */

  const [currentAgent, setCurrentAgent] = useState<AgentKey>("compass");

  /** 已经完整结束过一回合发言的军师（会话内标记为「已完成」，用于徽章） */

  const [completedAgents, setCompletedAgents] = useState<Set<AgentKey>>(() => new Set());

  /** 最近一次回合结束后，谁在卡片下展示交接小字（可随下一次完成而更替） */

  const [panelHandoff, setPanelHandoff] = useState<{ key: AgentKey; text: string } | null>(null);



  /**

   * 流式缓冲区原文（含未完成标签），供渲染层判断光标（pending）

   */

  const streamRawRef = useRef("");



  /**

   * 同步 ref：这一轮里「谁在说话」（避免 setState 异步导致 map 读到旧 streamingAgent）。

   * 起始值在发送时设为当时的 currentAgent，收到 `[Name]` 后再覆盖。

   */

  const streamingSpeakerRef = useRef<AgentKey>("compass");



  /** 右栏徽章 / 光圈用：与 ref 对齐，仅在流式中用 setState 触发重绘 */

  const [streamingAgent, setStreamingAgent] = useState<AgentKey | null>(null);



  /** 作战地图抽屉：是否挂载到 DOM（负责入场/退场动画） */

  const [mapOverlayMounted, setMapOverlayMounted] = useState(false);

  /** 作战地图抽屉：淡入 + 右滑是否到位 */

  const [mapAnimIn, setMapAnimIn] = useState(false);

  /** 作战地图：独立 loading，与对话 loading 分离，避免互相干扰 */

  const [mapGenLoading, setMapGenLoading] = useState(false);

  const [battleMapMarkdown, setBattleMapMarkdown] = useState("");

  const [mapGenError, setMapGenError] = useState<string | null>(null);

  /** 「复制全文」后的短暂文案反馈 */

  const [mapCopyFeedback, setMapCopyFeedback] = useState<string | null>(null);

  const mapCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mapCopyFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);



  /** 中间消息滚动容器 */

  const listRef = useRef<HTMLDivElement>(null);

  /** 列表底部锚点：`scrollIntoView` 驱动内部滚动到位 */

  const listEndRef = useRef<HTMLDivElement>(null);



  /** 抽屉挂上 DOM 后：双 requestAnimationFrame 再打开 animIn，首帧会先 paint「未入场」再做滑入+淡入过渡 */

  useEffect(() => {

    if (!mapOverlayMounted) return;

    setMapAnimIn(false);

    let outer = 0;

    let inner = 0;

    outer = requestAnimationFrame(() => {

      inner = requestAnimationFrame(() => {

        setMapAnimIn(true);

      });

    });

    return () => {

      cancelAnimationFrame(outer);

      cancelAnimationFrame(inner);

    };

  }, [mapOverlayMounted]);



  /** 组件卸载：清掉抽屉与复制文案的延时，杜绝内存泄漏 */

  useEffect(() => {

    return () => {

      if (mapCloseTimerRef.current) clearTimeout(mapCloseTimerRef.current);

      if (mapCopyFeedbackTimerRef.current) clearTimeout(mapCopyFeedbackTimerRef.current);

    };

  }, []);



  const scrollToBottom = useCallback(() => {

    requestAnimationFrame(() => {

      const list = listRef.current;

      if (list) {

        list.scrollTop = list.scrollHeight;

      }

      listEndRef.current?.scrollIntoView({

        behavior: "smooth",

        block: "end",

        inline: "nearest",

      });

    });

  }, []);



  /** 关闭作战地图：先退场动画再卸载挂载 */

  const closeBattleMapDrawer = useCallback(() => {

    setMapAnimIn(false);

    if (mapCloseTimerRef.current) clearTimeout(mapCloseTimerRef.current);

    mapCloseTimerRef.current = setTimeout(() => {

      setMapOverlayMounted(false);

      mapCloseTimerRef.current = null;

    }, 300);

  }, []);



  /** 点击醒目按钮后的主流程：同一条 /api/chat 流式链路，只用另一套专用 system prompt */

  const handleGenerateBattleMap = useCallback(async () => {

    if (mapGenLoading) return;

    if (mapCloseTimerRef.current) {

      clearTimeout(mapCloseTimerRef.current);

      mapCloseTimerRef.current = null;

    }

    setMapOverlayMounted(true);

    setBattleMapMarkdown("");

    setMapGenError(null);

    setMapGenLoading(true);



    const apiMessages = messages.map((m) => ({

      role: m.role,

      content: m.content,

    }));



    try {

      const res = await fetch("/api/chat", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          system: BATTLE_MAP_SYSTEM_PROMPT,

          messages: apiMessages,

        }),

      });



      if (!res.ok) {

        throw new Error(await explainApiFailure(res));

      }



      const reader = res.body?.getReader();

      if (!reader) throw new Error("无法读取生成流");



      const decoder = new TextDecoder();

      let accumulated = "";



      while (true) {

        const { done, value } = await reader.read();

        if (done) break;

        accumulated += decoder.decode(value, { stream: true });

        setBattleMapMarkdown(accumulated);

      }

    } catch (err) {

      setMapGenError(

        err instanceof Error ? err.message : "生成作战地图出错，请稍后重试",

      );

    } finally {

      setMapGenLoading(false);

    }

  }, [mapGenLoading, messages]);



  /** 复制 Markdown 正文到剪贴板 */

  const handleCopyBattleMap = useCallback(async () => {

    if (!battleMapMarkdown.trim()) return;

    try {

      await navigator.clipboard.writeText(battleMapMarkdown);

      setMapCopyFeedback("已复制✓");

      if (mapCopyFeedbackTimerRef.current) clearTimeout(mapCopyFeedbackTimerRef.current);

      mapCopyFeedbackTimerRef.current = setTimeout(() => {

        setMapCopyFeedback(null);

        mapCopyFeedbackTimerRef.current = null;

      }, 2000);

    } catch {

      setMapCopyFeedback("复制失败");

      mapCopyFeedbackTimerRef.current = setTimeout(() => {

        setMapCopyFeedback(null);

        mapCopyFeedbackTimerRef.current = null;

      }, 2000);

    }

  }, [battleMapMarkdown]);



  /** 下载 UTF-8 纯文本 · 文件名带当日日期 */

  const handleDownloadBattleMap = useCallback(() => {

    if (!battleMapMarkdown.trim()) return;

    const blob = new Blob([battleMapMarkdown], {

      type: "text/plain;charset=utf-8",

    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = `校招作战地图_${formatMapDownloadDate()}.txt`;

    a.click();

    URL.revokeObjectURL(url);

  }, [battleMapMarkdown]);



  /** 推导面板里某军师的状态徽标语义 */

  const cardStateFor = useCallback(

    (key: AgentKey): "idle" | "busy" | "done" => {

      if (loading && streamingAgent === key) return "busy";

      if (completedAgents.has(key)) return "done";

      return "idle";

    },

    [loading, streamingAgent, completedAgents],

  );



  /** 当前「激活」用于暗红光圈：仅工作中 */

  const isActiveGlow = useCallback(

    (key: AgentKey) => loading && streamingAgent === key,

    [loading, streamingAgent],

  );



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    const text = input.trim();

    if (!text || loading) return;



    const userBubble: UiMessage = { role: "user", id: nextMsgId++, content: text };

    const prev = messages.concat(userBubble);



    setInput("");

    setError(null);

    setMessages(prev);

    setLoading(true);



    streamingSpeakerRef.current = currentAgent;

    setStreamingAgent(currentAgent);



    streamRawRef.current = "";



    const assistantDraftId = nextMsgId++;

    const nextWithPlaceholder: UiMessage[] = [

      ...prev,

      { role: "assistant", id: assistantDraftId, agentKey: currentAgent, content: "" },

    ];



    try {

      const res = await fetch("/api/chat", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          system: buildWarRoomSystem(currentAgent),

          messages: prev.map((m) => ({

            role: m.role,

            content: m.content,

          })),

        }),

      });



      if (!res.ok) {

        throw new Error(await explainApiFailure(res));

      }



      const reader = res.body?.getReader();

      if (!reader) throw new Error("无法读取回复流");



      setMessages(nextWithPlaceholder);



      const decoder = new TextDecoder();

      let raw = "";



      while (true) {

        const { done, value } = await reader.read();

        if (done) break;

        raw += decoder.decode(value, { stream: true });

        streamRawRef.current = raw;



        const p = splitLeadingAgentTag(raw);

        let display = "";

        let speakerKey = streamingSpeakerRef.current;



        if (p.kind === "pending") {

          /** 开头标签括号未闭环：暂不展示正文，只显示呼吸光标 */

          display = "";

        } else if (p.kind === "plain") {

          display = p.display;

        } else {

          /** 规范 [Agent]：更新「发言者」，并剥离前缀正文 */

          speakerKey = p.agentKey;

          streamingSpeakerRef.current = speakerKey;

          setStreamingAgent(speakerKey);

          setCurrentAgent(speakerKey);

          display = p.display;

        }



        setMessages((list) =>

          list.map((m) => {

            if (m.id !== assistantDraftId || m.role !== "assistant") return m;

            return { ...m, agentKey: speakerKey, content: display };

          }),

        );

        scrollToBottom();

      }



      /** 流结束：最终态落盘 + 标记「已完成」+ 交接小字 */

      const final = splitLeadingAgentTag(raw);

      let finalKey: AgentKey = streamingSpeakerRef.current;

      let finalDisplay = raw;

      if (final.kind === "tag") {

        finalKey = final.agentKey;

        finalDisplay = final.display;

      } else if (final.kind === "plain") {

        finalDisplay = final.display;

        finalKey = streamingSpeakerRef.current;

      } else {

        /** pending 结束前不应出现；若出现则整块原文兜底 */

        finalDisplay = raw;

        finalKey = streamingSpeakerRef.current;

      }



      setCurrentAgent(finalKey);

      streamingSpeakerRef.current = finalKey;

      setStreamingAgent(null);



      setCompletedAgents((prevSet) => {

        const n = new Set(prevSet);

        n.add(finalKey);

        return n;

      });

      setPanelHandoff({ key: finalKey, text: handoffSubtitle(finalKey) });



      setMessages((list) =>

        list.map((m) =>

          m.id === assistantDraftId && m.role === "assistant"

            ? { ...m, agentKey: finalKey, content: finalDisplay }

            : m,

        ),

      );

    } catch (err) {

      setError(err instanceof Error ? err.message : "发送失败，请稍后重试");

      setMessages(prev);

      setStreamingAgent(null);

    } finally {

      streamRawRef.current = "";

      setLoading(false);

      scrollToBottom();

    }

  };



  /** 回车发送，Shift+Enter 换行 */

  const onKeyDownArea = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {

    if (e.key !== "Enter") return;

    if (e.shiftKey) return;

    e.preventDefault();

    /** 直接在原生层触发表单校验：等价于手动 handleSubmit（保持 loading 防抖一致） */

    const form = (e.target as HTMLElement).closest("form");

    form?.requestSubmit();

  };



  const subtitleForCard = useCallback(

    (key: AgentKey) => {

      if (panelHandoff && panelHandoff.key === key && !loading) {

        return panelHandoff.text;

      }

      return null;

    },

    [panelHandoff, loading],

  );



  return (

    <div className="relative min-h-screen px-6 pb-12 pt-8 font-serif text-ink selection:bg-cta/20">

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(196,30,58,0.07),transparent_55%)]" />



      <div className="relative mx-auto flex w-full max-w-[1400px] flex-row items-stretch gap-6">

        {/* ═══════════════════ 左侧 60%：对话 ═══════════════════ */}

        <section

          className="paper-texture marker-border flex min-h-[28rem] w-[60%] max-w-[60%] flex-col overflow-hidden shadow-card transition-shadow duration-300"

          style={{ height: LEFT_CHAT_PANEL_HEIGHT, maxHeight: LEFT_CHAT_PANEL_HEIGHT }}

        >

          <header className="flex shrink-0 items-center justify-between border-b border-ink/10 bg-paper/60 px-5 py-4">

            <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">

              应届生求职作战部 · 作战室

            </h1>

            <Link

              href="/"

              className="marker-border-soft shrink-0 px-4 py-2 text-sm font-bold shadow-warm transition hover:bg-paper"

            >

              ← 返回官网

            </Link>

          </header>



          <div

            ref={listRef}

            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-5 py-4"

            aria-live="polite"

          >

            {messages.map((m) => {

              const tail = messages[messages.length - 1];

              const isLastAi =

                m.role === "assistant" && tail?.role === "assistant" && tail.id === m.id;



              return m.role === "user" ? (

                <div

                  key={m.id}

                  className="animate-warroom-msg-in ml-auto w-[min(100%,520px)]"

                >

                  <div className="rounded-[20px_20px_6px_20px] border-2 border-[#D4A574] bg-[#fff7ea] px-4 py-3 shadow-warm">

                    <div className="text-right">

                      <span className="text-xs font-semibold uppercase tracking-wide text-ink/45">

                        你

                      </span>

                    </div>

                    <p className="mt-1 whitespace-pre-wrap text-right text-sm leading-relaxed text-ink md:text-[15px]">

                      {m.content}

                    </p>

                  </div>

                </div>

              ) : (

                <div

                  key={m.id}

                  className="animate-warroom-msg-in mr-auto w-[min(100%,620px)]"

                >

                  {/** AI 气泡上方的军师条：图标 + 英文名 + 中文角色 */}

                  <div className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-ink/80">

                    <span className="text-lg leading-none">{AGENTS[m.agentKey].icon}</span>

                    <span>{AGENTS[m.agentKey].name}</span>

                    <span className="text-ink/50">· {AGENTS[m.agentKey].cn}</span>

                  </div>



                  <div className="rounded-[20px_20px_20px_6px] border-2 border-cta/30 bg-[#fff8f7] px-4 py-3 shadow-warm ring-1 ring-cta/10 transition-[border-color,box-shadow] duration-300">

                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/95 md:text-[15px]">

                      {m.content}

                      {/** 流式未完成：末尾闪烁块光标（pending 时正文为空也会显示） */}

                      {loading && isLastAi ? (

                        <span

                          className="animate-warroom-caret ml-0.5 inline text-cta"

                          aria-hidden

                        >

                          ▋

                        </span>

                      ) : null}

                    </p>

                  </div>

                </div>

              );

            })}

            <div ref={listEndRef} className="h-px shrink-0" aria-hidden />

          </div>



          {error && (

            <div className="shrink-0 border-t border-ink/10 bg-[#fff0f2] px-5 py-2 text-sm font-semibold text-cta">

              {error}

            </div>

          )}



          {/** 会话 ≥6 条后：输入框上方的呼吸灯 CTA */}
          {messages.length >= 6 && (

            <div className="shrink-0 border-t border-[#e8dfd0] bg-gradient-to-br from-[#fffbf2] via-[#fffaf5] to-[#fef6f8] px-5 py-3">

              <button

                type="button"

                onClick={handleGenerateBattleMap}

                disabled={mapGenLoading}

                className={`relative mx-auto flex w-full max-w-[520px] items-center justify-center rounded-2xl border-2 border-cta/45 bg-[#fffdf9] px-5 py-3.5 text-center text-[15px] font-bold tracking-tight text-ink shadow-warm outline-none ring-cta/20 transition hover:border-cta/70 hover:bg-paper hover:brightness-[1.015] md:text-[15.5px] ${

                  mapGenLoading

                    ? "cursor-wait ring-4 ring-cta/30"

                    : "animate-battle-map-breathe cursor-pointer active:translate-y-px"

                } disabled:animate-none disabled:cursor-not-allowed disabled:opacity-55`}

              >

                {mapGenLoading ? "⚙ 作战部整合中…" : "🗺 生成我的《校招作战地图》"}

              </button>

              <p className="mx-auto mt-2 max-w-[520px] text-center text-[11.5px] font-semibold leading-snug text-ink/43">

                基于当前会话 · 附带专用 system 全文提交 /api/chat · 抽屉内 Markdown 流式渲染

              </p>

            </div>

          )}



          <form

            onSubmit={handleSubmit}

            className="shrink-0 border-t-2 border-ink/10 bg-cream/95 p-5"

          >

            <label htmlFor="chat-input-warroom" className="sr-only">

              作战室输入

            </label>

            <div className="flex flex-col gap-3 md:flex-row md:items-end">

              <textarea

                id="chat-input-warroom"

                rows={3}

                value={input}

                onChange={(e) => setInput(e.target.value)}

                onKeyDown={onKeyDownArea}

                placeholder="SHIFT + 回车 换行；回车发送"

                disabled={loading}

                className="min-h-[104px] flex-1 resize-y rounded-xl border-2 border-ink/20 bg-paper px-4 py-3 text-[15px] font-semibold text-ink placeholder:text-ink/40 focus:border-[#D4A574] focus:outline-none focus:ring-2 focus:ring-[#D4A574]/35 disabled:opacity-55"

              />

              <button

                type="submit"

                disabled={loading || !input.trim()}

                className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-full bg-cta px-10 text-[15px] font-bold text-white shadow-[3px_4px_0_rgba(61,40,23,0.15)] transition duration-150 hover:brightness-105 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-48"

              >

                {loading ? "作战部回应中…" : "发送"}

              </button>

            </div>

          </form>

        </section>



        {/* ═══════════════════ 右侧 40%：作战部面板 ═══════════════════ */}

        <aside className="flex min-h-0 w-[40%] min-w-[280px] flex-col gap-4 overflow-hidden">

          <div className="paper-texture marker-border-soft px-5 py-4 shadow-card transition-shadow duration-300">

            <div className="flex items-center gap-2">

              <span

                className="animate-warroom-live-dot inline-block size-2 rounded-full bg-cta"

                aria-hidden

              />

              <span className="text-sm font-bold tracking-wide text-ink">

                <span className="text-cta">LIVE</span>

                <span className="text-ink/35"> · </span>

                作战部正在为你工作

              </span>

            </div>

            <p className="mt-2 text-[13px] font-semibold leading-relaxed text-ink/58">

              右侧为七位军师实况；总指挥 Compass 常驻调度节奏。

            </p>

          </div>



          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">

            {PANEL_ORDER.map((key) => {

              const meta = AGENTS[key];

              const state = cardStateFor(key);

              const active = isActiveGlow(key);



              const done = state === "done";

              const busy = state === "busy";



              return (

                <div

                  key={key}

                  className={`paper-texture relative overflow-hidden rounded-2xl border-2 px-4 py-3 shadow-warm transition-all duration-500 ease-out ${

                    busy

                      ? "border-cta/70 bg-[#fff4f6] shadow-[0_0_0_1px_rgba(196,30,58,0.35)] ring-4 ring-cta/20"

                      : done

                        ? "border-emerald-600/40 bg-emerald-50/40"

                        : "border-ink/15 bg-paper"

                  }`}

                >

                  {active ? (

                    <span className="pointer-events-none absolute inset-0 animate-warroom-pulse-ring rounded-2xl border-2 border-cta/25" />

                  ) : null}



                  <div className="relative flex items-center gap-3">

                    <div className="text-2xl leading-none">{meta.icon}</div>

                    <div className="min-w-0 flex-1">

                      <div className="flex flex-wrap items-baseline gap-x-2">

                        <span className="truncate text-[15px] font-bold">{meta.name}</span>

                        <span className="text-[13px] font-semibold text-ink/60">{meta.cn}</span>

                      </div>



                      {/* 徽章：待命 / 工作中 / 已完成 */}

                      <div className="mt-2">

                        <span

                          className={`inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-bold tracking-wide transition-colors duration-500 ${

                            busy

                              ? "bg-cta text-white animate-pulse"

                              : done

                                ? "bg-emerald-600 text-white"

                                : "border border-ink/16 bg-white/85 text-ink/55"

                          }`}

                        >

                          {busy ? "工作中" : done ? "已完成" : "待命"}

                        </span>

                      </div>

                    </div>

                  </div>



                  {subtitleForCard(key) ? (

                    <p className="animate-warroom-msg-in relative mt-2 text-[12px] font-semibold leading-snug text-ink/62">

                      {subtitleForCard(key)}

                    </p>

                  ) : null}

                </div>

              );

            })}

          </div>



          <p className="text-center text-[12px] font-semibold text-ink/43">

            内容由大模型生成，请结合自身事实核对后使用 · 不向移动端单独适配布局

          </p>

        </aside>

      </div>



      {/** 作战地图抽屉：固定在视口右侧，独立于左栏裁剪区，盖住两栏 */}
      {mapOverlayMounted ? (

        <>

          <div

            role="presentation"

            className={`fixed inset-0 z-[118] bg-ink/[0.38] backdrop-blur-[2px] transition-opacity duration-300 ease-out ${

              mapAnimIn ? "opacity-100" : "opacity-0"

            } `}

            onClick={closeBattleMapDrawer}

            aria-hidden={!mapAnimIn}

          />



          <aside

            className={`fixed inset-y-0 right-0 z-[119] flex w-[min(100vw,_540px)] max-w-[100vw] flex-col shadow-[-16px_0_48px_rgba(61,40,23,0.22)] ring-4 ring-black/25 transition-[transform,opacity] duration-300 ease-out ${

              mapAnimIn

                ? "translate-x-0 opacity-100"

                : "translate-x-full opacity-90"

            } `}

            role="dialog"

            aria-modal

            aria-labelledby="battle-map-title"

            aria-busy={mapGenLoading}

          >

            <div className="paper-texture marker-border-soft relative flex max-h-none min-h-0 flex-1 flex-col overflow-hidden rounded-none border-x-2 border-y-2 border-x-ink/90 border-y-ink/90 md:rounded-bl-[235px_22px] md:rounded-tl-[235px_22px]">

              {/* 顶栏标题 + 右上角关闭 */}
              <header className="flex shrink-0 items-start justify-between gap-3 border-b-2 border-ink/14 bg-[#fff9f5]/92 px-5 pb-4 pt-5 backdrop-blur-sm">

                <div className="min-w-0 pr-12">

                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cta">

                    Confidential brief

                  </p>

                  <h2 id="battle-map-title" className="mt-1 truncate text-xl font-bold text-ink sm:text-2xl">

                    《校招作战地图》

                  </h2>

                  <p className="mt-2 text-[13px] font-semibold text-ink/55">

                    由完整对话会话流式生成的正式摘要 · 可复制或下载存档

                  </p>

                </div>



                <button

                  type="button"

                  onClick={closeBattleMapDrawer}

                  className="absolute right-4 top-4 rounded-full border border-ink/22 bg-white/95 px-2.5 py-1.5 text-lg font-bold leading-none text-ink/70 shadow-warm ring-cta/25 transition hover:border-cta/60 hover:bg-paper hover:text-cta md:text-xl"

                  aria-label="关闭作战地图面板"

                >

                  ✕

                </button>

              </header>



              {/* 公文正文区 */}
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#fdf9f6] px-5 py-5">

                <div className="mx-auto max-w-none rounded-[222px_12px_200px_12px_/12px_200px_12px_222px] border-[1.8px] border-ink/[0.06] bg-paper px-6 py-7 shadow-inner md:rounded-[228px_16px_210px_16px_/16px_210px_16px_228px]">

                  {/** 初次请求且无字符时占位提示 */}
                  {mapGenLoading && battleMapMarkdown.length === 0 && !mapGenError ? (

                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">

                      <span

                        className="inline-block size-10 animate-spin rounded-full border-[3px] border-cta/25 border-t-cta"

                        aria-hidden

                      />

                      <p className="text-sm font-semibold text-ink/72">⚙ 作战部整合对话中，请稍候…</p>

                    </div>

                  ) : null}



                  {mapGenError ? (

                    <div className="rounded-xl border border-cta/40 bg-[#fff0f2] px-4 py-3 text-sm font-bold text-cta">

                      {mapGenError}

                    </div>

                  ) : null}



                  {battleMapMarkdown.length > 0 ? (

                    <div className={`battle-map-md ${mapGenLoading ? "opacity-[0.93]" : ""}`}>

                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{battleMapMarkdown}</ReactMarkdown>

                      {/** 仍在流式时末尾呼吸光标 */}
                      {mapGenLoading && battleMapMarkdown.length > 0 ? (

                        <span className="ml-1 inline-block size-3 animate-pulse rounded-sm bg-cta/45 align-middle" aria-hidden />

                      ) : null}

                    </div>

                  ) : null}

                </div>

              </div>



              {/* 底栏 · 复制 + 下载 */}
              <footer className="shrink-0 border-t-2 border-ink/12 bg-[#fff7f3]/94 px-5 py-4 backdrop-blur-sm">

                <div className="flex flex-wrap items-center justify-between gap-3">

                  <div className="flex flex-wrap gap-3">

                    <button

                      type="button"

                      onClick={() => {

                        void handleCopyBattleMap();

                      }}

                      disabled={!battleMapMarkdown.trim()}

                      className="marker-border-soft inline-flex items-center rounded-full border-ink/85 bg-[#fffdf9] px-5 py-2.5 text-sm font-bold text-ink shadow-warm ring-cta/35 transition hover:border-cta hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"

                    >

                      📋 复制全文

                    </button>

                    <button

                      type="button"

                      onClick={handleDownloadBattleMap}

                      disabled={!battleMapMarkdown.trim()}

                      className="rounded-full bg-cta px-5 py-2.5 text-sm font-bold text-white shadow-[3px_4px_0_rgba(61,40,23,0.12)] transition hover:brightness-105 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-42"

                    >

                      ⬇ 下载

                    </button>

                  </div>

                  {mapCopyFeedback ? (

                    <span className="animate-warroom-msg-in text-sm font-bold text-emerald-700">

                      {mapCopyFeedback}

                    </span>

                  ) : null}

                </div>

              </footer>

            </div>

          </aside>

        </>

      ) : null}



    </div>

  );

}

