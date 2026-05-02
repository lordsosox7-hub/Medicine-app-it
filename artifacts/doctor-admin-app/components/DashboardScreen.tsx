import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useColors } from "@/hooks/useColors";
import { logoutDoctorAdmin, type DoctorAdminSession } from "@/lib/auth";
import {
  useDoctorAppointments,
  markTicketScanned,
  type AppointmentWithPatient,
  type ScanResult,
} from "@/lib/hooks";

type Tab = "today" | "scanner" | "history";

interface Props {
  session: DoctorAdminSession;
  onLogout: () => void;
}

export default function DashboardScreen({ session, onLogout }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("today");
  const { data: appointments, isLoading } = useDoctorAppointments(session.doctor_id);

  const today = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter((a) => a.appointment_date === today);
  const upcomingCount = todayAppts.filter((a) => a.status === "upcoming").length;
  const completedToday = todayAppts.filter((a) => a.status === "completed").length;
  const totalCompleted = appointments.filter((a) => a.status === "completed").length;

  const handleLogout = () => {
    Alert.alert("تسجيل الخروج", "هل تريد تسجيل الخروج؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "خروج",
        style: "destructive",
        onPress: async () => {
          await logoutDoctorAdmin();
          onLogout();
        },
      },
    ]);
  };

  const tabs: {
    id: Tab;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    activeIcon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { id: "today", label: "اليوم", icon: "calendar-outline", activeIcon: "calendar" },
    { id: "scanner", label: "ماسح QR", icon: "qr-code-outline", activeIcon: "qr-code" },
    { id: "history", label: "السجل", icon: "time-outline", activeIcon: "time" },
  ];

  const tabBarHeight = 64 + (Platform.OS !== "web" ? insets.bottom : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <TouchableOpacity onPress={handleLogout} style={styles.headerBtn}>
          <Ionicons name="log-out-outline" size={22} color={colors.destructive} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerName, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_700Bold" }]}>
            {session.doctor_name}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>
            {session.doctor_specialty}
          </Text>
        </View>
        <View style={[styles.headerIcon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="medkit" size={20} color={colors.primary} />
        </View>
      </View>

      {/* ── Stats ── */}
      <View style={[styles.statsRow, { borderBottomColor: colors.border }]}>
        <StatCard label="مواعيد اليوم" value={isLoading ? "…" : String(todayAppts.length)} icon="calendar" color="primary" colors={colors} />
        <StatCard label="قادمة" value={isLoading ? "…" : String(upcomingCount)} icon="time" color="muted" colors={colors} />
        <StatCard label="مكتملة" value={isLoading ? "…" : String(completedToday)} icon="checkmark-circle" color="success" colors={colors} />
        <StatCard label="إجمالي" value={isLoading ? "…" : String(totalCompleted)} icon="people" color="primary" colors={colors} />
      </View>

      {/* ── Content ── */}
      <View style={{ flex: 1, paddingBottom: tabBarHeight }}>
        {tab === "today" && <TodayTab appointments={appointments} isLoading={isLoading} colors={colors} />}
        {tab === "scanner" && <ScannerTab doctorId={session.doctor_id} colors={colors} />}
        {tab === "history" && <HistoryTab appointments={appointments} isLoading={isLoading} colors={colors} />}
      </View>

      {/* ── Bottom Tab Bar ── */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            height: tabBarHeight,
            paddingBottom: Platform.OS !== "web" ? insets.bottom : 0,
          },
        ]}
      >
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <TouchableOpacity key={t.id} onPress={() => setTab(t.id)} style={styles.tabItem} activeOpacity={0.7}>
              <Ionicons name={active ? t.activeIcon : t.icon} size={22} color={active ? colors.primary : colors.mutedForeground} />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: active ? colors.primary : colors.mutedForeground,
                    fontFamily: active ? "IBMPlexSansArabic_700Bold" : "IBMPlexSansArabic_400Regular",
                  },
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, colors }: {
  label: string; value: string; icon: keyof typeof Ionicons.glyphMap;
  color: "primary" | "muted" | "success"; colors: any;
}) {
  const bgColor = color === "primary" ? colors.primarySoft : color === "success" ? colors.successSoft : colors.muted;
  const iconColor = color === "primary" ? colors.primary : color === "success" ? colors.success : colors.mutedForeground;
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={14} color={iconColor} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_700Bold" }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>{label}</Text>
    </View>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, colors }: { status: "upcoming" | "completed" | "cancelled"; colors: any }) {
  const cfg = {
    upcoming:  { label: "قادم",   bg: "#dbeafe", text: "#1d4ed8" },
    completed: { label: "مكتمل",  bg: colors.successSoft, text: colors.success },
    cancelled: { label: "ملغى",   bg: "#fee2e2", text: "#b91c1c" },
  }[status] ?? { label: "قادم", bg: "#dbeafe", text: "#1d4ed8" };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.text, fontFamily: "IBMPlexSansArabic_500Medium" }]}>{cfg.label}</Text>
    </View>
  );
}

// ─── Appointment Row ──────────────────────────────────────────────────────────

function AppointmentRow({ appt, colors }: { appt: AppointmentWithPatient; colors: any }) {
  return (
    <View style={[styles.apptRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <StatusBadge status={appt.status} colors={colors} />
      <View style={styles.apptInfo}>
        <Text style={[styles.apptPatient, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_500Medium" }]}>
          {appt.patient_name ?? "مريض"}
        </Text>
        <Text style={[styles.apptId, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>
          #{appt.id.slice(0, 8).toUpperCase()}
        </Text>
      </View>
      <View style={[styles.apptTime, { backgroundColor: colors.primarySoft }]}>
        <Text style={[styles.apptTimeText, { color: colors.primary, fontFamily: "IBMPlexSansArabic_700Bold" }]}>
          {appt.appointment_time}
        </Text>
      </View>
    </View>
  );
}

// ─── Today Tab ────────────────────────────────────────────────────────────────

function TodayTab({ appointments, isLoading, colors }: { appointments: AppointmentWithPatient[]; isLoading: boolean; colors: any }) {
  const today = new Date().toISOString().split("T")[0];
  const todayList = useMemo(
    () => appointments.filter((a) => a.appointment_date === today).sort((a, b) => a.appointment_time.localeCompare(b.appointment_time)),
    [appointments, today],
  );
  const dateLabel = new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.tabHeader}>
        <View style={[styles.countPill, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.countText, { color: colors.primary, fontFamily: "IBMPlexSansArabic_500Medium" }]}>
            {isLoading ? "…" : `${todayList.length} موعد`}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.tabTitle, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_700Bold" }]}>مواعيد اليوم</Text>
          <Text style={[styles.tabSub, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>{dateLabel}</Text>
        </View>
      </View>
      {isLoading ? (
        <View style={styles.list}>{[1, 2, 3].map((i) => <View key={i} style={[styles.skeleton, { backgroundColor: colors.muted }]} />)}</View>
      ) : todayList.length === 0 ? (
        <EmptyState icon="calendar-outline" title="لا توجد مواعيد اليوم" subtitle="ستظهر مواعيد اليوم هنا" colors={colors} />
      ) : (
        <View style={styles.list}>{todayList.map((a) => <AppointmentRow key={a.id} appt={a} colors={colors} />)}</View>
      )}
    </ScrollView>
  );
}

// ─── Scanner Tab ──────────────────────────────────────────────────────────────

function ScannerTab({ doctorId, colors }: { doctorId: string; colors: any }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [parseError, setParseError] = useState(false);
  const hasScannedRef = useRef(false);

  const startScan = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert("إذن الكاميرا", "يرجى السماح بالوصول إلى الكاميرا لمسح رموز QR");
        return;
      }
    }
    setScanResult(null);
    setParseError(false);
    hasScannedRef.current = false;
    setScanning(true);
  };

  const stopScan = () => setScanning(false);

  const handleBarcodeScan = useCallback(
    async ({ data }: { data: string }) => {
      if (hasScannedRef.current || processing) return;
      hasScannedRef.current = true;
      setScanning(false);
      setProcessing(true);
      try {
        const parsed = JSON.parse(data);
        if (!parsed?.id) throw new Error("no_id");
        const result = await markTicketScanned(parsed.id, doctorId);
        setScanResult(result);
      } catch {
        setParseError(true);
      } finally {
        setProcessing(false);
      }
    },
    [doctorId, processing],
  );

  const reset = () => {
    setScanResult(null);
    setParseError(false);
    hasScannedRef.current = false;
    startScan();
  };

  const done = !!scanResult || parseError;

  return (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={[styles.tabTitle, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_700Bold" }]}>ماسح QR</Text>
        <Text style={[styles.tabSub, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>
          امسح رمز QR الخاص بتذكرة الموعد
        </Text>
      </View>

      {!done && !processing && (
        <View style={[styles.scanBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {scanning ? (
            <View style={styles.cameraWrap}>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                onBarcodeScanned={handleBarcodeScan}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              />
              <View style={styles.scanFrame} />
              <View style={styles.scanHintWrap}>
                <Text style={[styles.scanHintText, { fontFamily: "IBMPlexSansArabic_500Medium" }]}>
                  وجّه الكاميرا نحو رمز QR في التذكرة
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.scanIdle}>
              <View style={[styles.scanIdleIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="scan" size={44} color={colors.primary} />
              </View>
              <Text style={[styles.scanIdleTitle, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_700Bold" }]}>
                جاهز للمسح
              </Text>
              <Text style={[styles.scanIdleSub, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>
                اضغط لتشغيل الكاميرا ومسح تذكرة الموعد
              </Text>
              <TouchableOpacity style={[styles.startBtn, { backgroundColor: colors.primary }]} onPress={startScan} activeOpacity={0.85}>
                <Ionicons name="qr-code-outline" size={18} color="#fff" />
                <Text style={[styles.startBtnText, { fontFamily: "IBMPlexSansArabic_700Bold" }]}>تشغيل الكاميرا</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {scanning && !done && (
        <TouchableOpacity style={[styles.stopBtn, { borderColor: colors.border }]} onPress={stopScan} activeOpacity={0.7}>
          <Text style={[styles.stopBtnText, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>
            إيقاف الكاميرا
          </Text>
        </TouchableOpacity>
      )}

      {processing && (
        <View style={[styles.processingBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.processingText, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_500Medium" }]}>
            جارٍ التحقق من التذكرة…
          </Text>
        </View>
      )}

      {parseError && (
        <ScanResultCard icon="alert-circle" color="red" title="رمز غير صالح" subtitle="لم يتم التعرف على هذا الرمز، تأكد أنه تذكرة موعد" onReset={reset} colors={colors} />
      )}

      {scanResult?.status === "marked_used" && (
        <ScanResultCard icon="checkmark-circle" color="green" title="تم التحقق بنجاح ✓" subtitle="تم تسجيل دخول المريض بنجاح" appointment={scanResult.appointment} onReset={reset} colors={colors} />
      )}
      {scanResult?.status === "already_used" && (
        <ScanResultCard icon="close-circle" color="red" title="تم الاستخدام مسبقاً" subtitle="هذه التذكرة سبق مسحها واستخدامها" appointment={scanResult.appointment} onReset={reset} colors={colors} />
      )}
      {scanResult?.status === "wrong_doctor" && (
        <ScanResultCard icon="close-circle" color="red" title="موعد طبيب آخر" subtitle="هذا الموعد غير مخصص لطبيبك، لا يمكن تأكيده" onReset={reset} colors={colors} />
      )}
      {scanResult?.status === "cancelled" && (
        <ScanResultCard icon="close-circle" color="red" title="موعد ملغى" subtitle="هذا الموعد تم إلغاؤه ولا يمكن تسجيله" appointment={scanResult.appointment} onReset={reset} colors={colors} />
      )}
      {scanResult?.status === "not_found" && (
        <ScanResultCard icon="alert-circle" color="red" title="الموعد غير موجود" subtitle="لم يتم العثور على هذا الموعد في النظام" onReset={reset} colors={colors} />
      )}
    </ScrollView>
  );
}

function ScanResultCard({ icon, color, title, subtitle, appointment, onReset, colors }: {
  icon: keyof typeof Ionicons.glyphMap; color: "green" | "red";
  title: string; subtitle: string; appointment?: AppointmentWithPatient | null;
  onReset: () => void; colors: any;
}) {
  const isGreen = color === "green";
  const bg = isGreen ? colors.successSoft : "#fee2e2";
  const border = isGreen ? colors.success : "#fca5a5";
  const iconColor = isGreen ? colors.success : "#b91c1c";
  const titleColor = isGreen ? colors.success : "#b91c1c";

  return (
    <View style={styles.resultWrap}>
      <View style={[styles.resultBox, { backgroundColor: bg, borderColor: border }]}>
        <Ionicons name={icon} size={52} color={iconColor} />
        <Text style={[styles.resultTitle, { color: titleColor, fontFamily: "IBMPlexSansArabic_700Bold" }]}>{title}</Text>
        <Text style={[styles.resultSub, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>{subtitle}</Text>
      </View>

      {appointment && (
        <View style={[styles.detailsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.detailsTitle, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_700Bold" }]}>تفاصيل الموعد</Text>
          {[
            { label: "رقم التذكرة", value: `#${appointment.id.slice(0, 8).toUpperCase()}` },
            { label: "تاريخ الموعد", value: appointment.appointment_date },
            { label: "وقت الموعد", value: appointment.appointment_time },
          ].map(({ label, value }) => (
            <View key={label} style={[styles.detailRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.detailValue, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_500Medium" }]}>{value}</Text>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>{label}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={[styles.resetBtn, { backgroundColor: colors.primary }]} onPress={onReset} activeOpacity={0.85}>
        <Ionicons name="refresh" size={18} color="#fff" />
        <Text style={[styles.resetBtnText, { fontFamily: "IBMPlexSansArabic_700Bold" }]}>مسح تذكرة أخرى</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────

function HistoryTab({ appointments, isLoading, colors }: { appointments: AppointmentWithPatient[]; isLoading: boolean; colors: any }) {
  const grouped = useMemo(() => {
    const map = new Map<string, AppointmentWithPatient[]>();
    for (const a of appointments) {
      if (!map.has(a.appointment_date)) map.set(a.appointment_date, []);
      map.get(a.appointment_date)!.push(a);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [appointments]);

  return (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.tabHeader}>
        <View style={[styles.countPill, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.countText, { color: colors.primary, fontFamily: "IBMPlexSansArabic_500Medium" }]}>
            {isLoading ? "…" : `${appointments.length} موعد`}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.tabTitle, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_700Bold" }]}>سجل المواعيد</Text>
          <Text style={[styles.tabSub, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>جميع المواعيد مرتبة حسب التاريخ</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.list}>{[1, 2, 3, 4].map((i) => <View key={i} style={[styles.skeleton, { backgroundColor: colors.muted }]} />)}</View>
      ) : grouped.length === 0 ? (
        <EmptyState icon="time-outline" title="لا توجد مواعيد بعد" subtitle="ستظهر المواعيد هنا عند إضافتها" colors={colors} />
      ) : (
        <View style={styles.list}>
          {grouped.map(([date, list]) => {
            const label = new Date(date).toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
            return (
              <View key={date} style={styles.group}>
                <View style={[styles.groupHeader, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
                  <Text style={[styles.groupCount, { color: colors.primary, fontFamily: "IBMPlexSansArabic_400Regular" }]}>{list.length} موعد</Text>
                  <Text style={[styles.groupDate, { color: colors.primary, fontFamily: "IBMPlexSansArabic_700Bold" }]}>{label}</Text>
                </View>
                <View style={styles.list}>
                  {list.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time)).map((a) => (
                    <AppointmentRow key={a.id} appt={a} colors={colors} />
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ icon, title, subtitle, colors }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; colors: any }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={56} color={colors.mutedForeground} style={{ opacity: 0.35 }} />
      <Text style={[styles.emptyTitle, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_500Medium" }]}>{title}</Text>
      <Text style={[styles.emptySub, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>{subtitle}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
  headerBtn: { padding: 6 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerName: { fontSize: 15 },
  headerSub: { fontSize: 12 },
  headerIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },

  statsRow: { flexDirection: "row-reverse", paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, gap: 8 },
  statCard: { flex: 1, borderRadius: 14, padding: 10, borderWidth: 1, gap: 4, alignItems: "flex-end" },
  statIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  statValue: { fontSize: 20 },
  statLabel: { fontSize: 10 },

  tabBar: { flexDirection: "row-reverse", borderTopWidth: 1, position: "absolute", bottom: 0, left: 0, right: 0 },
  tabItem: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 10, gap: 3 },
  tabLabel: { fontSize: 10 },

  tabContent: { padding: 16, gap: 16, flexGrow: 1 },
  tabHeader: { flexDirection: "row-reverse", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  tabTitle: { fontSize: 18, textAlign: "right" },
  tabSub: { fontSize: 12, textAlign: "right" },
  countPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: "flex-start" },
  countText: { fontSize: 12 },

  list: { gap: 10 },
  skeleton: { height: 64, borderRadius: 14 },

  apptRow: { flexDirection: "row-reverse", alignItems: "center", borderRadius: 14, padding: 12, borderWidth: 1, gap: 10 },
  apptInfo: { flex: 1, alignItems: "flex-end", gap: 2 },
  apptPatient: { fontSize: 14 },
  apptId: { fontSize: 11 },
  apptTime: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  apptTimeText: { fontSize: 13 },

  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11 },

  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 80, gap: 10 },
  emptyTitle: { fontSize: 15 },
  emptySub: { fontSize: 13 },

  scanBox: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  cameraWrap: { height: 360 },
  scanFrame: {
    position: "absolute", top: "50%", left: "50%",
    width: 220, height: 220, marginTop: -110, marginLeft: -110,
    borderWidth: 3, borderColor: "#fff", borderRadius: 20,
  },
  scanHintWrap: { position: "absolute", bottom: 20, left: 16, right: 16, alignItems: "center" },
  scanHintText: { color: "#fff", fontSize: 14, textAlign: "center", backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  scanIdle: { alignItems: "center", padding: 36, gap: 16 },
  scanIdleIcon: { width: 92, height: 92, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  scanIdleTitle: { fontSize: 17 },
  scanIdleSub: { fontSize: 13, textAlign: "center" },
  startBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  startBtnText: { color: "#fff", fontSize: 15 },
  stopBtn: { borderWidth: 1, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  stopBtnText: { fontSize: 14 },
  processingBox: { borderRadius: 20, borderWidth: 1, padding: 40, alignItems: "center", gap: 16 },
  processingText: { fontSize: 15 },

  resultWrap: { gap: 12 },
  resultBox: { borderRadius: 20, borderWidth: 1, padding: 28, alignItems: "center", gap: 12 },
  resultTitle: { fontSize: 20, textAlign: "center" },
  resultSub: { fontSize: 13, textAlign: "center" },
  detailsBox: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 4 },
  detailsTitle: { fontSize: 11, textAlign: "right", marginBottom: 4 },
  detailRow: { flexDirection: "row-reverse", justifyContent: "space-between", paddingVertical: 10, borderTopWidth: 1 },
  detailLabel: { fontSize: 13 },
  detailValue: { fontSize: 13 },
  resetBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 14 },
  resetBtnText: { color: "#fff", fontSize: 15 },

  group: { gap: 8 },
  groupHeader: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  groupDate: { fontSize: 13 },
  groupCount: { fontSize: 12 },
});
