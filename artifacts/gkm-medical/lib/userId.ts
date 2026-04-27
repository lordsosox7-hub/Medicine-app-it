import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "gkm_user_id";
const NAME_KEY = "gkm_user_name";

function generateUUID(): string {
  // RFC4122-ish v4 — sufficient for a local anonymous user id
  const hex = "0123456789abcdef";
  let s = "";
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      s += "-";
    } else if (i === 14) {
      s += "4";
    } else if (i === 19) {
      s += hex[(Math.floor(Math.random() * 4) + 8)];
    } else {
      s += hex[Math.floor(Math.random() * 16)];
    }
  }
  return s;
}

export async function getUserId(): Promise<string> {
  let id = await AsyncStorage.getItem(KEY);
  if (!id) {
    id = generateUUID();
    await AsyncStorage.setItem(KEY, id);
  }
  return id;
}

export async function getUserName(): Promise<string> {
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
