import type { ReactNode } from "react";

function DialogueLine({ who, children }: { who: string; children: ReactNode }) {
  return (
    <p>
      <strong className="text-ink/90">{who}</strong> {children}
    </p>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <p className="text-sm font-bold text-ink">{children}</p>;
}

function QuoteStack({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-2 border-l-2 border-ink/15 pl-3 text-[12px] sm:text-[13px]">{children}</div>
  );
}

function CodeReport({ children }: { children: ReactNode }) {
  return (
    <pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded border border-ink/12 bg-white/75 p-2.5 font-mono text-[11px] leading-snug text-ink/88 sm:text-xs">
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
      <p className="text-[12px] italic text-ink/70 sm:text-[13px]">
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
      <SectionTitle>【开场诊断（30 秒锁定问题）】</SectionTitle>
      <p>
        小李发来简历，第一行是：「性格开朗，吃苦耐劳，具有较强的学习能力。」
      </p>
      <p>
        我直接打断：「停。HR 看到这句话，平均停留 0.3 秒，然后划走。你投的是产品岗，但全文没有『用户洞察』『DAU』『PRD』任何一个关键词。这不是简历，这是自杀式袭击。」
      </p>
      <div>
        <SectionTitle>【典型输出片段：STAR 重写示范】</SectionTitle>
        <p>原句：「负责校园二手交易平台运营，提升了用户活跃度。」</p>
        <p className="font-semibold text-ink">【硬伤】「负责……提升了」——无数字、无动作、无差异化。</p>
        <p className="font-semibold text-ink">→ 重写产品岗版：</p>
        <QuoteStack>
          <p>
            <strong>Situation</strong>｜校园二手交易项目上线 3 个月，DAU 停滞在 200，用户留存率仅 12%。
          </p>
          <p>
            <strong>Task</strong>｜负责提升用户活跃度和交易转化率。
          </p>
          <p>
            <strong>Action</strong>｜① 访谈 47 位用户，定位痛点为「信任机制缺失」；② 设计并上线实名认证 +
            评分体系，撰写 PRD 推动技术排期；③ 联合 5 个院系学生会做冷启动，策划「开学季 0 元送」活动。
          </p>
          <p>
            <strong>Result</strong>｜DAU 从 200 升至 1,100（+450%），月 GMV 突破 8 万，留存率提升至 34%。
          </p>
        </QuoteStack>
      </div>
      <QuoteStack>
        <DialogueLine who="小李的反应：">「原来我做的事可以写成这样……」</DialogueLine>
        <DialogueLine who="我的回复：">
          「不是『可以』，是必须。你的经历不差，你只是用 HR 听不懂的语言自废武功。下一句：你投运营岗和金融岗的版本，我一起给你。」
        </DialogueLine>
      </QuoteStack>
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
        <SectionTitle>【场景演示：第 1 题——自我介绍】</SectionTitle>
        <p>
          <strong>用户原答：</strong>
          「我叫小李，来自 XX 大学，学计算机的，对产品挺感兴趣的，做过一个校园二手交易小程序，希望能来贵公司学习。」
        </p>
        <p className="font-mono text-[11px] font-bold text-ink/80 sm:text-xs">=== 第 1 轮反馈 ===</p>
        <p className="font-semibold text-emerald-800">【优点 ✅】 提到了具体项目（校园二手交易小程序），比空泛说「热爱产品」有说服力</p>
        <div>
          <p className="font-semibold text-cta">【硬伤 ❌】</p>
          <ul className="list-disc space-y-1 pl-5 text-[12px] sm:text-[13px]">
            <li>
              <strong>求职动机模糊</strong>：「希望能来贵公司学习」这句话有问题，因为公司招的是能创造价值的人，不是来「上课」的
            </li>
            <li>
              <strong>项目缺数据</strong>：「做过一个」没有交代角色、成果，面试官无法判断你是画了两张图还是主导了全流程
            </li>
          </ul>
        </div>
        <p className="font-semibold text-ink">【改写示范 🎯】</p>
        <QuoteStack>
          <p>
            「我叫小李，XX 大学计算机专业。上一份实习里，我主导了一个校园二手交易平台的产品设计，从用户调研到上线全流程参与。上线 3
            周积累了 1200 名用户，日均成交 40 单。过程中我发现 PM 的核心是
            <strong>在约束条件下做取舍</strong>
            ——比如我们没有开发资源做支付系统，就用企业微信收款码过渡，保证了 MVP 准时上线。这也是我来面试这个岗位的原因：我希望能在一个产品方法论更成熟的团队里，把这件事做得更专业。」
          </p>
        </QuoteStack>
        <p className="text-[12px] font-semibold text-ink/80 sm:text-[13px]">
          【核心提分点】 用「约束条件下做取舍」替换「来贵公司学习」，体现产品经理的核心能力判断。
        </p>
      </div>
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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[280px] border-collapse text-[11px] sm:text-[12px]">
          <thead>
            <tr className="border-b border-ink/15">
              <th className="py-1.5 pr-2 text-left font-bold text-ink">维度</th>
              <th className="py-1.5 px-1 text-left font-bold text-ink">解释</th>
              <th className="py-1.5 pl-2 text-right font-bold text-ink">你的权重</th>
            </tr>
          </thead>
          <tbody className="text-ink/85">
            {[
              ["钱", "起薪 + 3 年薪资增速", "__%"],
              ["成长", "业务复杂度、能学到的东西", "__%"],
              ["稳定", "公司不会暴雷的概率", "__%"],
              ["城市", "城市本身的吸引力", "__%"],
              ["平台", "公司品牌、未来跳槽抬头", "__%"],
              ["直属上级", "上级是不是值得跟的人", "__%"],
              ["行业前景", "5 年后这个行业还在不在", "__%"],
            ].map(([a, b, c]) => (
              <tr key={a} className="border-b border-ink/8">
                <td className="py-1 pr-2 font-semibold text-ink/90">{a}</td>
                <td className="py-1 px-1">{b}</td>
                <td className="py-1 pl-2 text-right">{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] font-semibold text-ink/75 sm:text-[13px]">（用户填完后，基于权重的评分表示例）</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse text-[10px] sm:text-[11px]">
          <thead>
            <tr className="border-b border-ink/15">
              <th className="py-1 pr-1 text-left font-bold">维度</th>
              <th className="py-1 px-0.5 text-left font-bold">权重</th>
              <th className="py-1 px-0.5 text-left font-bold">字节运营</th>
              <th className="py-1 px-0.5 text-left font-bold">加权</th>
              <th className="py-1 px-0.5 text-left font-bold">AI 创业公司产品</th>
              <th className="py-1 pl-0.5 text-left font-bold">加权</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["钱", "20%", "6", "1.2", "8", "1.6"],
              ["成长", "25%", "7", "1.8", "9", "2.3"],
              ["稳定", "15%", "9", "1.4", "4", "0.6"],
              ["...", "...", "...", "...", "...", "..."],
              ["总分", "100%", "", "7.5", "", "7.3"],
            ].map((row, ri) => (
              <tr key={`score-${ri}`} className="border-b border-ink/8">
                {row.map((cell, ci) => (
                  <td key={`score-${ri}-${ci}`} className="py-1 text-ink/85">
                    {cell === "7.5" || cell === "7.3" ? <strong className="text-ink">{cell}</strong> : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        <strong>理性最优解：字节运营，领先 0.2 分。</strong>
      </p>
      <p>
        <strong className="text-cta">反直觉提醒 ⚠️</strong>{" "}
        你刚才说「父母觉得大厂稳定」——这句话里藏着信号。如果你的成长权重真的是 25%，那 AI
        创业公司应该大幅领先才对。但你只给了它 0.2 分的微弱劣势，说明你内心
        <strong>其实在用「稳定」做最终裁决</strong>
        。先冷静 24 小时，重新填一遍权重表。
        <strong>这次诚实一点，不要填「你想成为的人」，填「你现在的真实排序」。</strong>
      </p>
    </>
  ),

  lumen: (
    <>
      <SectionTitle>【场景】</SectionTitle>
      <p>
        凌晨 00:23，用户投完第 12 份简历后，在系统里发了句「又投了一遍，真的累了，不想再改了，反正也不会有人要我」。
      </p>
      <div>
        <SectionTitle>【识别到的信号】</SectionTitle>
        <p>
          你刚投完简历，说「不想再改了」，还加了一句「反正也不会有人要我」。这通常意味着你刚刚经历了一次完整的投简历流程，现在进入了贤者时间，同时那份被拒绝的恐惧又冒出来了。
        </p>
      </div>
      <div>
        <SectionTitle>【命名】</SectionTitle>
        <p>
          你现在的状态是<strong>自证陷阱</strong>
          ——你内心其实还想再试一次，但被「如果再被拒绝会更难受」的预期吓住了，所以先自己先否定自己。
        </p>
      </div>
      <div>
        <SectionTitle>【拆解】</SectionTitle>
        <p>事实是：你刚刚投出了 12 份简历，这个行为本身已经很实在。</p>
        <p>
          你的解读可能加上了：投=必须拿到 offer，不投=废物。中间跳了一级——你默认了「投了=一定要有结果」。
        </p>
      </div>
      <div>
        <SectionTitle>【最小行动】</SectionTitle>
        <p>接下来 10 分钟，只做这一件事：把手机扣在桌上，去倒一杯水喝完。不用想后面投不投的事。</p>
      </div>
      <p className="font-semibold text-ink/90">我在这里。</p>
    </>
  ),
} as const satisfies Record<string, ReactNode>;

export type AgentDemoId = keyof typeof AGENT_DEMOS;
