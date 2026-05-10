import type { ReactNode } from "react";

function DialogueLine({ who, children }: { who: string; children: ReactNode }) {
  return (
    <p>
      <strong className="text-ink/90">{who}</strong> {children}
    </p>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <p className="text-base font-bold text-[#8b2c2c]">{children}</p>;
}

function QuoteStack({ children }: { children: ReactNode }) {
  return <div className="space-y-2 border-l-2 border-ink/15 pl-3">{children}</div>;
}

function CodeReport({ children }: { children: ReactNode }) {
  return (
    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded border border-ink/12 bg-white/75 p-3 font-mono text-[13px] leading-relaxed text-ink/88">
      {children}
    </pre>
  );
}

export const AGENT_DEMOS = {
  prism: (
    <>
      <SectionTitle>【开场对话】</SectionTitle>
      <QuoteStack>
        <DialogueLine who="你：">
          我不知道自己适合做什么，专业是工商管理，感觉什么都学了，又什么都没学……
        </DialogueLine>
        <DialogueLine who="Prism：">
          先别急着给自己贴「没特长」的标签。问你个具体的——
          <strong className="text-ink">上一次你做某件事忘记时间，是在做什么？</strong>{" "}
          不用是「正事」，打游戏、整理东西、帮人改简历都算。
        </DialogueLine>
        <DialogueLine who="你：">
          呃……上周室友要投外企，我帮他改中英文简历，从晚上九点改到凌晨两点，还查了好多面经。他拿到面试的时候，我比他还激动。
        </DialogueLine>
        <DialogueLine who="Prism：">
          那个「比他还激动」的瞬间，最爽的是什么？是他感谢你，还是你发现自己能把他的经历「翻译」成 HR 想看的样子？
        </DialogueLine>
      </QuoteStack>
      <div>
        <SectionTitle>【典型输出片段】</SectionTitle>
        <CodeReport>{`个人画像报告 - 阿杰

## 一句话画像
你是一个"翻译型选手"——擅长把一个人的混沌经历，翻译成对方语言体系里高价值的故事。

## 三大核心能力

叙事重构力：能把零散经历重新组织成有说服力的逻辑
证据：帮室友改简历 5 小时不疲惫，核心快感是"发现他被低估的亮点"

共情穿透力：能站在接收方视角判断什么信息有效
证据：主动查面经、预判 HR 筛选逻辑，不是盲目美化

## 价值观排序（Top 3）
影响力确认 — 因为自己的工作直接改变他人结果
智力挑战性 — 因为重复性执行会快速消耗热情`}</CodeReport>
      </div>
      <p className="italic text-ink/70">
        5-7 轮追问后，你会得到一份带「证据链」的个人画像——不是星座标签，是你真实行为的镜像。
      </p>
    </>
  ),

  scope: (
    <>
      <SectionTitle>【开场对话】</SectionTitle>
      <QuoteStack>
        <DialogueLine who="应届生小李：">
          「我是某 985 经管学院的，GPA 3.3，做过学生会主席，有两段券商实习但都是打杂。金融卷不动了，互联网又不了解，请问该投哪？」
        </DialogueLine>
        <DialogueLine who="Scope：">
          「收到 Prism 画像了。你画像里有个关键矛盾——『领导力标签强（学生会主席）但券商实习零成果产出』。这不是你不够努力，是赛道选错了：券商研究所要的是『能写深度报告的人』，不是『能组织活动的人』。你最适合的战场，在互联网产品运营。」
        </DialogueLine>
      </QuoteStack>
      <div>
        <SectionTitle>【典型输出片段 · 行业匹配报告】</SectionTitle>
        <CodeReport>{`## Top 3 推荐方向

### 推荐 1: 互联网 - 产品运营（C 端增长方向）

- 为什么适合你：Prism 画像明确指出你"擅长协调资源、推动跨部门合作"，且"对数据敏感但非硬核技术背景"——这正是产品运营的核心能力模型。学生会主席经历在这里不是减分项，而是明确的"项目管理能力"证明。
- 应届起薪：18-25W（一线城市头部厂）
- 3 年路径：第 1 年执行活动/数据分析 → 第 2 年独立负责增长模块 → 第 3 年晋升运营经理，带 2-3 人小组
- 风险点：第 2 年容易陷入"只懂执行不懂策略"的瓶颈，必须主动争取独立项目
- 典型公司：字节跳动（增长运营）、美团（商家运营）、小红书（社区运营）

### ⚠️ 一个"看似适合但其实不推荐"的方向

【券商研究所】：你画像里"两段券商实习"让人误以为你适合这里，但实际上"零深度报告产出 + 非理工科复合背景"是隐形地雷。2024 年起，头部券商研究所校招已明确要求"能独立覆盖 1-2 个细分赛道"，你的实习经历无法满足。`}</CodeReport>
      </div>
    </>
  ),

  scalpel: (
    <>
      <SectionTitle>【开场对话】</SectionTitle>
      <QuoteStack>
        <DialogueLine who="小李：">
          「我投了 80 份简历，只收到 8 个回复。是不是我真的不适合产品岗？」
        </DialogueLine>
        <DialogueLine who="Scalpel：">
          「先别怀疑你自己，先看你的文本。你简历第一行是『性格开朗，吃苦耐劳』，这在 HR
          眼里等于空白。你不是没经历，是没把经历翻译成招聘方能判分的语言。」
        </DialogueLine>
      </QuoteStack>
      <div>
        <SectionTitle>【典型输出片段】</SectionTitle>
        <CodeReport>{`简历重写报告 - 产品岗版本

## 原句
负责校园二手交易平台运营，提升了用户活跃度。

## 诊断结论
- 问题 1：动作词弱（只说“负责”）
- 问题 2：没有业务数字（无法判断贡献规模）
- 问题 3：没有方法路径（看不出可复用能力）

## STAR 重写结果
Situation｜项目上线 3 个月，DAU 停滞在 200，7 日留存仅 12%
Task｜目标是提升活跃度与交易转化率
Action｜访谈 47 名用户定位“信任缺失”痛点；上线实名认证+评分体系；联动 5 个院系学生会做冷启动活动
Result｜DAU 200 → 1100（+450%），月 GMV 达 8 万，7 日留存升至 34%

## 投递建议
同一经历拆成“产品岗版 / 运营岗版 / 金融岗版”三套表达，避免一份简历打天下。`}</CodeReport>
      </div>
      <p className="italic text-ink/70">你不是没有内容，而是需要把内容改写成可量化、可判分、可比较的证据句。</p>
    </>
  ),

  arena: (
    <>
      <SectionTitle>【开场对话】</SectionTitle>
      <QuoteStack>
        <DialogueLine who="用户：">
          你好，我是应届生，想面互联网产品经理，但我从来没参加过正式面试，很紧张。
        </DialogueLine>
        <DialogueLine who="Arena：">
          紧张是正常的。我是 Arena，你的模拟面试官。接下来我会按真实面试流程，分 5 轮考察你——行为面、专业面、压力面都会覆盖。我会先出题，你回答，然后我逐句反馈，给你可复用的改写版本。
        </DialogueLine>
      </QuoteStack>
      <div>
        <SectionTitle>【典型输出片段】</SectionTitle>
        <CodeReport>{`模拟面试回放 - 第 1 题（自我介绍）

## 用户原答
我叫小李，来自 XX 大学，学计算机的，对产品挺感兴趣的，做过一个校园二手交易小程序，希望能来贵公司学习。

## Arena 逐句反馈
【优点】
- 提到了具体项目，比“我很热爱产品”更有锚点

【硬伤】
- 求职动机偏弱：公司招的是“能创造价值的人”，不是“来学习的人”
- 结果证据缺失：没有角色、规模、结果，无法判定贡献

## 改写示范
我叫小李，XX 大学计算机专业。上一段经历里我主导校园二手交易平台从调研到上线的完整流程，上线 3 周积累 1200 名用户，日均成交 40 单。这个过程让我形成了“在约束条件下做取舍”的产品判断，比如在开发资源不足时先用企业微信收款码完成 MVP，保障节点交付。这也是我应聘该岗位的核心动机。

## 复盘结论
一句“来贵公司学习”换成“我能带来什么价值”，就是候选人与学生心态的分水岭。`}</CodeReport>
      </div>
      <p className="italic text-ink/70">Arena 的目标不是让你背稿，而是把回答改造成可迁移的结构化模板。</p>
    </>
  ),

  balance: (
    <>
      <SectionTitle>【开场对话】</SectionTitle>
      <QuoteStack>
        <DialogueLine who="用户：">
          「你好，我是应届生，手里有两个 offer 不知道怎么选。一个是字节跳动运营岗，base 北京，月薪 14k；另一个是一家 AI
          创业公司做产品，base 上海，月薪 18k。两个我都有点心动，但父母觉得大厂稳定……」
        </DialogueLine>
        <DialogueLine who="Balance：">
          「先别急，我帮你算一笔账。但算账之前，你得告诉我：
          <strong className="text-ink">这 7 个维度在你心里各占多少比重？</strong> 总和必须是 100%。」
        </DialogueLine>
      </QuoteStack>
      <div>
        <SectionTitle>【典型输出片段】</SectionTitle>
        <CodeReport>{`Offer 决策报告 - Balance

## 维度权重表（用户填写）
| 维度 | 解释 | 权重 |
| --- | --- | --- |
| 钱 | 起薪 + 3 年薪资增速 | 20% |
| 成长 | 业务复杂度、学习速度 | 25% |
| 稳定 | 公司抗风险能力 | 15% |
| 城市 | 生活偏好与机会密度 | 10% |
| 平台 | 品牌与跳槽抬头 | 10% |
| 直属上级 | 带教质量与风格匹配 | 10% |
| 行业前景 | 赛道 5 年确定性 | 10% |

## 加权评分表（示例）
| 维度 | 权重 | 字节运营 | 加权 | AI 创业产品 | 加权 |
| --- | --- | --- | --- | --- | --- |
| 钱 | 20% | 6 | 1.2 | 8 | 1.6 |
| 成长 | 25% | 7 | 1.8 | 9 | 2.3 |
| 稳定 | 15% | 9 | 1.4 | 4 | 0.6 |
| ... | ... | ... | ... | ... | ... |
| 总分 | 100% | - | 7.5 | - | 7.3 |

## 结论
理性最优解：字节运营，领先 0.2 分。

## 反直觉提醒
如果“成长”真是你第一权重，AI 方案不应只落后 0.2。你可能在用“稳定”做最终裁决。建议冷静 24 小时后重填一次权重表。`}</CodeReport>
      </div>
      <p className="italic text-ink/70">Balance 不替你决定，只把你“嘴上排序”和“真实排序”摆到同一张表里。</p>
    </>
  ),

  lumen: (
    <>
      <SectionTitle>【开场对话】</SectionTitle>
      <QuoteStack>
        <DialogueLine who="用户（00:23）：">
          「又投了一份，还是没消息。真的累了，不想改了，反正也不会有人要我。」
        </DialogueLine>
        <DialogueLine who="Lumen：">
          「我先帮你把状态拆开，不讲鸡汤。你现在不是‘懒’，是连续投递后的情绪反噬。我们先把大脑从自证陷阱里拉出来，再谈下一步。」
        </DialogueLine>
      </QuoteStack>
      <div>
        <SectionTitle>【典型输出片段】</SectionTitle>
        <CodeReport>{`Lumen 异步陪跑记录（CBT）

## 信号识别
- 行为信号：连续投递后突然停摆
- 认知信号：出现“反正没人要我”的绝对化判断
- 身体信号：疲惫、回避、注意力涣散

## 情绪命名
当前状态：自证陷阱（担心被拒绝 -> 先否定自己 -> 暂停行动）

## 认知拆解
事实：你已经完成 12 次投递，这是有效行动。
自动化想法：投了就必须马上有反馈，否则说明我不行。
替代想法：投递是概率事件，今天的动作不等于今天的结果。

## 最小行动（10 分钟）
1) 手机倒扣，离开屏幕 3 分钟
2) 喝一杯水，做 6 次深呼吸
3) 只改简历里一个动词，不做全量重写

## 回流提示
完成后回复“done”，我再接你下一步。`}</CodeReport>
      </div>
      <p className="italic text-ink/70">Lumen 的目标是先稳住人，再稳住行动节奏。</p>
    </>
  ),
} as const satisfies Record<string, ReactNode>;

export type AgentDemoId = keyof typeof AGENT_DEMOS;
