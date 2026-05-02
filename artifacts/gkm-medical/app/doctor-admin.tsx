import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import {
  useDoctorAdminAppointments,
  useMarkDoctorTicketScanned,
  type AppointmentWithPatient,
} from "@/hooks/useGkmData";
import {
  loginDoctorAdmin,
  getDoctorAdminSession,
  logoutDoctorAdmin,
  type DoctorAdminSession,
} from "@/lib/doctorAdminAuth";

// ====================================================================
// Types
// ====================================================================

type DashTab = "today" | "scanner" | "history";

const TABS: Array<{ id: DashTab; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { id: "today", label: "اليوم", icon: "calendar" },
  { id: "scanner", label: "ماسح QR", icon: "camera" },
  { id: "history", label: "السجل", icon: "clock" },
];

// ====================================================================
// Main page
// ====================================================================

export default function DoctorAdminPage() {
  const colors = useColors();
  const [session, setSession] = useState<DoctorAdminSession | null | "loading">("loading");

  useEffect(() => {
    getDoctorAdminSession().then((s) => setSession(s));
  }, []);

  if (session === "loading") {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <DoctorAdminLogin onLogin={setSession} />;
  }

  return <DoctorAdminDashboard session={session} onLogout={() => setSession(null)} />;
}

// ====================================================================
// Login
// ====================================================================

function DoctorAdminLogin({ onLogin }: { onLogin: (s: DoctorAdminSession) => void }) {
  const colors = useColors();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    setError(null);
    if (!username.trim() || !password) {
      setError("الرجاء إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    setBusy(true);
    try {
      const session = await loginDoctorAdmin(username, password);
      if (!session) {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة");
      } else {
        onLogin(session);
      }
    } catch {
      setError("حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.loginCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.loginIcon, { backgroundColor: colors.primarySoft }]}>
          <Feather name="user-check" size={28} color={colors.primary} />
        </View>
        <Text style={[styles.loginTitle, { color: colors.foreground }]}>لوحة مشرف الطبيب</Text>
        <Text style={[styles.loginSub, { color: colors.mutedForeground }]}>
          تسجيل الدخول لمتابعة مواعيد طبيبك
        </Text>

        <View style={{ gap: 10, width: "100%" }}>
          <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
            <TextInput
              value={username}
              onChangeText={setUsername}
              placeholder="اسم المستخدم"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              style={[styles.input, { color: colors.foreground }]}
              textAlign="right"
            />
            <Feather name="user" size={16} color={colors.mutedForeground} />
          </View>
          <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.inputBackground }]}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="كلمة المرور"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              autoCapitalize="none"
              style={[styles.input, { color: colors.foreground }]}
              textAlign="right"
              onSubmitEditing={handleLogin}
            />
            <Feather name="lock" size={16} color={colors.mutedForeground} />
          </View>

          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.accents.red.bg, borderColor: colors.danger }]}>
              <Feather name="alert-circle" size={13} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          )}

          <Pressable
            onPress={handleLogin}
            disabled={busy}
            style={[styles.btn, { backgroundColor: colors.primary, opacity: busy ? 0.7 : 1 }]}
          >
            {busy ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.btnText, { color: colors.primaryForeground }]}>تسجيل الدخول</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ====================================================================
// Dashboard
// ====================================================================

function DoctorAdminDashboard({
  session,
  onLogout,
}: {
  session: DoctorAdminSession;
  onLogout: () => void;
}) {
  const colors = useColors();
  const [tab, setTab] = useState<DashTab>("today");
  const appts = useDoctorAdminAppointments(session.doctor_id);

  const handleLogout = async () => {
    await logoutDoctorAdmin();
    onLogout();
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable onPress={handleLogout} style={styles.logoutBtn}>
          <Feather name="log-out" size={18} color={colors.danger} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            {session.doctor_name}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]} numberOfLines={1}>
            {session.doctor_specialty}
          </Text>
        </View>
        <View style={[styles.headerAvatar, { backgroundColor: colors.primarySoft }]}>
          <Feather name="activity" size={18} color={colors.primary} />
        </View>
      </View>

      {/* Stats bar */}
      <StatsBar appointments={appts.data ?? []} isLoading={appts.isLoading} />

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[styles.tabItem, active && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            >
              <Feather name={t.icon} size={14} color={active ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.tabLabel, { color: active ? colors.primary : colors.mutedForeground }]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Content */}
      {tab === "today" && <TodayTab appointments={appts.data ?? []} isLoading={appts.isLoading} />}
      {tab === "scanner" && <DoctorScannerTab doctorId={session.doctor_id} />}
      {tab === "history" && <HistoryTab appointments={appts.data ?? []} isLoading={appts.isLoading} />}
    </View>
  );
}

// ====================================================================
// Stats Bar
// ====================================================================

function StatsBar({
  appointments,
  isLoading,
}: {
  appointments: AppointmentWithPatient[];
  isLoading: boolean;
}) {
  const colors = useColors();
  const today = new Date().toISOString().split("T")[0];

  const todayAppts = appointments.filter((a) => a.appointment_date === today);
  const upcoming = todayAppts.filter((a) => a.status === "upcoming").length;
  const completed = todayAppts.filter((a) => a.status === "completed").length;
  const totalAll = appointments.filter((a) => a.status === "completed").length;

  const stats = [
    { label: "مواعيد اليوم", value: todayAppts.length, icon: "calendar" as const, color: colors.primary, bg: colors.primarySoft },
    { label: "قادمة اليوم", value: upcoming, icon: "clock" as const, color: colors.foreground, bg: colors.border },
    { label: "مكتملة اليوم", value: completed, icon: "check-circle" as const, color: colors.success, bg: colors.accents.green.bg },
    { label: "إجمالي الزيارات", value: totalAll, icon: "users" as const, color: colors.primary, bg: colors.primarySoft },
  ];

  return (
    <View style={[styles.statsBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      {stats.map((s) => (
        <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
          <Feather name={s.icon} size={12} color={s.color} />
          {isLoading ? (
            <ActivityIndicator size="small" color={s.color} />
          ) : (
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
          )}
          <Text style={[styles.statLabel, { color: s.color, opacity: 0.75 }]}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ====================================================================
// Today Tab
// ====================================================================

function TodayTab({
  appointments,
  isLoading,
}: {
  appointments: AppointmentWithPatient[];
  isLoading: boolean;
}) {
  const colors = useColors();
  const today = new Date().toISOString().split("T")[0];

  const todayList = useMemo(
    () =>
      appointments
        .filter((a) => a.appointment_date === today)
        .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time)),
    [appointments, today],
  );

  const dateLabel = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>{dateLabel}</Text>

      {todayList.length === 0 && (
        <View style={[styles.emptyBox, { borderColor: colors.border }]}>
          <Feather name="calendar" size={36} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد مواعيد اليوم</Text>
        </View>
      )}

      {todayList.map((appt) => (
        <AppointmentRow key={appt.id} appt={appt} />
      ))}
    </ScrollView>
  );
}

// ====================================================================
// History Tab
// ====================================================================

function HistoryTab({
  appointments,
  isLoading,
}: {
  appointments: AppointmentWithPatient[];
  isLoading: boolean;
}) {
  const colors = useColors();

  const grouped = useMemo(() => {
    const map = new Map<string, AppointmentWithPatient[]>();
    for (const a of appointments) {
      const key = a.appointment_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [appointments]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      {grouped.length === 0 && (
        <View style={[styles.emptyBox, { borderColor: colors.border }]}>
          <Feather name="clock" size={36} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد مواعيد بعد</Text>
        </View>
      )}

      {grouped.map(([date, list]) => {
        const d = new Date(date);
        const label = d.toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
        return (
          <View key={date} style={{ gap: 8 }}>
            <View style={[styles.groupHeader, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.groupLabel, { color: colors.primary }]}>{label}</Text>
              <Text style={[styles.groupCount, { color: colors.primary }]}>{list.length} موعد</Text>
            </View>
            {list.map((appt) => (
              <AppointmentRow key={appt.id} appt={appt} />
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}

// ====================================================================
// Appointment Row
// ====================================================================

const STATUS_MAP = {
  upcoming: { label: "قادم", bg: "#EEF2FF", fg: "#4F46E5" },
  completed: { label: "مكتمل", bg: "#DCFCE7", fg: "#16A34A" },
  cancelled: { label: "ملغى", bg: "#FEE2E2", fg: "#DC2626" },
};

function AppointmentRow({ appt }: { appt: AppointmentWithPatient }) {
  const colors = useColors();
  const pill = STATUS_MAP[appt.status] ?? STATUS_MAP.upcoming;

  return (
    <View style={[styles.apptRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.timeBox, { backgroundColor: colors.primarySoft }]}>
        <Text style={[styles.timeText, { color: colors.primary }]}>{appt.appointment_time}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.patientName, { color: colors.foreground }]}>
          {appt.patient_name ?? "مريض غير محدد"}
        </Text>
        <Text style={[styles.apptRef, { color: colors.mutedForeground }]}>
          #{String(appt.id).slice(0, 8).toUpperCase()}
        </Text>
      </View>
      <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
        <Text style={[styles.statusText, { color: pill.fg }]}>{pill.label}</Text>
      </View>
    </View>
  );
}

// ====================================================================
// QR Scanner Tab (doctor-scoped)
// ====================================================================

function DoctorScannerTab({ doctorId }: { doctorId: string }) {
  const colors = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const markScanned = useMarkDoctorTicketScanned(doctorId);
  const [parseError, setParseError] = useState(false);
  const scannedRef = useRef(false);

  const reset = () => {
    scannedRef.current = false;
    setParseError(false);
    markScanned.reset();
  };

  const handleBarcode = useCallback(
    ({ data }: { data: string }) => {
      if (scannedRef.current || markScanned.isPending) return;
      scannedRef.current = true;
      setParseError(false);
      try {
        const parsed = JSON.parse(data);
        if (!parsed?.id) throw new Error("no_id");
        markScanned.mutate(parsed.id);
      } catch {
        setParseError(true);
      }
    },
    [markScanned],
  );

  const result = markScanned.data;
  const isLoading = markScanned.isPending;
  const isError = markScanned.isError || parseError;
  const done = !!result || isError;

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <View style={[styles.permBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="camera-off" size={40} color={colors.mutedForeground} />
          <Text style={[styles.permTitle, { color: colors.foreground }]}>يلزم إذن الكاميرا</Text>
          <Text style={[styles.permSub, { color: colors.mutedForeground }]}>
            يرجى السماح باستخدام الكاميرا لمسح رموز QR
          </Text>
          <Pressable
            onPress={requestPermission}
            style={[styles.btn, { backgroundColor: colors.primary, marginTop: 8 }]}
          >
            <Feather name="camera" size={16} color={colors.primaryForeground} />
            <Text style={[styles.btnText, { color: colors.primaryForeground }]}>السماح بالكاميرا</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {!done && (
        <View style={styles.cameraWrap}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={handleBarcode}
          />
          <View style={styles.scanOverlay} pointerEvents="none">
            <View style={styles.dimTop} />
            <View style={styles.middleRow}>
              <View style={styles.dimSide} />
              <View style={styles.frameBox}>
                {(["TL", "TR", "BL", "BR"] as const).map((c) => (
                  <View key={c} style={[styles.corner, cornerStyle(c), { borderColor: colors.primary }]} />
                ))}
              </View>
              <View style={styles.dimSide} />
            </View>
            <View style={styles.dimBottom}>
              <Text style={styles.scanHint}>وجّه الكاميرا نحو رمز QR في التذكرة</Text>
            </View>
          </View>
          {isLoading && (
            <View style={[styles.loadingOverlay, { backgroundColor: "rgba(0,0,0,0.55)" }]}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>جارٍ التحقق...</Text>
            </View>
          )}
        </View>
      )}

      {done && (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          {/* Error / Wrong doctor */}
          {(isError || result?.status === "wrong_doctor") && (
            <View style={[styles.resultCard, { backgroundColor: colors.accents.red.bg, borderColor: colors.danger }]}>
              <Feather name={isError ? "alert-circle" : "x-circle"} size={44} color={colors.danger} />
              <Text style={[styles.resultTitle, { color: colors.danger }]}>
                {isError ? "رمز غير صالح" : "موعد طبيب آخر"}
              </Text>
              <Text style={[styles.resultSub, { color: colors.danger }]}>
                {isError
                  ? "لم يتم التعرف على هذا الرمز"
                  : "هذا الموعد غير مخصص لطبيبك، لا يمكن تأكيده"}
              </Text>
            </View>
          )}

          {result?.status === "marked_used" && (
            <View style={[styles.resultCard, { backgroundColor: colors.accents.green.bg, borderColor: colors.success }]}>
              <Feather name="check-circle" size={44} color={colors.success} />
              <Text style={[styles.resultTitle, { color: colors.success }]}>تم التحقق ✓</Text>
              <Text style={[styles.resultSub, { color: colors.success }]}>تم تسجيل دخول المريض بنجاح</Text>
            </View>
          )}

          {result?.status === "already_used" && (
            <View style={[styles.resultCard, { backgroundColor: colors.accents.red.bg, borderColor: colors.danger }]}>
              <Feather name="x-circle" size={44} color={colors.danger} />
              <Text style={[styles.resultTitle, { color: colors.danger }]}>تم الاستخدام من قبل</Text>
              <Text style={[styles.resultSub, { color: colors.danger }]}>هذه التذكرة سبق مسحها</Text>
            </View>
          )}

          {result?.status === "cancelled" && (
            <View style={[styles.resultCard, { backgroundColor: colors.accents.red.bg, borderColor: colors.danger }]}>
              <Feather name="slash" size={44} color={colors.danger} />
              <Text style={[styles.resultTitle, { color: colors.danger }]}>موعد ملغى</Text>
              <Text style={[styles.resultSub, { color: colors.danger }]}>هذا الموعد تم إلغاؤه</Text>
            </View>
          )}

          {result?.appointment && result.status !== "wrong_doctor" && (
            <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.detailHeading, { color: colors.mutedForeground }]}>تفاصيل الموعد</Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              {[
                { icon: "user" as const, key: "المريض", val: result.appointment.patient_name ?? "غير محدد" },
                { icon: "calendar" as const, key: "التاريخ", val: result.appointment.appointment_date },
                { icon: "clock" as const, key: "الوقت", val: result.appointment.appointment_time },
                { icon: "hash" as const, key: "رقم التذكرة", val: `#${String(result.appointment.id).slice(0, 8).toUpperCase()}` },
              ].map(({ icon, key, val }) => (
                <View key={key} style={styles.detailRow}>
                  <View style={[styles.detailIcon, { backgroundColor: colors.primarySoft }]}>
                    <Feather name={icon} size={13} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.detailKey, { color: colors.mutedForeground }]}>{key}</Text>
                    <Text style={[styles.detailVal, { color: colors.foreground }]}>{val}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <Pressable
            onPress={reset}
            style={[styles.btn, { backgroundColor: colors.primary, justifyContent: "center" }]}
          >
            <Feather name="refresh-cw" size={16} color={colors.primaryForeground} />
            <Text style={[styles.btnText, { color: colors.primaryForeground }]}>مسح تذكرة أخرى</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

// ====================================================================
// Helpers
// ====================================================================

function cornerStyle(c: "TL" | "TR" | "BL" | "BR") {
  return {
    TL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
    TR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
    BL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
    BR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  }[c];
}

// ====================================================================
// Styles
// ====================================================================

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },

  // Login
  loginCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 12,
  },
  loginIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  loginTitle: {
    fontSize: 20,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "center",
  },
  loginSub: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_400Regular",
    textAlign: "center",
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 8,
    height: 48,
  },
  input: {
    flex: 1,
    fontFamily: "IBMPlexSansArabic_400Regular",
    fontSize: 14,
  },
  errorBox: {
    flexDirection: "row-reverse",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  errorText: {
    flex: 1,
    fontFamily: "IBMPlexSansArabic_400Regular",
    fontSize: 12,
    textAlign: "right",
  },
  btn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
    width: "100%",
  },
  btnText: {
    fontFamily: "IBMPlexSansArabic_700Bold",
    fontSize: 15,
  },

  // Header
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 52 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "IBMPlexSansArabic_700Bold",
    fontSize: 16,
    textAlign: "center",
  },
  headerSub: {
    fontFamily: "IBMPlexSansArabic_400Regular",
    fontSize: 11,
    textAlign: "center",
  },
  logoutBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  // Stats
  statsBar: {
    flexDirection: "row-reverse",
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    gap: 3,
  },
  statValue: {
    fontFamily: "IBMPlexSansArabic_700Bold",
    fontSize: 18,
  },
  statLabel: {
    fontFamily: "IBMPlexSansArabic_400Regular",
    fontSize: 9,
    textAlign: "center",
  },

  // Tabs
  tabBar: {
    flexDirection: "row-reverse",
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
  },
  tabLabel: {
    fontFamily: "IBMPlexSansArabic_700Bold",
    fontSize: 12,
  },

  // Appointment row
  apptRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  timeBox: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 56,
  },
  timeText: {
    fontFamily: "IBMPlexSansArabic_700Bold",
    fontSize: 12,
    writingDirection: "ltr",
  },
  patientName: {
    fontFamily: "IBMPlexSansArabic_700Bold",
    fontSize: 14,
    textAlign: "right",
  },
  apptRef: {
    fontFamily: "IBMPlexSansArabic_400Regular",
    fontSize: 11,
    textAlign: "right",
  },
  statusPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: {
    fontFamily: "IBMPlexSansArabic_700Bold",
    fontSize: 11,
  },

  // Date / group
  dateLabel: {
    fontFamily: "IBMPlexSansArabic_700Bold",
    fontSize: 13,
    textAlign: "right",
    marginBottom: 4,
  },
  groupHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  groupLabel: {
    fontFamily: "IBMPlexSansArabic_700Bold",
    fontSize: 12,
  },
  groupCount: {
    fontFamily: "IBMPlexSansArabic_400Regular",
    fontSize: 12,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    borderStyle: "dashed",
    padding: 32,
    marginTop: 20,
  },
  emptyText: {
    fontFamily: "IBMPlexSansArabic_400Regular",
    fontSize: 14,
    textAlign: "center",
  },

  // Camera / Scanner
  cameraWrap: { flex: 1, overflow: "hidden", position: "relative" },
  camera: { flex: 1 },
  scanOverlay: { ...StyleSheet.absoluteFillObject, flexDirection: "column" },
  dimTop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  dimBottom: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 16,
  },
  middleRow: { flexDirection: "row", height: 240 },
  dimSide: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  frameBox: { width: 240, height: 240, position: "relative" },
  corner: { position: "absolute", width: 28, height: 28, borderWidth: 3 },
  scanHint: {
    color: "#fff",
    fontFamily: "IBMPlexSansArabic_400Regular",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: "#fff",
    fontFamily: "IBMPlexSansArabic_700Bold",
    fontSize: 14,
  },

  // Permission
  permBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 12,
    maxWidth: 340,
    width: "100%",
  },
  permTitle: {
    fontSize: 18,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "center",
  },
  permSub: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },

  // Result
  resultCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  resultTitle: {
    fontSize: 20,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "center",
  },
  resultSub: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_400Regular",
    textAlign: "center",
    lineHeight: 20,
    opacity: 0.85,
  },
  detailCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  detailHeading: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
  },
  divider: { height: 1, marginVertical: 4 },
  detailRow: { flexDirection: "row-reverse", alignItems: "center", gap: 10, paddingVertical: 4 },
  detailIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  detailKey: {
    fontSize: 11,
    fontFamily: "IBMPlexSansArabic_400Regular",
    textAlign: "right",
  },
  detailVal: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
  },
});
