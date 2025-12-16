// app/api/report/route.ts (V10 - 整合七项细分结构和补救逻辑)
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

type Mode = "free" | "A" | "B" | "C";
type KeyConfigPlaceholder = any; 
type ReportModule = { id: number; title: string; markdown: string };

function compactKeyConfig(keyConfig: KeyConfigPlaceholder) {
  const c = keyConfig?.core ?? {};
  
  const pickAspects = (arr: any[]) =>
    (arr ?? []).slice(0, 6).map((a: any) => ({
      a: a.a, 
      b: a.b,
      type: a.type,
      orb: a.orb,
    }));

  const topHouses = (keyConfig?.houseFocusTop3 ?? []).map((x: any) => ({
    house: x.house,
    score: x.score,
    bodies: x.bodies,
  }));

  return {
    input: keyConfig?.input ?? {},
    core: { 
      sun: c.sun, moon: c.moon, asc: c.asc, mc: c.mc, 
      saturn: c.saturn, 
    },
    houseFocusTop3: topHouses,
    innerHardAspects: pickAspects(keyConfig?.innerHardAspectsTop3), 
    saturnAspects: pickAspects(keyConfig?.saturnAspectsTop), 
    outerHardAspects: pickAspects(keyConfig?.outerHardAspectsTop3), 
    nodes: keyConfig?.nodes ?? undefined,
  };
}

// --- Markdown 解析工具函数：将字符串分割成 modules 数组 ---
function parseMarkdownToStructuredData(markdown: string): { summary: string; modules: ReportModule[] } {
    const modules: ReportModule[] = [];
    let summary = "";
    
    const cleanMarkdown = markdown.replace(/---/g, '').trim(); 
    const parts = cleanMarkdown.split('##').map(p => p.trim()).filter(p => p.length > 0);

    parts.forEach(part => {
        const lines = part.split('\n');
        const titleLine = lines[0] || "";

        const titleMatch = titleLine.match(/^(\d+)\s*(.*)/); 
        
        if (titleMatch) {
            const id = parseInt(titleMatch[1]);
            const title = `## ${titleMatch[1]} ${titleLine.trim()}`; 
            
            const markdownContent = lines.slice(1).join('\n').trim();
            
            // 提取 Summary
            if (id === 0) {
                // 修正：匹配结论一句话的逻辑，支持多行
                const conclusionMatch = markdownContent.match(/1\)\s*结论一句话\s*💡\s*([\s\S]*)/); 
                summary = conclusionMatch ? conclusionMatch[1].split('\n')[0].trim() : markdownContent.split('\n\n')[0].trim();
            }

            modules.push({ id, title, markdown: markdownContent });
        }
    });
    modules.sort((a, b) => a.id - b.id);

    return { summary, modules };
}

// 辅助函数：将英文星座名转换为中文 (用于提示词)
const signMap: Record<string, string> = {
    Aries: '白羊座', Taurus: '金牛座', Gemini: '双子座', Cancer: '巨蟹座', 
    Leo: '狮子座', Virgo: '处女座', Libra: '天秤座', Scorpio: '天蝎座', 
    Sagittarius: '射手座', Capricorn: '摩羯座', Aquarius: '水瓶座', Pisces: '双鱼座'
};

function translateSign(englishSign: string): string {
    return signMap[englishSign] || englishSign;
}

function buildPrompt(keyConfig: KeyConfigPlaceholder, mode: Mode): string {
  const mini = compactKeyConfig(keyConfig);

  // ⚠️ 修复：在传入 JSON 之前，将核心星座名翻译成中文，强制 AI 引用中文
  if (mini.core) {
      mini.core.sun.sign = translateSign(mini.core.sun.sign);
      mini.core.moon.sign = translateSign(mini.core.moon.sign);
      mini.core.asc.sign = translateSign(mini.core.asc.sign);
      mini.core.mc.sign = translateSign(mini.core.mc.sign);
      mini.core.saturn.sign = translateSign(mini.core.saturn.sign);
  }
  if (mini.nodes && mini.nodes.north) {
      mini.nodes.north.sign = translateSign(mini.nodes.north.sign);
      mini.nodes.south.sign = translateSign(mini.nodes.south.sign);
  }


  const base = `
你是一位专业的“结构化占星解读”写作助手。你的输出必须是清晰、清醒、可执行的。

【格式要求】
1. **必须使用 Markdown 输出。**
2. **每个模块结束后，必须使用 '---' 作为分隔符。**
3. **在 H2 标题（##）和 H3 标题（1), 2), 3)...）的文本中，可以加入少量且相关的 Emoji 来增强阅读体验。**

【输入数据（已压缩 - 核心星座已翻译成中文）】
${JSON.stringify(mini, null, 2)}

【输出模块和格式模板】
- 必须包含所有 H2 标题：## 0 输入信息 📝 到 ## 6 灵魂方向 🧭。
- 每个模块都严格遵循以下七项小标题结构（顺序固定）：
  1) 结论一句话 (💡 Emoji引导)
  2) 证据点 (🔬 Emoji引导)
  3) 🔸 (仅输出内容，作为基础表现的标记) 👈 新增
  4) 🔻 (仅输出内容，作为低阶表现的标记)
  5) 🟡 (仅输出内容，作为中阶表现的标记) 👈 新增
  6) ✅ (仅输出内容，作为高阶表现的标记)
  7) 🛠️ (Emoji引导，2-3条，清晰具体，仅输出内容，作为可执行建议的标记)

【格式细节要求 - 关键修复】
1. **中文星座名**：在所有论述中，提到星座时，必须使用 **中文名**（例如：巨蟹座、摩羯座），**不要使用英文名或缩写**。
2. **模块 0 输入信息**：在“证据点”中，请用 **Markdown 列表**（星号 *）来清晰地列出 name, birthDateTime, city, lat, lon 等所有输入信息。**只输出数据和字段名，不要再添加“姓名”、“出生时间”等中文标签。**
3. **表现力模块（3)🔸, 4)🔻, 5)🟡, 6)✅, 7)🛠️）**：在这些标记下，请严格使用 **Markdown 列表**（星号 *）来描述要点，**不要输出任何中文标题**，只输出内容。
4. **证据点 (🔬) 简化**：在 **模块 1~6** 的证据点中，**只引用原始 JSON 字段，不要添加任何描述性文字，也不要重复解释该数据代表的意义。** （例如，只输出 \`core.sun.sign: 巨蟹座\`，不要输出“太阳巨蟹座代表你的核心人格...”）。
5. **⚠️ 重点关注模块 6 (灵魂方向)**：该模块必须完整，不得中断。

【深度模式指令】
如果 mode 不是 'free'，请只输出针对该模式的详细报告内容，不要包含 0-6 模块。
`;

  const modeExtra: Record<Mode, string> = {
    free: `【深度聚焦】聚焦报告的主要骨架。`,
    A: `【深度A：关系/亲密 ❤️】额外聚焦月亮、金星、七宫相关线索，给出可执行的关系模式建议。`,
    B: `【深度B：事业/财富 💼】额外聚焦 MC/十宫、二宫、土星，输出职业系统站位和避免消耗的策略。`,
    C: `【深度C：心理/创伤与整合 🧠】额外聚焦土星相位、内行星硬相位，输出：触发点→旧模式→新模式→具体练习（可执行）。`,
  };

  return base + "\n" + modeExtra[mode];
}

function modelFor(mode: Mode) {
  return "gemini-2.5-flash";
}

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --- 503 错误重试的 callGemini ---
async function callGemini(systemInstruction: string, userPrompt: string, mode: Mode) {
    const MAX_RETRIES = 5; 
    let delayTime = 5000;
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: modelFor(mode),
                contents: [{ role: "user", parts: [{ text: userPrompt }] }],
                config: {
                    systemInstruction,
                    temperature: 0.4,
                    maxOutputTokens: 3500,
                },
            });
            return response;

        } catch (e: any) {
            if (e.status === 503 && attempt < MAX_RETRIES - 1) {
                console.warn(`Gemini API 503 错误，尝试在 ${delayTime / 1000} 秒后重试... (Attempt ${attempt + 1}/${MAX_RETRIES})`);
                await delay(delayTime);
                delayTime *= 2; 
            } else {
                throw e; 
            }
        }
    }
    throw new Error("达到最大重试次数，仍无法连接到 Gemini API。"); 
}

const REQUIRED = [
  "## 0 输入信息", "## 1 主轴骨架", "## 2 人生主战场", "## 3 人格冲突点",
  "## 4 土星难度条", "## 5 外行星转折机制", "## 6 灵魂方向",
];

function missingHeadings(text: string) {
  return REQUIRED.filter((h) => !text.includes(h));
}

function mergeAndDeduplicate(originalText: string, newText: string): string {
    if (!newText) return originalText;
    
    const newHeadings = newText.match(/##\s*\d+\s*(.*?)(?:\n|$)/g) || [];
    let textToMerge = originalText;

    newHeadings.forEach(newH => {
        const idMatch = newH.match(/##\s*(\d+)/);
        if (idMatch) {
            const id = idMatch[1];
            const regex = new RegExp(`##\\s*${id}\\s*.*?(?=(##\\s*\\d+|\\s*$))`, 'gs');
            textToMerge = textToMerge.replace(regex, '');
        }
    });

    return (textToMerge.trim() + '\n\n' + newText.trim()).trim();
}


export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const { keyConfig, mode = "free" } = (await req.json()) as {
      keyConfig?: KeyConfigPlaceholder;
      mode?: Mode;
    };

    const systemInstruction = buildPrompt(keyConfig, mode); 
    const userPrompt = `按系统指令输出完整报告。${mode === 'free' ? '必须覆盖所有 SOP 模块（##0~##6），不要漏。' : ''}`;

    let text = "";
    // 1. 尝试第一次生成，内置重试
    const r1 = await callGemini(
        systemInstruction,
        userPrompt,
        mode
    );
    text = (r1.text ?? "").trim();

    // 🚀 核心修复：检查并补全所有缺失模块 (通用逻辑)
    if (mode === 'free') {
        const miss1 = missingHeadings(text);
        
        // 增加对文本长度的检查，如果文本太短 (例如小于 1000 字符)，也可能意味着中断
        if (miss1.length > 0 || text.length < 1000) {
            
            const modulesToRescue = miss1.length > 0 ? miss1.join(", ") : "Text Truncation Detected. Please re-output starting from the last complete module.";
            
            console.warn(`检测到缺失/中断: ${modulesToRescue}. 尝试补救...`);

            const rescuePrompt = `你上一次输出不完整，缺失或中断在以下模块：${modulesToRescue}。请严格遵循七项小标题结构，只输出这些“缺失模块”或“中断点”的内容，从对应 ## 标题开始。`;

            const r2 = await callGemini(systemInstruction, rescuePrompt, mode);
            const add = (r2.text ?? "").trim();
            text = mergeAndDeduplicate(text, add);
        }
    }


    if (!text) {
      return NextResponse.json({ error: "Gemini returned empty text after rescue" }, { status: 502 });
    }

    // 3. 【核心修复】解析 Markdown 字符串为结构化 JSON
    if (mode === 'free') {
        const { summary, modules } = parseMarkdownToStructuredData(text);
        
        // 🚀 最终修复：移除 Module 0 的数据，因为它在前端已硬编码
        const finalModules = modules.filter(m => m.id !== 0); 
        
        return NextResponse.json({ 
            summary, 
            modules: finalModules, 
            deep: {} 
        });
    } else {
        // 深度报告模式：直接返回深度文本
        const deepKey = mode as 'A' | 'B' | 'C';
        return NextResponse.json({ 
            summary: "", 
            modules: [], 
            deep: { [deepKey]: text } 
        });
    }

  } catch (e: any) {
    console.error("REPORT API ERROR:", e);
    return NextResponse.json({ error: e?.message || "Report API failed" }, { status: 500 });
  }
}