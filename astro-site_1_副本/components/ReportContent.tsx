// components/ReportContent.tsx
"use client";

import React from "react";
import ReactMarkdown from "react-markdown";

export default function ReportContent({ markdown }: { markdown: string }) {
  return (
    <article className="prose prose-zinc max-w-none">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </article>
  );
}

