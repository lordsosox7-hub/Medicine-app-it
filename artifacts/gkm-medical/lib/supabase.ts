import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY env vars",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});

export type Doctor = {
  id: string;
  name_ar: string;
  specialty_ar: string;
  category: string;
  photo_url: string | null;
  rating: number;
  years_experience: number;
  about_ar: string;
  services_ar: string[];
  price: number;
  clinic_name_ar?: string | null;
  clinic_address_ar?: string | null;
  clinic_phone?: string | null;
  clinic_maps_url?: string | null;
};

export type Appointment = {
  id: string;
  user_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  status: "upcoming" | "completed" | "cancelled";
  created_at: string;
  doctor?: Doctor;
};

export type Message = {
  id: string;
  conversation_id: string;
  doctor_id: string;
  user_id: string;
  sender: "user" | "doctor";
  text: string;
  created_at: string;
  read_at: string | null;
};

export type Conversation = {
  id: string;
  user_id: string;
  doctor_id: string;
  last_message: string | null;
  last_message_at: string | null;
  doctor?: Doctor;
};

export type MedicalFile = {
  id: string;
  user_id: string;
  full_name_ar: string;
  age: number;
  gender: string;
  blood_type: string;
  allergies: string[];
  chronic_diseases: string[];
  current_medications: string[];
  past_surgeries: string[];
  vaccinations: string[];
};

export type LabResult = {
  id: string;
  user_id: string;
  test_name_ar: string;
  test_type: "blood" | "urine" | "other";
  test_date: string;
  status: "normal" | "high" | "low";
  result_value: string;
  unit: string | null;
  reference_range: string | null;
};
