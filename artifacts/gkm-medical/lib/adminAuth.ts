import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_KEY = "gkm_admin_session";
const CREDS_KEY = "gkm_admin_credentials";

export const DEFAULT_ADMIN_USERNAME = "admin";
export const DEFAULT_ADMIN_PASSWORD = "gkm2026";

export type AdminCredentials = {
  username: string;
  password: string;
};

export async function getAdminCredentials(): Promise<AdminCredentials> {
  const raw = await AsyncStorage.getItem(CREDS_KEY);
  if (!raw) {
    return { username: DEFAULT_ADMIN_USERNAME, password: DEFAULT_ADMIN_PASSWORD };
  }
  try {
    const parsed = JSON.parse(raw) as AdminCredentials;
    if (parsed?.username && parsed?.password) return parsed;
  } catch {}
  return { username: DEFAULT_ADMIN_USERNAME, password: DEFAULT_ADMIN_PASSWORD };
}

export async function updateAdminCredentials(creds: AdminCredentials): Promise<void> {
  await AsyncStorage.setItem(CREDS_KEY, JSON.stringify(creds));
}

export async function loginAdmin(
  username: string,
  password: string,
): Promise<boolean> {
  const stored = await getAdminCredentials();
  const ok =
    username.trim() === stored.username && password === stored.password;
  if (ok) {
    await AsyncStorage.setItem(SESSION_KEY, String(Date.now()));
  }
  return ok;
}

export async function logoutAdmin(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function isAdminLoggedIn(): Promise<boolean> {
  const v = await AsyncStorage.getItem(SESSION_KEY);
  return !!v;
}
