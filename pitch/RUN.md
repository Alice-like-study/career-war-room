# Career War Room · 网页版 PPT

一个**完全独立**的 Next.js 网页 PPT（PPT 的平替），与主产品视觉语言一致，键盘翻页、全屏演示。

---

## 1. 启动

在 `pitch/` 目录下：

```bash
cd pitch
npm install   # 首次运行才需要
npm run dev
```

浏览器打开终端里 `Local:` 显示的地址（默认 **http://localhost:3000**）。
> 端口被占用时 Next 会自动改用 3001 / 3002…，以终端输出为准。

## 2. 全屏演示

进入页面后按 **F11** 进入浏览器全屏（再按 F11 退出）。
按 1080p（1920×1080）分辨率全屏即为面试时的最佳效果。

## 3. 键盘快捷键

| 按键 | 作用 |
|------|------|
| `→` / `Space` / `Page Down` | 下一页 |
| `←` / `Page Up` | 上一页 |
| `Home` | 回到首页 |
| `End` | 跳到末页 |
| `1`–`8` | 直接跳到对应页 |
| `Esc` | 打开 / 关闭全部页缩略图（可点击跳转） |

- 右下角半透明小字显示 `当前页 / 总页数`。
- 第 2–7 页右下方会浮出「→ 下一页」提示，3 秒后自动淡出。
- 鼠标移到屏幕**最左 / 最右边缘点击**也可翻页。
- 第 5 页「作战仪表盘」进入即自动播放、离开自动暂停、回来重新播放。

## 4. 面试前快速改文案 —— 改哪个文件

绝大多数文案集中在两个数据文件，**改完保存即热更新**：

| 内容 | 文件 |
|------|------|
| 6 位 Agent 名称 / 图标 / 一句话职能 / 人设关键词 / 方法论 | `lib/agents-data.ts` → `AGENT_CARDS` |
| 第 5 页每个 Agent 的「示例输出」（打字机内容） | `lib/agents-data.ts` → `AGENT_SAMPLE_OUTPUTS` |
| 创始人故事（第 7 页）金句 + 正文 | `lib/agents-data.ts` → `FOUNDER_STORY` |
| 结语金句 / 姓名 / 链接 / 联系方式（第 8 页） | `lib/agents-data.ts` → `CLOSING` |
| 第 4 页三个技术决策 | `lib/agents-data.ts` → `TECH_DECISIONS` |
| 第 5 页节奏（进度速度 / 打字速度）、Compass 任务、各 Agent 任务 | `lib/dashboard-data.ts` |

单页版式（如需调整）：

| 页 | 文件 |
|----|------|
| 第 1 页 · 封面 | `components/slides/SlideHero.tsx` |
| 第 2 页 · 架构总览 | `components/slides/SlideArchitecture.tsx` |
| 第 3 页 · Agent 详情 | `components/slides/SlideAgents.tsx` |
| 第 4 页 · 技术决策 | `components/slides/SlideTechDecisions.tsx` |
| 第 5 页 · 作战仪表盘 ⭐ | `components/slides/SlideDashboard.tsx` |
| 第 6 页 · 真产品过渡 | `components/slides/SlideDemoTransition.tsx` |
| 第 7 页 · 创始人故事 | `components/slides/SlideFounderStory.tsx` |
| 第 8 页 · 结语 | `components/slides/SlideClosing.tsx` |

翻页 / 页码 / 缩略图等交互逻辑：`components/PitchDeck.tsx`、`components/PitchControls.tsx`。

## 5. 第 6 页演示流程提示

第 6 页「打开真产品」按钮会在**新标签页**打开 `https://career-war-room-omega.vercel.app`：
演示完真产品后按 `Alt + Tab` 切回本 PPT，再按 `→` 进入第 7 页即可。
