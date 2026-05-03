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
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useMyPayments } from "@/hooks/useGkmData";

const METHOD_LABEL: Record<string, string> = {
  my_cashy: "ماي كاشي",
  cash: "نقداً",
  visa: "Visa",
  mastercard: "Mastercard",
  mada: "مدى",
  applepay: "Apple Pay",
};

const METHOD_ICON: Record<string, "smartphone" | "dollar-sign" | "credit-card"> = {
  my_cashy: "smartphone",
  cash: "dollar-sign",
};

const STATUS_CONFIG = {
  confirmed: { label: "مؤكد", bg: "#dcfce7", fg: "#16a34a" },
  pending:   { label: "قيد المراجعة", bg: "#fef3c7", fg: "#d97706" },
  rejected:  { label: "مرفوض", bg: "#fee2e2", fg: "#dc2626" },
} as const;

export default function PaymentsScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: payments, isLoading } = useMyPayments();

  const headerTop = Platform.OS === "web" ? 16 : insets.top + 8;

  const confirmedPayments = payments?.filter((p) => p.status === "confirmed") ?? [];
  const totalSpent = confirmedPayments.reduce((sum, p) => sum + (p.amount ?? 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: headerTop }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Feather name="arrow-right" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.foreground }]}>سجل المدفوعات</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !payments || payments.length === 0 ? (
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
            <Feather name="credit-card" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد مدفوعات</Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
            ستظهر هنا جميع عمليات الدفع المرتبطة بمواعيدك
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary card */}
          <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{Math.round(totalSpent)} ج.س</Text>
                <Text style={styles.summaryLabel}>إجمالي المدفوع</Text>
              </View>
              <View style={[styles.summaryDivider]} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{confirmedPayments.length}</Text>
                <Text style={styles.summaryLabel}>معاملة مؤكدة</Text>
              </View>
              <View style={[styles.summaryDivider]} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{payments.length}</Text>
                <Text style={styles.summaryLabel}>إجمالي المعاملات</Text>
              </View>
            </View>
          </View>

          {/* Transactions list */}
          {payments.map((p) => {
            const statusCfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pending;
            const methodLabel = METHOD_LABEL[p.method] ?? p.method;
            const methodIcon = METHOD_ICON[p.method] ?? "credit-card";
            const dateObj = new Date(p.created_at);
            const dateLabel = dateObj.toLocaleDateString("ar-SA", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });
            const timeLabel = dateObj.toLocaleTimeString("ar-SA", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <View
                key={p.id}
                style={[styles.txnCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                {/* Header row */}
                <View style={styles.txnHeader}>
                  <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
                    <Text style={[styles.statusText, { color: statusCfg.fg }]}>{statusCfg.label}</Text>
                  </View>
                  <Text style={[styles.txnAmount, { color: colors.foreground }]}>
                    {Math.round(p.amount)} ج.س
                  </Text>
                </View>

                {/* Divider */}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Doctor info */}
                {p.doctor && (
                  <View style={styles.txnRow}>
                    <View style={[styles.txnIconWrap, { backgroundColor: colors.primarySoft }]}>
                      <Feather name="user" size={14} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1, alignItems: "flex-end" }}>
                      <Text style={[styles.txnDoctorName, { color: colors.foreground }]}>
                        {p.doctor.name_ar}
                      </Text>
                      <Text style={[styles.txnDoctorSpec, { color: colors.mutedForeground }]}>
                        {p.doctor.specialty_ar}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Appointment date / time */}
                {p.appointment && (
                  <View style={styles.txnRow}>
                    <View style={[styles.txnIconWrap, { backgroundColor: colors.primarySoft }]}>
                      <Feather name="calendar" size={14} color={colors.primary} />
                    </View>
                    <Text style={[styles.txnMeta, { color: colors.mutedForeground }]}>
                      {new Date(p.appointment.appointment_date).toLocaleDateString("ar-SA", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}{" "}
                      — {p.appointment.appointment_time}
                    </Text>
                  </View>
                )}

                {/* Method + date row */}
                <View style={styles.txnFooter}>
                  <Text style={[styles.txnFooterText, { color: colors.mutedForeground }]}>
                    {dateLabel} • {timeLabel}
                  </Text>
                  <View style={[styles.methodChip, { backgroundColor: colors.muted }]}>
                    <Feather name={methodIcon} size={12} color={colors.mutedForeground} />
                    <Text style={[styles.methodText, { color: colors.mutedForeground }]}>
                      {methodLabel}
                    </Text>
                  </View>
                </View>

                {/* Rejection reason */}
                {p.status === "rejected" && p.rejection_reason && (
                  <View style={[styles.rejectionBox, { backgroundColor: "#fee2e2" }]}>
                    <Feather name="alert-circle" size={13} color="#dc2626" />
                    <Text style={styles.rejectionText}>{p.rejection_reason}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
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
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "IBMPlexSansArabic_700Bold",
    marginTop: 4,
  },
  emptyBody: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "center",
    lineHeight: 20,
  },
  summaryCard: {
    borderRadius: 20,
    padding: 20,
  },
  summaryRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
    gap: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: "IBMPlexSansArabic_700Bold",
    color: "#ffffff",
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: "IBMPlexSansArabic_500Medium",
    color: "rgba(255,255,255,0.75)",
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  txnCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  txnHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  txnAmount: {
    fontSize: 20,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  txnRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  txnIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  txnDoctorName: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
  },
  txnDoctorSpec: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
    marginTop: 1,
  },
  txnMeta: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
    flex: 1,
  },
  txnFooter: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  txnFooterText: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_500Medium",
  },
  methodChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  methodText: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  rejectionBox: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 10,
    borderRadius: 10,
  },
  rejectionText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_500Medium",
    color: "#dc2626",
    textAlign: "right",
    writingDirection: "rtl",
  },
});
