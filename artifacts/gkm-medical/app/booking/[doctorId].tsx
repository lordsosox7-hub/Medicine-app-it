import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDoctor, useCreateAppointment } from "@/hooks/useGkmData";
import { DoctorCardMini } from "@/components/DoctorCardMini";
import { GradientButton } from "@/components/GradientButton";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const TIME_SLOTS = ['10:30 صباحاً','11:30 صباحاً','12:30 ظهراً','02:30 ظهراً','04:30 مساءً','06:30 مساءً'];

export default function BookingScreen() {
  const { doctorId } = useLocalSearchParams<{ doctorId: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: doctor, isLoading } = useDoctor(doctorId);
  const createAppointment = useCreateAppointment();

  // Generate next 7 days
  const today = new Date();
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      date: d,
      dateString: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('ar', { weekday: 'short' }),
      dayNumber: d.getDate(),
      month: d.toLocaleDateString('ar', { month: 'short' }),
    };
  });

  const [selectedDate, setSelectedDate] = useState(days[0].dateString);
  const [selectedTime, setSelectedTime] = useState(TIME_SLOTS[0]);

  if (isLoading || !doctor) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const handleBook = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    createAppointment.mutate({
      doctor_id: doctor.id,
      appointment_date: selectedDate,
      appointment_time: selectedTime,
    }, {
      onSuccess: (appointment) => {
        router.replace({
          pathname: '/payment/[appointmentId]',
          params: {
            appointmentId: appointment.id,
            doctorName: doctor.name_ar,
            doctorSpecialty: doctor.specialty_ar,
            date: selectedDate,
            time: selectedTime,
            price: String(doctor.price),
          },
        });
      }
    });
  };

  const formattedDateSelected = new Date(selectedDate).toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.doctorWrapper}>
          <DoctorCardMini doctor={doctor} />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>اختر التاريخ</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.datesScroll}
        >
          {days.map((day, idx) => {
            const isSelected = selectedDate === day.dateString;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                onPress={() => setSelectedDate(day.dateString)}
                style={[
                  styles.dateCard,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  }
                ]}
              >
                <Text style={[styles.dayName, { color: isSelected ? colors.primaryForeground : colors.mutedForeground }]}>
                  {day.dayName}
                </Text>
                <Text style={[styles.dayNum, { color: isSelected ? colors.primaryForeground : colors.foreground }]}>
                  {day.dayNumber}
                </Text>
                <Text style={[styles.monthName, { color: isSelected ? colors.primaryForeground : colors.mutedForeground }]}>
                  {day.month}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>اختر الوقت</Text>
        <View style={styles.timeGrid}>
          {TIME_SLOTS.map((time, idx) => {
            const isSelected = selectedTime === time;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.7}
                onPress={() => setSelectedTime(time)}
                style={[
                  styles.timeSlot,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                  }
                ]}
              >
                <Text style={[styles.timeText, { color: isSelected ? colors.primaryForeground : colors.foreground }]}>
                  {time}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom || 16 }]}>
        <View style={styles.recapContainer}>
          <Text style={[styles.recapLabel, { color: colors.mutedForeground }]}>ملخص الحجز</Text>
          <View style={styles.recapRow}>
            <View style={[styles.recapIcon, { backgroundColor: colors.primarySoft }]}>
              <Feather name="calendar" size={16} color={colors.primary} />
            </View>
            <Text style={[styles.recapValue, { color: colors.foreground }]} numberOfLines={1}>
              {formattedDateSelected}
            </Text>
          </View>
          <View style={styles.recapRow}>
            <View style={[styles.recapIcon, { backgroundColor: colors.primarySoft }]}>
              <Feather name="clock" size={16} color={colors.primary} />
            </View>
            <Text style={[styles.recapValue, { color: colors.foreground }]} numberOfLines={1}>
              {selectedTime}
            </Text>
          </View>
        </View>
        <GradientButton
          title="تأكيد الحجز"
          onPress={handleBook}
        />
      </View>
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
  },
  scrollContent: {
    paddingBottom: 150,
  },
  doctorWrapper: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "IBMPlexSansArabic_700Bold",
    paddingHorizontal: 16,
    marginBottom: 16,
    textAlign: 'right',
  },
  datesScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  dateCard: {
    width: 64,
    height: 80,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayName: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_500Medium",
    marginBottom: 2,
  },
  dayNum: {
    fontSize: 18,
    fontFamily: "IBMPlexSansArabic_700Bold",
    marginBottom: 2,
  },
  monthName: {
    fontSize: 11,
    fontFamily: "IBMPlexSansArabic_400Regular",
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
  },
  timeSlot: {
    width: '46%',
    marginHorizontal: '2%',
    marginBottom: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  footer: {
    position: 'absolute',
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
  recapContainer: {
    marginBottom: 14,
    gap: 8,
  },
  recapLabel: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: 'right',
    marginBottom: 2,
  },
  recapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recapIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recapValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: 'right',
  }
});
