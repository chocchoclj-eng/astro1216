"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { DateTime } from "luxon";

type ChartInput = {
  name?: string;
  birthDateTime: string; // ISO string (local time)
  city: string;
  timezone?: string;     // IANA tz (new)
  utcOffset?: string;    // "+08:00" (old compatible)
};

const TZ_PRESETS = [
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Hong_Kong",
  "Asia/Taipei",
  "Asia/Seoul",
  "Asia/Kuala_Lumpur",
  "America/Los_Angeles",
  "America/New_York",
  "Europe/London",
  "Europe/Paris",
  "UTC",
] as const;

function safeParseJSON<T = any>(text: string): { ok: boolean; data?: T; error?: string } {
  try {
    const data = JSON.parse(text);
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e?.message || "JSON parse failed" };
  }
}

function minutesToOffsetStr(mins: number) {
  // mins: e.g. 480
  const sign = mins >= 0 ? "+" : "-";
  const abs = Math.abs(mins);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${sign}${hh}:${mm}`;
}

export default function StartPage() {
  const router = useRouter();

  const [name, setName] = useState("choc");
  const [birthLocal, setBirthLocal] = useState("2025-12-16T00:59"); // datetime-local
  const [city, setCity] = useState("上海");

  const [tzMode, setTzMode] = useState<"preset" | "custom">("preset");
  const [timezonePreset, setTimezonePreset] = useState<string>("Asia/Shanghai");
  const [timezoneCustom, setTimezoneCustom] = useState<string>("");

  const timezone = tzMode === "preset" ? timezonePreset : timezoneCustom.trim();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const birthDateTimeISO = useMemo(() => {
    // datetime-local => "YYYY-MM-DDTHH:mm"
    // 补秒：后端更好 parse
    return `${birthLocal}:00`;
  }, [birthLocal]);

  const utcOffset = useMemo(() => {
    // ✅ 兼容旧接口：把 timezone + birthLocal 推出 "+08:00"
    if (!birthLocal || !timezone) return "";
    const dt = DateTime.fromISO(birthDateTimeISO, { zone: timezone });
    if (!dt.isValid) return "";
    return minutesToOffsetStr(dt.offset); // dt.offset: minutes
  }, [birthDateTimeISO, birthLocal, timezone]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");

    if (!birthLocal) return setErr("请填写出生时间。");
    if (!city.trim()) return setErr("请填写出生城市。");
    if (!timezone) return setErr("请选择或填写时区（例如 Asia/Shanghai）。");

    // ✅ 校验 timezone 是否有效（防止自定义乱填）
    const check = DateTime.fromISO(birthDateTimeISO, { zone: timezone });
    if (!check.isValid) {
      return setErr(`时区或时间无法解析：${check.invalidReason || "invalid"}`);
    }

    const payload: ChartInput = {
      name: name?.trim() || "",
      birthDateTime: birthDateTimeISO,
      city: city.trim(),
      timezone,   // 新接口
      utcOffset,  // 旧接口兼容：你后端报的就是缺这个
    };

    setLoading(true);

    try {
      sessionStorage.setItem("lastChartInput", JSON.stringify(payload));

      const res = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      const parsed = raw ? safeParseJSON<any>(raw) : { ok: false, error: "Empty response" };

      if (!res.ok) {
        const msg =
          (parsed.ok && (parsed.data?.error || parsed.data?.message)) ||
          `Chart API error (${res.status})`;
        setErr(msg);
        return;
      }

      if (!parsed.ok) {
        setErr("Chart API 返回不是合法 JSON（请看终端/服务端日志）。");
        return;
      }

      const keyConfig = parsed.data?.keyConfig;
      if (!keyConfig) {
        setErr("Chart API 成功返回但缺少 keyConfig。");
        return;
      }

      // ✅ 用 birthDateTimeUTC 作为稳定 id（比 randomUUID 更好查 & 可复现）
      const id = crypto.randomUUID();

      localStorage.setItem(`chart:${id}`, JSON.stringify(keyConfig));
      router.push(`/report/${id}`);
    } catch (e: any) {
      setErr(e?.message || "网络错误，请检查服务是否启动。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto p-6 pt-10 space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">生成你的结构化占星报告</h1>
          <p className="text-sm text-gray-600">
            MVP：先输入出生信息 → 生成 KeyConfig → 再用 Gemini 输出 SOP（免费版 / 深度A/B/C）。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="name">昵称（可选）</label>
            <input
              id="name"
              className="w-full rounded-xl border px-3 py-2"
              placeholder="比如：Choc"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="birth">出生日期时间（当地时间）</label>
            <input
              id="birth"
              type="datetime-local"
              className="w-full rounded-xl border px-3 py-2"
              value={birthLocal}
              onChange={(e) => setBirthLocal(e.target.value)}
              required
            />
            <div className="text-xs text-gray-500">
              将发送：<span className="font-mono">{birthDateTimeISO}</span>
              <span className="ml-2">｜utcOffset：<span className="font-mono">{utcOffset || "（未计算）"}</span></span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">时区（IANA）</label>
              <div className="ml-auto flex gap-2 text-xs">
                <button
                  type="button"
                  className={`rounded-lg border px-2 py-1 ${tzMode === "preset" ? "bg-black text-white" : ""}`}
                  onClick={() => setTzMode("preset")}
                >
                  选择
                </button>
                <button
                  type="button"
                  className={`rounded-lg border px-2 py-1 ${tzMode === "custom" ? "bg-black text-white" : ""}`}
                  onClick={() => setTzMode("custom")}
                >
                  自定义
                </button>
              </div>
            </div>

            {tzMode === "preset" ? (
              <select
                className="w-full rounded-xl border px-3 py-2"
                value={timezonePreset}
                onChange={(e) => setTimezonePreset(e.target.value)}
              >
                {TZ_PRESETS.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            ) : (
              <input
                className="w-full rounded-xl border px-3 py-2"
                placeholder="例如：Asia/Shanghai"
                value={timezoneCustom}
                onChange={(e) => setTimezoneCustom(e.target.value)}
                autoComplete="off"
              />
            )}

            <div className="text-xs text-gray-500">
              你最终选择的时区：<span className="font-mono">{timezone || "（未填写）"}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="city">出生城市</label>
            <input
              id="city"
              className="w-full rounded-xl border px-3 py-2"
              placeholder="例如：上海"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              autoComplete="off"
            />
            <div className="text-xs text-gray-500">
              MVP 阶段如果后端只支持部分城市，请严格用它支持的城市名（例如：上海/北京/杭州）。
            </div>
          </div>

          {err ? (
            <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-black text-white py-3 font-semibold disabled:opacity-60"
          >
            {loading ? "生成中…" : "生成报告"}
          </button>

          <div className="text-xs text-gray-500 text-center">
            本工具用于自我探索与学习，不替代医疗/心理/法律建议。
          </div>
        </form>
      </div>
    </main>
  );
}





















