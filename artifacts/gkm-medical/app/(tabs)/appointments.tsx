import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppointments, useCancelAppointment } from "@/hooks/useGkmData";
import { BrandHeader } from "@/components/BrandHeader";
import { AppointmentCard } from "@/components/AppointmentCard";
import { EmptyState } from "@/components/EmptyState";
import { GradientButton } from "@/components/GradientButton";
import * as Haptics from "expo-haptics";

export default function AppointmentsScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: appointments, isLoading } = useAppointments();
  const cancelAppointment = useCancelAppointment();

  const handlePress = (appointment: any) => {
    if (appointment.status === "upcoming") {
      Alert.alert(
        "إدارة الموعد",
        "هل تريد إلغاء هذا الموعد؟",
        [
          { text: "تراجع", style: "cancel" },
          { 
            text: "إلغاء الموعد", 
            style: "destructive",
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              cancelAppointment.mutate(appointment.id);
            }
          }
        ]
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
