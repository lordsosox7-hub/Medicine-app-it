import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "rahah_favorites";

export async function getFavoriteIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export async function isFavoriteId(doctorId: string): Promise<boolean> {
  const ids = await getFavoriteIds();
  return ids.includes(doctorId);
}

export async function addFavoriteId(doctorId: string): Promise<string[]> {
  const ids = await getFavoriteIds();
  if (ids.includes(doctorId)) return ids;
  const updated = [doctorId, ...ids];
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}

export async function removeFavoriteId(doctorId: string): Promise<string[]> {
  const ids = await getFavoriteIds();
  const updated = ids.filter((id) => id !== doctorId);
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}
