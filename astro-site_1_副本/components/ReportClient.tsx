// components/ReportContent.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// 假设 KeyConfig, ReportSection, ShareSummaryBar 已正确导入或定义
type KeyConfig = any; 
type Mode = "free" | "A" | "B" | "C";

export default function ReportContent({ id }: { id: string }) {
  const [mode, setMode] = useState<Mode>("free");
  const [keyConfig, setKeyConfig] = useState<KeyConfig | null>(null);
  const [reportText, setReportText] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. 从 localStorage 读取 keyConfig (Client-side logic)
  useEffect(() => {
    if (!id) return;
    const rawConfig = localStorage.getItem(`chart:${id}`);
    if (rawConfig) {
      setKeyConfig(JSON.parse(rawConfig));
    } else {
      setError("未找到报告数据。请返回首页重新生成。");
      setLoading(false);
    }
  }, [id]);
  
  // 2. 调 API 生成报告文本 (Client-side logic)
  useEffect(() => {
    async function runReportGeneration() {
      if (!keyConfig) return;
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch("/api/report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ keyConfig, mode }),
        });

        const data = await res.json();

        if (!res.ok) {
            setError(data.error || "报告生成失败。请检查 Gemini 密钥或配额。");
        } else if (data.text) {
            setReportText(data.text);
        }

      } catch (e: any) {
        setError("网络请求失败或服务器错误: " + e.message);
      } finally {
        setLoading(false);
      }
    }
    runReportGeneration();
  }, [keyConfig, mode]);

  const summaryItems = useMemo(() => {
      // 假设 keyConfig.core 结构存在
      if (!keyConfig || !keyConfig.core) return [];
      const c = keyConfig.core;
      return [
          { k: "上升星座", v: `${c.asc.sign} ${c.asc.degree.toFixed(1)}°` },
          { k: "太阳", v: `${c.sun.sign}｜第${c.sun.house}宫` },
      ];
  }, [keyConfig]);

  if (error) {
    return <div className="text-red-600 p-4 border rounded-lg bg-red-50">🚨 错误: {error}</div>;
  }
  
  if (loading || !keyConfig) {
    return <div className="text-center py-12 text-gray-500">正在加载和解析你的星盘数据...</div>;
  }

  return (
    <div className="space-y-6">
        <h1 className="text-3xl font-bold">结构化报告 - ID: {id}</h1>
        {/* 假设 ShareSummaryBar 是一个存在的组件 */}
        {/* <ShareSummaryBar items={summaryItems} /> */}
        
        {loading ? (
            <div className="text-center py-12 text-gray-500 animate-pulse">
                <p>正在连接 Gemini 深度解析系统...</p>
            </div>
        ) : reportText ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                p: ({node, ...props}) => <p className="text-base" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-4 mb-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-xl font-semibold mt-3 mb-1" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 pl-4" {...props} />,
                li: ({node, ...props}) => <li className="text-base" {...props} />,
            }}>
                {reportText}
            </ReactMarkdown>
        ) : (
             <div className="text-gray-500">报告内容为空。</div>
        )}

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">选择报告模式:</label>
          <select 
            value={mode} 
            onChange={(e) => setMode(e.target.value as Mode)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
          >
            <option value="free">Free - 骨架SOP</option>
            <option value="A">A - 关系深度</option>
            <option value="B">B - 事业深度</option>
            <option value="C">C - 创伤整合</option>
          </select>
        </div>
    </div>
  );
}
