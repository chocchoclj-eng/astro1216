export type ReportMode = "free" | "A" | "B" | "C";

const aspectCN: Record<string, string> = {
  CONJ: "合相",
  SQR: "刑相",
  OPP: "对冲",
  TRI: "拱相",
  SEX: "六合",
};

export function renderReport(keyConfig: any, mode: ReportMode) {
  const c = keyConfig.core || {};
  const input = keyConfig.input || {};

  const houseTop = keyConfig.houseFocusTop3 || [];
  const inner = keyConfig.innerHardAspectsTop3 || [];
  const sat = keyConfig.saturnAspectsTop || [];
  const outer = keyConfig.outerHardAspectsTop3 || [];
  const nodes = keyConfig.nodes || {};

  const header = `# 你的结构化本命盘报告（${mode.toUpperCase()}）

> 这是一份“结构化解盘”：先给你骨架与重点，再给可执行的理解方式。

## 0｜输入信息
- 昵称：${input.name || "（未填）"}
- 出生时间：${input.birthDateTime || "（未填）"}
- 时区：${input.timezone || "（未填）"}
- 城市：${input.city || "（未填）"}
`;

  // 免费版：骨架 + 解释
  const free = `

## 1｜主轴骨架：你这个人怎么运转（☉☽ASC♄）
- **太阳**（意志与人生主线）：${c.sun?.sign ?? "?"}｜第${c.sun?.house ?? "?"}宫  
  关键词：我要成为谁？我为谁发光？
- **月亮**（情绪与安全感）：${c.moon?.sign ?? "?"}｜第${c.moon?.house ?? "?"}宫  
  关键词：我靠什么安稳？我害怕失去什么？
- **上升**（第一反应与外在气场）：${c.asc?.sign ?? "?"}｜${c.asc?.degree ?? "?"}°  
  关键词：别人第一眼看到的“你”
- **土星**（人生难度条）：${c.saturn?.sign ?? "?"}｜第${c.saturn?.house ?? "?"}宫  
  关键词：你会被迫练成的能力

## 2｜人生主战场（Top3 宫位）
- **Top1：第${houseTop?.[0]?.house ?? "?"}宫**（${(houseTop?.[0]?.bodies ?? []).join("、")}）  
  常见剧情：你的人生能量长期会集中在这里，爱恨都更“重”。
- Top2：第${houseTop?.[1]?.house ?? "?"}宫  
- Top3：第${houseTop?.[2]?.house ?? "?"}宫

## 3｜人格冲突点（内行星硬相位 Top3）
${inner
  .map((a: any) => `- **${a.a} × ${a.b}：${aspectCN[a.type] ?? a.type}**（orb ${a.orb}°）→ 反复卡点 / 情绪触发 / 决策偏差`)
  .join("\n")}

> 使用方式：看到硬相位别慌，它不是“坏”，而是你人生里最能练出“技能树”的地方。

## 4｜土星难度条（你会被逼着升级的那条线）
${sat
  .map((a: any) => `- 土星 × ${a.a === "Saturn" ? a.b : a.a}：${aspectCN[a.type] ?? a.type}（orb ${a.orb}°）→ 延迟、压力、责任、长期主义`)
  .join("\n")}

## 5｜外行星转折机制（人生的觉醒/断舍离/换轨）
${outer
  .map((a: any) => `- ${a.a} × ${a.b}：${aspectCN[a.type] ?? a.type}（orb ${a.orb}°）→ 你在哪些领域会“突然变了一个人”`)
  .join("\n")}

## 6｜灵魂方向（交点）
- 北交点：${nodes?.north?.sign ?? "?"}｜第${nodes?.north?.house ?? "?"}宫（你要走向的成长方向）
- 南交点：${nodes?.south?.sign ?? "?"}｜第${nodes?.south?.house ?? "?"}宫（你很熟练但容易停留的舒适区）
`;

  // 深度版：不同主题加“可执行策略”
  const deepA = `

## A｜关系与亲密（深度版）
你在关系里最容易反复出现的模式，通常来自 **月亮 / 金星 / 七宫 / 土星相位**。
- 你需要的安全感类型（从月亮落宫看）
- 你会被什么样的人吸引（从金星 & 火星看）
- 冲突时你怎么反应（从硬相位看）
- 建议：3 条“关系沟通 SOP”（可执行）
`;

  const deepB = `

## B｜事业与财富（深度版）
事业看 **太阳 / 十宫 / MC / 土星**，赚钱看 **二宫/八宫/木星**。
- 你适合的事业叙事：你靠什么赢？
- 你最容易卡住的天花板：你在哪一关要练？
- 建议：1 个“职业增长路线图”（3 个月版）
`;

  const deepC = `

## C｜灵魂与疗愈（深度版）
看 **海王/冥王/十二宫/交点**：你的人生为何会反复推你走向某个主题？
- 你最深的恐惧来自哪里？（冥王/土星）
- 你最容易迷失在哪里？（海王）
- 你真正的方向是什么？（交点）
- 建议：1 个“自我观察练习”（7 天游记）
`;

  if (mode === "free") return (header + free).trim();
  if (mode === "A") return (header + free + deepA).trim();
  if (mode === "B") return (header + free + deepB).trim();
  return (header + free + deepC).trim();
}
