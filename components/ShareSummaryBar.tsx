// components/ShareSummaryBar.tsx
import React from 'react';

export default function ShareSummaryBar({
  items,
}: {
  items: Array<{ k: string; v: string }>;
}) {
  return (
    <div className="rounded-2xl border p-4 grid gap-3 md:grid-cols-4 bg-gray-50">
      {items.map((it) => (
        <div key={it.k} className="p-1">
          <div className="text-xs text-gray-500 font-medium">{it.k}</div>
          <div className="text-sm font-semibold text-gray-800">{it.v}</div>
        </div>
      ))}
    </div>
  );
}