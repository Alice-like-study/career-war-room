import type { AgentKey } from "./agents-data";

export type AgentStatus = "running" | "done" | "idle";

export interface DashboardAgentConfig {
  key: AgentKey;
  progressSpeed: number;
  taskDelay: number;
  typeSpeed: number;
}

/** 仪表盘各 Agent 异步节奏 — 进度速度 / 任务切换 / 打字速度各不相同 */
export const DASHBOARD_AGENTS: DashboardAgentConfig[] = [
  { key: "prism", progressSpeed: 1.2, taskDelay: 8000, typeSpeed: 28 },
  { key: "scope", progressSpeed: 0.9, taskDelay: 9500, typeSpeed: 22 },
  { key: "scalpel", progressSpeed: 1.5, taskDelay: 7000, typeSpeed: 32 },
  { key: "arena", progressSpeed: 0.7, taskDelay: 11000, typeSpeed: 20 },
  { key: "balance", progressSpeed: 0.5, taskDelay: 12000, typeSpeed: 18 },
  { key: "lumen", progressSpeed: 1.0, taskDelay: 6000, typeSpeed: 35 },
];

export const COMPASS_TASKS = [
  "协调 Prism + Scope 并行画像与赛道匹配",
  "等待 Scalpel 产出三版差异化简历",
  "Arena 模拟面试第 3/5 轮 — 压力面",
  "Lumen 监测到负面信号，异步介入",
  "整合产出《个人校招作战地图》",
] as const;

export const AGENT_TASKS: Record<AgentKey, string[]> = {
  prism: ["第 3/5 轮 · 挖价值观", "第 5/5 轮 · 输出画像报告", "file_share → Compass"],
  scope: ["读取 Prism 画像证据", "匹配 Top 3 赛道", "标注地雷方向 → Scalpel"],
  scalpel: ["诊断简历 5 个硬伤", "重写产品岗版 bullet", "产出运营岗 / 金融岗版"],
  arena: ["行为面 · 自我介绍", "专业面 · 费米估算", "压力面 · 抗压测试"],
  balance: ["收集 7 维权重表", "字节 vs AI 创业加权", "反直觉提醒输出"],
  lumen: ["监测：凌晨在线 + 负面词", "命名：自证陷阱", "最小行动：改一个动词"],
};

/** 完整循环时长（毫秒） */
export const DASHBOARD_CYCLE_MS = 36000;
