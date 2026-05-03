import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppointments, useCancelAppointment, useDeleteAppointment, useCreateRefundAndCancel, isRefundWindowOpen, useAutoMarkNoShow } from "@/hooks/useGkmData";
import { BrandHeader } from "@/components/BrandHeader";
import { AppointmentCard } from "@/components/AppointmentCard";
import { EmptyState } from "@/components/EmptyState";
import { GradientButton } from "@/components/GradientButton";
import * as Haptics from "expo-haptics";
import { cancelAppointmentReminder } from "@/lib/pushNotifications";

export default function AppointmentsScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: appointments, isLoading } = useAppointments();
  const cancelAppointment = useCancelAppointment();
  const deleteAppointment = useDeleteAppointment();
  const cancelWithRefund = useCreateRefundAndCancel();

  useAutoMarkNoShow(appointments);

  const handlePress = (appointment: any) => {
    if (appointment.status !== "upcoming") return;

    const refundable = isRefundWindowOpen(appointment.appointment_date, appointment.appointment_time);

    if (refundable) {
      Alert.alert(
        "إلغاء الموعد",
        "يمكنك استرداد 95% من المبلغ المدفوع (يُخصم 5% رسوم استرداد) لأن الموعد بعد أكثر من ساعتين.",
        [
          { text: "تراجع", style: "cancel" },
          {
            text: "إلغاء مع استرداد (95%)",
            style: "destructive",
            onPress: async () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              cancelAppointmentReminder(appointment.id);
              try {
                const result = await cancelWithRefund.mutateAsync(appointment.id);
                if (result.hasRefund) {
                  Alert.alert(
                    "✅ تم تقديم طلب الاسترداد",
                    `سيتم استرداد ${Math.round(result.refundAmount)} ج.س خلال 3-5 أيام عمل.`,
                  );
                }
              } catch {
                Alert.alert("خطأ", "تعذّر إلغاء الموعد، يرجى المحاولة مرة أخرى.");
              }
            },
          },
          {
            text: "إلغاء بدون استرداد",
            style: "destructive",
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              cancelAppointment.mutate(appointment.id);
              cancelAppointmentReminder(appointment.id);
            },
          },
        ],
      );
    } else {
      Alert.alert(
        "إلغاء الموعد",
        "لا يمكن الاسترداد عند الإلغاء قبل أقل من ساعتين من الموعد.",
        [
          { text: "تراجع", style: "cancel" },
          {
            text: "إلغاء بدون استرداد",
            style: "destructive",
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              cancelAppointment.mutate(appointment.id);
              cancelAppointmentReminder(appointment.id);
            },
          },
        ],
      );
    }
  };

  const handleDelete = (appointment: any) => {
    const doDelete = () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      deleteAppointment.mutate(appointment.id);
    };
    if (Platform.OS === "web") {
      const ok = typeof window !== "undefined" && window.confirm("هل تريد حذف هذا الموعد نهائياً؟");
      if (ok) doDelete();
    } else {
      Alert.alert(
        "حذف الموعد",
        "هل تريد حذف هذا الموعد نهائياً؟ لا يمكن التراجع.",
        [
          { text: "تراجع", style: "cancel" },
          { text: "حذف", style: "destructive", onPress: doDelete },
        ],
      );
    }
  };

  const isWeb = Platform.OS === "web";
  const headerTop = isWeb ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: headerTop }]}>
      <BrandHeader title="مواعيدي" />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : appointments && appointments.length > 0 ? (
        <ScrollView 
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {appointments.map((apt) => (
            <AppointmentCard 
              key={apt.id} 
              appointment={apt} 
              onPress={() => handlePress(apt)}
              onDelete={() => handleDelete(apt)}
            />
          ))}
        </ScrollView>
      ) : (
        <EmptyState 
          icon="calendar" 
          title="لا توجد مواعيد حالياً" 
          action={
            <GradientButton 
              title="احجز موعد" 
              onPress={() => router.push("/(tabs)/my-doctor")} 
            />
          } 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  }
});
