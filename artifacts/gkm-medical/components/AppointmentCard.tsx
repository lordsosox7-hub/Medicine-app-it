import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { Appointment } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";
import { StatusPill } from "./StatusPill";
import { PressableScale } from "./PressableScale";
import { useRouter } from "expo-router";

function parseArabicTimeTo24h(timeStr: string): { hours: number; minutes: number } {
  const match = timeStr.match(/(\d+):(\d+)/);
  if (!match) return { hours: 12, minutes: 0 };
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (timeStr.includes("صباحاً")) {
    if (hours === 12) hours = 0;
  } else {
    if (hours !== 12) hours += 12;
  }
  return { hours, minutes };
}

function isAppointmentPast(dateStr: string, timeStr: string): boolean {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const { hours, minutes } = parseArabicTimeTo24h(timeStr);
    const apptDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return apptDate.getTime() < Date.now();
  } catch {
    return false;
  }
}

interface AppointmentCardProps {
  appointment: Appointment;
  onPress?: () => void;
  onTicket?: () => void;
}

export function AppointmentCard({ appointment, onPress, onTicket }: AppointmentCardProps) {
  const colors = useColors();
  const router = useRouter();
  const doc = appointment.doctor;

  const handleTicket = () => {
    if (onTicket) { onTicket(); return; }
    router.push(`/ticket/${appointment.id}`);
  };

  if (!doc) return null;

  const dateObj = new Date(appointment.appointment_date);
  const formattedDate = dateObj.toLocaleDateString("ar", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // If the appointment is stored as "upcoming" but its datetime has already passed, show it as "فائت"
  const displayStatus =
    appointment.status === "no_show"
      ? "missed"
      : appointment.status === "upcoming" &&
        isAppointmentPast(appointment.appointment_date, appointment.appointment_time)
      ? "missed"
      : appointment.status;

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={onPress ? 0.97 : 1}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderRadius: 18,
          borderColor: colors.border,
          borderWidth: 1,
          shadowColor: colors.foreground,
        },
      ]}
    >
      {/* Doctor info row */}
      <View style={styles.doctorRow}>
        <View style={styles.imageContainer}>
          {doc.photo_url ? (
            <Image source={{ uri: doc.photo_url }} style={styles.image} contentFit="cover" />
          ) : (
            <View style={[styles.placeholder, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.placeholderText, { color: colors.primary }]}>
                {doc.name_ar.charAt(0)}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {doc.name_ar}
          </Text>
          <Text style={[styles.specialty, { color: colors.mutedForeground }]} numberOfLines={1}>
            {doc.specialty_ar}
          </Text>
        </View>
        <StatusPill status={displayStatus as any} />
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Date + time + QR row */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <View style={[styles.metaIcon, { backgroundColor: colors.primarySoft }]}>
            <Feather name="calendar" size={14} color={colors.primary} />
          </View>
          <Text style={[styles.metaText, { color: colors.foreground }]} numberOfLines={1}>
            {formattedDate}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <View style={[styles.metaIcon, { backgroundColor: colors.primarySoft }]}>
            <Feather name="clock" size={14} color={colors.primary} />
          </View>
          <Text style={[styles.metaText, { color: colors.foreground }]} numberOfLines={1}>
            {appointment.appointment_time}
          </Text>
        </View>
        <PressableScale
          onPress={handleTicket}
          scaleTo={0.88}
          style={[styles.qrBtn, { backgroundColor: colors.primarySoft }]}
          hitSlop={6}
          accessibilityLabel="عرض تذكرة QR"
        >
          <Feather name="maximize" size={15} color={colors.primary} />
        </PressableScale>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  doctorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  imageContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 18,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  info: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
  },
  specialty: {
    fontSize: 12.5,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
  },
  divider: {
    height: 1,
    marginVertical: 12,
    opacity: 0.7,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  metaIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  metaText: {
    fontSize: 12.5,
    fontFamily: "IBMPlexSansArabic_700Bold",
    flexShrink: 1,
  },
  qrBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
});
