import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type Appointment,
  type Conversation,
  type Doctor,
  type LabResult,
  type MedicalFile,
  type Message,
  type Payment,
  type Refund,
  supabase,
} from "@/lib/supabase";
import { getUserId } from "@/lib/userId";
import {
  getFavoriteIds,
  isFavoriteId,
  addFavoriteId,
  removeFavoriteId,
} from "@/lib/localFavorites";

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

function parseArabicTimeTo24h(timeStr: string): { hours: number; minutes: number } {
  const match = timeStr.match(/(\d+):(\d+)/);
  if (!match) return { hours: 12, minutes: 0 };
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (timeStr.includes("صباحاً")) {
    if (hours === 12) hours = 0;
  } else {
    if (hours !== 12) hours += 12;
  }
  return { hours, minutes };
}

function isAppointmentInFuture(dateStr: string, timeStr: string): boolean {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const { hours, minutes } = parseArabicTimeTo24h(timeStr);
    const apptDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return apptDate.getTime() > Date.now();
  } catch {
    return false;
  }
}

export function useUpcomingAppointment() {
  const { data, ...rest } = useAppointments();
  const upcoming = data?.find(
    (a) => a.status === "upcoming" && isAppointmentInFuture(a.appointment_date, a.appointment_time)
  );
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

export type AppointmentWithPatient = Appointment & {
  patient_name: string | null;
};

export function useAllAppointmentsWithPatients() {
  return useQuery({
    queryKey: ["appointments", "all", "with_patients"],
    queryFn: async (): Promise<AppointmentWithPatient[]> => {
      const [apptRes, filesRes] = await Promise.all([
        supabase
          .from("appointments")
          .select("*, doctor:doctors(*)")
          .order("appointment_date", { ascending: false }),
        supabase
          .from("medical_files")
          .select("user_id, full_name_ar"),
      ]);
      if (apptRes.error) throw apptRes.error;
      if (filesRes.error) throw filesRes.error;

      const nameMap = new Map<string, string>();
      for (const f of filesRes.data ?? []) {
        if (f.user_id && (f as any).full_name_ar) {
          nameMap.set(f.user_id as string, (f as any).full_name_ar as string);
        }
      }

      return (apptRes.data ?? []).map((a) => ({
        ...(a as Appointment),
        patient_name: nameMap.get((a as any).user_id as string) ?? null,
      }));
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

export type TicketScanResult =
  | { status: "marked_used"; appointment: AppointmentWithPatient }
  | { status: "already_used"; appointment: AppointmentWithPatient }
  | { status: "cancelled"; appointment: AppointmentWithPatient };

export function useMarkTicketScanned() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (appointmentId: string): Promise<TicketScanResult> => {
      const { data: apt, error } = await supabase
        .from("appointments")
        .select("*, doctor:doctors(*)")
        .eq("id", appointmentId)
        .maybeSingle();
      if (error) throw error;
      if (!apt) throw new Error("not_found");

      const { data: file } = await supabase
        .from("medical_files")
        .select("full_name_ar")
        .eq("user_id", (apt as any).user_id)
        .maybeSingle();

      const apptWithPatient: AppointmentWithPatient = {
        ...(apt as Appointment),
        patient_name: (file as any)?.full_name_ar ?? null,
      };

      if ((apt as any).status === "completed") {
        return { status: "already_used", appointment: apptWithPatient };
      }
      if ((apt as any).status === "cancelled") {
        return { status: "cancelled", appointment: apptWithPatient };
      }

      const { error: updateError } = await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", appointmentId);
      if (updateError) throw updateError;

      return {
        status: "marked_used",
        appointment: { ...apptWithPatient, status: "completed" },
      };
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

// ---------- Favorites (stored locally in AsyncStorage) ----------

export function useFavorites() {
  return useQuery({
    queryKey: ["favorites"],
    staleTime: 30_000,
    queryFn: async (): Promise<Doctor[]> => {
      const ids = await getFavoriteIds();
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .in("id", ids);
      if (error) throw error;
      const map = new Map((data ?? []).map((d: Doctor) => [d.id, d]));
      return ids.map((id) => map.get(id)).filter(Boolean) as Doctor[];
    },
  });
}

export function useIsFavorite(doctorId?: string) {
  return useQuery({
    queryKey: ["favorite", doctorId],
    enabled: !!doctorId,
    staleTime: 30_000,
    queryFn: async (): Promise<boolean> => {
      if (!doctorId) return false;
      return isFavoriteId(doctorId);
    },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { doctor_id: string; current: boolean }) => {
      if (input.current) {
        await removeFavoriteId(input.doctor_id);
        return false;
      }
      await addFavoriteId(input.doctor_id);
      return true;
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ["favorite", vars.doctor_id] });
      await qc.cancelQueries({ queryKey: ["favorites"] });

      const previousIsFav = qc.getQueryData<boolean>(["favorite", vars.doctor_id]);
      const previousList = qc.getQueryData<Doctor[]>(["favorites"]);

      qc.setQueryData(["favorite", vars.doctor_id], !vars.current);

      if (vars.current) {
        qc.setQueryData<Doctor[]>(["favorites"], (old) =>
          old ? old.filter((d) => d.id !== vars.doctor_id) : [],
        );
      }

      return { previousIsFav, previousList };
    },
    onError: (_err, vars, ctx) => {
      if (ctx?.previousIsFav !== undefined) {
        qc.setQueryData(["favorite", vars.doctor_id], ctx.previousIsFav);
      }
      if (ctx?.previousList !== undefined) {
        qc.setQueryData(["favorites"], ctx.previousList);
      }
    },
    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: ["favorite", vars.doctor_id] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

// ---------- Payments (manual transfer verification) ----------

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      appointment_id: string;
      doctor_id: string;
      amount: number;
      method: string;
      txn_ref: string;
    }): Promise<Payment> => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("payments")
        .insert({
          appointment_id: input.appointment_id,
          user_id: userId,
          doctor_id: input.doctor_id,
          amount: input.amount,
          method: input.method,
          txn_ref: input.txn_ref,
          status: "pending",
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as Payment;
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ["payment", p.appointment_id] });
      qc.invalidateQueries({ queryKey: ["pending_payments"] });
    },
  });
}

export function usePaymentByAppointment(appointmentId?: string) {
  return useQuery({
    queryKey: ["payment", appointmentId ?? ""],
    enabled: !!appointmentId,
    queryFn: async (): Promise<Payment | null> => {
      if (!appointmentId) return null;
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("appointment_id", appointmentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as Payment | null) ?? null;
    },
    refetchInterval: (q) => {
      const p = q.state.data as Payment | null | undefined;
      return p && p.status === "pending" ? 4000 : false;
    },
  });
}

export function useRealtimePayment(appointmentId?: string) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!appointmentId) return;
    const channel = supabase
      .channel(`payment:${appointmentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
          filter: `appointment_id=eq.${appointmentId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["payment", appointmentId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [appointmentId, qc]);
}

export function usePendingPayments() {
  return useQuery({
    queryKey: ["pending_payments"],
    queryFn: async (): Promise<Array<Payment & { doctor?: Doctor }>> => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, doctor:doctors(*)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<Payment & { doctor?: Doctor }>;
    },
    refetchInterval: 8000,
  });
}

export function useUpdatePaymentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      appointment_id: string;
      status: "confirmed" | "rejected";
      reason?: string;
      user_id: string;
      amount: number;
      doctor_name_ar?: string;
    }) => {
      const patch: Record<string, unknown> = { status: input.status };
      if (input.status === "confirmed") {
        patch.confirmed_at = new Date().toISOString();
      } else {
        patch.rejected_at = new Date().toISOString();
        patch.rejection_reason = input.reason ?? null;
      }
      const { error } = await supabase
        .from("payments")
        .update(patch)
        .eq("id", input.id);
      if (error) throw error;

      const doctorLabel = input.doctor_name_ar ? ` مع ${input.doctor_name_ar}` : "";
      const amountLabel = `${Math.round(input.amount)} ج.س`;
      const notif =
        input.status === "confirmed"
          ? {
              user_id: input.user_id,
              kind: "payment",
              title_ar: "✅ تم تأكيد الدفع",
              body_ar: `تم تأكيد دفعتك بمبلغ ${amountLabel}${doctorLabel}. موعدك مؤكد!`,
              ref_id: input.appointment_id,
            }
          : {
              user_id: input.user_id,
              kind: "payment",
              title_ar: "❌ لم يتم تأكيد الدفع",
              body_ar: input.reason ?? "رقم العملية غير مطابق. يرجى التواصل مع الدعم.",
              ref_id: input.appointment_id,
            };
      await supabase.from("notifications").insert(notif);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["payment", vars.appointment_id] });
      qc.invalidateQueries({ queryKey: ["pending_payments"] });
      qc.invalidateQueries({ queryKey: ["user_notifications"] });
    },
  });
}

export function useUserNotifications() {
  return useQuery({
    queryKey: ["user_notifications"],
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<{
        id: string;
        user_id: string;
        kind: string;
        title_ar: string;
        body_ar: string;
        ref_id: string | null;
        read: boolean;
        created_at: string;
      }>;
    },
    refetchInterval: 20000,
  });
}

export function useMarkDbNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user_notifications"] });
    },
  });
}

// ---------- Refunds & No-Show ----------

function appointmentDatetime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const { hours, minutes } = parseArabicTimeTo24h(timeStr);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function isRefundWindowOpen(dateStr: string, timeStr: string): boolean {
  try {
    const apptTime = appointmentDatetime(dateStr, timeStr);
    return apptTime.getTime() - Date.now() > 2 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function isAppointmentPast(dateStr: string, timeStr: string): boolean {
  try {
    const apptTime = appointmentDatetime(dateStr, timeStr);
    return Date.now() >= apptTime.getTime();
  } catch {
    return false;
  }
}

function isAppointmentNoShow(dateStr: string, timeStr: string): boolean {
  try {
    const apptTime = appointmentDatetime(dateStr, timeStr);
    return Date.now() > apptTime.getTime() + 30 * 60 * 1000;
  } catch {
    return false;
  }
}

export function useCreateRefundAndCancel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (appointmentId: string): Promise<{ hasRefund: boolean; refundAmount: number }> => {
      const userId = await getUserId();

      const { data: payment } = await supabase
        .from("payments")
        .select("*")
        .eq("appointment_id", appointmentId)
        .eq("status", "confirmed")
        .maybeSingle();

      const { error: cancelError } = await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", appointmentId);
      if (cancelError) throw cancelError;

      if (payment) {
        const feeAmount = Math.round(payment.amount * 0.05);
        const refundAmount = payment.amount - feeAmount;

        await supabase.from("refunds").insert({
          appointment_id: appointmentId,
          payment_id: payment.id,
          user_id: userId,
          original_amount: payment.amount,
          fee_amount: feeAmount,
          refund_amount: refundAmount,
          reason: "patient_cancelled",
          status: "pending",
        });

        await supabase.from("notifications").insert({
          user_id: userId,
          kind: "refund",
          title_ar: "🔄 طلب استرداد مقدم",
          body_ar: `تم إلغاء موعدك. سيتم استرداد ${Math.round(refundAmount)} ج.س (بعد خصم 5% رسوم) خلال 3-5 أيام عمل.`,
          ref_id: appointmentId,
        });

        return { hasRefund: true, refundAmount };
      }

      return { hasRefund: false, refundAmount: 0 };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["refund"] });
      qc.invalidateQueries({ queryKey: ["user_notifications"] });
    },
  });
}

export function useRefundByAppointment(appointmentId?: string) {
  return useQuery({
    queryKey: ["refund", appointmentId ?? ""],
    enabled: !!appointmentId,
    queryFn: async (): Promise<Refund | null> => {
      if (!appointmentId) return null;
      const { data, error } = await supabase
        .from("refunds")
        .select("*")
        .eq("appointment_id", appointmentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as Refund | null) ?? null;
    },
  });
}

export function usePendingRefunds() {
  return useQuery({
    queryKey: ["pending_refunds"],
    queryFn: async (): Promise<Refund[]> => {
      const { data, error } = await supabase
        .from("refunds")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Refund[];
    },
    refetchInterval: 10000,
  });
}

export function useUpdateRefundStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: "processed" | "rejected" }) => {
      const { error } = await supabase
        .from("refunds")
        .update({ status: input.status, processed_at: new Date().toISOString() })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending_refunds"] });
    },
  });
}

export function useAutoMarkNoShow(appointments: Appointment[] | undefined) {
  const qc = useQueryClient();
  const ranRef = useRef(false);
  useEffect(() => {
    if (!appointments || appointments.length === 0 || ranRef.current) return;
    const noShowIds = appointments
      .filter((a) => a.status === "upcoming" && isAppointmentNoShow(a.appointment_date, a.appointment_time))
      .map((a) => a.id);
    if (noShowIds.length === 0) return;
    ranRef.current = true;
    supabase
      .from("appointments")
      .update({ status: "no_show" })
      .in("id", noShowIds)
      .then(() => {
        qc.invalidateQueries({ queryKey: ["appointments"] });
      });
  }, [appointments, qc]);
}

// ---------- Admin: Doctor management ----------

export type NewDoctorInput = Omit<Doctor, "id"> & { id?: string };

export function useCreateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewDoctorInput): Promise<void> => {
      const { id: _id, ...rest } = input;
      const { error } = await supabase.from("doctors").insert(rest);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

export function useUpdateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Doctor> & { id: string }): Promise<void> => {
      const { id, ...rest } = input;
      const { error } = await supabase
        .from("doctors")
        .update(rest)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["doctors"] });
      qc.invalidateQueries({ queryKey: ["doctor", vars.id] });
    },
  });
}

export function useDeleteDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("doctors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctors"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// ---------- Admin: User (patient) directory ----------

export type AdminUser = {
  user_id: string;
  full_name_ar: string | null;
  age: number | null;
  gender: string | null;
  blood_type: string | null;
  appointments_count: number;
  conversations_count: number;
  last_seen_at: string | null;
  has_medical_file: boolean;
};

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async (): Promise<AdminUser[]> => {
      const [filesRes, apptRes, convRes] = await Promise.all([
        supabase.from("medical_files").select("user_id, full_name_ar, age, gender, blood_type, created_at"),
        supabase.from("appointments").select("user_id, created_at"),
        supabase.from("conversations").select("user_id, last_message_at, created_at"),
      ]);
      if (filesRes.error) throw filesRes.error;
      if (apptRes.error) throw apptRes.error;
      if (convRes.error) throw convRes.error;

      const map = new Map<string, AdminUser>();
      const ensure = (id: string): AdminUser => {
        let u = map.get(id);
        if (!u) {
          u = {
            user_id: id,
            full_name_ar: null,
            age: null,
            gender: null,
            blood_type: null,
            appointments_count: 0,
            conversations_count: 0,
            last_seen_at: null,
            has_medical_file: false,
          };
          map.set(id, u);
        }
        return u;
      };
      const bumpSeen = (u: AdminUser, ts: string | null | undefined) => {
        if (!ts) return;
        if (!u.last_seen_at || ts > u.last_seen_at) u.last_seen_at = ts;
      };

      for (const r of filesRes.data ?? []) {
        const u = ensure(r.user_id as string);
        u.full_name_ar = (r as any).full_name_ar ?? null;
        u.age = (r as any).age ?? null;
        u.gender = (r as any).gender ?? null;
        u.blood_type = (r as any).blood_type ?? null;
        u.has_medical_file = true;
        bumpSeen(u, (r as any).created_at);
      }
      for (const r of apptRes.data ?? []) {
        const u = ensure(r.user_id as string);
        u.appointments_count += 1;
        bumpSeen(u, (r as any).created_at);
      }
      for (const r of convRes.data ?? []) {
        const u = ensure(r.user_id as string);
        u.conversations_count += 1;
        bumpSeen(u, (r as any).last_message_at ?? (r as any).created_at);
      }
      return Array.from(map.values()).sort((a, b) => {
        const ta = a.last_seen_at ?? "";
        const tb = b.last_seen_at ?? "";
        return tb.localeCompare(ta);
      });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      // Cascade-delete the user's data across all tables (no auth account).
      const tables = [
        "messages",
        "conversations",
        "payments",
        "appointments",
        "lab_results",
        "vital_readings",
        "medical_files",
      ] as const;
      for (const t of tables) {
        const { error } = await supabase.from(t).delete().eq("user_id", userId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "conversations"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// ---------- Doctor Admins ----------

export interface DoctorAdminRow {
  id: string;
  username: string;
  password: string;
  doctor_id: string;
  created_at: string;
  doctor?: Doctor;
}

export function useDoctorAdmins() {
  return useQuery({
    queryKey: ["doctor_admins"],
    queryFn: async (): Promise<DoctorAdminRow[]> => {
      const { data, error } = await supabase
        .from("doctor_admins")
        .select("*, doctor:doctors(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DoctorAdminRow[];
    },
  });
}

export function useCreateDoctorAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      username: string;
      password: string;
      doctor_id: string;
    }) => {
      const { data, error } = await supabase
        .from("doctor_admins")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctor_admins"] }),
  });
}

export function useDeleteDoctorAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("doctor_admins")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctor_admins"] }),
  });
}

// ---------- Doctor-admin appointments (with realtime) ----------

export function useDoctorAdminAppointments(doctorId: string | null) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!doctorId) return;
    const ch = supabase
      .channel(`doctor_appts_${doctorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `doctor_id=eq.${doctorId}`,
        },
        () =>
          qc.invalidateQueries({
            queryKey: ["doctor_admin_appointments", doctorId],
          }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [doctorId, qc]);

  return useQuery({
    queryKey: ["doctor_admin_appointments", doctorId],
    enabled: !!doctorId,
    queryFn: async (): Promise<AppointmentWithPatient[]> => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("doctor_id", doctorId!)
        .order("appointment_date", { ascending: false })
        .order("appointment_time", { ascending: true });
      if (error) throw error;

      const rows = (data ?? []) as Appointment[];
      const userIds = [...new Set(rows.map((r) => r.user_id))];
      const { data: files } = await supabase
        .from("medical_files")
        .select("user_id, full_name_ar")
        .in("user_id", userIds.length ? userIds : ["__none__"]);

      const nameMap = Object.fromEntries(
        (files ?? []).map((f: any) => [f.user_id, f.full_name_ar]),
      );
      return rows.map((r) => ({
        ...r,
        patient_name: nameMap[r.user_id] ?? null,
      }));
    },
  });
}

export type DoctorTicketScanResult =
  | { status: "marked_used"; appointment: AppointmentWithPatient }
  | { status: "already_used"; appointment: AppointmentWithPatient }
  | { status: "cancelled"; appointment: AppointmentWithPatient }
  | { status: "wrong_doctor"; appointment: AppointmentWithPatient };

export function useMarkDoctorTicketScanned(doctorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      appointmentId: string,
    ): Promise<DoctorTicketScanResult> => {
      const { data: apt, error } = await supabase
        .from("appointments")
        .select("*, doctor:doctors(*)")
        .eq("id", appointmentId)
        .maybeSingle();
      if (error) throw error;
      if (!apt) throw new Error("not_found");

      const { data: file } = await supabase
        .from("medical_files")
        .select("full_name_ar")
        .eq("user_id", (apt as any).user_id)
        .maybeSingle();

      const appt: AppointmentWithPatient = {
        ...(apt as Appointment),
        patient_name: (file as any)?.full_name_ar ?? null,
      };

      if ((apt as any).doctor_id !== doctorId) {
        return { status: "wrong_doctor", appointment: appt };
      }
      if ((apt as any).status === "completed") {
        return { status: "already_used", appointment: appt };
      }
      if ((apt as any).status === "cancelled") {
        return { status: "cancelled", appointment: appt };
      }

      const { error: updateError } = await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", appointmentId);
      if (updateError) throw updateError;

      return {
        status: "marked_used",
        appointment: { ...appt, status: "completed" },
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["doctor_admin_appointments", doctorId],
      });
    },
  });
}

// ---------- Admin: All conversations & message monitor ----------

export function useAllConversations() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "conversations"],
    queryFn: async (): Promise<Conversation[]> => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*, doctor:doctors(*)")
        .order("last_message_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as Conversation[];
    },
  });
  useEffect(() => {
    const ch = supabase
      .channel("admin_all_convs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => qc.invalidateQueries({ queryKey: ["admin", "conversations"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);
  return query;
}

