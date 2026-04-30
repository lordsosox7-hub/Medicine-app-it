import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { GradientButton } from "@/components/GradientButton";
import * as Haptics from "expo-haptics";

type PaymentMethod = {
  id: string;
  label_ar: string;
  icon: React.ReactNode;
  hint_ar?: string;
};

export default function PaymentScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { appointmentId, doctorName, doctorSpecialty, date, time, price } =
    useLocalSearchParams<{
      appointmentId: string;
      doctorName?: string;
      doctorSpecialty?: string;
      date?: string;
      time?: string;
      price?: string;
    }>();

  const consultationFee = Number(price ?? 0);
  const serviceFee = Math.round(consultationFee * 0.05);
  const vat = Math.round((consultationFee + serviceFee) * 0.15);
  const total = consultationFee + serviceFee + vat;

  const formattedDate = date
    ? new Date(date).toLocaleDateString("ar", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "";

  const methods: PaymentMethod[] = [
    {
      id: "mada",
      label_ar: "مدى",
      icon: (
        <MaterialCommunityIcons
          name="credit-card-outline"
          size={22}
          color={colors.primary}
        />
      ),
      hint_ar: "بطاقة بنكية سعودية",
    },
    {
      id: "visa",
      label_ar: "فيزا / ماستركارد",
      icon: <Feather name="credit-card" size={22} color={colors.primary} />,
      hint_ar: "بطاقة ائتمانية",
    },
    {
      id: "apple_pay",
      label_ar: "Apple Pay",
      icon: <Ionicons name="logo-apple" size={22} color={colors.primary} />,
      hint_ar: "دفع سريع وآمن",
    },
    {
      id: "stc_pay",
      label_ar: "STC Pay",
      icon: <Feather name="smartphone" size={22} color={colors.primary} />,
      hint_ar: "محفظة رقمية",
    },
    {
      id: "cash",
      label_ar: "الدفع في العيادة",
      icon: <Feather name="dollar-sign" size={22} color={colors.primary} />,
      hint_ar: "نقداً عند وصولك",
    },
  ];

  const [selectedMethod, setSelectedMethod] = useState<string>("mada");
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      router.replace({
        pathname: "/booking-confirmed/[appointmentId]",
        params: {
          appointmentId: String(appointmentId),
          doctorName: doctorName ?? "",
          doctorSpecialty: doctorSpecialty ?? "",
          date: date ?? "",
          time: time ?? "",
          total: String(total),
          method: selectedMethod,
        },
      });
    }, 1400);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 200 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Appointment summary */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              تفاصيل الموعد
            </Text>
            <View
              style={[
                styles.cardIcon,
                { backgroundColor: colors.primarySoft },
              ]}
            >
              <Feather name="calendar" size={18} color={colors.primary} />
            </View>
          </View>

          {!!doctorName && (
            <View style={styles.summaryRow}>
              <Text
                style={[styles.summaryLabel, { color: colors.mutedForeground }]}
              >
                الطبيب
              </Text>
              <Text
                style={[styles.summaryValue, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {doctorName}
              </Text>
            </View>
          )}
          {!!doctorSpecialty && (
            <View style={styles.summaryRow}>
              <Text
                style={[styles.summaryLabel, { color: colors.mutedForeground }]}
              >
                التخصص
              </Text>
              <Text
                style={[styles.summaryValue, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {doctorSpecialty}
              </Text>
            </View>
          )}
          {!!formattedDate && (
            <View style={styles.summaryRow}>
              <Text
                style={[styles.summaryLabel, { color: colors.mutedForeground }]}
              >
                التاريخ
              </Text>
              <Text
                style={[styles.summaryValue, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {formattedDate}
              </Text>
            </View>
          )}
          {!!time && (
            <View style={styles.summaryRow}>
              <Text
                style={[styles.summaryLabel, { color: colors.mutedForeground }]}
              >
                الوقت
              </Text>
              <Text
                style={[styles.summaryValue, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {time}
              </Text>
            </View>
          )}
        </View>

        {/* Payment methods */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          طريقة الدفع
        </Text>
        <View style={{ gap: 10 }}>
          {methods.map((m) => {
            const isSelected = selectedMethod === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                activeOpacity={0.85}
                onPress={() => setSelectedMethod(m.id)}
                style={[
                  styles.methodCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.methodIcon,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  {m.icon}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={[styles.methodLabel, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {m.label_ar}
                  </Text>
                  {!!m.hint_ar && (
                    <Text
                      style={[
                        styles.methodHint,
                        { color: colors.mutedForeground },
                      ]}
                      numberOfLines={1}
                    >
                      {m.hint_ar}
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    styles.radioOuter,
                    {
                      borderColor: isSelected
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        styles.radioInner,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Fee breakdown */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.foreground, marginTop: 24 },
          ]}
        >
          ملخص الفاتورة
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryLabel, { color: colors.mutedForeground }]}
            >
              رسوم الاستشارة
            </Text>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {consultationFee} ر.س
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryLabel, { color: colors.mutedForeground }]}
            >
              رسوم الخدمة
            </Text>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {serviceFee} ر.س
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryLabel, { color: colors.mutedForeground }]}
            >
              ضريبة القيمة المضافة (15%)
            </Text>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {vat} ر.س
            </Text>
          </View>
          <View
            style={[styles.divider, { backgroundColor: colors.border }]}
          />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>
              الإجمالي
            </Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              {total} ر.س
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.secureNote,
            {
              backgroundColor: colors.primarySoft,
              borderColor: colors.border,
            },
          ]}
        >
          <Feather name="shield" size={16} color={colors.primary} />
          <Text style={[styles.secureText, { color: colors.mutedForeground }]}>
            جميع المعاملات مشفرة وآمنة بالكامل
          </Text>
        </View>
      </ScrollView>

      {/* Pay button */}
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
        <View style={styles.footerTotalRow}>
          <Text
            style={[styles.footerTotalLabel, { color: colors.mutedForeground }]}
          >
            المبلغ المستحق
          </Text>
          <Text style={[styles.footerTotalValue, { color: colors.foreground }]}>
            {total} ر.س
          </Text>
        </View>
        {processing ? (
          <View
            style={[
              styles.processingBtn,
              { backgroundColor: colors.primary },
            ]}
          >
            <ActivityIndicator color="#ffffff" />
            <Text style={styles.processingText}>جارٍ معالجة الدفع...</Text>
          </View>
        ) : (
          <GradientButton title="ادفع الآن" onPress={handlePay} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
    marginTop: 20,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    gap: 12,
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
  },
  summaryValue: {
    fontSize: 13.5,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "left",
    flexShrink: 1,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
  },
  totalValue: {
    fontSize: 17,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "left",
  },
  methodCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  methodLabel: {
    fontSize: 14.5,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
    marginBottom: 2,
  },
  methodHint: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  secureNote: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
  },
  secureText: {
    fontSize: 12.5,
    fontFamily: "IBMPlexSansArabic_500Medium",
    flex: 1,
    textAlign: "right",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  footerTotalRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  footerTotalLabel: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_500Medium",
  },
  footerTotalValue: {
    fontSize: 18,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  processingBtn: {
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  processingText: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
});
