import { useCallback, useEffect, useRef, useState } from "react";
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

export function useAllAppointments() {
  return useQuery({
    queryKey: ["appointments", "all"],
    queryFn: async (): Promise<Appointment[]> => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, doctor:doctors(*)")
        .order("appointment_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Appointment[];
    },
  });
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

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("appointments")
        .delete()
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

export function useDoctorConversations(doctorId?: string) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["doctor_conversations", doctorId],
    enabled: !!doctorId,
    queryFn: async (): Promise<Conversation[]> => {
      if (!doctorId) return [];
      const { data, error } = await supabase
        .from("conversations")
        .select("*, doctor:doctors(*)")
        .eq("doctor_id", doctorId)
        .order("last_message_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as Conversation[];
    },
  });
  useEffect(() => {
    if (!doctorId) return;
    const ch = supabase
      .channel(`doctor_convs:${doctorId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations", filter: `doctor_id=eq.${doctorId}` },
        () => qc.invalidateQueries({ queryKey: ["doctor_conversations", doctorId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [doctorId, qc]);
  return query;
}

export function useSendMessageAsDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { conversation_id: string; doctor_id: string; user_id: string; text: string }) => {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: input.conversation_id,
          doctor_id: input.doctor_id,
          user_id: input.user_id,
          sender: "doctor",
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
      qc.invalidateQueries({ queryKey: ["doctor_conversations", vars.doctor_id] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useRealtimeMessages(conversationId?: string) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          qc.setQueryData<Message[]>(["messages", conversationId], (prev) => {
            const list = prev ?? [];
            if (list.some((m) => m.id === newMsg.id)) return list;
            return [...list, newMsg];
          });
          qc.invalidateQueries({ queryKey: ["conversations"] });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          qc.setQueryData<Message[]>(["messages", conversationId], (prev) =>
            (prev ?? []).map((m) => (m.id === updated.id ? { ...m, ...updated } : m)),
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, qc]);
}

export function useMarkMessagesRead(
  conversationId: string | undefined,
  viewerRole: "user" | "doctor",
  messages: Message[] | undefined,
) {
  const lastMarkedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!conversationId || !messages || messages.length === 0) return;
    const otherSender = viewerRole === "user" ? "doctor" : "user";
    const unreadIds = messages
      .filter((m) => m.sender === otherSender && !m.read_at && !lastMarkedRef.current.has(m.id))
      .map((m) => m.id);
    if (unreadIds.length === 0) return;
    unreadIds.forEach((id) => lastMarkedRef.current.add(id));
    void supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds);
  }, [conversationId, viewerRole, messages]);
}

export function useTypingIndicator(
  conversationId: string | undefined,
  myRole: "user" | "doctor",
) {
  const [otherTyping, setOtherTyping] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const clearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentRef = useRef<number>(0);

  useEffect(() => {
    if (!conversationId) return;
    const ch = supabase.channel(`typing:${conversationId}`, {
      config: { broadcast: { self: false } },
    });
    ch.on("broadcast", { event: "typing" }, (payload) => {
      const from = (payload.payload as { from?: string })?.from;
      if (!from || from === myRole) return;
      setOtherTyping(true);
      if (clearRef.current) clearTimeout(clearRef.current);
      clearRef.current = setTimeout(() => setOtherTyping(false), 2500);
    });
    ch.subscribe();
    channelRef.current = ch;
    return () => {
      if (clearRef.current) clearTimeout(clearRef.current);
      supabase.removeChannel(ch);
      channelRef.current = null;
    };
  }, [conversationId, myRole]);

  const notifyTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastSentRef.current < 1500) return;
    lastSentRef.current = now;
    const ch = channelRef.current;
    if (!ch) return;
    void ch.send({ type: "broadcast", event: "typing", payload: { from: myRole } });
  }, [myRole]);

  return { otherTyping, notifyTyping };
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

export function useUpdateMedicalFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<MedicalFile>): Promise<MedicalFile> => {
      const userId = await getUserId();
      const { data: existing } = await supabase
        .from("medical_files")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      const payload = { ...input, user_id: userId };
      if (existing?.id) {
        const { data, error } = await supabase
          .from("medical_files")
          .update(payload)
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data as MedicalFile;
      } else {
        const { data, error } = await supabase
          .from("medical_files")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data as MedicalFile;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medical_file"] });
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

// ---------- Favorites ----------

export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    queryFn: async (): Promise<Doctor[]> => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("favorites")
        .select("doctor:doctors(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data ?? [])
        .map((row: { doctor: Doctor | null }) => row.doctor)
        .filter(Boolean)) as Doctor[];
    },
  });
}

export function useIsFavorite(doctorId?: string) {
  return useQuery({
    queryKey: ["favorite", doctorId],
    enabled: !!doctorId,
    queryFn: async (): Promise<boolean> => {
      if (!doctorId) return false;
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", userId)
        .eq("doctor_id", doctorId)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { doctor_id: string; current: boolean }) => {
      const userId = await getUserId();
      if (input.current) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("doctor_id", input.doctor_id);
        if (error) throw error;
        return false;
      }
      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: userId, doctor_id: input.doctor_id });
      if (error && !error.message.toLowerCase().includes("duplicate")) throw error;
      return true;
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["favorite", vars.doctor_id] });
      const previous = qc.getQueryData<boolean>(["favorite", vars.doctor_id]);
      qc.setQueryData(["favorite", vars.doctor_id], !vars.current);
      return { previous };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(["favorite", vars.doctor_id], ctx.previous);
      }
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ["favorite", vars.doctor_id] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

// ---------- Bootstrap demo data for the local user ----------

export async function ensureDemoData(): Promise<void> {
  const userId = await getUserId();
  // Idempotent — calls a SQL function defined in supabase/schema.sql
  await supabase.rpc("gkm_seed_demo_data", { p_user_id: userId });
}
