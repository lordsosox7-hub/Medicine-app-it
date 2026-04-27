import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Appointment } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";
import { StatusPill } from "./StatusPill";

interface AppointmentCardProps {
  appointment: Appointment;
  onPress?: () => void;
}

export function AppointmentCard({ appointment, onPress }: AppointmentCardProps) {
  const colors = useColors();
  const doc = appointment.doctor;

  if (!doc) return null;

  const dateObj = new Date(appointment.appointment_date);
  const formattedDate = dateObj.toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      style={[styles.container, { backgroundColor: colors.card, borderRadius: colors.radius, shadowColor: colors.foreground }]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
        <View style={styles.dateRow}>
          <Text style={[styles.dateText, { color: colors.foreground }]}>{formattedDate} • {appointment.appointment_time}</Text>
          <StatusPill status={appointment.status} />
        </View>
      </View>
      
      <View style={styles.doctorInfo}>
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
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    paddingBottom: 12,
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginLeft: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
    textAlign: 'left',
  },
  specialty: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: 'left',
  },
});
