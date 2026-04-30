import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Doctor } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";
import { useIsFavorite, useToggleFavorite } from "@/hooks/useGkmData";

interface DoctorCardProps {
  doctor: Doctor;
  onPress: () => void;
}

export function DoctorCard({ doctor, onPress }: DoctorCardProps) {
  const colors = useColors();
  const { data: isFav = false } = useIsFavorite(doctor.id);
  const toggleFav = useToggleFavorite();

  const onToggleFavorite = () => {
    toggleFav.mutate({ doctor_id: doctor.id, current: isFav });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
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
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {doctor.name_ar}
          </Text>
          <TouchableOpacity
            style={[
              styles.heart,
              { backgroundColor: isFav ? "#fee2e2" : colors.muted },
            ]}
            activeOpacity={0.7}
            hitSlop={6}
            onPress={onToggleFavorite}
            disabled={toggleFav.isPending}
          >
            <Ionicons
              name={isFav ? "heart" : "heart-outline"}
              size={16}
              color={isFav ? "#ef4444" : colors.mutedForeground}
            />
          </TouchableOpacity>
        </View>

        <Text style={[styles.specialty, { color: colors.mutedForeground }]} numberOfLines={2}>
          {doctor.specialty_ar}
        </Text>

        <View style={styles.metaRow}>
          <View style={[styles.ratingPill, { backgroundColor: "#fff7e0" }]}>
            <Feather name="star" size={12} color={colors.warning} />
            <Text style={[styles.ratingText, { color: "#a35a00" }]}>
              {doctor.rating.toFixed(1)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="briefcase" size={12} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>
              متاح اليوم
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 12,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    alignItems: "center",
    gap: 12,
  },
  imageContainer: {
    width: 72,
    height: 72,
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
    fontSize: 24,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  info: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
  },
  heart: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
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
    gap: 10,
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
    flexShrink: 1,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_500Medium",
  },
});
