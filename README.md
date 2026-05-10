# 应届生求职作战部 · Career War Room

> 7 位 AI 军师 · 30 分钟生成你的《校招作战地图》

[![Built with EasyClaw](https://img.shields.io/badge/Built%20with-EasyClaw-purple)](https://easyclaw.com)
[![Hackathon](https://img.shields.io/badge/Hackathon-FuSheng%20AI%20Team-red)](https://easyclaw.link)

## 🎯 项目简介

「应届生求职作战部」是一个基于 EasyClaw 平台搭建的多 Agent 协作系统,由 1 位总指挥(Compass)+ 6 位专职军师组成,通过 sessions_send / file_share / context_inherit 等协议实现真正的团队协作。

**在线网站**:[https://career-war-room-omega.vercel.app](https://career-war-room-omega.vercel.app)  
**GitHub 仓库**:[https://github.com/Alice-like-study/career-war-room](https://github.com/Alice-like-study/career-war-room)  
**Skill 包下载**:[v1.0.0 Release](https://github.com/Alice-like-study/career-war-room/releases/download/v1.0.0/career-war-room-skill-v1.0.0.zip.zip)

## 💭 开发初衷

我做这个产品的契机,不是某个商业洞察,而是一个意外。

5 月某个凌晨,我刚把 6 位 Agent 在 EasyClaw 上搭好,按计划应该用一份"虚拟应届生小李"的人物设定测试整条 Pipeline。但我没注意,Prism 第一轮提问时,我下意识用了自己的真实经历回答。

5 轮对话之后,Prism 输出了一份画像,其中有一句话戳中了我:

> "你不是被'成功结果'驱动,
> 而是被'把模糊变清晰、把不可能变可能'的过程驱动。"
> —— Prism · 棱镜 给作者的画像,2026.5

没有任何朋友、家人、HR 在 5 轮对话内,准确地说出过这句话。但我自己心里知道:它说对了。

那一刻我意识到,作战部的真正价值,不是"把求职流程自动化",而是它能在一个被父母、KPI、同辈压力裹挟的应届生面前,**用 5 轮对话告诉对方:你是谁,你想要什么**。

应届生最缺的从来不是信息,是有人安静地、不带评价地、帮他把内心的混乱拆解成一份可执行的地图。

7 位 AI 军师做不到代替你做选择,但它们能让选择不再孤独。

这就是我做这个产品的原因。

## 🏗️ 团队架构

| 角色 | 中文名 | 职责 |
|---|---|---|
| Compass | 领航官 · 总指挥 | 接收用户需求、分诊、调度子 Agent、整合输出 |
| Prism | 棱镜 · 自我画像官 | 5 轮情景化追问,挖掘真实自我 |
| Scope | 望远镜 · 行业匹配官 | 基于画像匹配 Top3 赛道 |
| Scalpel | 手术刀 · 简历医生 | 针对 3 个行业重写简历 |
| Arena | 沙盘 · 模拟面试官 | 5 轮模拟面试 + STAR 反馈 |
| Balance | 天平 · Offer 决策官 | 7 维度加权评分 + 反直觉提醒 |
| Lumen | 暖灯 · 情绪陪跑官 | 异步监测 + CBT 三步法介入 |

## 🔄 Pipeline 协作流程

```
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
  Compass 整合输出
        ↓
《个人校招作战地图》

全程 Lumen 异步监测情绪信号,主动介入
```
## 📦 Skill 包内容(v1.0.0)

[下载 v1.0.0](https://github.com/Alice-like-study/career-war-room/releases/download/v1.0.0/career-war-room-skill-v1.0.0.zip.zip) 后解压,得到的文件结构:
career-war-room/
├── SKILL.md          # 标准 EasyClaw Skill 入口(带 YAML frontmatter)
├── README.md         # 用户说明
├── INSTALL.md        # 命令行 + 自然语言双安装指南
└── agents/           # 6 位子 Agent 配置
├── prism/        # 棱镜 · 自我画像官
├── scope/        # 望远镜 · 行业匹配官
├── scalpel/      # 手术刀 · 简历医生
├── arena/        # 沙盘 · 模拟面试官
├── balance/      # 天平 · Offer 决策官
└── lumen/        # 暖灯 · 情绪陪跑官
每位 Agent 都包含 `IDENTITY.md`(身份定义)和 `SOUL.md`(人设、方法论、提问库、输出格式),完全符合 OpenClaw / EasyClaw 官方 Skill 规范。
## 💻 技术栈

- **AI 平台**:EasyClaw(基于 OpenClaw 框架)
- **多 Agent 通信**:sessions_send / sessions_spawn / file_share / context_inherit
- **大模型**:moonshot.kimi-k2.6(旗舰)+ minimax.m2.5(轻量,Lumen 用)
- **官网**:Next.js 14 + Tailwind CSS + TypeScript
- **部署**:Vercel(Hobby 免费版)

## 📂 项目结构

```
career-war-room/
├── app/                    # Next.js App Router
├── components/             # React 组件
│   ├── sections/           # 8 个落地页 section
│   └── links.ts            # 外链统一配置
├── public/                 # 静态资源
├── agents-config/          # 6 个 Agent 的 SOUL.md + IDENTITY.md
│   ├── compass/
│   ├── prism/
│   ├── scope/
│   ├── scalpel/
│   ├── arena/
│   ├── balance/
│   └── lumen/
├── demo/                   # 演示视频和截图
└── README.md
```

## 🚀 如何安装这个 Agent 团队

### 方式一:一键下载 Skill 包(推荐)

1. **下载 Skill 包**:[v1.0.0 Release](https://github.com/Alice-like-study/career-war-room/releases/latest)
2. **解压 ZIP** 到任意位置
3. **按包内 `INSTALL.md` 操作**——支持命令行 + 自然语言两种安装方式

### 方式二:让你的主 Agent 自己安装(最省心)

下载并解压 ZIP 后,直接对你的 EasyClaw 主 Agent 说:

> "请安装 career-war-room Skill,Skill 包就在我下载文件夹里。
> 帮我把 6 位子 Agent 配置好,并验证团队就位。"

主 Agent 会自动完成全部安装步骤(包括复制配置、注册子 Agent、设置调度权限)。

### 方式三:手动从源码加载(开发者用)

本仓库 `agents-config/AGENTS.md` 文件汇总了 6 位 Agent 的完整配置:

- Prism(自我画像官)
- Scope(行业匹配官)
- Scalpel(简历医生)
- Arena(模拟面试官)
- Balance(Offer 决策官)
- Lumen(情绪陪跑官)

每位 Agent 都包含 IDENTITY(身份定义)和 SOUL(人设与方法论)两部分。把每位 Agent 的两部分内容,分别写入 EasyClaw 工作区对应目录:
~/.easyclaw/agents/prism/IDENTITY.md
~/.easyclaw/agents/prism/SOUL.md
... (依此类推 6 位 Agent)

### 开始使用

安装完成后,对主 Agent 说:

> "我是应届生,在求职中遇到困难,请帮我。"

Compass 会自动分诊并调度对应子 Agent,30 分钟内输出一份《个人校招作战地图》。

## 🗺️ 路线图

### ✅ 已完成
- [x] 6 位 Agent + 1 位总指挥的完整人设设计
- [x] Pipeline 协作流程跑通
- [x] 产品官网(Next.js + Vercel,已部署)
- [x] **将 6 位 Agent 打包成标准 EasyClaw Skill 包(v1.0.0,2026.5)**
- [x] **GitHub Releases 永久下载渠道**


### 🔮 长期规划
- [ ] 加入更多场景:跳槽、留学申请、考研复试
- [ ] 接入更多平台(微信、飞书、Telegram)
- [ ] 沉淀真实用户案例库

## 🙏 致谢

- 傅盛 AI 战队 & 猎豹移动 — 让普通人也能搭出 7×24 运转的 AI 团队
- 三万(SanWan)— 整个产品形态的精神标杆
- EasyClaw 开发团队 — 把 OpenClaw 的高门槛打成 0

## 📄 License

本作品参加「傅盛 AI 战队青少年黑客松」(2026.5),仅作参赛展示用途。

---

**Made with ☕ and 🦞 by Alice · 2026 年 5 月**
