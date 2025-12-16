// app/report/[id]/report-client.tsx (最终修复版 V8 - 骨架逻辑)
"use client";

import React, { useEffect, useRef, useState } from "react";
import ReportShell from "@/components/ReportShell"; 
import { usePathname } from "next/navigation";

type Mode = "free" | "A" | "B" | "C";

// 匹配后端返回的结构
type ReportModule = { id: number; title: string; markdown: string };
type DeepReport = { A?: string; B?: string; C?: string };
type ReportDTO = {
  summary: string;
  modules: ReportModule[];
  deep: DeepReport;
};

// 预定义模块骨架（用于在 AI 内容未加载时渲染框架）
const SKELETON_MODULES: ReportModule[] = [
    { id: 0, title: '## 0 输入信息 📝', markdown: '' },
    { id: 1, title: '## 1 主轴骨架 ✨', markdown: '' },
    { id: 2, title: '## 2 人生主战场 🎯', markdown: '' },
    { id: 3, title: '## 3 人格冲突点 🔥', markdown: '' },
    { id: 4, title: '## 4 土星难度条 ⛰️', markdown: '' },
    { id: 5, title: '## 5 外行星转折机制 🌌', markdown: '' },
    { id: 6, title: '## 6 灵魂方向 🧭', markdown: '' },
];


export default function ReportClient({ reportId }: { reportId: string }) {
  const pathname = usePathname();
  
  const finalReportId = React.useMemo(() => {
    if (reportId && reportId !== '[id]') return reportId;
    const segments = pathname.split('/');
    return segments[segments.length - 1];
  }, [reportId, pathname]);

  const [mode, setMode] = useState<Mode>("free");
  const [keyConfig, setKeyConfig] = useState<any>(null); 
  const [data, setData] = useState<ReportDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const lastRequestRef = useRef<string>("");

  // 1) 从 localStorage 读取 keyConfig
  useEffect(() => {
    if (!finalReportId || finalReportId === 'report' || finalReportId === '[id]') return;
    const raw = localStorage.getItem(`chart:${finalReportId}`);
    if (!raw) {
      setErr("未找到报告数据，请返回首页重新生成。");
      return;
    }
    setKeyConfig(JSON.parse(raw));
  }, [finalReportId]);

  // 2) 请求 /api/report 拿结构化输出
  useEffect(() => {
    if (!keyConfig || !finalReportId) return;

    const requestKey = `${finalReportId}:${mode}`;
    if (lastRequestRef.current === requestKey) return;
    lastRequestRef.current = requestKey;

    setLoading(true);
    setErr("");

    fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyConfig, mode }),
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d?.error || "生成失败");

        setData(prevData => {
            const newData = {
                summary: d.summary || prevData?.summary || "",
                modules: Array.isArray(d.modules) ? d.modules : prevData?.modules || [],
                deep: d.deep || prevData?.deep || {},
            };
            if (mode === 'free') return newData;
            
            return {
                ...prevData!,
                deep: {
                    ...prevData?.deep,
                    ...d.deep,
                },
            };
        });
      })
      .catch((e) => {
          console.error("API error:", e);
          setErr(e?.message || "生成失败"); 
      }) 
      .finally(() => setLoading(false));
  }, [keyConfig, mode, finalReportId]);
  
  if (!keyConfig) {
    return <div className="text-center py-12 text-gray-500">正在加载和解析你的星盘数据...</div>;
  }

  // 🚀 核心逻辑：始终使用 keyConfig 渲染 ReportShell
  const modulesToRender = data?.modules?.length > 0 ? data.modules : SKELETON_MODULES;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      
      {/* 按钮 */}
      <div className="flex gap-2">
        {(["free", "A", "B", "C"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m as Mode)}
            className={`px-4 py-2 rounded-xl border ${mode === m ? "bg-black text-white" : ""}`}
          >
            {m === "free" ? "免费版" : `深度${m}`}
          </button>
        ))}
      </div>

      <h1 className="text-2xl font-bold">你的结构化本命盘报告</h1>
      
      {/* 错误信息显示：显示警示条，但不中断报告 */}
      {err && ( 
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          🚨 AI 报告生成失败: {err} 
          <p className="text-sm mt-1">基础星盘信息已加载。请稍后重试，或点击顶部按钮切换模式。</p>
        </div>
      )}

      < ReportShell
          // ⚠️ 传递关键状态：报告是否正在加载/内容是否可用
          loading={loading}
          contentAvailable={!!data}

          // 骨架逻辑：如果没有数据，使用 SKELETON_MODULES 渲染框架
          summary={data?.summary || ""} 
          modules={modulesToRender} 
          deep={data?.deep || {}} 
          setMode={setMode} 
          keyConfig={keyConfig} 
      />
    </main>
  );
}