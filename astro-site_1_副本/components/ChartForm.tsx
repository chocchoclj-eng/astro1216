// components/ChartForm.tsx
"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
// 确保安装了 luxon：npm install luxon
import { DateTime } from "luxon"; 

type KeyConfig = any;

// IANA 时区预设列表 (用于选择)
const TIME_ZONES = [
  { value: "Asia/Shanghai", label: "UTC+8（北京/上海）" },
  { value: "Asia/Hong_Kong", label: "UTC+8（香港）" },
  { value: "Asia/Singapore", label: "UTC+8（新加坡）" },
  { value: "Europe/London", label: "UTC+0（伦敦/格林威治）" },
  { value: "Europe/Paris", label: "UTC+1（柏林/巴黎）" },
  { value: "America/New_York", label: "UTC-5（纽约/多伦多）" },
  { value: "America/Los_Angeles", label: "UTC-8（洛杉矶/温哥华）" },
  { value: "UTC", label: "UTC（0）" },
] as const;

// 辅助函数：将分钟偏移量转换为 "+HH:MM" 字符串
function minutesToOffsetStr(mins: number) {
  const sign = mins >= 0 ? "+" : "-";
  const abs = Math.abs(mins);
  const hh = String(Math.floor(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  // 后端只需要 +HH 格式来构造时间，所以只返回小时部分
  return `${sign}${hh}`; 
}

export default function ChartForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [formData, setFormData] = useState({
    name: "",
    date: "2001-07-20",
    time: "23:15",
    city: "上海",
    timezone: "Asia/Shanghai", // 👈 IANA 时区
  });

  const birthDateTime = useMemo(() => `${formData.date}T${formData.time}:00`, [formData.date, formData.time]);

  // 自动计算 UTC 偏移量 (例如 "+8")
  const utcOffset = useMemo(() => {
    const dt = DateTime.fromISO(birthDateTime, { zone: formData.timezone });
    if (!dt.isValid) return "";
    return minutesToOffsetStr(dt.offset);
  }, [birthDateTime, formData.timezone]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.date || !formData.time || !formData.city || !formData.timezone) {
      setError("请填写所有必填字段。");
      setLoading(false);
      return;
    }

    // 校验 timezone 是否能被 Luxon 解析
    const dtCheck = DateTime.fromISO(birthDateTime, { zone: formData.timezone });
    if (!dtCheck.isValid) {
      setError(`时区或时间无法解析：${dtCheck.invalidReason || "invalid"}`);
      setLoading(false);
      return;
    }
    
    // 确保 utcOffset 被计算出来
    const finalUtcOffset = utcOffset;
    if (!finalUtcOffset) {
        setError("无法计算 UTC 偏移量，请检查时间输入。");
        setLoading(false);
        return;
    }

    try {
      const res = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name?.trim() || "",
          birthDateTime,
          city: formData.city.trim(),
          timezone: formData.timezone,    // 👈 IANA 时区 (备用)
          utcOffset: finalUtcOffset,       // 👈 关键：发送精确计算的偏移量 (+HH)
        }),
      });

      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        throw new Error(`Chart API 返回不是合法 JSON: ${raw.slice(0, 100)}...`);
      }

      if (!res.ok) {
        throw new Error(data?.error || "星盘计算失败。");
      }

      const keyConfig: KeyConfig = data?.keyConfig;
      if (!keyConfig) throw new Error("后端返回缺少 keyConfig");

      const id = keyConfig?.input?.birthDateTimeUTC || data?.id || uuidv4();

      localStorage.setItem(`chart:${id}`, JSON.stringify(keyConfig));
      router.push(`/report/${encodeURIComponent(id)}`);
    } catch (e: any) {
      console.error("Chart API Error:", e?.message);
      setError(`计算失败: ${e?.message || "unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white shadow-lg rounded-lg space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">输入您的出生信息</h2>

      {error ? (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>
      ) : null}

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            姓名/昵称
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
            autoComplete="off"
          />
        </div>

        <div className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              出生日期
            </label>
            <input
              type="date"
              name="date"
              id="date"
              value={formData.date}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              required
            />
          </div>
          <div className="flex-1">
            <label htmlFor="time" className="block text-sm font-medium text-gray-700">
              出生时间
            </label>
            <input
              type="time"
              name="time"
              id="time"
              value={formData.time}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              required
            />
          </div>
        </div>

        <div className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700">
              城市
            </label>
            <input
              type="text"
              name="city"
              id="city"
              value={formData.city}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              placeholder="例如：上海"
              required
              autoComplete="off"
            />
          </div>

          <div className="flex-1">
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
              时区（IANA）
            </label>
            <select
              name="timezone"
              id="timezone"
              value={formData.timezone}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              required
            >
              {TIME_ZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label} — {tz.value}
                </option>
              ))}
            </select>
            <div className="mt-1 text-xs text-gray-500">
              发送偏移量：<span className="font-mono ml-1">{utcOffset || "（未计算）"}</span>
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white ${
          loading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
        }`}
      >
        {loading ? "正在计算星盘..." : "生成你的结构化报告"}
      </button>
    </form>
  );
}