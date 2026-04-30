import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Stack } from "expo-router";
import { useColors } from "@/hooks/useColors";
import {
  useAllAppointments,
  useDoctors,
  useDoctorConversations,
  useMessages,
  useRealtimeMessages,
  useSendMessageAsDoctor,
  useTypingIndicator,
  useMarkMessagesRead,
} from "@/hooks/useGkmData";
import { MessageBubble, TypingBubble } from "@/components/MessageBubble";
import { Feather } from "@expo/vector-icons";
import type { Appointment } from "@/lib/supabase";

type AdminTab = "appointments" | "revenue" | "chat";

const TABS: Array<{ id: AdminTab; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { id: "appointments", label: "Appointments", icon: "calendar" },
  { id: "revenue", label: "Revenue", icon: "trending-up" },
  { id: "chat", label: "Doctor Console", icon: "message-square" },
];

export default function AdminScreen() {
  const colors = useColors();
  const [tab, setTab] = useState<AdminTab>("appointments");

  return (
    <>
      <Stack.Screen options={{ title: "Admin", headerShown: true }} />
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.tabBar,
            { borderBottomColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id)}
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor: active ? colors.primary : "transparent",
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Feather
                  name={t.icon}
                  size={14}
                  color={active ? colors.primaryForeground : colors.foreground}
                />
                <Text
                  style={{
                    color: active ? colors.primaryForeground : colors.foreground,
                    fontFamily: "IBMPlexSansArabic_700Bold",
                    fontSize: 13,
                  }}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tab === "appointments" && <AppointmentsView />}
        {tab === "revenue" && <RevenueView />}
        {tab === "chat" && <DoctorConsoleView />}
      </View>
    </>
  );
}

// =============== Appointments View ===============

type AppointmentFilter = "all" | "upcoming" | "completed" | "cancelled";

function AppointmentsView() {
  const colors = useColors();
  const { data: appointments, isLoading } = useAllAppointments();
  const [filter, setFilter] = useState<AppointmentFilter>("all");

  const filtered = useMemo(() => {
    const list = appointments ?? [];
    if (filter === "all") return list;
    return list.filter((a) => a.status === filter);
  }, [appointments, filter]);

  const counts = useMemo(() => {
    const list = appointments ?? [];
    return {
      all: list.length,
      upcoming: list.filter((a) => a.status === "upcoming").length,
      completed: list.filter((a) => a.status === "completed").length,
      cancelled: list.filter((a) => a.status === "cancelled").length,
    };
  }, [appointments]);

  const filters: Array<{ id: AppointmentFilter; label: string; count: number }> = [
    { id: "all", label: "All", count: counts.all },
    { id: "upcoming", label: "Upcoming", count: counts.upcoming },
    { id: "completed", label: "Completed", count: counts.completed },
    { id: "cancelled", label: "Cancelled", count: counts.cancelled },
  ];

  if (isLoading) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {filters.map((f) => {
          const active = filter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? colors.primary : colors.primarySoft,
                  borderColor: active ? colors.primary : "transparent",
                },
              ]}
            >
              <Text
                style={{
                  color: active ? colors.primaryForeground : colors.primary,
                  fontFamily: "IBMPlexSansArabic_700Bold",
                  fontSize: 13,
                }}
              >
                {f.label}
              </Text>
              <View
                style={[
                  styles.filterBadge,
                  {
                    backgroundColor: active
                      ? "rgba(255,255,255,0.25)"
                      : colors.background,
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? colors.primaryForeground : colors.primary,
                    fontFamily: "IBMPlexSansArabic_700Bold",
                    fontSize: 11,
                  }}
                >
                  {f.count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="calendar" size={42} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No appointments to display.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 16, paddingTop: 8, gap: 10 }}
          renderItem={({ item }) => (
            <AppointmentRow appointment={item} />
          )}
        />
      )}
    </View>
  );
}

function AppointmentRow({ appointment }: { appointment: Appointment }) {
  const colors = useColors();
  const statusColor =
    appointment.status === "upcoming"
      ? colors.primary
      : appointment.status === "completed"
        ? colors.success
        : colors.danger;
  const statusBg =
    appointment.status === "upcoming"
      ? colors.primarySoft
      : appointment.status === "completed"
        ? colors.accents.green.bg
        : colors.accents.red.bg;
  const formattedDate = (() => {
    try {
      return new Date(appointment.appointment_date).toLocaleDateString("ar", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return appointment.appointment_date;
    }
  })();

  return (
    <View
      style={[
        styles.apptCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.apptHeader}>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.apptDoctor, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {appointment.doctor?.name_ar ?? "Unknown doctor"}
          </Text>
          <Text
            style={[styles.apptSpecialty, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {appointment.doctor?.specialty_ar ?? ""}
          </Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
          <Text style={{ color: statusColor, fontFamily: "IBMPlexSansArabic_700Bold", fontSize: 11 }}>
            {appointment.status}
          </Text>
        </View>
      </View>

      <View style={[styles.apptDivider, { backgroundColor: colors.border }]} />

      <View style={styles.apptMeta}>
        <View style={styles.apptMetaItem}>
          <Feather name="calendar" size={13} color={colors.mutedForeground} />
          <Text style={[styles.apptMetaText, { color: colors.foreground }]}>
            {formattedDate}
          </Text>
        </View>
        <View style={styles.apptMetaItem}>
          <Feather name="clock" size={13} color={colors.mutedForeground} />
          <Text style={[styles.apptMetaText, { color: colors.foreground }]}>
            {appointment.appointment_time}
          </Text>
        </View>
        <View style={styles.apptMetaItem}>
          <Feather name="user" size={13} color={colors.mutedForeground} />
          <Text style={[styles.apptMetaText, { color: colors.foreground }]}>
            Patient {appointment.user_id.slice(0, 8)}
          </Text>
        </View>
        <View style={styles.apptMetaItem}>
          <Feather name="dollar-sign" size={13} color={colors.primary} />
          <Text style={[styles.apptMetaText, { color: colors.primary, fontFamily: "IBMPlexSansArabic_700Bold" }]}>
            {appointment.doctor?.price ?? 0} ج.س
          </Text>
        </View>
      </View>
    </View>
  );
}

// =============== Revenue View ===============

function RevenueView() {
  const colors = useColors();
  const { data: appointments, isLoading } = useAllAppointments();

  const stats = useMemo(() => {
    const list = appointments ?? [];
    const completed = list.filter((a) => a.status === "completed");
    const upcoming = list.filter((a) => a.status === "upcoming");
    const cancelled = list.filter((a) => a.status === "cancelled");
    const sumPrice = (arr: Appointment[]) =>
      arr.reduce((s, a) => s + (a.doctor?.price ?? 0), 0);

    const totalRevenue = sumPrice(completed);
    const projected = sumPrice(upcoming);
    const lost = sumPrice(cancelled);

    // Group by doctor
    const byDoctor = new Map<
      string,
      { name: string; specialty: string; bookings: number; revenue: number }
    >();
    for (const a of completed) {
      const key = a.doctor_id;
      const prev = byDoctor.get(key) ?? {
        name: a.doctor?.name_ar ?? "Unknown",
        specialty: a.doctor?.specialty_ar ?? "",
        bookings: 0,
        revenue: 0,
      };
      prev.bookings += 1;
      prev.revenue += a.doctor?.price ?? 0;
      byDoctor.set(key, prev);
    }
    const doctorRows = Array.from(byDoctor.values()).sort(
      (a, b) => b.revenue - a.revenue,
    );

    // Group by month (last 6)
    const byMonth = new Map<string, number>();
    for (const a of completed) {
      const d = new Date(a.appointment_date);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + (a.doctor?.price ?? 0));
    }
    const monthRows = Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([key, value]) => {
        const [yy, mm] = key.split("-");
        const labelDate = new Date(Number(yy), Number(mm) - 1, 1);
        return {
          key,
          label: labelDate.toLocaleDateString("en", { month: "short", year: "numeric" }),
          value,
        };
      });
    const monthMax = Math.max(1, ...monthRows.map((m) => m.value));

    return {
      totalRevenue,
      projected,
      lost,
      completedCount: completed.length,
      upcomingCount: upcoming.length,
      cancelledCount: cancelled.length,
      doctorRows,
      monthRows,
      monthMax,
    };
  }, [appointments]);

  if (isLoading) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* KPI cards */}
      <View style={styles.kpiGrid}>
        <KpiCard
          label="Total revenue"
          value={`${stats.totalRevenue.toLocaleString()} ج.س`}
          sub={`${stats.completedCount} completed`}
          tone="success"
          icon="trending-up"
        />
        <KpiCard
          label="Projected"
          value={`${stats.projected.toLocaleString()} ج.س`}
          sub={`${stats.upcomingCount} upcoming`}
          tone="primary"
          icon="clock"
        />
        <KpiCard
          label="Lost (cancelled)"
          value={`${stats.lost.toLocaleString()} ج.س`}
          sub={`${stats.cancelledCount} cancelled`}
          tone="danger"
          icon="x-circle"
        />
        <KpiCard
          label="Total bookings"
          value={String(
            stats.completedCount + stats.upcomingCount + stats.cancelledCount,
          )}
          sub="All time"
          tone="muted"
          icon="calendar"
        />
      </View>

      {/* Monthly chart */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Revenue by month
        </Text>
        {stats.monthRows.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.mutedForeground, paddingVertical: 8 }]}>
            No completed appointments yet.
          </Text>
        ) : (
          <View style={{ gap: 10, marginTop: 8 }}>
            {stats.monthRows.map((m) => {
              const pct = m.value / stats.monthMax;
              return (
                <View key={m.key} style={{ gap: 4 }}>
                  <View style={styles.monthHeader}>
                    <Text
                      style={[styles.monthLabel, { color: colors.foreground }]}
                    >
                      {m.label}
                    </Text>
                    <Text
                      style={[styles.monthValue, { color: colors.primary }]}
                    >
                      {m.value.toLocaleString()} ج.س
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.barTrack,
                      { backgroundColor: colors.primarySoft },
                    ]}
                  >
                    <View
                      style={[
                        styles.barFill,
                        {
                          backgroundColor: colors.primary,
                          width: `${Math.max(4, pct * 100)}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Revenue by doctor */}
      <View
        style={[
          styles.section,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Revenue by doctor
        </Text>
        {stats.doctorRows.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.mutedForeground, paddingVertical: 8 }]}>
            No completed appointments yet.
          </Text>
        ) : (
          <View style={{ gap: 10, marginTop: 8 }}>
            {stats.doctorRows.map((d, idx) => (
              <View
                key={`${d.name}-${idx}`}
                style={[
                  styles.doctorRow,
                  { borderBottomColor: colors.border },
                ]}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={[styles.doctorName, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {d.name}
                  </Text>
                  <Text
                    style={[
                      styles.doctorMeta,
                      { color: colors.mutedForeground },
                    ]}
                    numberOfLines={1}
                  >
                    {d.specialty} • {d.bookings} bookings
                  </Text>
                </View>
                <Text
                  style={[styles.doctorRevenue, { color: colors.primary }]}
                >
                  {d.revenue.toLocaleString()} ج.س
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function KpiCard({
  label,
  value,
  sub,
  tone,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "primary" | "success" | "danger" | "muted";
  icon: keyof typeof Feather.glyphMap;
}) {
  const colors = useColors();
  const tones = {
    primary: { fg: colors.primary, bg: colors.primarySoft },
    success: { fg: colors.success, bg: colors.accents.green.bg },
    danger: { fg: colors.danger, bg: colors.accents.red.bg },
    muted: { fg: colors.mutedForeground, bg: colors.muted },
  } as const;
  const t = tones[tone];
  return (
    <View
      style={[
        styles.kpiCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.kpiIcon, { backgroundColor: t.bg }]}>
        <Feather name={icon} size={18} color={t.fg} />
      </View>
      <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.kpiValue, { color: colors.foreground }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.kpiSub, { color: colors.mutedForeground }]}>
        {sub}
      </Text>
    </View>
  );
}

// =============== Doctor Console View (existing chat) ===============

function DoctorConsoleView() {
  const colors = useColors();
  const { data: doctors, isLoading: doctorsLoading } = useDoctors();
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedConvId, setSelectedConvId] = useState<string>("");
  const [text, setText] = useState("");

  const { data: conversations, isLoading: convsLoading } = useDoctorConversations(
    selectedDoctorId || undefined,
  );
  const { data: messages } = useMessages(selectedConvId || undefined);
  useRealtimeMessages(selectedConvId || undefined);
  useMarkMessagesRead(selectedConvId || undefined, "doctor", messages);
  const { otherTyping, notifyTyping } = useTypingIndicator(
    selectedConvId || undefined,
    "doctor",
  );
  const sendAsDoctor = useSendMessageAsDoctor();

  const selectedConv = useMemo(
    () => conversations?.find((c) => c.id === selectedConvId),
    [conversations, selectedConvId],
  );

  const send = () => {
    const t = text.trim();
    if (!t || !selectedConv) return;
    sendAsDoctor.mutate({
      conversation_id: selectedConv.id,
      doctor_id: selectedConv.doctor_id,
      user_id: selectedConv.user_id,
      text: t,
    });
    setText("");
  };

  return (
    <View style={styles.flex}>
      <View
        style={[
          styles.toolbar,
          { borderBottomColor: colors.border, backgroundColor: colors.card },
        ]}
      >
        <Text style={[styles.toolbarLabel, { color: colors.mutedForeground }]}>
          Signed in as:
        </Text>
        {doctorsLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {(doctors ?? []).map((d) => {
              const active = selectedDoctorId === d.id;
              return (
                <Pressable
                  key={d.id}
                  onPress={() => {
                    setSelectedDoctorId(d.id);
                    setSelectedConvId("");
                  }}
                  style={[
                    styles.doctorChip,
                    {
                      backgroundColor: active
                        ? colors.primary
                        : colors.primarySoft,
                      borderColor: active ? colors.primary : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active
                        ? colors.primaryForeground
                        : colors.primary,
                      fontFamily: "IBMPlexSansArabic_700Bold",
                      fontSize: 13,
                    }}
                  >
                    {d.name_ar}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {!selectedDoctorId ? (
        <View style={styles.empty}>
          <Feather name="user-check" size={42} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Pick a doctor above to view that doctor&apos;s incoming patient
            messages.
          </Text>
        </View>
      ) : (
        <View style={styles.split}>
          <View
            style={[
              styles.sidebar,
              {
                borderRightColor: colors.border,
                borderLeftColor: colors.border,
                backgroundColor: colors.card,
              },
            ]}
          >
            <Text style={[styles.sidebarHeader, { color: colors.foreground }]}>
              Conversations
            </Text>
            {convsLoading ? (
              <ActivityIndicator
                color={colors.primary}
                style={{ marginTop: 24 }}
              />
            ) : (conversations?.length ?? 0) === 0 ? (
              <Text
                style={[
                  styles.emptyText,
                  { color: colors.mutedForeground, padding: 16 },
                ]}
              >
                No patient conversations yet.
              </Text>
            ) : (
              <FlatList
                data={conversations}
                keyExtractor={(c) => c.id}
                renderItem={({ item }) => {
                  const active = item.id === selectedConvId;
                  return (
                    <Pressable
                      onPress={() => setSelectedConvId(item.id)}
                      style={[
                        styles.convRow,
                        {
                          borderBottomColor: colors.border,
                          backgroundColor: active
                            ? colors.primarySoft
                            : "transparent",
                        },
                      ]}
                    >
                      <Text
                        style={[styles.convName, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        Patient {item.user_id.slice(0, 8)}
                      </Text>
                      <Text
                        style={[
                          styles.convPreview,
                          { color: colors.mutedForeground },
                        ]}
                        numberOfLines={1}
                      >
                        {item.last_message ?? "(no messages yet)"}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            )}
          </View>

          <View style={styles.chatPane}>
            {!selectedConvId ? (
              <View style={styles.empty}>
                <Feather
                  name="message-square"
                  size={42}
                  color={colors.mutedForeground}
                />
                <Text
                  style={[styles.emptyText, { color: colors.mutedForeground }]}
                >
                  Pick a conversation on the side to start replying.
                </Text>
              </View>
            ) : (
              <>
                <View
                  style={[
                    styles.chatHeader,
                    {
                      borderBottomColor: colors.border,
                      backgroundColor: colors.card,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chatHeaderTitle,
                      { color: colors.foreground },
                    ]}
                  >
                    Patient {selectedConv?.user_id.slice(0, 8)}
                  </Text>
                  {otherTyping && (
                    <Text
                      style={[
                        styles.chatHeaderStatus,
                        { color: colors.primary },
                      ]}
                    >
                      Patient is typing...
                    </Text>
                  )}
                </View>
                {(() => {
                  const list: Array<
                    { kind: "typing" } | { kind: "msg"; id: string; msg: any }
                  > = [];
                  if (otherTyping) list.push({ kind: "typing" });
                  (messages ?? []).forEach((m) =>
                    list.push({ kind: "msg", id: m.id, msg: m }),
                  );
                  return (
                    <FlatList
                      data={[...list].reverse()}
                      keyExtractor={(item) =>
                        item.kind === "typing" ? "__typing" : item.id
                      }
                      inverted
                      contentContainerStyle={{ paddingVertical: 12 }}
                      renderItem={({ item }) =>
                        item.kind === "typing" ? (
                          <TypingBubble />
                        ) : (
                          <MessageBubble
                            message={item.msg}
                            viewerRole="doctor"
                          />
                        )
                      }
                    />
                  );
                })()}
                <View
                  style={[
                    styles.inputBar,
                    {
                      borderTopColor: colors.border,
                      backgroundColor: colors.card,
                    },
                  ]}
                >
                  <TextInput
                    value={text}
                    onChangeText={(v) => {
                      setText(v);
                      if (v.length > 0) notifyTyping();
                    }}
                    placeholder="Reply as the doctor..."
                    placeholderTextColor={colors.mutedForeground}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.input,
                        color: colors.foreground,
                      },
                    ]}
                    onSubmitEditing={send}
                    multiline
                  />
                  <Pressable
                    onPress={send}
                    disabled={!text.trim()}
                    style={[
                      styles.sendBtn,
                      {
                        backgroundColor: text.trim()
                          ? colors.primary
                          : colors.mutedForeground,
                      },
                    ]}
                  >
                    <Feather
                      name="send"
                      size={18}
                      color={colors.primaryForeground}
                    />
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const isWeb = Platform.OS === "web";

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  tabBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },

  // Appointments view
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  apptCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  apptHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  apptDoctor: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
  },
  apptSpecialty: {
    fontSize: 12.5,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  apptDivider: { height: 1 },
  apptMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    rowGap: 6,
  },
  apptMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  apptMetaText: {
    fontSize: 12.5,
    fontFamily: "IBMPlexSansArabic_500Medium",
  },

  // Revenue view
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  kpiCard: {
    flexBasis: "47%",
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_500Medium",
  },
  kpiValue: {
    fontSize: 18,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  kpiSub: {
    fontSize: 11.5,
    fontFamily: "IBMPlexSansArabic_500Medium",
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  monthLabel: {
    fontSize: 12.5,
    fontFamily: "IBMPlexSansArabic_500Medium",
  },
  monthValue: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  barTrack: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 5,
  },
  doctorRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  doctorName: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
  },
  doctorMeta: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
    marginTop: 2,
  },
  doctorRevenue: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },

  // Console view (existing)
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  toolbarLabel: { fontSize: 13, fontFamily: "IBMPlexSansArabic_500Medium" },
  doctorChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  split: {
    flex: 1,
    flexDirection: isWeb ? "row" : "column",
  },
  sidebar: {
    width: isWeb ? 320 : "100%",
    maxHeight: isWeb ? "100%" : 240,
    borderRightWidth: isWeb ? 1 : 0,
    borderBottomWidth: isWeb ? 0 : 1,
  },
  sidebarHeader: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_700Bold",
    padding: 16,
    paddingBottom: 8,
  },
  convRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  convName: { fontSize: 14, fontFamily: "IBMPlexSansArabic_700Bold", marginBottom: 2 },
  convPreview: { fontSize: 12, fontFamily: "IBMPlexSansArabic_400Regular" },
  chatPane: { flex: 1 },
  chatHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  chatHeaderTitle: { fontSize: 14, fontFamily: "IBMPlexSansArabic_700Bold" },
  chatHeaderStatus: { fontSize: 11, fontFamily: "IBMPlexSansArabic_500Medium", marginTop: 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  emptyText: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "center",
    maxWidth: 320,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
