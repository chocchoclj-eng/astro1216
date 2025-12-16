// types/astrology.ts
// 位于项目根目录下的 types/ 文件夹

export type Planet =
  | "Sun" | "Moon" | "Mercury" | "Venus" | "Mars"
  | "Jupiter" | "Saturn" | "Uranus" | "Neptune" | "Pluto"
  | "Node" | "Chiron";

export type AspectType = "CONJ" | "OPP" | "SQR" | "TRI" | "SEX";

export interface Placement {
  body: Planet | "ASC" | "MC";
  sign: string;
  house: number;
  degree: number;
}

export interface AspectEndpoints {
  a: string; // Planet name
  b: string; // Planet name
  type: string; // Aspect type
  orb: number;
}

export interface KeyConfig {
  input: {
    name: string;
    birthDateTime: string;
    city: string;
    timezone?: string;
    birthDateTimeUTC?: string;
    lat?: number;
    lon?: number;
  };
  core: {
    sun: Placement;
    moon: Placement;
    asc: Placement;
    saturn: Placement;
    mc: Placement;
  };
  houseFocusTop3: Array<{ house: number; score: number; bodies: string[] }>;
  innerHardAspectsTop3: AspectEndpoints[];
  saturnAspectsTop: AspectEndpoints[];
  outerHardAspectsTop3: AspectEndpoints[];
  nodes: { north: Placement; south: Placement };
}