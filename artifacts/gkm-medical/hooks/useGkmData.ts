import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type Appointment,
  type Conversation,
  type Doctor,
  type LabResult,
  type MedicalFile,
  type Message,
  supabase,
} from "@/lib/supabase";
import { getUserId } from "@/lib/userId";

// ---------- Doctors ----------

export function useDoctors(category?: string) {
  return useQuery({
    queryKey: ["doctors", category ?? "all"],
    queryFn: async (): Promise<Doctor[]> => {
      let q = supabase.from("doctors").select("*").order("rating", { ascending: false });
      if (category && category !== "all") {
        q = q.eq("category", category);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Doctor[];
    },
  });
}

export function useDoctor(id?: string) {
  return useQuery({
    queryKey: ["doctor", id],
    enabled: !!id,
    queryFn: async (): Promise<Doctor | null> => {
      if (!id) return null;
      const { data, error } = await supabase.from("doctors").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Doctor;
    },
  });
}

// ---------- Appointments ----------

export function useAppointments() {
  return useQuery({
    queryKey: ["appointments"],
    queryFn: async (): Promise<Appointment[]> => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("appointments")
        .select("*, doctor:doctors(*)")
        .eq("user_id", userId)
        .order("appointment_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Appointment[];
    },
  });
}

export function useUpcomingAppointment() {
  const { data, ...rest } = useAppointments();
  const upcoming = data?.find((a) => a.status === "upcoming");
  return { data: upcoming, ...rest };
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { doctor_id: string; appointment_date: string; appointment_time: string }) => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("appointments")
        .insert({ ...input, user_id: userId, status: "upcoming" })
        .select()
        .single();
      if (error) throw error;
      return data as Appointment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

// ---------- Chat ----------

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async (): Promise<Conversation[]> => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("conversations")
        .select("*, doctor:doctors(*)")
        .eq("user_id", userId)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Conversation[];
    },
  });
}

export function useOrCreateConversation(doctorId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<Conversation> => {
      if (!doctorId) throw new Error("doctorId required");
      const userId = await getUserId();
      const { data: existing } = await supabase
        .from("conversations")
        .select("*, doctor:doctors(*)")
        .eq("user_id", userId)
        .eq("doctor_id", doctorId)
        .maybeSingle();
      if (existing) return existing as Conversation;
      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: userId, doctor_id: doctorId })
        .select("*, doctor:doctors(*)")
        .single();
      if (error) throw error;
      return data as Conversation;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useMessages(conversationId?: string) {
  return useQuery({
    queryKey: ["messages", conversationId],
    enabled: !!conversationId,
    queryFn: async (): Promise<Message[]> => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { conversation_id: string; doctor_id: string; text: string }) => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: input.conversation_id,
          doctor_id: input.doctor_id,
          user_id: userId,
          sender: "user",
          text: input.text,
        })
        .select()
        .single();
      if (error) throw error;
      await supabase
        .from("conversations")
        .update({ last_message: input.text, last_message_at: new Date().toISOString() })
        .eq("id", input.conversation_id);
      return data as Message;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["messages", vars.conversation_id] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// ---------- Medical file ----------

export function useMedicalFile() {
  return useQuery({
    queryKey: ["medical_file"],
    queryFn: async (): Promise<MedicalFile | null> => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("medical_files")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data as MedicalFile | null;
    },
  });
}

// ---------- Lab results ----------

export function useLabResults(filter: "all" | "blood" | "urine" = "all") {
  return useQuery({
    queryKey: ["lab_results", filter],
    queryFn: async (): Promise<LabResult[]> => {
      const userId = await getUserId();
      let q = supabase.from("lab_results").select("*").eq("user_id", userId);
      if (filter !== "all") q = q.eq("test_type", filter);
      const { data, error } = await q.order("test_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as LabResult[];
    },
  });
}

// ---------- Bootstrap demo data for the local user ----------

export async function ensureDemoData(): Promise<void> {
  const userId = await getUserId();
  // Idempotent — calls a SQL function defined in supabase/schema.sql
  await supabase.rpc("gkm_seed_demo_data", { p_user_id: userId });
}
