# 应届生求职作战部 · Career War Room

> 7 位 AI 军师 · 30 分钟生成你的《校招作战地图》

[![Built with EasyClaw](https://img.shields.io/badge/Built%20with-EasyClaw-purple)](https://easyclaw.com)
[![Hackathon](https://img.shields.io/badge/Hackathon-FuSheng%20AI%20Team-red)](https://easyclaw.link)

## 🎯 项目简介

「应届生求职作战部」是一个基于 EasyClaw 平台搭建的多 Agent 协作系统,由 1 位总指挥(Compass)+ 6 位专职军师组成,通过 sessions_send / file_share / context_inherit 等协议实现真正的团队协作。

**演示地址**:career-war-room-cbw47etzm-alice-s-projects2.vercel.app

⭐ ## 💭 开发初衷

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

## 🚀 如何复现这个 Agent 团队

> ⚠️ **当前状态说明**:作战部 Skill 包尚未发布到 EasyClaw 技能市场。
> 本仓库提供 6 个 Agent 的完整配置文件,你可以按以下步骤手动在本地 EasyClaw 中复现整套团队。

### 第一步:安装 EasyClaw 客户端
访问 [easyclaw.com](https://easyclaw.com),下载对应系统的客户端,完成账号注册。

### 第二步:导入 Agent 配置文件
本仓库 `agents-config/AGENTS.md` 文件汇总了 6 位 Agent 的完整配置:
- Prism(自我画像官)
- Scope(行业匹配官)
- Scalpel(简历医生)
- Arena(模拟面试官)
- Balance(Offer 决策官)
- Lumen(情绪陪跑官)

每位 Agent 都包含 IDENTITY(身份定义)和 SOUL(人设与方法论)两部分。
直接对你的主 Agent 说:
> "请按 agents-config/AGENTS.md 的内容,创建 6 位子 Agent。"

主 Agent 会自动完成创建。

### 第三步:配置主 Agent 调度权限
在 EasyClaw 客户端,对你的主 Agent(Compass)说:
> "请把以下 6 个子 Agent 加入你的 allowAgents 列表:prism, scope, scalpel, arena, balance, lumen"

或手动执行 CLI 命令:
\`\`\`bash
easyclaw config set agents.list[0].subagents.allowAgents \
  '["prism","scope","scalpel","arena","balance","lumen"]' --json
\`\`\`

### 第四步:验证团队就位
\`\`\`bash
easyclaw agents list
\`\`\`
应看到 7 个 Agent 全部在线。

### 第五步:开始使用
对主 Agent(Compass)说:
> "我是应届生,在求职中遇到困难,请帮我。"

Compass 会自动分诊并调度对应子 Agent。

## 🗺️ 路线图

- [x] 6 位 Agent + 1 位总指挥的完整人设设计
- [x] Pipeline 协作流程跑通
- [x] 产品官网(Next.js + Vercel)
- [ ] 把 6 位 Agent 打包成 EasyClaw Skill 包,实现一键安装
- [ ] 提交到 EasyClaw 技能市场
- [ ] 加入更多场景:跳槽、留学申请、考研复试
- [ ] 接入更多平台(微信、飞书、Telegram)

## 🙏 致谢

- 傅盛 AI 战队 & 猎豹移动 — 让普通人也能搭出 7×24 运转的 AI 团队
- 三万(SanWan)— 整个产品形态的精神标杆
- EasyClaw 开发团队 — 把 OpenClaw 的高门槛打成 0

## 📄 License

本作品参加「傅盛 AI 战队青少年黑客松」(2026.5),仅作参赛展示用途。

---

**Made with ☕ and 🦞 by Alice · 2026 年 5 月**
