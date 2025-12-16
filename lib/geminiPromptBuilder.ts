// lib/geminiPromptBuilder.ts
import { KeyConfig } from "@/types/astrology";

export function buildPrompt(keyConfig: KeyConfig, mode: "free" | "A" | "B" | "C") {
  const inputBlock = `
【输入信息】
- 昵称：${keyConfig.input.name || "未提供"}
- 出生日期时间（本地）：${keyConfig.input.birthDateTime}
- 时区：${keyConfig.input.timezone || "未提供"}
- 出生城市：${keyConfig.input.city || "未提供"}（lat ${keyConfig.input.lat}, lon ${keyConfig.input.lon}）
- 出生日期时间（UTC）：${keyConfig.input.birthDateTimeUTC}
`.trim();

  const core = keyConfig.core;
  const corePlacements = `
【星盘核心数据】
- 太阳：${core.sun.sign} ${core.sun.degree}° / 第${core.sun.house}宫
- 月亮：${core.moon.sign} ${core.moon.degree}° / 第${core.moon.house}宫
- 上升：${core.asc.sign} ${core.asc.degree}° 
- 中天：${core.mc.sign} ${core.mc.degree}° / 第10宫
- 土星：${core.saturn.sign} ${core.saturn.degree}° / 第${core.saturn.house}宫

【北交点】
- 北交：${keyConfig.nodes.north.sign} ${keyConfig.nodes.north.degree}° / 第${keyConfig.nodes.north.house}宫
- 南交：${keyConfig.nodes.south.sign} ${keyConfig.nodes.south.degree}° / 第${keyConfig.nodes.south.house}宫
`.trim();

  const conflicts =
    (keyConfig.innerHardAspectsTop3 || [])
      .map((a) => `- ${a.a} ${a.type} ${a.b}（orb ${a.orb.toFixed(2)}°）`)
      .join("\n") || "- 无（或数据不足）";

  const saturnAspects =
    (keyConfig.saturnAspectsTop || [])
      .map((a) => `- Saturn ${a.type} ${a.b}（orb ${a.orb.toFixed(2)}°）`)
      .join("\n") || "- 无（或数据不足）";

  const outer =
    (keyConfig.outerHardAspectsTop3 || [])
      .map((a) => `- ${a.a} ${a.type} ${a.b}（orb ${a.orb.toFixed(2)}°）`)
      .join("\n") || "- 无（或数据不足）";

  const systemInstruction = `
你是一位专业的结构化占星解读专家（偏“清醒、可执行、非迷信”）。
你必须输出一份**结构化报告**，并严格遵守以下规则：

【硬性规则（不允许违反）】
1) 必须使用 Markdown。
2) 必须输出且仅输出以下 7 个 H2 模块，标题必须一字不差：
   - ## 0 输入信息
   - ## 1 主轴骨架
   - ## 2 人生主战场
   - ## 3 人格冲突点
   - ## 4 土星难度条
   - ## 5 外行星转折机制
   - ## 6 灵魂方向
3) 每个模块必须包含固定 5 段，顺序固定，标题必须一字不差：
   - **结论一句话**
   - **证据点**（用 - 列表，引用我给你的配置字段）
   - **低阶表现**
   - **高阶表现**
   - **可执行建议**（2-3 条，用 - 列表）
4) 每个模块之间必须空一行；每个小段之间必须空一行。
5) 禁止输出 JSON、debug、代码块、免责声明长篇废话；不要重复模块；不要把模块合并。

【给你的星盘信息】
${inputBlock}

${corePlacements}

【主要内在冲突相位（Top3）】
${conflicts}

【土星相关相位（Top）】
${saturnAspects}

【外行星硬相位（Top3）】
${outer}
`.trim();

  // 3 个付费深度模式（A/B/C）你之前按钮要“都要”，这里给你三个 prompt 的差异
  let promptContent = "";
  if (mode === "free") {
    promptContent = `请生成完整的 0~6 报告，整体深度适中，但必须完整。`;
  }
  if (mode === "A") {
    promptContent = `请生成完整的 0~6 报告，但整体更“直白+落地”，少形容词，多策略。`;
  }
  if (mode === "B") {
    promptContent = `请生成完整的 0~6 报告，并在 ## 2 / ## 4 模块把“事业路径/职业系统站位/赚钱方式/消耗点”讲得更深。`;
  }
  if (mode === "C") {
    promptContent = `请生成完整的 0~6 报告，并在 ## 3 / ## 6 模块把“人格矛盾→修炼路径→长期人设/关系模式”讲得更深。`;
  }

  return `${systemInstruction}\n\n${promptContent}`.trim();
}
