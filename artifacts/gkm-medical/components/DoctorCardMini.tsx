import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { Doctor } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";

interface DoctorCardMiniProps {
  doctor: Doctor;
}

export function DoctorCardMini({ doctor }: DoctorCardMiniProps) {
  const colors = useColors();

  return (
    <View
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
      <View style={styles.imageContainer}>
        {doctor.photo_url ? (
          <Image source={{ uri: doctor.photo_url }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.placeholderText, { color: colors.primary }]}>
              {doctor.name_ar.charAt(0)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {doctor.name_ar}
        </Text>
        <Text style={[styles.specialty, { color: colors.mutedForeground }]} numberOfLines={2}>
          {doctor.specialty_ar}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.ratingPill, { backgroundColor: "#fff7e0" }]}>
            <Feather name="star" size={11} color={colors.warning} />
            <Text style={[styles.ratingText, { color: "#a35a00" }]}>
              {doctor.rating.toFixed(1)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="check-circle" size={11} color={colors.success} />
            <Text style={[styles.metaText, { color: colors.success }]}>موثّق</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    alignItems: "center",
    gap: 12,
  },
  imageContainer: {
    width: 64,
    height: 64,
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
    fontSize: 22,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  info: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 5,
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
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11.5,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
});
