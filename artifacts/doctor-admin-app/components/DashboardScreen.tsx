import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  RefreshControl, Alert, Modal, ActivityIndicator, Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useColors } from "@/hooks/useColors";
import { logoutDoctorAdmin, type DoctorAdminSession } from "@/lib/auth";
import {
  useDoctorAppointments, completeAppointment, cancelAppointment,
  markTicketScanned, type AppointmentWithPatient,
} from "@/lib/hooks";

type Tab = "today" | "scanner" | "history";
type ScanPhase = "idle" | "scanning" | "processing" | "result";

interface Props {
  session: DoctorAdminSession;
  onLogout: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
}

function fmt12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const suffix = h < 12 ? "ص" : "م";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function groupByDate(appts: AppointmentWithPatient[]) {
  const map: Record<string, AppointmentWithPatient[]> = {};
  for (const a of appts) {
    if (!map[a.appointment_date]) map[a.appointment_date] = [];
    map[a.appointment_date].push(a);
  }
  return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
}

// ─── Status config ─────────────────────────────────────────────────────────────

function statusConfig(status: string, colors: any) {
  switch (status) {
    case "completed": return { label: "مكتمل", bg: colors.successSoft, fg: colors.success, icon: "checkmark-circle" as const };
    case "cancelled": return { label: "ملغي", bg: "#fef2f2", fg: colors.destructive, icon: "close-circle" as const };
    default: return { label: "قادم", bg: colors.primarySoft, fg: colors.primary, icon: "time" as const };
  }
}

// ─── Appointment Row ───────────────────────────────────────────────────────────

function AppointmentRow({
  item, colors, onComplete, onCancel, showActions = true,
}: {
  item: AppointmentWithPatient;
  colors: any;
  onComplete?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const st = statusConfig(item.status, colors);
  const isUpcoming = item.status === "upcoming";

  const handleComplete = async () => {
    Alert.alert("تأكيد", `هل تريد تعليم الموعد لـ "${item.patient_name}" كمكتمل؟`, [
      { text: "إلغاء", style: "cancel" },
      {
        text: "مكتمل", onPress: async () => {
          setBusy(true);
          try { await completeAppointment(item.id); onComplete?.(); }
          catch { Alert.alert("خطأ", "تعذر تحديث الموعد"); }
          finally { setBusy(false); }
        },
      },
    ]);
  };

  const handleCancel = async () => {
    Alert.alert("تأكيد الإلغاء", `هل تريد إلغاء موعد "${item.patient_name}"؟`, [
      { text: "لا", style: "cancel" },
      {
        text: "إلغاء الموعد", style: "destructive", onPress: async () => {
          setBusy(true);
          try { await cancelAppointment(item.id); onCancel?.(); }
          catch { Alert.alert("خطأ", "تعذر إلغاء الموعد"); }
          finally { setBusy(false); }
        },
      },
    ]);
  };

  return (
    <View style={[styles.apptCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Top row */}
      <View style={styles.apptTop}>
        <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
          <Ionicons name={st.icon} size={12} color={st.fg} />
          <Text style={[styles.statusText, { color: st.fg, fontFamily: "IBMPlexSansArabic_500Medium" }]}>{st.label}</Text>
        </View>
        <View style={styles.apptInfo}>
          <Text style={[styles.apptPatient, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_600SemiBold" }]}>
            {item.patient_name}
          </Text>
          <Text style={[styles.apptId, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>
            {item.id.slice(0, 8).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.apptDivider, { backgroundColor: colors.border }]} />

      {/* Time + actions */}
      <View style={styles.apptBottom}>
        {showActions && isUpcoming && (
          <View style={styles.actionBtns}>
            {busy ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primarySoft }]}
                  onPress={handleComplete} activeOpacity={0.8}
                >
                  <Ionicons name="checkmark" size={14} color={colors.primary} />
                  <Text style={[styles.actionBtnText, { color: colors.primary, fontFamily: "IBMPlexSansArabic_500Medium" }]}>
                    مكتمل
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#fef2f2" }]}
                  onPress={handleCancel} activeOpacity={0.8}
                >
                  <Ionicons name="close" size={14} color={colors.destructive} />
                  <Text style={[styles.actionBtnText, { color: colors.destructive, fontFamily: "IBMPlexSansArabic_500Medium" }]}>
                    إلغاء
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
        <View style={[styles.timePill, { backgroundColor: colors.muted }]}>
          <Text style={[styles.timeText, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_500Medium" }]}>
            {fmt12(item.appointment_time)}
          </Text>
          <Ionicons name="time-outline" size={14} color={colors.mutedForeground} />
        </View>
      </View>
    </View>
  );
}

// ─── Today Tab ────────────────────────────────────────────────────────────────

function TodayTab({ appointments, isLoading, refetch, colors }: {
  appointments: AppointmentWithPatient[];
  isLoading: boolean;
  refetch: () => void;
  colors: any;
}) {
  const today = todayISO();
  const todayAppts = appointments
    .filter(a => a.appointment_date === today)
    .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
  const upcoming = todayAppts.filter(a => a.status === "upcoming");
  const completed = todayAppts.filter(a => a.status === "completed");

  if (isLoading) {
    return (
      <View style={styles.tabContent}>
        {[...Array(3)].map((_, i) => (
          <View key={i} style={[styles.skeleton, { backgroundColor: colors.muted }]} />
        ))}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.tabHeaderRow}>
        <View style={[styles.countPill, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.countText, { color: colors.primary, fontFamily: "IBMPlexSansArabic_500Medium" }]}>
            {upcoming.length} قادم
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.tabTitle, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_700Bold" }]}>
            مواعيد اليوم
          </Text>
          <Text style={[styles.tabSub, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>
            {formatDate(today)}
          </Text>
        </View>
      </View>

      {todayAppts.length === 0 ? (
        <EmptyState icon="calendar-outline" title="لا توجد مواعيد اليوم" subtitle="لم يتم حجز أي مواعيد لهذا اليوم" colors={colors} />
      ) : (
        <View style={styles.list}>
          {/* Upcoming first */}
          {upcoming.length > 0 && (
            <View style={styles.group}>
              <Text style={[styles.groupLabel, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_500Medium" }]}>
                المواعيد القادمة ({upcoming.length})
              </Text>
              {upcoming.map(a => (
                <AppointmentRow key={a.id} item={a} colors={colors} onComplete={refetch} onCancel={refetch} />
              ))}
            </View>
          )}
          {/* Completed */}
          {completed.length > 0 && (
            <View style={styles.group}>
              <Text style={[styles.groupLabel, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_500Medium" }]}>
                المكتملة ({completed.length})
              </Text>
              {completed.map(a => (
                <AppointmentRow key={a.id} item={a} colors={colors} showActions={false} />
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Scanner Tab ─────────────────────────────────────────────────────────────

function ScannerTab({ session, refetch, colors }: {
  session: DoctorAdminSession;
  refetch: () => void;
  colors: any;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [result, setResult] = useState<Awaited<ReturnType<typeof markTicketScanned>> | null>(null);
  const processingRef = useRef(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (phase === "scanning") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [phase]);

  const handleScan = async ({ data: qrData }: { data: string }) => {
    if (processingRef.current || phase !== "scanning") return;
    processingRef.current = true;
    setPhase("processing");
    try {
      const res = await markTicketScanned(qrData, session.doctor_id);
      setResult(res);
      refetch();
    } catch {
      setResult({ status: "not_found", appointment: null });
    } finally {
      setPhase("result");
      processingRef.current = false;
    }
  };

  const resetScan = () => { setPhase("idle"); setResult(null); processingRef.current = false; };

  const startScan = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert("صلاحية الكاميرا", "يرجى السماح بالوصول إلى الكاميرا من إعدادات الجهاز");
        return;
      }
    }
    setPhase("scanning");
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.tabHeaderRow}>
        <View style={[styles.countPill, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="qr-code" size={12} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.tabTitle, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_700Bold" }]}>
            مسح QR
          </Text>
          <Text style={[styles.tabSub, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>
            امسح رمز موعد المريض للتحقق
          </Text>
        </View>
      </View>

      {phase === "idle" && (
        <View style={[styles.scanBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.scanIdle}>
            <View style={[styles.scanIdleIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="qr-code-outline" size={52} color={colors.primary} />
            </View>
            <Text style={[styles.scanIdleTitle, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_700Bold" }]}>
              جاهز للمسح
            </Text>
            <Text style={[styles.scanIdleSub, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>
              اطلب من المريض عرض رمز QR الخاص بموعده ثم اضغط ابدأ المسح
            </Text>
            <TouchableOpacity
              style={[styles.startBtn, { backgroundColor: colors.primary }]}
              onPress={startScan} activeOpacity={0.85}
            >
              <Ionicons name="camera-outline" size={20} color="#fff" />
              <Text style={[styles.startBtnText, { fontFamily: "IBMPlexSansArabic_700Bold" }]}>ابدأ المسح</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {phase === "scanning" && (
        <View style={[styles.scanBox, { borderColor: colors.primary, borderWidth: 2, overflow: "hidden", borderRadius: 20 }]}>
          <View style={styles.cameraWrap}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={handleScan}
            />
            <View style={styles.scanOverlay}>
              <Animated.View style={[styles.scanFrame, { transform: [{ scale: pulseAnim }] }]}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
              </Animated.View>
              <View style={styles.scanHintWrap}>
                <Text style={[styles.scanHintText, { fontFamily: "IBMPlexSansArabic_500Medium" }]}>
                  ضع رمز QR داخل الإطار
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.stopBtn, { borderColor: colors.border, margin: 16 }]}
            onPress={resetScan} activeOpacity={0.85}
          >
            <Text style={[styles.stopBtnText, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_500Medium" }]}>
              إلغاء المسح
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {phase === "processing" && (
        <View style={[styles.scanBox, { backgroundColor: colors.card, borderColor: colors.border, padding: 48, alignItems: "center", gap: 16 }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.scanIdleTitle, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_500Medium" }]}>
            جاري التحقق...
          </Text>
        </View>
      )}

      {phase === "result" && result && (
        <ScanResultCard result={result} colors={colors} onReset={resetScan} />
      )}
    </ScrollView>
  );
}

function ScanResultCard({ result, colors, onReset }: {
  result: Awaited<ReturnType<typeof markTicketScanned>>;
  colors: any;
  onReset: () => void;
}) {
  const isSuccess = result.status === "marked_used";
  const isWarning = result.status === "already_used" || result.status === "wrong_doctor" || result.status === "cancelled";

  const config: Record<string, { icon: any; title: string; sub: string; bg: string; fg: string }> = {
    marked_used: { icon: "checkmark-circle", title: "تم التحقق!", sub: "تم تعليم الموعد كمكتمل بنجاح", bg: colors.successSoft, fg: colors.success },
    already_used: { icon: "alert-circle", title: "موعد مكتمل مسبقاً", sub: "هذا الموعد تم تعليمه مكتملاً من قبل", bg: "#fef9c3", fg: "#ca8a04" },
    wrong_doctor: { icon: "close-circle", title: "موعد لطبيب آخر", sub: "هذا الموعد لا يخص هذه العيادة", bg: "#fef2f2", fg: colors.destructive },
    cancelled: { icon: "close-circle", title: "موعد ملغي", sub: "هذا الموعد تم إلغاؤه مسبقاً", bg: "#fef2f2", fg: colors.destructive },
    not_found: { icon: "help-circle", title: "موعد غير موجود", sub: "لم يتم العثور على هذا الموعد في النظام", bg: colors.muted, fg: colors.mutedForeground },
  };

  const c = config[result.status] ?? config.not_found;

  return (
    <View style={styles.resultWrap}>
      <View style={[styles.resultBox, { backgroundColor: c.bg, borderColor: c.fg + "30" }]}>
        <Ionicons name={c.icon} size={64} color={c.fg} />
        <Text style={[styles.resultTitle, { color: c.fg, fontFamily: "IBMPlexSansArabic_700Bold" }]}>{c.title}</Text>
        <Text style={[styles.resultSub, { color: c.fg + "cc", fontFamily: "IBMPlexSansArabic_400Regular" }]}>{c.sub}</Text>
      </View>

      {result.appointment && (
        <View style={[styles.detailsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.detailsTitle, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_500Medium" }]}>
            تفاصيل الموعد
          </Text>
          {[
            { label: "المريض", value: result.appointment.patient_name ?? "—" },
            { label: "التاريخ", value: formatDate(result.appointment.appointment_date) },
            { label: "الوقت", value: fmt12(result.appointment.appointment_time) },
          ].map(row => (
            <View key={row.label} style={[styles.detailRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.detailValue, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>{row.value}</Text>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>{row.label}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.startBtn, { backgroundColor: colors.primary }]}
        onPress={onReset} activeOpacity={0.85}
      >
        <Ionicons name="qr-code-outline" size={20} color="#fff" />
        <Text style={[styles.startBtnText, { fontFamily: "IBMPlexSansArabic_700Bold" }]}>مسح موعد آخر</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────

function HistoryTab({ appointments, isLoading, refetch, colors }: {
  appointments: AppointmentWithPatient[];
  isLoading: boolean;
  refetch: () => void;
  colors: any;
}) {
  const today = todayISO();
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const past = appointments.filter(a => a.appointment_date !== today);
  const groups = groupByDate(past);

  const toggle = (date: string) => setExpandedDates(p => ({ ...p, [date]: !p[date] }));

  if (isLoading) {
    return (
      <View style={styles.tabContent}>
        {[...Array(4)].map((_, i) => (
          <View key={i} style={[styles.skeleton, { backgroundColor: colors.muted }]} />
        ))}
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} />}
    >
      <View style={styles.tabHeaderRow}>
        <View style={[styles.countPill, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.countText, { color: colors.primary, fontFamily: "IBMPlexSansArabic_500Medium" }]}>
            {past.length}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.tabTitle, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_700Bold" }]}>
            السجل الكامل
          </Text>
          <Text style={[styles.tabSub, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>
            جميع المواعيد السابقة
          </Text>
        </View>
      </View>

      {groups.length === 0 ? (
        <EmptyState icon="time-outline" title="لا يوجد سجل" subtitle="لم تتم أي مواعيد بعد" colors={colors} />
      ) : (
        <View style={styles.list}>
          {groups.map(([date, items]) => {
            const isOpen = expandedDates[date] !== false;
            const completedCount = items.filter(a => a.status === "completed").length;
            return (
              <View key={date} style={[styles.historyGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.historyGroupHeader}
                  onPress={() => toggle(date)} activeOpacity={0.8}
                >
                  <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
                  <View style={styles.historyGroupMeta}>
                    <Text style={[styles.historyGroupDate, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_600SemiBold" }]}>
                      {formatDate(date)}
                    </Text>
                    <Text style={[styles.historyGroupSub, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>
                      {completedCount}/{items.length} مكتمل
                    </Text>
                  </View>
                </TouchableOpacity>
                {isOpen && (
                  <View style={[styles.historyGroupBody, { borderTopColor: colors.border }]}>
                    {items.map(a => (
                      <AppointmentRow key={a.id} item={a} colors={colors} showActions={false} />
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ icon, title, subtitle, colors }: { icon: any; title: string; subtitle: string; colors: any }) {
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIconWrap, { backgroundColor: colors.muted }]}>
        <Ionicons name={icon} size={44} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_600SemiBold" }]}>{title}</Text>
      <Text style={[styles.emptySub, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>{subtitle}</Text>
    </View>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardScreen({ session, onLogout }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("today");
  const [showLogout, setShowLogout] = useState(false);
  const { data: appointments, isLoading, refetch } = useDoctorAppointments(session.doctor_id);

  const today = todayISO();
  const todayAppts = appointments.filter(a => a.appointment_date === today);
  const todayUpcoming = todayAppts.filter(a => a.status === "upcoming");
  const todayCompleted = todayAppts.filter(a => a.status === "completed");
  const allCompleted = appointments.filter(a => a.status === "completed");

  const handleLogout = async () => {
    setShowLogout(false);
    await logoutDoctorAdmin();
    onLogout();
  };

  const TABS: { id: Tab; label: string; icon: any; activeIcon: any }[] = [
    { id: "today", label: "اليوم", icon: "calendar-outline", activeIcon: "calendar" },
    { id: "scanner", label: "مسح QR", icon: "qr-code-outline", activeIcon: "qr-code" },
    { id: "history", label: "السجل", icon: "time-outline", activeIcon: "time" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: colors.card,
        borderBottomColor: colors.border,
        paddingTop: insets.top + 10,
      }]}>
        <TouchableOpacity
          style={[styles.headerBtn, { backgroundColor: colors.muted }]}
          onPress={() => setShowLogout(true)}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerName, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_700Bold" }]}>
            د. {session.doctor_name || session.username}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>
            {session.doctor_specialty || "لوحة التحكم"}
          </Text>
        </View>
        <View style={[styles.headerAvatar, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="medical" size={22} color={colors.primary} />
        </View>
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {[
          { icon: "time", label: "قادم اليوم", value: todayUpcoming.length, bg: colors.primarySoft, fg: colors.primary },
          { icon: "checkmark-circle", label: "مكتمل اليوم", value: todayCompleted.length, bg: colors.successSoft, fg: colors.success },
          { icon: "calendar", label: "إجمالي اليوم", value: todayAppts.length, bg: "#f3f4f6", fg: colors.mutedForeground },
          { icon: "star", label: "مكتمل كلي", value: allCompleted.length, bg: "#fef9c3", fg: "#ca8a04" },
        ].map(s => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
            <Ionicons name={s.icon as any} size={16} color={s.fg} />
            <Text style={[styles.statValue, { color: s.fg, fontFamily: "IBMPlexSansArabic_700Bold" }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: s.fg + "bb", fontFamily: "IBMPlexSansArabic_400Regular" }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Tab content */}
      <View style={{ flex: 1 }}>
        {tab === "today" && <TodayTab appointments={appointments} isLoading={isLoading} refetch={refetch} colors={colors} />}
        {tab === "scanner" && <ScannerTab session={session} refetch={refetch} colors={colors} />}
        {tab === "history" && <HistoryTab appointments={appointments} isLoading={isLoading} refetch={refetch} colors={colors} />}
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, {
        backgroundColor: colors.card,
        borderTopColor: colors.border,
        paddingBottom: insets.bottom + 4,
      }]}>
        {TABS.map(t => {
          const isActive = tab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={styles.tabItem}
              onPress={() => setTab(t.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.tabIconWrap, isActive && { backgroundColor: colors.primarySoft }]}>
                <Ionicons
                  name={isActive ? t.activeIcon : t.icon}
                  size={22}
                  color={isActive ? colors.primary : colors.mutedForeground}
                />
              </View>
              <Text style={[
                styles.tabLabel,
                {
                  color: isActive ? colors.primary : colors.mutedForeground,
                  fontFamily: isActive ? "IBMPlexSansArabic_600SemiBold" : "IBMPlexSansArabic_400Regular",
                },
              ]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Logout modal */}
      <Modal visible={showLogout} transparent animationType="fade" onRequestClose={() => setShowLogout(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowLogout(false)}>
          <View style={[styles.logoutCard, { backgroundColor: colors.card }]}>
            <View style={[styles.logoutIcon, { backgroundColor: "#fef2f2" }]}>
              <Ionicons name="log-out-outline" size={28} color={colors.destructive} />
            </View>
            <Text style={[styles.logoutTitle, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_700Bold" }]}>
              تسجيل الخروج
            </Text>
            <Text style={[styles.logoutSub, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>
              هل أنت متأكد من رغبتك في تسجيل الخروج؟
            </Text>
            <View style={styles.logoutBtns}>
              <TouchableOpacity
                style={[styles.logoutBtn, { backgroundColor: colors.muted }]}
                onPress={() => setShowLogout(false)} activeOpacity={0.8}
              >
                <Text style={[styles.logoutBtnText, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_500Medium" }]}>
                  إلغاء
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.logoutBtn, { backgroundColor: colors.destructive }]}
                onPress={handleLogout} activeOpacity={0.8}
              >
                <Text style={[styles.logoutBtnText, { color: "#fff", fontFamily: "IBMPlexSansArabic_600SemiBold" }]}>
                  تسجيل الخروج
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerName: { fontSize: 16 },
  headerSub: { fontSize: 12, marginTop: 1 },
  headerAvatar: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },

  statsRow: {
    flexDirection: "row-reverse",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 6,
  },
  statCard: {
    flex: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 8,
    alignItems: "center", gap: 3,
  },
  statValue: { fontSize: 18 },
  statLabel: { fontSize: 9, textAlign: "center" },

  tabBar: {
    flexDirection: "row-reverse",
    borderTopWidth: 1,
    paddingTop: 6,
  },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 4 },
  tabIconWrap: { width: 42, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  tabLabel: { fontSize: 10 },

  tabContent: { padding: 16, gap: 14, flexGrow: 1 },
  tabHeaderRow: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 12 },
  tabTitle: { fontSize: 19, textAlign: "right" },
  tabSub: { fontSize: 12, textAlign: "right", marginTop: 2 },
  countPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, alignSelf: "flex-start" },
  countText: { fontSize: 13 },

  list: { gap: 10 },
  skeleton: { height: 80, borderRadius: 16 },
  group: { gap: 8 },
  groupLabel: { fontSize: 12, textAlign: "right" },

  apptCard: { borderRadius: 16, padding: 14, borderWidth: 1, gap: 10 },
  apptTop: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  apptInfo: { flex: 1, alignItems: "flex-end", gap: 3 },
  apptPatient: { fontSize: 15 },
  apptId: { fontSize: 11 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12 },
  apptDivider: { height: 1, marginHorizontal: 0 },
  apptBottom: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  timePill: { flexDirection: "row-reverse", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  timeText: { fontSize: 13 },
  actionBtns: { flexDirection: "row-reverse", gap: 8 },
  actionBtn: { flexDirection: "row-reverse", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  actionBtnText: { fontSize: 12 },

  empty: { alignItems: "center", paddingVertical: 64, gap: 12 },
  emptyIconWrap: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontSize: 16 },
  emptySub: { fontSize: 13, textAlign: "center" },

  scanBox: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  cameraWrap: { height: 380, position: "relative" },
  scanOverlay: { ...StyleSheet.absoluteFillObject },
  scanFrame: {
    position: "absolute", top: "50%", left: "50%",
    width: 230, height: 230,
    marginTop: -115, marginLeft: -115,
  },
  corner: { position: "absolute", width: 30, height: 30, borderColor: "#fff", borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  scanHintWrap: { position: "absolute", bottom: 20, left: 16, right: 16, alignItems: "center" },
  scanHintText: { color: "#fff", fontSize: 14, textAlign: "center", backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  scanIdle: { alignItems: "center", padding: 36, gap: 16 },
  scanIdleIcon: { width: 100, height: 100, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  scanIdleTitle: { fontSize: 18 },
  scanIdleSub: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  startBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  startBtnText: { color: "#fff", fontSize: 15 },
  stopBtn: { borderWidth: 1, borderRadius: 14, paddingVertical: 13, alignItems: "center", marginTop: 4 },
  stopBtnText: { fontSize: 14 },

  resultWrap: { gap: 14 },
  resultBox: { borderRadius: 20, borderWidth: 1, padding: 32, alignItems: "center", gap: 12 },
  resultTitle: { fontSize: 22, textAlign: "center" },
  resultSub: { fontSize: 13, textAlign: "center", lineHeight: 20 },
  detailsBox: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 0 },
  detailsTitle: { fontSize: 11, textAlign: "right", marginBottom: 4 },
  detailRow: { flexDirection: "row-reverse", justifyContent: "space-between", paddingVertical: 10, borderTopWidth: 1 },
  detailLabel: { fontSize: 13 },
  detailValue: { fontSize: 13 },

  historyGroup: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  historyGroupHeader: { flexDirection: "row-reverse", alignItems: "center", padding: 14, gap: 10 },
  historyGroupMeta: { flex: 1, alignItems: "flex-end" },
  historyGroupDate: { fontSize: 14 },
  historyGroupSub: { fontSize: 12, marginTop: 2 },
  historyGroupBody: { borderTopWidth: 1, padding: 12, gap: 10 },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "flex-end" },
  logoutCard: {
    width: "100%", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 28, alignItems: "center", gap: 12,
  },
  logoutIcon: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  logoutTitle: { fontSize: 20 },
  logoutSub: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  logoutBtns: { flexDirection: "row-reverse", gap: 12, marginTop: 8, width: "100%" },
  logoutBtn: { flex: 1, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  logoutBtnText: { fontSize: 15 },
});
