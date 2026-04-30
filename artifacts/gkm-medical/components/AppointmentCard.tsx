import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { Appointment } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";
import { StatusPill } from "./StatusPill";

interface AppointmentCardProps {
  appointment: Appointment;
  onPress?: () => void;
  onDelete?: () => void;
}

export function AppointmentCard({ appointment, onPress, onDelete }: AppointmentCardProps) {
  const colors = useColors();
  const doc = appointment.doctor;

  if (!doc) return null;

  const dateObj = new Date(appointment.appointment_date);
  const formattedDate = dateObj.toLocaleDateString("ar", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
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
        <StatusPill status={appointment.status} />
        {onDelete && (
          <TouchableOpacity
            onPress={onDelete}
            style={[styles.deleteBtn, { backgroundColor: colors.destructive + "1A" }]}
            hitSlop={8}
            accessibilityLabel="حذف الموعد"
          >
            <Feather name="trash-2" size={16} color={colors.destructive} />
          </TouchableOpacity>
        )}
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Date + time row */}
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
      </View>
    </TouchableOpacity>
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
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
