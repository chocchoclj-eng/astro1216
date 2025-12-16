// components/ReportShell.tsx (V21 - 修复 DEEP_BUTTONS 未定义错误)
"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// --- 辅助函数：数据处理和翻译 ---
const SIGN_MAP: Record<string, string> = {
    Aries: '白羊座', Taurus: '金牛座', Gemini: '双子座', Cancer: '巨蟹座', 
    Leo: '狮子座', Virgo: '处女座', Libra: '天秤座', Scorpio: '天蝎座', 
    Sagittarius: '射手座', Capricorn: '摩羯座', Aquarius: '水瓶座', Pisces: '双鱼座'
};

const translateSign = (englishSign: string): string => {
    return SIGN_MAP[englishSign] || englishSign;
};


// --- ReportContent: 渲染 AI 文本内容 (保持不变) ---
function ReportContent({ 
    moduleId, 
    markdown, 
    isSkeleton = false, 
}: { 
    moduleId: number | string; 
    markdown: string; 
    isSkeleton?: boolean;
}) {
    // 渲染骨架
    if (isSkeleton) {
        return (
            <div className="space-y-2 pt-2 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-11/12"></div>
                <div className="h-4 bg-gray-200 rounded w-10/12"></div>
            </div>
        );
    }

    let processedMarkdown = markdown;

    // 1. 替换 1) 和 2) 的标题 (硬编码标题)
    processedMarkdown = processedMarkdown.replace(/^1\)\s*结论一句话\s*💡\s*/gm, '#### 结论一句话 💡\n');
    processedMarkdown = processedMarkdown.replace(/^2\)\s*证据点\s*🔬\s*/gm, '#### 证据点 🔬\n');

    // 2. 替换 3) ~ 7) 的标题 (硬编码中文)
    if (Number(moduleId) > 0) {
        processedMarkdown = processedMarkdown.replace(/^3\)\s*🔸\s*/gm, '#### 基础表现 🔸\n'); 
        processedMarkdown = processedMarkdown.replace(/^4\)\s*🔻\s*/gm, '#### 低阶表现 🔻\n'); 
        processedMarkdown = processedMarkdown.replace(/^5\)\s*🟡\s*/gm, '#### 中阶表现 🟡\n'); 
        processedMarkdown = processedMarkdown.replace(/^6\)\s*✅\s*/gm, '#### 高阶表现 ✅\n');
        processedMarkdown = processedMarkdown.replace(/^7\)\s*🛠️\s*/gm, '#### 可执行建议 🛠️\n');
        
        processedMarkdown = processedMarkdown.replace(/^\d\)\s*/gm, '');
    }
    
    // 3. 关键清理
    if (moduleId === 0 || moduleId === 1) {
        processedMarkdown = processedMarkdown.replace(/(核心自我|人格面具|情感需求|事业方向|你的核心人格|你的公众形象)：.*?\n/g, ''); 
    }

    return (
        <div className="prose prose-sm prose-zinc max-w-none prose-headings:scroll-mt-24">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{processedMarkdown}</ReactMarkdown>
        </div>
    );
}


// --- 辅助函数：硬编码数据渲染 (保持不变) ---
function renderHardcodedModule0(keyConfig: any) {
    const input = keyConfig?.input;
    if (!input) return null;

    return (
        <div className="text-sm text-gray-700 space-y-1">
            <div className="mt-2 grid grid-cols-2 gap-x-4">
                <p><strong>姓名:</strong> {input.name || 'N/A'}</p>
                <p><strong>出生日期:</strong> {input.birthDateTime.split('T')[0]}</p>
                <p><strong>出生时间:</strong> {input.birthDateTime.split('T')[1].slice(0, 5)} (UTC{input.utcOffset})</p>
                <p><strong>出生地点:</strong> {input.city} (Lat: {input.lat}, Lon: {input.lon})</p>
            </div>
        </div>
    );
}

function renderHardcodedCoreConfig(keyConfig: any) {
    const core = keyConfig?.core;
    if (!core) return null;
    
    const sunSign = translateSign(core.sun.sign);
    const moonSign = translateSign(core.moon.sign);
    const ascSign = translateSign(core.asc.sign);
    const mcSign = translateSign(core.mc.sign);

    return (
        <div className="mt-4 border-t border-gray-100 pt-4">
             <h4 className="font-bold text-gray-800 mb-2">核心星盘配置（四大主轴）</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                <p><strong>☀️ 太阳 (自我核心)</strong>: {sunSign} 落在第 {core.sun.house} 宫。</p>
                <p><strong>🌙 月亮 (情感需求)</strong>: {moonSign} 落在第 {core.moon.house} 宫。</p>
                <p><strong>⬆️ 上升 (人格面具)</strong>: {ascSign} 落在第 1 宫。</p>
                <p><strong>🎯 中天 (事业方向)</strong>: {mcSign} 落在第 10 宫。</p>
            </div>
        </div>
    );
}


// --- 主 ReportShell 组件和结构定义 ---
type Mode = "free" | "A" | "B" | "C";
type ReportModule = { id: number; title: string; markdown: string };
type DeepReport = { A?: string; B?: string; C?: string };
type DeepMode = 'A' | 'B' | 'C';

const MODULE_ICONS: Record<number, string> = {
    0: '📝', 1: '✨', 2: '🎯', 3: '🔥', 4: '⛰️', 5: '🌌', 6: '🧭',
};

// 深度报告按钮配置 (必须在 ReportShell 组件外部定义，否则编译会失败)
const DEEP_BUTTONS: { mode: DeepMode; label: string; icon: string; color: string }[] = [
    { mode: 'A', label: '关系 / 情感 A', icon: '💗', color: 'bg-pink-500 hover:bg-pink-600' },
    { mode: 'B', label: '事业 / 财富 B', icon: '💼', color: 'bg-amber-500 hover:bg-amber-600' },
    { mode: 'C', label: '灵魂 / 创伤 C', icon: '🧿', color: 'bg-indigo-600 hover:bg-indigo-700' },
];

interface ReportShellProps {
    summary: string;
    modules: ReportModule[];
    deep: DeepReport;
    setMode: (mode: Mode) => void; 
    keyConfig: any; 
    loading: boolean;
    contentAvailable: boolean; 
}

export default function ReportShell({ summary, modules, deep, setMode, keyConfig, loading, contentAvailable }: ReportShellProps) {
    const [activeDeepMode, setActiveDeepMode] = useState<DeepMode | null>(null);
    const [expandedModuleId, setExpandedModuleId] = useState<number | null>(null);
    
    const toggleModule = (id: number) => {
        if (contentAvailable || id === expandedModuleId) {
            setExpandedModuleId(expandedModuleId === id ? null : id);
        }
    };

    const handleDeepClick = (mode: DeepMode) => {
        setActiveDeepMode(mode);
        if (!deep[mode]) {
            setMode(mode);
        }
    };
    
    const activeDeepContent = activeDeepMode ? deep[activeDeepMode] : null;

    // --- 顶部身份卡和总结 ---
    const identityCard = (
         <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-3 text-indigo-800">
                   {keyConfig?.input?.name || '用户'} 的结构化本命盘报告
                </h3>
                {renderHardcodedModule0(keyConfig)} 
                
                {renderHardcodedCoreConfig(keyConfig)} 
            </div>

            <div className="rounded-2xl border-l-4 border-indigo-500 bg-indigo-50 p-4 shadow-md">
                <h4 className="font-bold text-indigo-800 flex items-center gap-2">🧠 一句话总览</h4>
                
                {loading && !summary ? (
                     <div className="mt-2 text-base animate-pulse h-4 bg-indigo-200 rounded w-3/4"></div>
                ) : (
                    <p className="text-indigo-700 mt-2 text-base">
                        {summary || (contentAvailable ? '内容生成失败或为空' : 'AI内容正在加载中，请稍候...')}
                    </p>
                )}
            </div>
        </div>
    );


    return (
        <div className="space-y-8">
            {/* 顶部身份和总结 */}
            {identityCard}

            {/* 3. 核心模块网格 (单列/双列布局优化) */}
            <h2 className="text-2xl font-bold pt-4 border-t">核心模块拆解 (6 大维度)</h2>
            
            {/* 布局修正：sm (640px) 以上即双列 */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
                {modules
                    .filter(module => module.id >= 1) 
                    .map(module => {
                        const isExpanded = expandedModuleId === module.id;
                        const moduleLoading = loading && !contentAvailable;

                        const moduleSummary = module.markdown.match(/结论一句话\s*💡\s*([^\n]+)/)?.[1]?.trim();
                        
                        return (
                            <div 
                                key={module.id} 
                                className={`p-5 border rounded-xl shadow-lg cursor-pointer transition 
                                            ${isExpanded ? 'border-indigo-500 shadow-xl' : 'hover:shadow-xl hover:border-indigo-400'}
                                            ${moduleLoading ? 'bg-gray-50 border-gray-300' : 'bg-white'}`}
                                onClick={() => toggleModule(module.id)}
                            >
                                <h3 className="text-xl font-extrabold text-indigo-700 flex items-center gap-2">
                                    <span className="text-2xl">{MODULE_ICONS[module.id] || '❓'}</span>
                                    {module.title.replace(/##\s*\d+\s*/, '').trim()} 
                                </h3>
                                
                                <p className={`text-sm mt-2 mb-3 border-b pb-2 ${moduleLoading ? 'bg-gray-200 h-4 rounded w-4/5 animate-pulse' : 'text-gray-600'}`}>
                                    {moduleLoading 
                                        ? '' 
                                        : (moduleSummary || "点击展开查看详细解读")
                                    }
                                </p>
                                
                                {isExpanded && (
                                    <div className="mt-4 border-t pt-4">
                                        
                                        <ReportContent 
                                            moduleId={module.id} 
                                            markdown={module.markdown} 
                                            isSkeleton={moduleLoading} 
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
            </div>

            {/* --- 4. 深度报告选项区 (底部) --- */}
            <h2 className="text-2xl font-bold pt-4 border-t">深入报告：探索个人潜能</h2>
            <div className="grid grid-cols-3 gap-4">
                {DEEP_BUTTONS.map(({ mode, label, icon, color }) => {
                    // 修复 Bug: 确保 mode 是 DeepMode 之一，并且存在于 deep 对象中
                    const contentReady = !!deep[mode as DeepMode];

                    return (
                        <button 
                            key={mode}
                            onClick={() => handleDeepClick(mode)}
                            className={`p-4 rounded-xl text-white disabled:bg-gray-400 disabled:cursor-not-allowed flex flex-col items-center justify-center space-y-1 transition shadow-md ${color} ${loading && activeDeepMode === mode ? 'animate-pulse' : ''}`}
                            disabled={!contentReady && activeDeepMode === mode} 
                        >
                            <span className="text-2xl">{icon}</span>
                            <span className="text-sm font-semibold">
                                {activeDeepMode === mode && loading ? "生成中..." : label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* 5. 深度报告内容区 */}
            {activeDeepContent && (
                <div className="mt-8 border-t pt-4">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                        深度解读 ({DEEP_BUTTONS.find(b => b.mode === activeDeepMode)?.label})
                    </h2>
                    <div className="p-6 border border-indigo-200 bg-indigo-50 rounded-xl shadow-inner">
                        <ReportContent
                            moduleId={activeDeepMode || ''}
                            markdown={activeDeepContent || ''}
                            isSkeleton={loading && activeDeepMode !== undefined}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}