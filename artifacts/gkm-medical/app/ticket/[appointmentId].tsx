import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { AppointmentQR } from "@/components/AppointmentQR";
import { useAppointments, usePaymentByAppointment } from "@/hooks/useGkmData";
import { StatusPill } from "@/components/StatusPill";

export default function TicketScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const { data: appointments, isLoading } = useAppointments();
  const { data: payment } = usePaymentByAppointment(appointmentId ?? undefined);

  const apt = appointments?.find((a) => a.id === appointmentId);
  const doc = apt?.doctor as any;

  // Derive the strip state from appointment + payment data
  const stripState = (() => {
    if (apt?.status === "cancelled")
      return { color: "#dc2626", text: "ملغي",               icon: "x-circle"    } as const;
    if (apt?.status === "completed")
      return { color: "#16a34a", text: "مكتمل",              icon: "check-circle" } as const;
    if (payment?.status === "pending")
      return { color: "#dc2626", text: "بانتظار تأكيد الدفع", icon: "clock"        } as const;
    if (payment?.status === "confirmed")
      return { color: "#16a34a", text: "تم التأكيد",          icon: "check-circle" } as const;
    if (payment?.status === "rejected")
      return { color: "#dc2626", text: "تم الرفض",            icon: "x-circle"    } as const;
    // No payment record = cash / pay-at-clinic
    return   { color: "#d97706", text: "الدفع عند العيادة",   icon: "home"        } as const;
  })();

  const stripColor = stripState.color;
  const stripLabel = stripState;

  const dateObj = apt ? new Date(apt.appointment_date) : null;
  const formattedDate = dateObj
    ? dateObj.toLocaleDateString("ar", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const headerTop = Platform.OS === "web" ? 16 : insets.top + 8;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!apt || !doc) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_500Medium" }}>
          لم يتم العثور على الموعد
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: headerTop }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Feather name="arrow-right" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.foreground }]}>تذكرة الموعد</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Ticket card */}
        <View
          style={[
            styles.ticket,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Top strip */}
          <View style={[styles.ticketStrip, { backgroundColor: stripColor }]}>
            <Text style={styles.stripText}>راحة · Medical Care</Text>
            <View style={styles.stripLabelPill}>
              <Feather name={stripLabel.icon} size={13} color="#ffffff" />
              <Text style={styles.stripLabelText}>{stripLabel.text}</Text>
            </View>
          </View>

          {/* Doctor info */}
          <View style={[styles.section, { borderBottomColor: colors.border }]}>
            <View style={[styles.doctorAvatar, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {doc.name_ar?.charAt(0) ?? "د"}
              </Text>
            </View>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={[styles.doctorName, { color: colors.foreground }]}>
                {doc.name_ar}
              </Text>
              <Text style={[styles.doctorSpec, { color: colors.mutedForeground }]}>
                {doc.specialty_ar}
              </Text>
            </View>
          </View>

          {/* Date / Time row */}
          <View style={[styles.metaSection, { borderBottomColor: colors.border }]}>
            <View style={styles.metaItem}>
              <View style={[styles.metaIcon, { backgroundColor: colors.primarySoft }]}>
                <Feather name="calendar" size={15} color={colors.primary} />
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>التاريخ</Text>
                <Text style={[styles.metaValue, { color: colors.foreground }]}>{formattedDate}</Text>
              </View>
            </View>
            <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
            <View style={styles.metaItem}>
              <View style={[styles.metaIcon, { backgroundColor: colors.primarySoft }]}>
                <Feather name="clock" size={15} color={colors.primary} />
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>الوقت</Text>
                <Text style={[styles.metaValue, { color: colors.foreground }]}>
                  {apt.appointment_time}
                </Text>
              </View>
            </View>
          </View>

          {/* Perforation line */}
          <View style={styles.perfRow}>
            <View style={[styles.semiCircle, styles.semiLeft, { backgroundColor: colors.background }]} />
            {Array.from({ length: 18 }).map((_, i) => (
              <View
                key={i}
                style={[styles.dot, { backgroundColor: colors.border }]}
              />
            ))}
            <View style={[styles.semiCircle, styles.semiRight, { backgroundColor: colors.background }]} />
          </View>

          {/* QR section */}
          <View style={styles.qrSection}>
            <Text style={[styles.qrLabel, { color: colors.mutedForeground }]}>
              أرِ هذا الرمز عند الوصول
            </Text>
            <View
              style={[styles.qrBox, { backgroundColor: "#ffffff", borderColor: colors.border }]}
            >
              <AppointmentQR
                appointmentId={apt.id}
                doctorName={doc.name_ar}
                specialty={doc.specialty_ar}
                date={apt.appointment_date}
                time={apt.appointment_time}
                status={apt.status}
                size={200}
                color="#000000"
                backgroundColor="#ffffff"
                showRef={false}
              />
            </View>
            <Text style={[styles.refText, { color: colors.primary }]}>
              #{String(apt.id).slice(0, 8).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Info note */}
        <View style={[styles.note, { backgroundColor: colors.primarySoft, borderColor: colors.primary + "33" }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={[styles.noteText, { color: colors.primary }]}>
            احتفظ بهذه التذكرة وأرِها لموظف الاستقبال عند وصولك إلى العيادة
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 18,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "center",
  },
  scroll: {
    padding: 16,
    alignItems: "stretch",
    gap: 16,
  },
  ticket: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  ticketStrip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  stripText: {
    color: "#ffffff",
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_700Bold",
    letterSpacing: 0.5,
  },
  stripLabelPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  stripLabelText: {
    color: "#ffffff",
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  section: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
  },
  doctorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  doctorName: {
    fontSize: 16,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
  },
  doctorSpec: {
    fontSize: 12.5,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
    marginTop: 2,
  },
  metaSection: {
    flexDirection: "row-reverse",
    borderBottomWidth: 1,
    padding: 16,
    gap: 0,
  },
  metaItem: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
  },
  metaDivider: {
    width: 1,
    height: "100%",
    marginHorizontal: 12,
    alignSelf: "stretch",
  },
  metaIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  metaLabel: {
    fontSize: 11,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
  },
  perfRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
    gap: 4,
    paddingHorizontal: 0,
    overflow: "hidden",
  },
  semiCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  semiLeft: {
    marginLeft: -9,
  },
  semiRight: {
    marginRight: -9,
  },
  dot: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  qrSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 12,
  },
  qrLabel: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "center",
  },
  qrBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  refText: {
    fontSize: 18,
    fontFamily: "IBMPlexSansArabic_700Bold",
    letterSpacing: 3,
    textAlign: "center",
    writingDirection: "ltr",
  },
  note: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 20,
  },
});
