# 应届生求职作战部 · Career War Room

> 7 位 AI 军师 · 30 分钟生成你的《校招作战地图》

[![Built with EasyClaw](https://img.shields.io/badge/Built%20with-EasyClaw-purple)](https://easyclaw.com)
[![Hackathon](https://img.shields.io/badge/Hackathon-FuSheng%20AI%20Team-red)](https://easyclaw.link)

## 🎯 项目简介

「应届生求职作战部」是一个基于 EasyClaw 平台搭建的多 Agent 协作系统,由 1 位总指挥(Compass)+ 6 位专职军师组成,通过 sessions_send / file_share / context_inherit 等协议实现真正的团队协作。

**演示地址**:career-war-room-cbw47etzm-alice-s-projects2.vercel.app

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

### 第一步:安装 EasyClaw 客户端
访问 [easyclaw.com](https://easyclaw.com),下载对应系统的客户端,完成账号注册。

### 第二步:导入 Agent 配置
将本仓库 `agents-config/` 目录下的 6 个子目录,分别复制到 EasyClaw 工作区:
```
~/.easyclaw/agents/
```

### 第三步:配置主 Agent 的 subagents.allowAgents
```bash
easyclaw config set agents.list[0].subagents.allowAgents \
  '["prism","scope","scalpel","arena","balance","lumen"]' --json
```

### 第四步:验证团队就位
```bash
easyclaw agents list
```

应看到 7 个 Agent 全部在线。

### 第五步:开始使用
对主 Agent(Compass)说:
> "我是应届生,在求职中遇到困难,请帮我。"

Compass 会自动分诊并调度对应子 Agent。

## 🎬 演示

详细演示请见:
- 在线网站:[Vercel 部署地址](#)
- 演示视频:`demo/demo.mp4`(1 分 30 秒)

## 📝 设计理念

### 为什么是"多 Agent"而不是"一个全能 Agent"?

- 一个 Agent 试图什么都做,会陷入"什么都做但什么都不精"的陷阱
- 6 位 Agent 分工,每位都有独立的工作区(workspace)、独立的记忆(memory)、独立的人设(SOUL.md)、独立的提示策略
- 通过 sessions_send 实现数据流转,通过 file_share 实现产出沉淀,通过 context_inherit 实现上下文复用

### 为什么用 EasyClaw 而不是 Coze / Dify?

- EasyClaw 原生支持持久 Agent + 子 Agent 双模式,这是真正的"多 Agent"
- Coze / Dify 本质是工作流(workflow),Agent 之间是"调用",不是"协作"
- EasyClaw 的本地沙盒 + 自然语言配置,完美匹配"非程序员也能搭团队"的产品愿景

## 🙏 致谢

- 傅盛 AI 战队 & 猎豹移动 — 让普通人也能搭出 7×24 运转的 AI 团队
- 三万(SanWan)— 整个产品形态的精神标杆
- EasyClaw 开发团队 — 把 OpenClaw 的高门槛打成 0

## 📄 License

本作品参加「傅盛 AI 战队青少年黑客松」(2026.5),仅作参赛展示用途。

---

**Made with ☕ and 🦞 by Alice · 2026 年 5 月**
