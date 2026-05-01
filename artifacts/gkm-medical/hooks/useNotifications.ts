import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import {
  useAppointments,
  useConversations,
  useUserNotifications,
  useMarkDbNotificationRead,
} from "@/hooks/useGkmData";
import {
  addClearedIds,
  addReadIds,
  getClearedIds,
  getReadIds,
} from "@/lib/notificationsStore";

export type NotificationItem = {
  id: string;
  kind: "appointment" | "message" | "system" | "payment";
  title: string;
  body: string;
  timestamp: string;
  icon: keyof typeof Feather.glyphMap;
  iconBg: string;
  iconColor: string;
  doctorId?: string;
  conversationId?: string;
  appointmentId?: string;
  dbId?: string;
  read: boolean;
};

function formatArDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("ar", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    return dateStr;
  }
}

export function useNotifications() {
  const { data: appointments } = useAppointments();
  const { data: conversations } = useConversations();
  const { data: dbNotifications } = useUserNotifications();
  const markDbRead = useMarkDbNotificationRead();
  const qc = useQueryClient();

  const [readIds, setReadIds] = useState<string[]>([]);
  const [clearedIds, setClearedIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refreshLocal = useCallback(async () => {
    const [r, c] = await Promise.all([getReadIds(), getClearedIds()]);
    setReadIds(r);
    setClearedIds(c);
    setLoaded(true);
  }, []);

  useEffect(() => {
    refreshLocal();
  }, [refreshLocal]);

  const items: NotificationItem[] = useMemo(() => {
    const list: NotificationItem[] = [];

    // ── Payment notifications from Supabase ──────────────────────────────────
    (dbNotifications ?? []).forEach((n) => {
      const isConfirmed = n.title_ar.includes("تأكيد الدفع") && !n.title_ar.includes("لم");
      list.push({
        id: `db:${n.id}`,
        dbId: n.id,
        kind: "payment",
        title: n.title_ar,
        body: n.body_ar,
        timestamp: n.created_at,
        icon: isConfirmed ? "check-circle" : "x-circle",
        iconBg: isConfirmed ? "#e7f7ee" : "#fde8e8",
        iconColor: isConfirmed ? "#16a34a" : "#ef4444",
        appointmentId: n.ref_id ?? undefined,
        read: n.read,
      });
    });

    // ── Upcoming appointment reminders ───────────────────────────────────────
    (appointments ?? [])
      .filter((a) => a.status === "upcoming")
      .forEach((a) => {
        const id = `appt:${a.id}`;
        const docName = a.doctor?.name_ar ?? "طبيبك";
        list.push({
          id,
          kind: "appointment",
          title: "تذكير بموعدك القادم",
          body: `لديك موعد مع ${docName} يوم ${formatArDate(
            a.appointment_date,
          )} الساعة ${a.appointment_time}`,
          timestamp: a.created_at,
          icon: "calendar",
          iconBg: "#e8f0ff",
          iconColor: "#1e6bf0",
          doctorId: a.doctor_id,
          read: false,
        });
      });

    // ── Recent conversation messages ─────────────────────────────────────────
    (conversations ?? [])
      .filter((c) => c.last_message && c.last_message_at)
      .forEach((c) => {
        const id = `msg:${c.id}:${c.last_message_at}`;
        const docName = c.doctor?.name_ar ?? "طبيب";
        list.push({
          id,
          kind: "message",
          title: `رسالة جديدة من ${docName}`,
          body: c.last_message ?? "",
          timestamp: c.last_message_at as string,
          icon: "message-circle",
          iconBg: "#e7f7ee",
          iconColor: "#16a34a",
          doctorId: c.doctor_id,
          conversationId: c.id,
          read: false,
        });
      });

    // ── Static welcome / system message ─────────────────────────────────────
    list.push({
      id: "system:welcome",
      kind: "system",
      title: "مرحباً بك في راحة للرعاية الطبية",
      body: "احجز مواعيدك، تابع حالتك الصحية، وتواصل مع الأطباء بسهولة.",
      timestamp: new Date(0).toISOString(),
      icon: "heart",
      iconBg: "#fde8e8",
      iconColor: "#ef4444",
      read: false,
    });

    const cleared = new Set(clearedIds);
    const read = new Set(readIds);
    return list
      .filter((it) => !cleared.has(it.id))
      .map((it) => {
        // DB notifications track read server-side; local ones use AsyncStorage
        const isRead = it.dbId ? it.read : read.has(it.id);
        return { ...it, read: isRead };
      })
      .sort((a, b) => {
        const ta = new Date(a.timestamp).getTime() || 0;
        const tb = new Date(b.timestamp).getTime() || 0;
        return tb - ta;
      });
  }, [appointments, conversations, dbNotifications, readIds, clearedIds]);

  const unreadCount = useMemo(
    () => items.filter((it) => !it.read).length,
    [items],
  );

  const markRead = useCallback(
    async (ids: string[]) => {
      // For DB-backed notifications, mark them read on the server
      const dbIds = ids
        .filter((id) => id.startsWith("db:"))
        .map((id) => id.replace("db:", ""));
      dbIds.forEach((dbId) => markDbRead.mutate(dbId));

      // For local notifications, use AsyncStorage
      const localIds = ids.filter((id) => !id.startsWith("db:"));
      if (localIds.length) {
        await addReadIds(localIds);
        setReadIds((prev) => Array.from(new Set([...prev, ...localIds])));
      }
    },
    [markDbRead],
  );

  const markAllRead = useCallback(async () => {
    const ids = items.filter((it) => !it.read).map((it) => it.id);
    if (!ids.length) return;
    await markRead(ids);
  }, [items, markRead]);

  const clearAll = useCallback(async () => {
    const ids = items.map((it) => it.id);
    await addClearedIds(ids);
    setClearedIds((prev) => Array.from(new Set([...prev, ...ids])));
  }, [items]);

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["appointments"] });
    qc.invalidateQueries({ queryKey: ["conversations"] });
    qc.invalidateQueries({ queryKey: ["user_notifications"] });
  }, [qc]);

  return {
    items,
    unreadCount,
    loaded,
    markRead,
    markAllRead,
    clearAll,
    refresh,
  };
}
