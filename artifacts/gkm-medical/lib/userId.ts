import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const KEY = "gkm_user_id";
const NAME_KEY = "gkm_user_name";

function generateUUID(): string {
  const hex = "0123456789abcdef";
  let s = "";
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      s += "-";
    } else if (i === 14) {
      s += "4";
    } else if (i === 19) {
      s += hex[Math.floor(Math.random() * 4) + 8];
    } else {
      s += hex[Math.floor(Math.random() * 16)];
    }
  }
  return s;
}

export async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const authId = data.session?.user?.id;
  if (authId) return authId;

  let id = await AsyncStorage.getItem(KEY);
  if (!id) {
    id = generateUUID();
    await AsyncStorage.setItem(KEY, id);
  }
  return id;
}

export async function getUserName(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const email = data.session?.user?.email;
  if (email) {
    const stored = await AsyncStorage.getItem(NAME_KEY);
    if (stored) return stored;
    const local = email.split("@")[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  const n = await AsyncStorage.getItem(NAME_KEY);
  return n ?? "أحمد";
}

export async function setUserName(name: string): Promise<void> {
  await AsyncStorage.setItem(NAME_KEY, name);
}

const ONBOARDING_KEY = "gkm_onboarded";

export async function isOnboarded(): Promise<boolean> {
  const v = await AsyncStorage.getItem(ONBOARDING_KEY);
  return v === "true";
}

export async function markOnboarded(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, "true");
}

export async function isAuthenticated(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

export async function getUserEmail(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.email ?? null;
}
