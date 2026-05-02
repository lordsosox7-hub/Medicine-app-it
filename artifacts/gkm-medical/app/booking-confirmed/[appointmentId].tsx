import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { GradientButton } from "@/components/GradientButton";
import { AppointmentQR } from "@/components/AppointmentQR";
import { scheduleAppointmentReminder } from "@/lib/pushNotifications";

const METHOD_LABELS: Record<string, string> = {
  mada: "مدى",
  visa: "فيزا / ماستركارد",
  apple_pay: "Apple Pay",
  stc_pay: "STC Pay",
  cash: "الدفع في العيادة",
};

export default function BookingConfirmedScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    appointmentId,
    doctorName,
    doctorSpecialty,
    date,
    time,
    total,
    method,
  } = useLocalSearchParams<{
    appointmentId: string;
    doctorName?: string;
    doctorSpecialty?: string;
    date?: string;
    time?: string;
    total?: string;
    method?: string;
  }>();

  const scale = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0)).current;
  const ringOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
        tension: 80,
      }),
    ]).start();

    Animated.loop(
      Animated.parallel([
        Animated.timing(ringScale, {
          toValue: 1.6,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scale, ringScale, ringOpacity]);

  // Schedule a reminder notification 1 hour before the appointment
  useEffect(() => {
    if (appointmentId && date && time && doctorName) {
      scheduleAppointmentReminder(appointmentId, doctorName, date, time);
    }
  }, [appointmentId, doctorName, date, time]);

  const formattedDate = date
    ? new Date(date).toLocaleDateString("ar", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const referenceCode = appointmentId
    ? `#${String(appointmentId).slice(0, 8).toUpperCase()}`
    : "";

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 160 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Success badge */}
        <View style={styles.badgeWrap}>
          <Animated.View
            style={[
              styles.ring,
              {
                backgroundColor: colors.success + "33",
                transform: [{ scale: ringScale }],
                opacity: ringOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.badge,
              {
                backgroundColor: colors.success,
                transform: [{ scale }],
              },
            ]}
          >
            <Feather name="check" size={48} color="#ffffff" />
          </Animated.View>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          تم تأكيد الحجز بنجاح
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          تم تأكيد موعدك ودفع الرسوم. ستصلك رسالة تذكير قبل موعد الزيارة.
        </Text>

        {/* Appointment details */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {!!referenceCode && (
            <View style={styles.refRow}>
              <Text style={[styles.refLabel, { color: colors.mutedForeground }]}>
                رقم الحجز
              </Text>
              <Text style={[styles.refValue, { color: colors.primary }]}>
                {referenceCode}
              </Text>
            </View>
          )}

          {!!doctorName && (
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="person" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                  الطبيب
                </Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]} numberOfLines={1}>
                  {doctorName}
                </Text>
                {!!doctorSpecialty && (
                  <Text style={[styles.detailSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {doctorSpecialty}
                  </Text>
                )}
              </View>
            </View>
          )}

          {!!formattedDate && (
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: colors.primarySoft }]}>
                <Feather name="calendar" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                  التاريخ
                </Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]} numberOfLines={1}>
                  {formattedDate}
                </Text>
              </View>
            </View>
          )}

          {!!time && (
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: colors.primarySoft }]}>
                <Feather name="clock" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                  الوقت
                </Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]} numberOfLines={1}>
                  {time}
                </Text>
              </View>
            </View>
          )}

          {!!method && (
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: colors.primarySoft }]}>
                <Feather name="credit-card" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                  طريقة الدفع
                </Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]} numberOfLines={1}>
                  {METHOD_LABELS[method] ?? method}
                </Text>
              </View>
            </View>
          )}

          {!!total && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.foreground }]}>
                  المبلغ المدفوع
                </Text>
                <Text style={[styles.totalValue, { color: colors.success }]}>
                  {total} ج.س
                </Text>
              </View>
            </>
          )}
        </View>

        {/* QR Ticket */}
        {!!appointmentId && (
          <View
            style={[
              styles.qrCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.qrTitle, { color: colors.foreground }]}>
              تذكرة الموعد
            </Text>
            <Text style={[styles.qrSub, { color: colors.mutedForeground }]}>
              أرِ هذا الرمز عند الوصول إلى العيادة
            </Text>
            <View style={[styles.qrBox, { borderColor: colors.border }]}>
              <AppointmentQR
                appointmentId={appointmentId}
                doctorName={doctorName}
                specialty={doctorSpecialty}
                date={date}
                time={time}
                size={190}
                color="#000000"
                backgroundColor="#ffffff"
                showRef={false}
              />
            </View>
            <Text style={[styles.qrRef, { color: colors.primary }]}>
              {referenceCode}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer actions */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom || 16,
          },
        ]}
      >
        <GradientButton
          title="عرض مواعيدي"
          onPress={() => router.replace("/(tabs)/appointments")}
        />
        <TouchableOpacity
          style={[styles.ghostBtn, { borderColor: colors.border }]}
          onPress={() => router.replace("/(tabs)")}
          activeOpacity={0.7}
        >
          <Text style={[styles.ghostBtnText, { color: colors.foreground }]}>
            العودة للرئيسية
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20, alignItems: "stretch", gap: 16 },
  badgeWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 24,
    height: 130,
  },
  ring: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "center",
    writingDirection: "rtl",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "center",
    writingDirection: "rtl",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  refRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  refLabel: {
    fontSize: 12.5,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
    writingDirection: "rtl",
  },
  refValue: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "left",
    writingDirection: "ltr",
  },
  detailRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  detailIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  detailLabel: {
    fontSize: 11.5,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
    writingDirection: "rtl",
  },
  detailSub: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
    writingDirection: "rtl",
  },
  totalValue: {
    fontSize: 18,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "left",
    writingDirection: "rtl",
  },
  qrCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  qrTitle: {
    fontSize: 17,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "center",
  },
  qrSub: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "center",
  },
  qrBox: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "#ffffff",
  },
  qrRef: {
    fontSize: 16,
    fontFamily: "IBMPlexSansArabic_700Bold",
    letterSpacing: 3,
    textAlign: "center",
    writingDirection: "ltr",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    gap: 10,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  ghostBtn: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostBtnText: {
    fontSize: 14.5,
    fontFamily: "IBMPlexSansArabic_700Bold",
    writingDirection: "rtl",
  },
});
