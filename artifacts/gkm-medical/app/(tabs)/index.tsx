import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { SearchBar } from "@/components/SearchBar";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { TouchableOpacity } from "react-native";
import { ServiceTile } from "@/components/ServiceTile";
import { SectionHeader } from "@/components/SectionHeader";
import { AppointmentCard } from "@/components/AppointmentCard";
import { EmptyState } from "@/components/EmptyState";
import { getUserName } from "@/lib/userId";
import { useUpcomingAppointment } from "@/hooks/useGkmData";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: upcomingAppointment, isLoading } = useUpcomingAppointment();
  const [userName, setUserName] = useState("أحمد");

  useEffect(() => {
    getUserName().then(setUserName);
  }, []);

  const isWeb = Platform.OS === "web";
  const headerTop = isWeb ? 67 : insets.top;

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: headerTop + 16, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <Feather name="bell" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.greeting, { color: colors.foreground }]}>مرحباً، {userName}</Text>
          <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{userName.charAt(0)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar placeholder="ابحث عن طبيب، تخصص، خدمة..." />
      </View>

      <LinearGradient
        colors={[colors.gradientFrom, colors.gradientTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroCard, { borderRadius: colors.radius }]}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>صحتك في يد أمينة</Text>
          <Text style={styles.heroSubtitle}>نحن هنا لرعايتك</Text>
          <TouchableOpacity 
            style={[styles.heroButton, { backgroundColor: colors.primaryForeground, borderRadius: colors.radius }]}
            onPress={() => router.push("/(tabs)/my-doctor")}
            activeOpacity={0.8}
          >
            <Text style={[styles.heroButtonText, { color: colors.primary }]}>احجز موعدك الآن</Text>
          </TouchableOpacity>
        </View>
        <Image 
          source={require("@/assets/images/hero-heart.png")} 
          style={styles.heroImage} 
          contentFit="contain" 
        />
      </LinearGradient>

      <View style={styles.section}>
        <SectionHeader 
          title="الخدمات السريعة" 
          actionLabel="عرض الكل" 
          onAction={() => {}} 
        />
        <View style={styles.servicesGrid}>
          <View style={styles.servicesRow}>
            <ServiceTile label="احجز موعد" icon="calendar" onPress={() => router.push("/(tabs)/appointments")} />
            <View style={{ width: 12 }} />
            <ServiceTile label="استشارة طبية" icon="message-circle" onPress={() => router.push("/(tabs)/chats")} />
          </View>
          <View style={{ height: 12 }} />
          <View style={styles.servicesRow}>
            <ServiceTile label="الأدوية" icon="thermometer" onPress={() => {}} />
            <View style={{ width: 12 }} />
            <ServiceTile label="نتائج التحاليل" icon="activity" onPress={() => router.push("/lab-results")} />
          </View>
          <View style={{ height: 12 }} />
          <View style={styles.servicesRow}>
            <ServiceTile label="الملف الطبي" icon="file-text" onPress={() => router.push("/medical-file")} />
            <View style={{ width: 12 }} />
            <ServiceTile label="المراكز الطبية" icon="map-pin" onPress={() => {}} />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="الموعد القادم" />
        {isLoading ? (
          <View style={{ height: 100 }} />
        ) : upcomingAppointment ? (
          <AppointmentCard 
            appointment={upcomingAppointment} 
            onPress={() => {}} 
          />
        ) : (
          <View style={[styles.emptyContainer, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا يوجد موعد قادم</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 16,
    fontFamily: "Tajawal_700Bold",
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: "Tajawal_700Bold",
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  heroCard: {
    marginHorizontal: 16,
    padding: 24,
    flexDirection: 'row',
    marginBottom: 32,
    overflow: 'hidden',
  },
  heroContent: {
    flex: 1,
    zIndex: 2,
    alignItems: 'flex-start',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontFamily: "Tajawal_700Bold",
    marginBottom: 8,
    textAlign: 'left',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontFamily: "Tajawal_500Medium",
    marginBottom: 24,
    textAlign: 'left',
  },
  heroButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  heroButtonText: {
    fontSize: 14,
    fontFamily: "Tajawal_700Bold",
  },
  heroImage: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 140,
    height: 140,
    opacity: 0.9,
    zIndex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  servicesGrid: {
    marginTop: 8,
  },
  servicesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Tajawal_500Medium",
  }
});
