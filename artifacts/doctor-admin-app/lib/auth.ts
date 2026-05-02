import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";

const SESSION_KEY = "doctor_admin_session";

export interface DoctorAdminSession {
  id: string;
  username: string;
  doctor_id: string;
  doctor_name: string;
  doctor_specialty: string;
}

export async function loginDoctorAdmin(
  username: string,
  password: string,
): Promise<DoctorAdminSession | null> {
  const { data, error } = await supabase
    .from("doctor_admins")
    .select("id, username, doctor_id, doctors(name_ar, specialty_ar)")
    .eq("username", username.trim())
    .eq("password", password)
    .maybeSingle();

  if (error || !data) return null;

  const session: DoctorAdminSession = {
    id: (data as any).id,
    username: (data as any).username,
    doctor_id: (data as any).doctor_id,
    doctor_name: (data as any).doctors?.name_ar ?? "",
    doctor_specialty: (data as any).doctors?.specialty_ar ?? "",
  };

  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export async function getDoctorAdminSession(): Promise<DoctorAdminSession | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DoctorAdminSession;
  } catch {
    return null;
  }
}

export async function logoutDoctorAdmin(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}
