import AsyncStorage from "@react-native-async-storage/async-storage";

const READ_KEY = "gkm_notifications_read_ids";
const CLEARED_KEY = "gkm_notifications_cleared_ids";

export async function getReadIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(READ_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addReadIds(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const existing = await getReadIds();
  const next = Array.from(new Set([...existing, ...ids]));
  await AsyncStorage.setItem(READ_KEY, JSON.stringify(next));
}

export async function getClearedIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(CLEARED_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addClearedIds(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const existing = await getClearedIds();
  const next = Array.from(new Set([...existing, ...ids]));
  await AsyncStorage.setItem(CLEARED_KEY, JSON.stringify(next));
}
