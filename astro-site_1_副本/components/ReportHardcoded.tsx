"use client";

import React, { useMemo, useState } from "react";

type Level = "low" | "mid" | "high";

type ModuleCardData = {
  key: string;
  icon: string;
  title: string;
  subtitle?: string;
  basics: Array<{ icon: string; label: string; value: string }>;
  oneLiner: string;
  levels: Record<Level, string[]>;
  actions: string[];
};

function Pill({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1 text-sm transition",
        active ? "bg-black text-white border-black" : "bg-white text-zinc-700 hover:bg-zinc-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
    </div>
  );
}

function ModuleCard({ data }: { data: ModuleCardData }) {
  const [level, setLevel] = useState<Level>("mid");

  const levelLabel = useMemo(() => {
    if (level === "low") return "🔻 低阶";
    if (level === "mid") return "🟡 中阶";
    return "✅ 高阶";
  }, [level]);

  return (
    <section className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{data.icon}</span>
            <h2 className="text-lg font-bold text-zinc-900">{data.title}</h2>
          </div>
          {data.subtitle ? <div className="text-sm text-zinc-500">{data.subtitle}</div> : null}
        </div>

        <div className="flex gap-2">
          <Pill active={level === "low"} onClick={() => setLevel("low")}>
            低阶
          </Pill>
          <Pill active={level === "mid"} onClick={() => setLevel("mid")}>
            中阶
          </Pill>
          <Pill active={level === "high"} onClick={() => setLevel("high")}>
            高阶
          </Pill>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {/* 基础结构 */}
        <div className="rounded-2xl bg-zinc-50 p-4">
          <SectionTitle icon="🧩" title="基础结构" />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {data.basics.map((b, idx) => (
              <div key={idx} className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 border">
                <span className="text-base">{b.icon}</span>
                <div className="text-sm text-zinc-700">
                  <span className="font-medium">{b.label}：</span>
                  <span className="font-mono">{b.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 一句话总结 */}
        <div className="rounded-2xl border p-4">
          <SectionTitle icon="💡" title="一句话总结" />
          <p className="mt-3 text-sm leading-6 text-zinc-800">{data.oneLiner}</p>
        </div>

        {/* 分层表现 */}
        <div className="rounded-2xl border p-4">
          <SectionTitle icon="🧠" title={`表现层级 · ${levelLabel}`} />
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-800">
            {data.levels[level].map((x, idx) => (
              <li key={idx}>{x}</li>
            ))}
          </ul>
        </div>

        {/* 可执行建议 */}
        <div className="rounded-2xl border p-4">
          <SectionTitle icon="🛠️" title="可执行建议" />
          <ul className="mt-3 space-y-2">
            {data.actions.map((x, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm leading-6 text-zinc-800">
                <span className="mt-[2px]">✔</span>
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default function ReportHardcoded() {
  // ✅ 这里先写死：后面你再把它替换成 keyConfig + reportApi 的结果
  const hero = {
    name: "choc",
    localTime: "2001-07-20 23:13 (UTC+08:00)",
    city: "上海",
    core: {
      sun: "巨蟹座 · 第4宫",
      moon: "巨蟹座 · 第3宫",
      asc: "白羊座 · 第1宫",
      mc: "摩羯座 · 第10宫",
    },
    statement:
      "你是一个用情感做底盘、用行动做方向的人：在关系与归属感里建立安全感，同时又渴望把这份安全感转化为可被看见的事业结构。",
  };

  const modules: ModuleCardData[] = [
    {
      key: "m1",
      icon: "✨",
      title: "1 主轴骨架",
      subtitle: "你是谁：核心人格与第一印象",
      basics: [
        { icon: "☀️", label: "太阳（自我核心）", value: hero.core.sun },
        { icon: "🌙", label: "月亮（情感需求）", value: hero.core.moon },
        { icon: "⬆️", label: "上升（人格面具）", value: hero.core.asc },
        { icon: "🏔️", label: "中天（事业方向）", value: hero.core.mc },
      ],
      oneLiner: "你外在行动直接、内在情感敏锐，核心动力来自“建立归属与安全”，并倾向把安全感做成一套可持续的事业与生活结构。",
      levels: {
        low: ["做决定摇摆：一边想冲，一边怕失去安全感。", "在亲密关系中更容易情绪化或防御。", "把“被认可”当成安全感来源，容易过度用力。"],
        mid: ["能把情绪转化为行动计划：先安抚自己，再推进目标。", "开始建立边界：既照顾别人也照顾自己。", "能稳定输出：做事有节奏，关系有温度。"],
        high: ["你能成为“稳定的创造者/建设者”：把情感洞察做成长期作品与影响力。", "关系里既深情又独立：能给安全感，也能保持自我。", "事业上形成风格：用结构承载敏感，用成果表达温柔。"],
      },
      actions: ["写下你的“安全感清单”：哪些来自内在，哪些来自外界？每周复盘一次。", "把目标拆成 3 层：今天能做什么、本周能做什么、三个月能做什么。", "关系沟通先说“感受”，再说“需求”，最后说“请求”。"],
    },
    {
      key: "m2",
      icon: "🎯",
      title: "2 人生主战场",
      subtitle: "你的能量最常投入在哪里",
      basics: [
        { icon: "🧭", label: "聚焦领域", value: "沟通/学习/日常节奏" },
        { icon: "⚙️", label: "关键课题", value: "效率与健康边界" },
      ],
      oneLiner: "你的人生推进方式是“边学边做边迭代”：一旦节奏稳定，你会非常能打；节奏崩了，就会情绪拖累执行。",
      levels: {
        low: ["信息过载，越看越焦虑。", "作息混乱导致效率下滑。", "容易被别人的需求牵着走。"],
        mid: ["知道自己需要规律：开始做时间块管理。", "能把学习变成产出：写作/表达/复盘。", "逐步建立“可拒绝清单”。"],
        high: ["形成强个人系统：学习—输出—迭代闭环。", "身体与情绪成为助推器而非阻力。", "你能稳定影响周围人：成为组织者/带头人。"],
      },
      actions: ["每天固定 30 分钟“低刺激时间”：不刷信息，只整理/写作/复盘。", "用一张表记录：睡眠/运动/情绪/产出，连续 14 天看趋势。", "每周主动拒绝 1 件“消耗型社交/任务”。"],
    },
    {
      key: "m3",
      icon: "🔥",
      title: "3 人格冲突点",
      subtitle: "你最容易卡住的内部拉扯",
      basics: [
        { icon: "⚡", label: "冲突主题", value: "想要亲密 vs 需要自由" },
        { icon: "🗣️", label: "表达主题", value: "情绪先行 vs 理性控制" },
      ],
      oneLiner: "你的冲突常发生在‘我想靠近’与‘我怕失控’之间：靠近会更敏感，退开又会更空。",
      levels: {
        low: ["沟通容易情绪化：先怼/先冷，再后悔。", "关系里要么过度投入，要么突然抽离。", "对自己要求高，反而更不敢开始。"],
        mid: ["开始识别触发点：知道自己什么时候会失控。", "愿意解释自己的情绪来源。", "能把冲突当成“升级关系”的机会。"],
        high: ["你能把张力变成魅力：表达直接但不伤人。", "关系里既有激情也有合作。", "你具备强说服力与感染力：适合做内容/演讲/带团队。"],
      },
      actions: ["冲动开口前做 10 秒规则：先复述对方一句话，再表达自己。", "把你的“雷点”写下来：触发—想法—反应—更好的反应。", "每周一次“主动脆弱”：用一句话表达真实需求（不指责）。"],
    },
    {
      key: "m4",
      icon: "⛰️",
      title: "4 土星难度条",
      subtitle: "你必须练出来的硬功夫",
      basics: [
        { icon: "🧱", label: "关键词", value: "结构 / 纪律 / 长期主义" },
        { icon: "🪙", label: "价值感", value: "别用外界评价定义自己" },
      ],
      oneLiner: "你最终会赢在“长期结构”：越是按周期稳定输出，你的自信和价值感越牢。",
      levels: {
        low: ["完美主义拖延：不够好就不做。", "把物质/结果当唯一安全感。", "关系里慢热但一旦投入就很难抽身。"],
        mid: ["愿意用小步积累：每天都做一点。", "开始管理资源：钱/时间/精力。", "能在关系里稳定承诺，但不过度控制。"],
        high: ["你可以把兴趣打磨成作品/职业：持久且可复利。", "价值感来自内在秩序：不再被评价牵动。", "你会成为可靠的人：别人愿意把事交给你。"],
      },
      actions: ["选一个领域做 30 天游泳式练习：每天 20 分钟固定输出。", "建立“可持续的金钱规则”：先存后花/预算上限/投资学习。", "每次想放弃时，改成“只做 10 分钟”。"],
    },
    {
      key: "m5",
      icon: "🌌",
      title: "5 外行星转折机制",
      subtitle: "人生大事件如何推动你蜕变",
      basics: [
        { icon: "🧨", label: "常见触发", value: "权力/控制/身份重塑" },
        { icon: "🕯️", label: "深层主题", value: "信任、边界、重生" },
      ],
      oneLiner: "你的关键转折往往来自强烈的外部压力：它逼你重新定义‘我是谁’以及‘我不再接受什么’。",
      levels: {
        low: ["在压力下控制欲变强，容易走极端。", "经历身份危机：否定自己或否定世界。", "为了安全感而抓住不该抓的东西。"],
        mid: ["学会用边界保护自己：不再讨好。", "能把危机当成升级：我该改变什么？", "对自己的阴影更诚实。"],
        high: ["凤凰型成长：越难你越强。", "你能用力量影响别人，但不压迫。", "适合做变革型角色：重组系统、带团队、做品牌。"],
      },
      actions: ["列出 3 条底线：关系底线/工作底线/自我底线。", "每次压力来临，写下：我在害怕什么？我真正要什么？", "练习‘说不’：从小事开始拒绝。"],
    },
    {
      key: "m6",
      icon: "🧭",
      title: "6 灵魂方向",
      subtitle: "你长期会走向哪里",
      basics: [
        { icon: "🌿", label: "方向关键词", value: "连接 / 表达 / 疗愈" },
        { icon: "📚", label: "成长方式", value: "把内在洞察变成作品" },
      ],
      oneLiner: "你的灵魂方向是：把敏感与洞察转化为表达，把表达转化为连接——最终成为能影响他人的那个人。",
      levels: {
        low: ["沉溺幻想或过度独处，难以落地。", "社交活跃但内心孤独。", "对意义执念太强导致行动停滞。"],
        mid: ["能在独处与表达间切换：沉淀后输出。", "把感受变成内容/作品。", "开始找到“我的人”和“我的场”。"],
        high: ["你能成为桥梁：连接内在世界与现实世界。", "你的表达会疗愈别人：写作/咨询/教育/内容。", "你会拥有稳定的影响力与社群磁场。"],
      },
      actions: ["做一个“内容容器”：Notion/公众号/小红书，固定输出你的洞察。", "每周一次深度独处：散步/冥想/写梦。", "把你最痛的经历写成一段可分享的故事。"],
    },
  ];

  return (
    <div className="space-y-8">
      {/* 顶部 tabs（先做 UI，不做逻辑） */}
      <div className="flex flex-wrap gap-2">
        <Pill active>免费版</Pill>
        <Pill>深度A</Pill>
        <Pill>深度B</Pill>
        <Pill>深度C</Pill>
      </div>

      {/* Hero */}
      <section className="rounded-3xl border bg-white p-7 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-zinc-900">你的结构化本命盘报告</h1>
            <div className="text-sm text-zinc-600">
              <span className="font-medium text-zinc-800">{hero.name}</span> · {hero.localTime} · {hero.city}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-zinc-50 px-4 py-3">
                <div className="text-xs text-zinc-500">☀️ 太阳</div>
                <div className="mt-1 text-sm font-semibold">{hero.core.sun}</div>
              </div>
              <div className="rounded-2xl bg-zinc-50 px-4 py-3">
                <div className="text-xs text-zinc-500">🌙 月亮</div>
                <div className="mt-1 text-sm font-semibold">{hero.core.moon}</div>
              </div>
              <div className="rounded-2xl bg-zinc-50 px-4 py-3">
                <div className="text-xs text-zinc-500">⬆️ 上升</div>
                <div className="mt-1 text-sm font-semibold">{hero.core.asc}</div>
              </div>
              <div className="rounded-2xl bg-zinc-50 px-4 py-3">
                <div className="text-xs text-zinc-500">🏔️ 中天</div>
                <div className="mt-1 text-sm font-semibold">{hero.core.mc}</div>
              </div>
            </div>
          </div>

          <div className="lg:max-w-xl">
            <div className="rounded-2xl bg-zinc-900 px-5 py-4 text-white">
              <div className="text-xs opacity-80">总论 · 一句话总结</div>
              <div className="mt-2 text-sm leading-6">{hero.statement}</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 模块：桌面 2 列 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {modules.slice(0, 4).map((m) => (
          <ModuleCard key={m.key} data={m} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {modules.slice(4).map((m) => (
          <ModuleCard key={m.key} data={m} />
        ))}
      </div>

      {/* 底部深入模块（先 UI） */}
      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="text-base font-bold text-zinc-900">深入报告：探索个人潜能</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <button className="rounded-2xl border bg-rose-500 px-4 py-4 text-white font-semibold">
            ❤️ 情感与亲密 A
          </button>
          <button className="rounded-2xl border bg-emerald-600 px-4 py-4 text-white font-semibold">
            💼 事业与财富 B
          </button>
          <button className="rounded-2xl border bg-violet-600 px-4 py-4 text-white font-semibold">
            🧠 心理与整合 C
          </button>
        </div>
      </section>
    </div>
  );
}
