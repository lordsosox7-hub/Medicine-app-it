import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDoctor } from "@/hooks/useGkmData";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { GradientButton } from "@/components/GradientButton";
import { RTLChevron } from "@/components/RTLChevron";

export default function DoctorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: doctor, isLoading } = useDoctor(id);

  if (isLoading || !doctor) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <LinearGradient
          colors={[colors.gradientFrom, colors.gradientTo]}
          style={[styles.banner, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <RTLChevron color="#ffffff" size={24} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Feather name="heart" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.avatarContainer}>
            {doctor.photo_url ? (
              <Image source={{ uri: doctor.photo_url }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.avatarInitial, { color: colors.primary }]}>{doctor.name_ar.charAt(0)}</Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{doctor.name_ar}</Text>
          <Text style={styles.specialty}>{doctor.specialty_ar}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Feather name="star" size={16} color={colors.warning} style={{ fill: colors.warning, marginBottom: 4 }} />
              <Text style={styles.statValue}>{doctor.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>التقييم</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Feather name="briefcase" size={16} color="#ffffff" style={{ marginBottom: 4 }} />
              <Text style={styles.statValue}>+{doctor.years_experience}</Text>
              <Text style={styles.statLabel}>سنوات خبرة</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.content, { backgroundColor: colors.background, marginTop: -24, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>عن الطبيب</Text>
          <Text style={[styles.about, { color: colors.mutedForeground }]}>{doctor.about_ar}</Text>
          
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>الخدمات</Text>
          <View style={styles.servicesGrid}>
            {doctor.services_ar.map((service, index) => (
              <View key={index} style={[styles.serviceChip, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.serviceText, { color: colors.primary }]}>{service}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom || 16 }]}>
        <View style={styles.priceContainer}>
          <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>سعر الاستشارة</Text>
          <Text style={[styles.priceValue, { color: colors.foreground }]}>{doctor.price} ر.س</Text>
        </View>
        <GradientButton 
          title="احجز موعد" 
          onPress={() => router.push(`/booking/${doctor.id}`)} 
          style={styles.bookButton}
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
  banner: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  iconBtn: {
    padding: 8,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
  },
  name: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: '#ffffff',
    marginBottom: 4,
  },
  specialty: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  statValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: '#ffffff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
    textAlign: 'left',
  },
  about: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
    textAlign: 'left',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  serviceChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  serviceText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
    textAlign: 'left',
  },
  priceValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: 'left',
  },
  bookButton: {
    flex: 1.5,
  }
});
