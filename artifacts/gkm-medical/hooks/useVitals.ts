import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type VitalType =
  | "heart_rate"
  | "blood_pressure"
  | "blood_sugar"
  | "weight"
  | "temperature"
  | "oxygen";

export type VitalReading = {
  id: string;
  type: VitalType;
  value: string; // raw text: "72", "120/80", "98.6"...
  recorded_at: string; // ISO
  note?: string;
};

export type VitalStatus = "normal" | "warning" | "alert";

export type VitalMeta = {
  type: VitalType;
  label_ar: string;
  unit: string;
  defaultValue: string;
  iconName: string; // MaterialCommunityIcons name
  accentKey: "rose" | "blue" | "purple" | "amber" | "red" | "teal";
};

export const VITALS_META: VitalMeta[] = [
  {
    type: "heart_rate",
    label_ar: "معدل ضربات القلب",
    unit: "bpm",
    defaultValue: "72",
    iconName: "heart-pulse",
    accentKey: "rose",
  },
  {
    type: "blood_pressure",
    label_ar: "ضغط الدم",
    unit: "mmHg",
    defaultValue: "120/80",
    iconName: "gauge",
    accentKey: "blue",
  },
  {
    type: "blood_sugar",
    label_ar: "سكر الدم",
    unit: "mg/dL",
    defaultValue: "98",
    iconName: "water",
    accentKey: "purple",
  },
  {
    type: "weight",
    label_ar: "الوزن",
    unit: "kg",
    defaultValue: "70",
    iconName: "scale-bathroom",
    accentKey: "amber",
  },
  {
    type: "temperature",
    label_ar: "درجة الحرارة",
    unit: "°C",
    defaultValue: "37.0",
    iconName: "thermometer",
    accentKey: "red",
  },
  {
    type: "oxygen",
    label_ar: "تشبع الأكسجين",
    unit: "%",
    defaultValue: "98",
    iconName: "lungs",
    accentKey: "teal",
  },
];

export function getVitalMeta(type: VitalType): VitalMeta {
  return VITALS_META.find((m) => m.type === type)!;
}

export function evaluateVitalStatus(type: VitalType, value: string): VitalStatus {
  if (!value) return "normal";
  switch (type) {
    case "heart_rate": {
      const n = Number(value);
      if (!isFinite(n)) return "normal";
      if (n < 50 || n > 110) return "alert";
      if (n < 60 || n > 100) return "warning";
      return "normal";
    }
    case "blood_pressure": {
      const m = value.match(/^\s*(\d{2,3})\s*\/\s*(\d{2,3})\s*$/);
      if (!m) return "normal";
      const sys = Number(m[1]);
      const dia = Number(m[2]);
      if (sys >= 140 || dia >= 90 || sys < 90 || dia < 60) return "alert";
      if (sys >= 130 || dia >= 85) return "warning";
      return "normal";
    }
    case "blood_sugar": {
      const n = Number(value);
      if (!isFinite(n)) return "normal";
      if (n < 70 || n > 180) return "alert";
      if (n > 140) return "warning";
      return "normal";
    }
    case "weight":
      return "normal";
    case "temperature": {
      const n = Number(value);
      if (!isFinite(n)) return "normal";
      if (n >= 38.5 || n < 35.5) return "alert";
      if (n >= 37.6) return "warning";
      return "normal";
    }
    case "oxygen": {
      const n = Number(value);
      if (!isFinite(n)) return "normal";
      if (n < 92) return "alert";
      if (n < 95) return "warning";
      return "normal";
    }
  }
}

const STORAGE_KEY = "gkm:vitals:v1";

async function readAll(): Promise<VitalReading[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as VitalReading[];
  } catch {
    return [];
  }
}

async function writeAll(readings: VitalReading[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
}

// Tiny pub/sub so components stay in sync after a write
const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((fn) => fn());
}

export function useVitals() {
  const [readings, setReadings] = useState<VitalReading[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await readAll();
    data.sort((a, b) => (a.recorded_at < b.recorded_at ? 1 : -1));
    setReadings(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const fn = () => refresh();
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, [refresh]);

  const addReading = useCallback(
    async (type: VitalType, value: string, note?: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      const all = await readAll();
      const newReading: VitalReading = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        value: trimmed,
        recorded_at: new Date().toISOString(),
        note: note?.trim() || undefined,
      };
      const next = [newReading, ...all];
      await writeAll(next);
      notify();
    },
    []
  );

  const deleteReading = useCallback(async (id: string) => {
    const all = await readAll();
    const next = all.filter((r) => r.id !== id);
    await writeAll(next);
    notify();
  }, []);

  const latestByType: Partial<Record<VitalType, VitalReading>> = {};
  for (const r of readings) {
    if (!latestByType[r.type]) latestByType[r.type] = r;
  }

  const getLatest = (type: VitalType): VitalReading | undefined =>
    latestByType[type];

  const getDisplayValue = (type: VitalType): string => {
    const r = latestByType[type];
    if (r) return r.value;
    return getVitalMeta(type).defaultValue;
  };

  const getStatus = (type: VitalType): VitalStatus => {
    const r = latestByType[type];
    if (!r) return "normal";
    return evaluateVitalStatus(type, r.value);
  };

  const getHistory = (type: VitalType): VitalReading[] =>
    readings.filter((r) => r.type === type);

  // Returns the last `n` readings for `type` as numeric points,
  // ordered oldest -> newest, ready to plot in a sparkline.
  // For blood_pressure (e.g. "120/80"), uses the systolic number.
  const getTrend = (type: VitalType, n: number = 7): number[] => {
    const list = readings.filter((r) => r.type === type).slice(0, n);
    if (list.length === 0) return [];
    const nums: number[] = [];
    for (let i = list.length - 1; i >= 0; i--) {
      const r = list[i];
      if (type === "blood_pressure") {
        const m = r.value.match(/^\s*(\d{2,3})\s*\/\s*\d{2,3}\s*$/);
        if (m) nums.push(Number(m[1]));
      } else {
        const v = Number(r.value);
        if (isFinite(v)) nums.push(v);
      }
    }
    return nums;
  };

  return {
    loading,
    readings,
    addReading,
    deleteReading,
    getLatest,
    getDisplayValue,
    getStatus,
    getHistory,
    getTrend,
  };
}
