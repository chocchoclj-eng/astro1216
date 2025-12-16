import { NextResponse } from "next/server";
import { DateTime } from "luxon"; 
import * as Astronomy from "astronomy-engine";
import { Body } from 'astronomy-engine'; 

export const runtime = "nodejs";

// ====== 城市数据库 ======
const CITY_DB: Record<string, { lat: number; lon: number }> = {
  上海: { lat: 31.2304, lon: 121.4737 },
  北京: { lat: 39.9042, lon: 116.4074 },
  深圳: { lat: 22.5431, lon: 114.0579 },
  广州: { lat: 23.1291, lon: 113.2644 },
  杭州: { lat: 30.2741, lon: 120.1551 },
  成都: { lat: 30.5728, lon: 104.0668 },
};

// ====== 基础工具 ======
function normalize360(x: number) {
  x %= 360;
  if (x < 0) x += 360;
  return x;
}

function signOf(eclLon: number) {
  const signs = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
  ];
  return signs[Math.floor(normalize360(eclLon) / 30) % 12];
}

function degInSign(eclLon: number) {
  return +((normalize360(eclLon) % 30).toFixed(2));
}

function rad2deg(r: number) { return (r * 180) / Math.PI; }
function deg2rad(d: number) { return (d * Math.PI) / 180; }

// ====== 行星黄经计算 ======
function planetEclLon(body: Body, time: Date) {
  const vec = Astronomy.GeoVector(body, time, true);
  const ecl = Astronomy.Ecliptic(vec);
  return normalize360(ecl.elon);
}

// ====== ✅ 修复：计算平均北交点 (Mean North Node) ======
function calcMeanNorthNode(time: Date) {
  const timeMs = time.getTime();
  const jd = (timeMs / 86400000.0) + 2440587.5; 
  const T = (jd - 2451545.0) / 36525.0;

  let node = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000.0;

  return normalize360(node);
}

// ====== 宫位与轴点 ======
function calcMC(lstDeg: number, obliqDeg: number) {
  const lst = deg2rad(lstDeg);
  const eps = deg2rad(obliqDeg);
  const y = Math.sin(lst);
  const x = Math.cos(lst) * Math.cos(eps);
  return normalize360(rad2deg(Math.atan2(y, x)));
}

// ⚠️ 修正后的 ASC 公式
function calcASC(lstDeg: number, latDeg: number, obliqDeg: number) {
  const theta = deg2rad(lstDeg);
  const phi = deg2rad(latDeg);
  const eps = deg2rad(obliqDeg);
  const y = -Math.cos(theta);
  const x = Math.sin(theta) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps);
  return normalize360(rad2deg(Math.atan2(y, x)) + 180);
}

function houseOfEqual(eclLon: number, ascLon: number) {
  const d = normalize360(eclLon - ascLon);
  return Math.floor(d / 30) + 1;
}

// ====== 相位相关 ======
const ASPECTS = [
  { type: "CONJ", deg: 0, orb: 8 },
  { type: "SEX", deg: 60, orb: 5 },
  { type: "SQR", deg: 90, orb: 6 },
  { type: "TRI", deg: 120, orb: 6 },
  { type: "OPP", deg: 180, orb: 8 },
] as const;

function angle(a: number, b: number) {
  let d = Math.abs(a - b) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

function pickAspects(L: Record<string, number>, pairs: [string, string][]) {
  const out: any[] = [];
  for (const [a, b] of pairs) {
    const d = angle(L[a], L[b]);
    for (const asp of ASPECTS) {
      const orb = Math.abs(d - asp.deg);
      if (orb <= asp.orb) {
        out.push({ a, b, type: asp.type, orb: +orb.toFixed(2), score: +(10 - orb).toFixed(2) });
      }
    }
  }
  return out.sort((x, y) => y.score - y.score);
}

// ====== 主接口 ======
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // ⚠️ 接收 utcOffset (前端已计算好)
    const { name = "", birthDateTime, city, utcOffset } = body as {
      name?: string;
      birthDateTime: string;
      city: string;
      utcOffset: string; // 接收 UTC 偏移量，例如 "+8"
    };

    if (!birthDateTime || !city || !utcOffset) {
      return NextResponse.json({ error: "缺少 birthDateTime / city / utcOffset" }, { status: 400 });
    }

    const cityInfo = CITY_DB[city];
    if (!cityInfo) {
      return NextResponse.json({ error: `城市不支持：${city}` }, { status: 400 });
    }

    // --- 时间处理：使用 UTC 偏移量 ---
    const offsetNum = parseInt(utcOffset, 10);
    const sign = offsetNum >= 0 ? '+' : '-';
    const absOffset = Math.abs(offsetNum).toString().padStart(2, '0');
    
    // 🚨 关键修复：强制格式为 HH:00，以满足 new Date() 的严格 ISO 解析要求
    const finalOffset = `${sign}${absOffset}:00`; // <-- 修正点
    
    const localTimeWithOffset = `${birthDateTime}${finalOffset}`; // e.g. "2001-07-20T23:15:00+08:00"
    const dt = new Date(localTimeWithOffset); // 转换为精确的 UTC Date 对象
    
    // 🚨 关键校验：确保 dt 对象有效
    if (isNaN(dt.getTime())) {
        console.error("Invalid Date String:", localTimeWithOffset);
        return NextResponse.json(
            { error: `时间格式无效，无法解析为 Date 对象。请检查输入的时间和 UTC 偏移量：${localTimeWithOffset}` }, 
            { status: 400 }
        );
    }
    // --- End Time Handling ---


    // 天文计算对象
    const time = Astronomy.MakeTime(dt);
    const obliq = 23.4392911;

    // 恒星时与ASC/MC
    const gstHours = Astronomy.SiderealTime(time);
    const gstDeg = normalize360(gstHours * 15);
    const lstDeg = normalize360(gstDeg + cityInfo.lon);

    const ascLon = calcASC(lstDeg, cityInfo.lat, obliq);
    const mcLon = calcMC(lstDeg, obliq);

    // ✅ 修复：使用公式计算南北交点
    const northNodeLon = calcMeanNorthNode(dt);
    const southNodeLon = normalize360(northNodeLon + 180);

    // 行星位置
    const L: Record<string, number> = {
      Sun: planetEclLon(Body.Sun, dt),
      Moon: planetEclLon(Body.Moon, dt),
      Mercury: planetEclLon(Body.Mercury, dt),
      Venus: planetEclLon(Body.Venus, dt),
      Mars: planetEclLon(Body.Mars, dt),
      Jupiter: planetEclLon(Body.Jupiter, dt),
      Saturn: planetEclLon(Body.Saturn, dt),
      Uranus: planetEclLon(Body.Uranus, dt),
      Neptune: planetEclLon(Body.Neptune, dt),
      Pluto: planetEclLon(Body.Pluto, dt),
      ASC: ascLon,
      MC: mcLon,
    };

    function placement(bodyName: string) {
      const lon = L[bodyName];
      return {
        body: bodyName,
        sign: signOf(lon),
        degree: degInSign(lon),
        house: bodyName === "ASC" ? 1 : bodyName === "MC" ? 10 : houseOfEqual(lon, ascLon),
      };
    }

    // 相位计算
    const innerPairs: [string, string][] = [
      ["Sun", "Moon"], ["Sun", "Mercury"], ["Sun", "Venus"], ["Sun", "Mars"],
      ["Moon", "Mercury"], ["Moon", "Venus"], ["Moon", "Mars"],
      ["Mercury", "Venus"], ["Mercury", "Mars"], ["Venus", "Mars"],
    ];

    const innerAll = pickAspects(L, innerPairs);
    
    const satAll = pickAspects(L, [
      ["Saturn", "Sun"], ["Saturn", "Moon"], ["Saturn", "Mercury"],
      ["Saturn", "Venus"], ["Saturn", "Mars"],
    ]);

    const outerAll = pickAspects(L, [
      ["Uranus", "Sun"], ["Neptune", "Sun"], ["Pluto", "Sun"],
      ["Uranus", "Moon"], ["Neptune", "Moon"], ["Pluto", "Moon"],
    ]);

    // 宫位权重
    const bodiesForFocus = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
    const score: Record<number, { score: number; bodies: string[] }> = {};
    for (const b of bodiesForFocus) {
      const p = placement(b);
      const w = b === "Sun" ? 10 : b === "Moon" ? 9 : b === "Saturn" ? 7 : 5;
      score[p.house] ??= { score: 0, bodies: [] };
      score[p.house].score += w;
      score[p.house].bodies.push(b);
    }
    const houseFocusTop3 = Object.entries(score)
      .map(([house, v]) => ({ house: Number(house), score: v.score, bodies: v.bodies }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const keyConfig: any = {
      input: {
        name,
        birthDateTime,
        utcOffset, 
        birthDateTimeUTC: dt.toISOString(),
        city,
        lat: cityInfo.lat,
        lon: cityInfo.lon,
      },
      core: {
        sun: placement("Sun"),
        moon: placement("Moon"),
        asc: placement("ASC"),
        saturn: placement("Saturn"),
        mc: placement("MC"),
      },
      houseFocusTop3,
      innerHardAspectsTop3: innerAll.filter((x) => ["CONJ", "SQR", "OPP"].includes(x.type)).slice(0, 3),
      saturnAspectsTop: satAll.slice(0, 3),
      outerHardAspectsTop3: outerAll.filter((x) => ["CONJ", "SQR", "OPP"].includes(x.type)).slice(0, 3),
      // ✅ 填入正确的交点数据
      nodes: {
        north: {
          body: "North Node",
          sign: signOf(northNodeLon),
          degree: degInSign(northNodeLon),
          house: houseOfEqual(northNodeLon, ascLon)
        },
        south: {
          body: "South Node",
          sign: signOf(southNodeLon),
          degree: degInSign(southNodeLon),
          house: houseOfEqual(southNodeLon, ascLon)
        },
      },
      debug: {
        utcISO: dt.toISOString(),
        ascLon,
        mcLon,
        northNodeLon
      },
    };

    return NextResponse.json({ keyConfig, id: crypto.randomUUID() });
  } catch (e: any) {
    console.error("CHART API ERROR:", e);
    return NextResponse.json({ error: e?.message || "chart api failed" }, { status: 500 });
  }
}