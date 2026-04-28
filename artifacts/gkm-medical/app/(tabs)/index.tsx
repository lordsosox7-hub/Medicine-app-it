import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { SearchBar } from "@/components/SearchBar";
import { SectionHeader } from "@/components/SectionHeader";
import { AppointmentCard } from "@/components/AppointmentCard";
import { QuickActionCard } from "@/components/QuickActionCard";
import { HealthMetricCard } from "@/components/HealthMetricCard";
import { InsightCard } from "@/components/InsightCard";
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

  const quickActions: Array<{
    label: string;
    subtitle: string;
    icon: keyof typeof Feather.glyphMap;
    iconColor: string;
    iconBg: string;
    onPress: () => void;
  }> = [
    {
      label: "احجز موعد",
      subtitle: "مع أفضل الأطباء",
      icon: "calendar",
      iconColor: "#1e6bf0",
      iconBg: "#e8f0ff",
      onPress: () => router.push("/(tabs)/my-doctor"),
    },
    {
      label: "استشارة طبية",
      subtitle: "تواصل فوري",
      icon: "message-circle",
      iconColor: "#16a34a",
      iconBg: "#e7f7ee",
      onPress: () => router.push("/(tabs)/chats"),
    },
    {
      label: "نتائج التحاليل",
      subtitle: "تابع نتائجك",
      icon: "activity",
      iconColor: "#7c3aed",
      iconBg: "#f1ebff",
      onPress: () => router.push("/lab-results"),
    },
    {
      label: "الأدوية",
      subtitle: "وصفاتك الطبية",
      icon: "thermometer",
      iconColor: "#0891b2",
      iconBg: "#e0f5fa",
      onPress: () => {},
    },
    {
      label: "الملف الطبي",
      subtitle: "سجلك الكامل",
      icon: "file-text",
      iconColor: "#0b3fb5",
      iconBg: "#e8f0ff",
      onPress: () => router.push("/medical-file"),
    },
    {
      label: "الطوارئ",
      subtitle: "اتصل الآن",
      icon: "alert-circle",
      iconColor: "#ef4444",
      iconBg: "#fde8e8",
      onPress: () => {},
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: headerTop + 12, paddingBottom: 110 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userBlock}>
          <TouchableOpacity
            style={[styles.avatar, { backgroundColor: colors.primarySoft }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.avatarText, { color: colors.primary }]}>{userName.charAt(0)}</Text>
          </TouchableOpacity>
          <View style={styles.greetingBlock}>
            <Text style={[styles.greeting, { color: colors.foreground }]} numberOfLines={1}>
              مرحباً، {userName} 👋
            </Text>
            <Text style={[styles.greetingSub, { color: colors.mutedForeground }]} numberOfLines={1}>
              نتمنى لك يوماً صحياً
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.iconButton,
            { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
          ]}
          activeOpacity={0.7}
        >
          <Feather name="bell" size={20} color={colors.foreground} />
          <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.background }]}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar placeholder="ابحث عن طبيب، تخصص، خدمة..." />
      </View>

      {/* Hero */}
      <LinearGradient
        colors={[colors.gradientFrom, colors.gradientTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroCard, { borderRadius: 24 }]}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>صحتك أولويتنا</Text>
          <Text style={styles.heroSubtitle}>
            احجز مواعيدك بسهولة، تابع حالتك الصحية، واحصل على أفضل رعاية طبية.
          </Text>
          <TouchableOpacity
            style={[styles.heroButton, { backgroundColor: colors.primaryForeground }]}
            onPress={() => router.push("/(tabs)/my-doctor")}
            activeOpacity={0.85}
          >
            <Text style={[styles.heroButtonText, { color: colors.primary }]}>احجز موعد</Text>
            <Feather name="calendar" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Image
          source={require("@/assets/images/hero-heart.png")}
          style={styles.heroImage}
          contentFit="contain"
        />
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.section}>
        <SectionHeader title="الخدمات السريعة" actionLabel="عرض الكل" onAction={() => {}} />
        <View style={styles.actionsGrid}>
          {[0, 1, 2].map((rowIdx) => (
            <View key={rowIdx} style={styles.actionsRow}>
              <QuickActionCard {...quickActions[rowIdx * 2]} />
              <QuickActionCard {...quickActions[rowIdx * 2 + 1]} />
            </View>
          ))}
        </View>
      </View>

      {/* Upcoming Appointment */}
      <View style={styles.section}>
        <SectionHeader
          title="المواعيد القادمة"
          actionLabel="عرض الكل"
          onAction={() => router.push("/(tabs)/appointments")}
        />
        {isLoading ? (
          <View style={{ height: 100 }} />
        ) : upcomingAppointment ? (
          <AppointmentCard appointment={upcomingAppointment} onPress={() => {}} />
        ) : (
          <View
            style={[
              styles.emptyContainer,
              { backgroundColor: colors.card, borderRadius: 20, borderColor: colors.border, borderWidth: 1 },
            ]}
          >
            <Feather name="calendar" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا يوجد موعد قادم</Text>
          </View>
        )}
      </View>

      {/* Health Indicators */}
      <View style={[styles.section, { paddingHorizontal: 0 }]}>
        <View style={{ paddingHorizontal: 16 }}>
          <SectionHeader title="المؤشرات الصحية" actionLabel="التفاصيل" onAction={() => {}} />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metricsScroll}
        >
          <HealthMetricCard
            icon="heart"
            iconColor="#ef4444"
            iconBg="#fde8e8"
            label="معدل ضربات القلب"
            value="72"
            unit="bpm"
            status="normal"
          />
          <HealthMetricCard
            icon="activity"
            iconColor="#1e6bf0"
            iconBg="#e8f0ff"
            label="ضغط الدم"
            value="120/80"
            status="normal"
          />
          <HealthMetricCard
            icon="droplet"
            iconColor="#7c3aed"
            iconBg="#f1ebff"
            label="سكر الدم"
            value="98"
            unit="mg/dL"
            status="normal"
          />
          <HealthMetricCard
            icon="bar-chart-2"
            iconColor="#f59e0b"
            iconBg="#fef3d7"
            label="الوزن"
            value="70"
            unit="kg"
            status="normal"
          />
        </ScrollView>
      </View>

      {/* Smart Insight */}
      <View style={styles.section}>
        <SectionHeader title="نصيحة اليوم" />
        <InsightCard
          title="نصيحة صحية ذكية"
          body="اشرب الماء بانتظام للحفاظ على ضغط الدم ودعم وظائف الجسم الحيوية."
          icon="droplet"
        />
      </View>

      {/* Quick Services */}
      <View style={styles.section}>
        <SectionHeader title="خدمات سريعة" />
        <View style={styles.quickServicesRow}>
          <QuickActionCard
            label="تواصل مع طبيب"
            icon="phone-call"
            iconColor="#16a34a"
            iconBg="#e7f7ee"
            onPress={() => router.push("/(tabs)/chats")}
          />
          <QuickActionCard
            label="إعادة وصفة"
            icon="refresh-cw"
            iconColor="#0891b2"
            iconBg="#e0f5fa"
            onPress={() => {}}
          />
          <QuickActionCard
            label="زيارة منزلية"
            icon="home"
            iconColor="#1e6bf0"
            iconBg="#e8f0ff"
            onPress={() => {}}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  userBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  greetingBlock: {
    flex: 1,
    minWidth: 0,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 4,
    insetInlineEnd: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontFamily: "Tajawal_700Bold",
    lineHeight: 11,
  },
  greeting: {
    fontSize: 15,
    fontFamily: "Tajawal_700Bold",
    textAlign: "right",
  },
  greetingSub: {
    fontSize: 12,
    fontFamily: "Tajawal_500Medium",
    textAlign: "right",
    marginTop: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
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
    flexDirection: "row",
    marginBottom: 28,
    overflow: "hidden",
    minHeight: 180,
  },
  heroContent: {
    flex: 1,
    zIndex: 2,
    alignItems: "flex-start",
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontFamily: "Tajawal_700Bold",
    marginBottom: 8,
    textAlign: "right",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontFamily: "Tajawal_500Medium",
    marginBottom: 18,
    textAlign: "right",
    lineHeight: 20,
  },
  heroButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    gap: 8,
  },
  heroButtonText: {
    fontSize: 13,
    fontFamily: "Tajawal_700Bold",
  },
  heroImage: {
    position: "absolute",
    insetInlineStart: -10,
    bottom: -10,
    width: 150,
    height: 150,
    opacity: 0.85,
    zIndex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 28,
  },
  actionsGrid: {
    gap: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  quickServicesRow: {
    flexDirection: "row",
    gap: 12,
  },
  emptyContainer: {
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Tajawal_500Medium",
  },
});
