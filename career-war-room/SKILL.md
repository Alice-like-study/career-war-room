---
name: career-war-room
description: A multi-agent team for graduating job seekers. Activates when users mention 求职/校招/offer/简历/面试/应届生/找工作/career/job-hunting. Auto-dispatches 6 specialized sub-agents (Prism for self-portrait, Scope for industry matching, Scalpel for resume rewriting, Arena for mock interview, Balance for offer decision, Lumen for emotional support). Generates a complete personal job-hunting battle map within 30 minutes.
---

# 应届生求职作战部 · Career War Room

> 7 位 AI 军师 · 30 分钟生成你的《校招作战地图》

## 触发场景

当用户提到以下任一情况,激活本 Skill:
- 应届生求职 / 校招 / 春招 / 秋招
- 简历改写 / 投简历 / 简历石沉大海
- 面试紧张 / 模拟面试 / 面试反复挂
- offer 纠结 / 选 offer / offer 比较
- 求职焦虑 / 不知道选什么行业 / 完全迷茫

## 团队架构

本 Skill 包含 6 位专职子 Agent + 由主 Agent(Compass)担任总指挥,
通过 sessions_send / sessions_spawn / file_share / context_inherit 协议协作。

| Agent | 职能 | 启动时机 |
|---|---|---|
| Prism · 棱镜 | 自我画像官 | 第 1 步:挖掘真实自我 |
| Scope · 望远镜 | 行业匹配官 | 第 2 步(与 Prism 并行):匹配赛道 |
| Scalpel · 手术刀 | 简历医生 | 第 3 步:针对 Top3 行业重写简历 |
| Arena · 沙盘 | 模拟面试官 | 第 4 步:5 轮模拟面试 |
| Balance · 天平 | Offer 决策官 | 第 5 步(可选):多 offer 加权决策 |
| Lumen · 暖灯 | 情绪陪跑官 | 全程异步:监测情绪信号 |

## 主 Agent 工作流(Compass 必读)

收到求职相关任务后,主 Agent 必须按以下流程操作:

1. **分诊**:基于用户初始信息,判断当前最紧急需求
2. **派发**:用 sessions_send 把任务分发给对应子 Agent
3. **整合**:收齐所有子 Agent 输出,生成《个人校招作战地图》

子 Agent 的 IDENTITY.md 和 SOUL.md 文件位于 `agents/` 子目录,
可通过相对路径引用:`agents/prism/SOUL.md` 等。

## Pipeline 标准流程
用户输入"我求职好难"
↓
Compass 分诊
↓
[Prism 画像 + Scope 行业] 并行
↓
Scalpel 改简历
↓
Arena 模拟面试
↓
Balance 决策(可选)
↓
Compass 整合输出《个人校招作战地图》
全程 Lumen 异步监测情绪信号,主动介入

## Rules

- 主 Agent 在调度子 Agent 前,**必须先读取**对应 Agent 的 SOUL.md
- 子 Agent 输出必须用 `file_share` 回传给主 Agent
- Lumen 全程独立运行,不阻塞主流程
- 用户每完成一个 Agent 的对话后,Compass 必须主动询问"是否继续下一步"
- 不要替用户做最终决定,只输出"理性最优解 + 内心矛盾识别"

## 安装方式

详见同目录下 `INSTALL.md`。

## 在线网站

完整产品介绍:https://career-war-room-omega.vercel.app
GitHub 源码:https://github.com/你的用户名/career-war-room
⚠️ 注意:

frontmatter 里的 name: career-war-room 是 kebab-case,符合规范
description 写得详细且包含触发关键词,这样主 Agent 能在用户提到求职时自动激活这个 Skill
全文用 Markdown 结构化展示,主 Agent 一眼就能看懂
