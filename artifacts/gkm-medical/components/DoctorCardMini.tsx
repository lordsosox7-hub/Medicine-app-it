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
    <View style={[styles.container, { backgroundColor: colors.card, borderRadius: colors.radius, shadowColor: colors.foreground }]}>
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
        <Text style={[styles.specialty, { color: colors.mutedForeground }]} numberOfLines={1}>
          {doctor.specialty_ar}
        </Text>
        <View style={styles.ratingRow}>
          <Feather name="star" size={12} color={colors.warning} style={{ fill: colors.warning }} />
          <Text style={[styles.ratingText, { color: colors.foreground }]}>{doctor.rating.toFixed(1)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    marginEnd: 12,
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
    fontSize: 20,
    fontFamily: "Tajawal_700Bold",
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontFamily: "Tajawal_700Bold",
    marginBottom: 4,
    textAlign: 'right',
  },
  specialty: {
    fontSize: 12,
    fontFamily: "Tajawal_500Medium",
    marginBottom: 6,
    textAlign: 'right',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontFamily: "Tajawal_700Bold",
    marginStart: 4,
  },
});
