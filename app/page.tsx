// app/page.tsx
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-12 min-h-screen bg-gray-50">
      <header className="space-y-6 text-center pt-12">
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
          用「结构化占星」读懂你的人生系统
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          不玄、不吓人、不堆术语。用一套清晰的解盘 SOP：主轴 → 主战场 → 冲突点 → 难度条 → 转折机制 → 灵魂方向。
        </p>
        <Link
          href="/start"
          className="inline-block rounded-full bg-black text-white text-lg font-semibold px-8 py-4 shadow-xl hover:bg-gray-800 transition duration-200"
        >
          立即生成我的报告（3 分钟）
        </Link>
      </header>

      <section className="grid md:grid-cols-3 gap-6">
        {[
          { icon: "🛠️", t: "像产品分析一样解盘", d: "先结构、后细节，有优先级，定位人生功能位。" },
          { icon: "✅", t: "可验证、不盲从", d: "每段解读都有证据点与自检问题，引导你主动对照人生。" },
          { icon: "🚀", t: "可升级深挖模块", d: "SOP 报告后，可按需升级 A/B/C 关系、事业、灵魂线深度解读。" },
        ].map((x) => (
          <div key={x.t} className="rounded-3xl border border-gray-200 p-6 bg-white shadow-md space-y-3">
            <div className="text-4xl">{x.icon}</div>
            <div className="font-bold text-xl">{x.t}</div>
            <div className="text-gray-600">{x.d}</div>
          </div>
        ))}
      </section>

      <footer className="text-sm text-center text-gray-500 pt-8 border-t">
        <p>本工具用于自我探索与学习用途，不替代医疗、心理、法律或金融建议。</p>
      </footer>
    </main>
  );
}

