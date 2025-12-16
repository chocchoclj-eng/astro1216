// components/ReportSection.tsx
"use client";
import { useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // 用于支持表格等扩展 Markdown 语法

export default function ReportSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: string; 
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="rounded-2xl border p-4 shadow-sm bg-white">
      <button className="w-full flex items-center justify-between" onClick={() => setOpen(!open)}>
        <h2 className="text-xl font-bold">{title}</h2>
        <span className="text-sm text-gray-500">{open ? "收起" : "展开"}</span>
      </button>
      {open && (
        <div className="mt-4 border-t pt-4">
          <ReactMarkdown 
            components={{
              p: ({node, ...props}) => <p className="text-base" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-4 mb-2" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-3 mb-1" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 pl-4" {...props} />,
              li: ({node, ...props}) => <li className="text-base" {...props} />,
            }}
            remarkPlugins={[remarkGfm]}
          >
            {children}
          </ReactMarkdown>
          
          <div className="mt-6 flex justify-end space-x-2">
            <button className="text-xs text-green-600 border border-green-200 bg-green-50 px-3 py-1 rounded-full">
                ✅ 我认可
            </button>
            <button className="text-xs text-red-600 border border-red-200 bg-red-50 px-3 py-1 rounded-full">
                ❌ 不太符
            </button>
          </div>
        </div>
      )}
    </section>
  );
}