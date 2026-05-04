import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDoctor, useIsFavorite, useToggleFavorite } from "@/hooks/useGkmData";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Feather, Ionicons } from "@expo/vector-icons";
import { GradientButton } from "@/components/GradientButton";
import { RTLChevron } from "@/components/RTLChevron";
import { CLINIC } from "@/constants/clinic";

export default function DoctorProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: doctor, isLoading } = useDoctor(id);
  const { data: isFav = false } = useIsFavorite(id);
  const toggleFav = useToggleFavorite();
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.25, useNativeDriver: true, friction: 4 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
  }, [isFav, heartScale]);

  const onToggleFavorite = () => {
    if (!id) return;
    toggleFav.mutate({ doctor_id: id, current: isFav });
  };

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
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onToggleFavorite}
              activeOpacity={0.7}
              disabled={toggleFav.isPending}
            >
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Ionicons
                  name={isFav ? "heart" : "heart-outline"}
                  size={24}
                  color="#ffffff"
                />
              </Animated.View>
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

          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>عنوان العيادة</Text>
          {(() => {
            const clinicName = doctor.clinic_name_ar ?? CLINIC.name_ar;
            const clinicAddress = doctor.clinic_address_ar ?? CLINIC.address_ar;
            const clinicPhone = doctor.clinic_phone ?? CLINIC.phone;
            const clinicMapsUrl =
              doctor.clinic_maps_url ??
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinicAddress)}`;
            return (
              <View
                style={[
                  styles.clinicCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.clinicRow}>
                  <View style={styles.clinicTextWrap}>
                    <Text style={[styles.clinicName, { color: colors.foreground }]} numberOfLines={2}>
                      {clinicName}
                    </Text>
                    <Text style={[styles.clinicAddress, { color: colors.mutedForeground }]} numberOfLines={3}>
                      {clinicAddress}
                    </Text>
                    <View style={styles.clinicMeta}>
                      <Feather name="clock" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.clinicMetaText, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {CLINIC.hours_ar}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.clinicIconWrap, { backgroundColor: colors.primarySoft }]}>
                    <Feather name="map-pin" size={22} color={colors.primary} />
                  </View>
                </View>

                <View style={[styles.clinicDivider, { backgroundColor: colors.border }]} />

                <View style={styles.clinicActions}>
                  <TouchableOpacity
                    style={[styles.clinicActionBtn, { backgroundColor: colors.primary }]}
                    onPress={() => Linking.openURL(clinicMapsUrl)}
                    activeOpacity={0.85}
                  >
                    <Feather name="navigation" size={15} color={colors.primaryForeground} />
                    <Text style={[styles.clinicActionText, { color: colors.primaryForeground }]}>
                      الاتجاهات
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.clinicActionBtn,
                      styles.clinicActionBtnGhost,
                      { borderColor: colors.border },
                    ]}
                    onPress={() => Linking.openURL(`tel:${clinicPhone}`)}
                    activeOpacity={0.7}
                  >
                    <Feather name="phone" size={15} color={colors.primary} />
                    <Text style={[styles.clinicActionText, { color: colors.primary }]}>
                      اتصل
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom || 16 }]}>
        <View style={styles.priceContainer}>
          <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>سعر المقابلة</Text>
          <Text style={[styles.priceValue, { color: colors.foreground }]}>{doctor.price} ج.س</Text>
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
    borderRadius: 20,
  },
  iconBtnActive: {
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  heartFilled: {
    textShadowColor: "#ef4444",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
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
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  name: {
    fontSize: 22,
    fontFamily: "IBMPlexSansArabic_700Bold",
    color: '#ffffff',
    marginBottom: 4,
  },
  specialty: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_500Medium",
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
    fontFamily: "IBMPlexSansArabic_700Bold",
    color: '#ffffff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_500Medium",
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "IBMPlexSansArabic_700Bold",
    marginBottom: 12,
    textAlign: 'right',
  },
  about: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_400Regular",
    lineHeight: 24,
    textAlign: 'right',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  serviceText: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_500Medium",
  },
  clinicCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  clinicRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 12,
  },
  clinicTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  clinicIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  clinicName: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
    marginBottom: 4,
    lineHeight: 22,
  },
  clinicAddress: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_400Regular",
    textAlign: "right",
    lineHeight: 20,
  },
  clinicMeta: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  clinicMetaText: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_500Medium",
    flex: 1,
    textAlign: "right",
  },
  clinicDivider: {
    height: 1,
    marginVertical: 14,
  },
  clinicActions: {
    flexDirection: "row",
    gap: 10,
  },
  clinicActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
  },
  clinicActionBtnGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  clinicActionText: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_700Bold",
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
    fontFamily: "IBMPlexSansArabic_500Medium",
    marginBottom: 2,
    textAlign: 'right',
  },
  priceValue: {
    fontSize: 18,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: 'right',
  },
  bookButton: {
    flex: 1.5,
  }
});
