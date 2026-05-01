import { useCallback, useEffect, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, type VitalReadingRow } from "@/lib/supabase";
import { getUserId } from "@/lib/userId";

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

const LEGACY_STORAGE_KEY = "rahah:vitals:v1";
const MIGRATION_FLAG_KEY = "rahah:vitals:v1:migrated";

function rowToReading(row: VitalReadingRow): VitalReading {
  return {
    id: row.id,
    type: row.type,
    value: row.value,
    recorded_at: row.recorded_at,
    note: row.note ?? undefined,
  };
}

// One-time best-effort migration of any vitals previously stored on-device
// (AsyncStorage) into the cloud-backed `vital_readings` table. After a
// successful upload we clear the local data so it can't double-import.
async function migrateLegacyLocalIfNeeded(userId: string): Promise<void> {
  try {
    const flag = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
    if (flag === "1") return;
    const raw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      await AsyncStorage.setItem(MIGRATION_FLAG_KEY, "1");
      return;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      await AsyncStorage.setItem(MIGRATION_FLAG_KEY, "1");
      return;
    }
    const payload = parsed
      .filter(
        (r) =>
          r &&
          typeof r.type === "string" &&
          typeof r.value === "string" &&
          typeof r.recorded_at === "string"
      )
      .map((r) => ({
        user_id: userId,
        type: r.type,
        value: r.value,
        note: r.note ?? null,
        recorded_at: r.recorded_at,
      }));
    if (payload.length === 0) {
      await AsyncStorage.setItem(MIGRATION_FLAG_KEY, "1");
      return;
    }
    const { error } = await supabase.from("vital_readings").insert(payload);
    if (error) {
      // Don't flip the flag — try again next launch
      console.warn("[vitals] legacy migration failed:", error.message);
      return;
    }
    await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
    await AsyncStorage.setItem(MIGRATION_FLAG_KEY, "1");
  } catch (e) {
    console.warn("[vitals] legacy migration error:", e);
  }
}

export function useVitals() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["vital_readings"],
    queryFn: async (): Promise<VitalReading[]> => {
      const userId = await getUserId();
      await migrateLegacyLocalIfNeeded(userId);
      const { data, error } = await supabase
        .from("vital_readings")
        .select("*")
        .eq("user_id", userId)
        .order("recorded_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(rowToReading);
    },
  });

  const readings = query.data ?? [];
  const loading = query.isLoading;

  // Keep cache fresh if other surfaces (e.g. home page) mount this hook later
  useEffect(() => {
    // no-op; query hook already handles this. Kept for clarity.
  }, []);

  const addMutation = useMutation({
    mutationFn: async (input: {
      type: VitalType;
      value: string;
      note?: string;
    }): Promise<VitalReading> => {
      const userId = await getUserId();
      const trimmed = input.value.trim();
      const { data, error } = await supabase
        .from("vital_readings")
        .insert({
          user_id: userId,
          type: input.type,
          value: trimmed,
          note: input.note?.trim() || null,
          recorded_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return rowToReading(data as VitalReadingRow);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vital_readings"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const userId = await getUserId();
      const { error } = await supabase
        .from("vital_readings")
        .delete()
        .eq("user_id", userId)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vital_readings"] });
    },
  });

  const addReading = useCallback(
    async (type: VitalType, value: string, note?: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      try {
        await addMutation.mutateAsync({ type, value: trimmed, note });
      } catch (e) {
        console.warn("[vitals] addReading failed:", e);
        throw e;
      }
    },
    [addMutation]
  );

  const deleteReading = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (e) {
        console.warn("[vitals] deleteReading failed:", e);
        throw e;
      }
    },
    [deleteMutation]
  );

  const latestByType = useMemo(() => {
    const map: Partial<Record<VitalType, VitalReading>> = {};
    for (const r of readings) {
      if (!map[r.type]) map[r.type] = r;
    }
    return map;
  }, [readings]);

  const getLatest = useCallback(
    (type: VitalType): VitalReading | undefined => latestByType[type],
    [latestByType]
  );

  const getDisplayValue = useCallback(
    (type: VitalType): string => {
      const r = latestByType[type];
      if (r) return r.value;
      return getVitalMeta(type).defaultValue;
    },
    [latestByType]
  );

  const getStatus = useCallback(
    (type: VitalType): VitalStatus => {
      const r = latestByType[type];
      if (!r) return "normal";
      return evaluateVitalStatus(type, r.value);
    },
    [latestByType]
  );

  const getHistory = useCallback(
    (type: VitalType): VitalReading[] =>
      readings.filter((r) => r.type === type),
    [readings]
  );

  const getTrend = useCallback(
    (type: VitalType, n: number = 7): number[] => {
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
    },
    [readings]
  );

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
