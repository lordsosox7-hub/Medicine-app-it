import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { GradientButton } from "@/components/GradientButton";
import * as Haptics from "expo-haptics";
import {
  useCreatePayment,
  usePaymentByAppointment,
  useRealtimePayment,
} from "@/hooks/useGkmData";

const ACCOUNT_NAME = "اسامة ادم موسى ادم";

const MANUAL_PAYMENT_INSTRUCTIONS: Record<
  string,
  { account: string; label_ar: string; note_ar: string }
> = {
  bankak: {
    account: "2091704",
    label_ar: "بنكك",
    note_ar:
      "حوّل المبلغ إلى الحساب التالي عبر تطبيق بنكك ثم أدخل آخر 4 أرقام من رقم العملية.",
  },
  ocash: {
    account: "0609899",
    label_ar: "اوكاش",
    note_ar:
      "أرسل المبلغ إلى الرقم التالي من محفظة اوكاش ثم أدخل آخر 4 أرقام من رقم العملية.",
  },
  fawry: {
    account: "51970049",
    label_ar: "فوري",
    note_ar:
      "ادفع المبلغ في أقرب منفذ فوري لكود الدفع التالي ثم أدخل آخر 4 أرقام من رقم العملية.",
  },
  my_cashy: {
    account: "401106595",
    label_ar: "ماي كاشي",
    note_ar:
      "حوّل المبلغ من تطبيق ماي كاشي إلى الرقم التالي ثم أدخل آخر 4 أرقام من رقم العملية.",
  },
};

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
  const { appointmentId, doctorId, doctorName, doctorSpecialty, date, time, price } =
    useLocalSearchParams<{
      appointmentId: string;
      doctorId?: string;
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
      id: "bankak",
      label_ar: "بنكك",
      icon: (
        <MaterialCommunityIcons
          name="bank-outline"
          size={22}
          color={colors.primary}
        />
      ),
      hint_ar: "تطبيق بنكك للدفع الإلكتروني",
    },
    {
      id: "fawry",
      label_ar: "فوري",
      icon: (
        <MaterialCommunityIcons
          name="storefront-outline"
          size={22}
          color={colors.primary}
        />
      ),
      hint_ar: "ادفع نقداً من أقرب منفذ فوري",
    },
    {
      id: "ocash",
      label_ar: "اوكاش",
      icon: (
        <MaterialCommunityIcons
          name="wallet-outline"
          size={22}
          color={colors.primary}
        />
      ),
      hint_ar: "محفظة اوكاش الإلكترونية",
    },
    {
      id: "my_cashy",
      label_ar: "ماي كاشي",
      icon: (
        <MaterialCommunityIcons
          name="cellphone-nfc"
          size={22}
          color={colors.primary}
        />
      ),
      hint_ar: "ادفع من محفظة ماي كاشي",
    },
    {
      id: "cash",
      label_ar: "الدفع في العيادة",
      icon: <Feather name="dollar-sign" size={22} color={colors.primary} />,
      hint_ar: "نقداً عند وصولك",
    },
  ];

  const [selectedMethod, setSelectedMethod] = useState<string>("bankak");
  const [processing, setProcessing] = useState(false);
  const [txnLast4, setTxnLast4] = useState<string>("");
  const [submittedReason, setSubmittedReason] = useState<string | null>(null);

  const manualInfo = MANUAL_PAYMENT_INSTRUCTIONS[selectedMethod];
  const requiresTxnRef = !!manualInfo;
  const txnRefValid = !requiresTxnRef || /^\d{4}$/.test(txnLast4);

  const createPayment = useCreatePayment();
  const { data: payment, refetch: refetchPayment } = usePaymentByAppointment(
    appointmentId ? String(appointmentId) : undefined,
  );
  useRealtimePayment(appointmentId ? String(appointmentId) : undefined);

  // When the admin confirms, route to the success screen.
  React.useEffect(() => {
    if (!payment) return;
    if (payment.status === "confirmed") {
      router.replace({
        pathname: "/booking-confirmed/[appointmentId]",
        params: {
          appointmentId: String(appointmentId),
          doctorName: doctorName ?? "",
          doctorSpecialty: doctorSpecialty ?? "",
          date: date ?? "",
          time: time ?? "",
          total: String(total),
          method: payment.method,
          txnRef: payment.txn_ref ?? "",
        },
      });
    } else if (payment.status === "rejected") {
      setSubmittedReason(payment.rejection_reason ?? null);
    }
  }, [
    payment,
    appointmentId,
    doctorName,
    doctorSpecialty,
    date,
    time,
    total,
    router,
  ]);

  const handleCopyAccount = async () => {
    if (!manualInfo) return;
    try {
      await Clipboard.setStringAsync(manualInfo.account);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (Platform.OS === "android") {
        Alert.alert("تم النسخ", "تم نسخ الرقم بنجاح");
      } else {
        Alert.alert("تم النسخ", "تم نسخ الرقم بنجاح");
      }
    } catch {
      // ignore
    }
  };

  const submitForVerification = async (doctorIdParam?: string) => {
    if (!appointmentId) return;
    setProcessing(true);
    try {
      await createPayment.mutateAsync({
        appointment_id: String(appointmentId),
        doctor_id: doctorIdParam ?? "",
        amount: total,
        method: selectedMethod,
        txn_ref: txnLast4,
      });
      setSubmittedReason(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refetchPayment();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "تعذّر إرسال البيانات",
        "تأكد من اتصالك بالإنترنت ثم حاول مرة أخرى.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const handlePay = async () => {
    if (requiresTxnRef && !txnRefValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "بيانات غير مكتملة",
        "يرجى إدخال آخر 4 أرقام من رقم العملية للتأكيد.",
      );
      return;
    }
    if (requiresTxnRef) {
      // Manual transfer: persist the attempt and wait for admin confirmation.
      await submitForVerification(doctorId);
      return;
    }
    // Cash on arrival or any non-manual method: confirm immediately.
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setProcessing(true);
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
          txnRef: "",
        },
      });
    }, 1000);
  };

  const isPending = !!payment && payment.status === "pending";
  const isRejected = !!payment && payment.status === "rejected";

  // ----- Pending / rejected verification screen -----
  if (isPending || isRejected) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 }]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.statusCard,
              {
                backgroundColor: colors.card,
                borderColor: isRejected
                  ? colors.destructive + "55"
                  : colors.primary + "55",
              },
            ]}
          >
            <View
              style={[
                styles.statusIconWrap,
                {
                  backgroundColor: isRejected
                    ? colors.destructive + "15"
                    : colors.primarySoft,
                },
              ]}
            >
              {isRejected ? (
                <Feather name="x-circle" size={42} color={colors.destructive} />
              ) : (
                <ActivityIndicator size="large" color={colors.primary} />
              )}
            </View>
            <Text style={[styles.statusTitle, { color: colors.foreground }]}>
              {isRejected
                ? "تم رفض عملية الدفع"
                : "بانتظار تأكيد الإدارة"}
            </Text>
            <Text
              style={[
                styles.statusSubtitle,
                { color: colors.mutedForeground },
              ]}
            >
              {isRejected
                ? "يبدو أن هناك مشكلة في رقم العملية. يمكنك إعادة المحاولة بإدخال الأرقام الصحيحة."
                : "تم استلام بيانات تحويلك. سيتم تأكيد الموعد فور التحقق من العملية في حسابنا."}
            </Text>

            {!!submittedReason && isRejected && (
              <View
                style={[
                  styles.reasonBox,
                  {
                    backgroundColor: colors.destructive + "10",
                    borderColor: colors.destructive + "33",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.reasonText,
                    { color: colors.destructive },
                  ]}
                >
                  {submittedReason}
                </Text>
              </View>
            )}

            <View
              style={[
                styles.statusDetailRow,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  marginTop: 18,
                },
              ]}
            >
              <Text
                style={[styles.statusDetailLabel, { color: colors.mutedForeground }]}
              >
                طريقة الدفع
              </Text>
              <Text
                style={[styles.statusDetailValue, { color: colors.foreground }]}
              >
                {MANUAL_PAYMENT_INSTRUCTIONS[payment!.method]?.label_ar ??
                  payment!.method}
              </Text>
            </View>
            <View
              style={[
                styles.statusDetailRow,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  marginTop: 8,
                },
              ]}
            >
              <Text
                style={[styles.statusDetailLabel, { color: colors.mutedForeground }]}
              >
                آخر 4 أرقام
              </Text>
              <Text
                style={[
                  styles.statusDetailValue,
                  { color: colors.primary, letterSpacing: 4 },
                ]}
              >
                {payment!.txn_ref}
              </Text>
            </View>
            <View
              style={[
                styles.statusDetailRow,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  marginTop: 8,
                },
              ]}
            >
              <Text
                style={[styles.statusDetailLabel, { color: colors.mutedForeground }]}
              >
                المبلغ
              </Text>
              <Text
                style={[styles.statusDetailValue, { color: colors.foreground }]}
              >
                {Math.round(payment!.amount)} ج.س
              </Text>
            </View>

            {isPending && (
              <View
                style={[
                  styles.hintBox,
                  {
                    backgroundColor: colors.primarySoft,
                    borderColor: colors.primary + "33",
                  },
                ]}
              >
                <Feather name="clock" size={16} color={colors.primary} />
                <Text
                  style={[styles.hintText, { color: colors.foreground }]}
                >
                  عادةً ما تتم المراجعة خلال دقائق. يمكنك إغلاق التطبيق وسيصلك
                  إشعار عند التأكيد.
                </Text>
              </View>
            )}

            {isRejected && (
              <View style={{ marginTop: 18, gap: 10 }}>
                <Text
                  style={[styles.txnLabel, { color: colors.foreground }]}
                >
                  أعد إدخال آخر 4 أرقام من رقم العملية
                </Text>
                <TextInput
                  value={txnLast4}
                  onChangeText={(t) =>
                    setTxnLast4(t.replace(/\D/g, "").slice(0, 4))
                  }
                  keyboardType="number-pad"
                  maxLength={4}
                  placeholder="0000"
                  placeholderTextColor={colors.mutedForeground}
                  style={[
                    styles.txnInput,
                    {
                      backgroundColor: colors.background,
                      borderColor:
                        txnLast4.length === 0
                          ? colors.border
                          : txnRefValid
                            ? colors.primary
                            : colors.destructive,
                      color: colors.foreground,
                    },
                  ]}
                />
              </View>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.replace("/(tabs)/appointments")}
            style={[
              styles.secondaryBtn,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
          >
            <Feather name="calendar" size={16} color={colors.foreground} />
            <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>
              متابعة المواعيد لاحقاً
            </Text>
          </TouchableOpacity>
        </ScrollView>

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
          {isRejected ? (
            processing ? (
              <View
                style={[
                  styles.processingBtn,
                  { backgroundColor: colors.primary },
                ]}
              >
                <ActivityIndicator color="#ffffff" />
                <Text style={styles.processingText}>جارٍ الإرسال...</Text>
              </View>
            ) : (
              <GradientButton
                title="إعادة المحاولة"
                onPress={() => submitForVerification(payment!.doctor_id)}
              />
            )
          ) : (
            <View
              style={[
                styles.pendingBanner,
                {
                  backgroundColor: colors.primarySoft,
                  borderColor: colors.primary + "33",
                },
              ]}
            >
              <ActivityIndicator color={colors.primary} />
              <Text
                style={[styles.pendingBannerText, { color: colors.foreground }]}
              >
                بانتظار تأكيد الإدارة...
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }

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

        {/* Manual transfer instructions (Bankak / OCash / Fawry) */}
        {manualInfo && (
          <View
            style={[
              styles.instructionsCard,
              {
                backgroundColor: colors.primarySoft,
                borderColor: colors.primary + "55",
              },
            ]}
          >
            <View style={styles.instructionsHeader}>
              <View
                style={[
                  styles.cardIcon,
                  { backgroundColor: colors.background },
                ]}
              >
                <Feather name="info" size={18} color={colors.primary} />
              </View>
              <Text
                style={[styles.instructionsTitle, { color: colors.foreground }]}
              >
                تعليمات الدفع عبر {manualInfo.label_ar}
              </Text>
            </View>

            <Text
              style={[
                styles.instructionsNote,
                { color: colors.mutedForeground },
              ]}
            >
              {manualInfo.note_ar}
            </Text>

            <View
              style={[
                styles.detailRow,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[styles.detailLabel, { color: colors.mutedForeground }]}
              >
                اسم الحساب
              </Text>
              <Text
                style={[styles.detailValue, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {ACCOUNT_NAME}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCopyAccount}
              style={[
                styles.detailRow,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  marginTop: 8,
                },
              ]}
            >
              <Text
                style={[styles.detailLabel, { color: colors.mutedForeground }]}
              >
                {selectedMethod === "fawry" ? "كود الدفع" : "رقم الحساب"}
              </Text>
              <View style={styles.accountRow}>
                <Feather name="copy" size={14} color={colors.primary} />
                <Text
                  style={[
                    styles.detailValue,
                    { color: colors.primary, letterSpacing: 1 },
                  ]}
                >
                  {manualInfo.account}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={{ marginTop: 14 }}>
              <Text
                style={[styles.txnLabel, { color: colors.foreground }]}
              >
                آخر 4 أرقام من رقم العملية
              </Text>
              <Text
                style={[
                  styles.txnHint,
                  { color: colors.mutedForeground },
                ]}
              >
                بعد إتمام التحويل، أدخل آخر 4 أرقام من رقم العملية للتأكيد.
              </Text>
              <TextInput
                value={txnLast4}
                onChangeText={(t) =>
                  setTxnLast4(t.replace(/\D/g, "").slice(0, 4))
                }
                keyboardType="number-pad"
                maxLength={4}
                placeholder="0000"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.txnInput,
                  {
                    backgroundColor: colors.background,
                    borderColor:
                      txnLast4.length === 0
                        ? colors.border
                        : txnRefValid
                          ? colors.primary
                          : colors.destructive,
                    color: colors.foreground,
                  },
                ]}
              />
            </View>
          </View>
        )}

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
              {consultationFee} ج.س
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryLabel, { color: colors.mutedForeground }]}
            >
              رسوم الخدمة
            </Text>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {serviceFee} ج.س
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryLabel, { color: colors.mutedForeground }]}
            >
              ضريبة القيمة المضافة (15%)
            </Text>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {vat} ج.س
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
              {total} ج.س
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
            {total} ج.س
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
  instructionsCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
  },
  instructionsHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  instructionsTitle: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_700Bold",
    flex: 1,
    textAlign: "right",
  },
  instructionsNote: {
    fontSize: 12.5,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
    lineHeight: 20,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  detailLabel: {
    fontSize: 12.5,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
  },
  detailValue: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "left",
    flexShrink: 1,
  },
  accountRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  txnLabel: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
    marginBottom: 4,
  },
  txnHint: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
    marginBottom: 8,
    lineHeight: 18,
  },
  txnInput: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 18,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "center",
    letterSpacing: 8,
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
  statusCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    alignItems: "center",
  },
  statusIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  statusTitle: {
    fontSize: 20,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "center",
    marginBottom: 6,
  },
  statusSubtitle: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_400Regular",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  statusDetailRow: {
    width: "100%",
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusDetailLabel: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_400Regular",
  },
  statusDetailValue: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  hintBox: {
    marginTop: 18,
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    width: "100%",
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 22,
    fontFamily: "IBMPlexSansArabic_400Regular",
  },
  reasonBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    width: "100%",
  },
  reasonText: {
    fontSize: 13,
    lineHeight: 22,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "center",
  },
  pendingBanner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  pendingBannerText: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  secondaryBtn: {
    marginTop: 14,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_500Medium",
  },
});
