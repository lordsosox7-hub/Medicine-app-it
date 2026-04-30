import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import Svg, { Circle, Path, G } from "react-native-svg";
import { SearchBar } from "@/components/SearchBar";
import { SectionHeader } from "@/components/SectionHeader";
import { AppointmentCard } from "@/components/AppointmentCard";
import { QuickActionCard } from "@/components/QuickActionCard";
import { HealthMetricCard } from "@/components/HealthMetricCard";
import { InsightCard } from "@/components/InsightCard";
import { getTodayAdvice } from "@/constants/advices";
import { getUserName } from "@/lib/userId";
import { useUpcomingAppointment } from "@/hooks/useGkmData";
import { useNotifications } from "@/hooks/useNotifications";
import { useVitals } from "@/hooks/useVitals";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: upcomingAppointment, isLoading } = useUpcomingAppointment();
  const { unreadCount } = useNotifications();
  const { getDisplayValue, getStatus, getTrend } = useVitals();
  const [userName, setUserName] = useState("أحمد");
  const [todayAdvice, setTodayAdvice] = useState(() => getTodayAdvice());

  useEffect(() => {
    getUserName().then(setUserName);
  }, []);

  useEffect(() => {
    // Re-evaluate the daily advice every 5 minutes so it auto-rotates
    // at midnight London time even if the app stays open.
    const interval = setInterval(() => {
      setTodayAdvice(getTodayAdvice());
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const isWeb = Platform.OS === "web";
  const headerTop = isWeb ? 67 : insets.top;

  const a = colors.accents;

  const quickActions: Array<{
    label: string;
    subtitle: string;
    icon?: keyof typeof Feather.glyphMap;
    iconNode?: React.ReactNode;
    iconColor: string;
    iconBg: string;
    onPress: () => void;
  }> = [
    {
      label: "احجز موعد",
      subtitle: "مع أفضل الأطباء",
      icon: "calendar",
      iconColor: a.blue.color,
      iconBg: a.blue.bg,
      onPress: () => router.push("/(tabs)/my-doctor"),
    },
    {
      label: "استشارة طبية",
      subtitle: "تواصل فوري",
      iconNode: (
        <MaterialCommunityIcons name="stethoscope" size={22} color={a.green.color} />
      ),
      iconColor: a.green.color,
      iconBg: a.green.bg,
      onPress: () => router.push("/(tabs)/chats"),
    },
    {
      label: "نتائج التحاليل",
      subtitle: "تابع نتائجك",
      iconNode: (
        <MaterialCommunityIcons name="test-tube" size={22} color={a.purple.color} />
      ),
      iconColor: a.purple.color,
      iconBg: a.purple.bg,
      onPress: () => router.push("/lab-results"),
    },
    {
      label: "الأدوية",
      subtitle: "وصفاتك الطبية",
      iconNode: (
        <MaterialCommunityIcons name="pill" size={22} color={a.teal.color} />
      ),
      iconColor: a.teal.color,
      iconBg: a.teal.bg,
      onPress: () => {},
    },
    {
      label: "الملف الطبي",
      subtitle: "سجلك الكامل",
      iconNode: (
        <MaterialCommunityIcons name="clipboard-pulse" size={22} color={a.indigo.color} />
      ),
      iconColor: a.indigo.color,
      iconBg: a.indigo.bg,
      onPress: () => router.push("/medical-file"),
    },
    {
      label: "الطوارئ",
      subtitle: "اتصل الآن",
      iconNode: (
        <MaterialCommunityIcons name="ambulance" size={22} color={a.red.color} />
      ),
      iconColor: a.red.color,
      iconBg: a.red.bg,
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
            onPress={() => router.push("/profile")}
          >
            <Feather name="user" size={22} color={colors.primary} />
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
            {
              backgroundColor: colors.primarySoft,
              shadowColor: colors.primary,
            },
          ]}
          activeOpacity={0.7}
          onPress={() => router.push("/notifications")}
          accessibilityLabel="الإشعارات"
        >
          <Ionicons name="notifications-outline" size={22} color={colors.primary} />
          {unreadCount > 0 && (
            <View
              style={[
                styles.badge,
                { backgroundColor: colors.danger, borderColor: colors.background },
              ]}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder="ابحث عن طبيب، تخصص، خدمة..."
          editable={false}
          onPress={() => router.push("/(tabs)/my-doctor")}
          onSubmit={(text) =>
            router.push({ pathname: "/(tabs)/my-doctor", params: { q: text } })
          }
        />
      </View>

      {/* Hero */}
      <LinearGradient
        colors={[colors.gradientFrom, colors.gradientTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroCard, { borderRadius: 24 }]}
      >
        {/* Decorative art layer */}
        <View style={styles.heroArt} pointerEvents="none">
          <Svg width="100%" height="100%" viewBox="0 0 360 200">
            <G opacity={0.18}>
              <Circle cx={40} cy={30} r={70} fill="#ffffff" />
              <Circle cx={20} cy={170} r={50} fill="#ffffff" />
              <Circle cx={110} cy={180} r={28} fill="#ffffff" />
            </G>
            <G opacity={0.32}>
              <Circle cx={70} cy={100} r={46} stroke="#ffffff" strokeWidth={1.5} fill="none" />
              <Circle cx={70} cy={100} r={66} stroke="#ffffff" strokeWidth={1} fill="none" />
            </G>
            {/* Pulse line */}
            <Path
              d="M0 130 L25 130 L35 110 L45 150 L60 90 L75 130 L150 130"
              stroke="#ffffff"
              strokeWidth={1.6}
              fill="none"
              opacity={0.55}
            />
            {/* Plus signs scattered */}
            <G fill="#ffffff" opacity={0.45}>
              <Path d="M120 40 h10 v3 h-10 z M124 36 h2 v11 h-2 z" />
              <Path d="M30 70 h8 v2.5 h-8 z M33 67 h2 v8.5 h-2 z" />
              <Path d="M150 90 h6 v2 h-6 z M152 87 h2 v8 h-2 z" />
            </G>
            {/* Soft heart pulse circle */}
            <Circle cx={70} cy={100} r={20} fill="#ffffff" opacity={0.22} />
          </Svg>
        </View>

        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>صحتك أولويتنا</Text>
          <Text style={styles.heroSubtitle}>
            احجز مواعيدك بسهولة، تابع حالتك الصحية، واحصل على أفضل رعاية.
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
          <SectionHeader
            title="المؤشرات الصحية"
            actionLabel="التفاصيل"
            onAction={() => router.push("/vitals")}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metricsScroll}
        >
          <HealthMetricCard
            iconNode={<MaterialCommunityIcons name="heart-pulse" size={20} color={a.rose.color} />}
            iconColor={a.rose.color}
            iconBg={a.rose.bg}
            label="معدل ضربات القلب"
            value={getDisplayValue("heart_rate")}
            unit="bpm"
            status={getStatus("heart_rate")}
            trend={getTrend("heart_rate", 7)}
            onPress={() => router.push("/vitals")}
          />
          <HealthMetricCard
            iconNode={<MaterialCommunityIcons name="gauge" size={20} color={a.blue.color} />}
            iconColor={a.blue.color}
            iconBg={a.blue.bg}
            label="ضغط الدم"
            value={getDisplayValue("blood_pressure")}
            status={getStatus("blood_pressure")}
            trend={getTrend("blood_pressure", 7)}
            onPress={() => router.push("/vitals")}
          />
          <HealthMetricCard
            iconNode={<MaterialCommunityIcons name="water" size={20} color={a.purple.color} />}
            iconColor={a.purple.color}
            iconBg={a.purple.bg}
            label="سكر الدم"
            value={getDisplayValue("blood_sugar")}
            unit="mg/dL"
            status={getStatus("blood_sugar")}
            trend={getTrend("blood_sugar", 7)}
            onPress={() => router.push("/vitals")}
          />
          <HealthMetricCard
            iconNode={<MaterialCommunityIcons name="scale-bathroom" size={20} color={a.amber.color} />}
            iconColor={a.amber.color}
            iconBg={a.amber.bg}
            label="الوزن"
            value={getDisplayValue("weight")}
            unit="kg"
            status={getStatus("weight")}
            trend={getTrend("weight", 7)}
            onPress={() => router.push("/vitals")}
          />
        </ScrollView>
      </View>

      {/* Smart Insight */}
      <View style={styles.section}>
        <SectionHeader title="نصيحة اليوم" />
        <InsightCard
          title={todayAdvice.title}
          body={todayAdvice.body}
          icon={todayAdvice.icon}
        />
      </View>

      {/* Quick Services */}
      <View style={styles.section}>
        <SectionHeader title="خدمات سريعة" />
        <View style={styles.quickServicesRow}>
          <QuickActionCard
            label="تواصل مع طبيب"
            iconNode={<MaterialCommunityIcons name="phone-in-talk" size={22} color={a.green.color} />}
            iconColor={a.green.color}
            iconBg={a.green.bg}
            onPress={() => router.push("/(tabs)/chats")}
          />
          <QuickActionCard
            label="إعادة وصفة"
            iconNode={<MaterialCommunityIcons name="prescription" size={22} color={a.teal.color} />}
            iconColor={a.teal.color}
            iconBg={a.teal.bg}
            onPress={() => {}}
          />
          <QuickActionCard
            label="زيارة منزلية"
            iconNode={<MaterialCommunityIcons name="home-heart" size={22} color={a.blue.color} />}
            iconColor={a.blue.color}
            iconBg={a.blue.bg}
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
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
  },
  badge: {
    position: "absolute",
    top: 10,
    insetInlineEnd: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  greeting: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
  },
  greetingSub: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_500Medium",
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
    fontFamily: "IBMPlexSansArabic_700Bold",
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
    minHeight: 200,
    position: "relative",
  },
  heroArt: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  heroContent: {
    flex: 1,
    maxWidth: "62%",
    zIndex: 2,
    alignItems: "flex-start",
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontFamily: "IBMPlexSansArabic_700Bold",
    marginBottom: 8,
    textAlign: "right",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_500Medium",
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
    fontFamily: "IBMPlexSansArabic_700Bold",
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
    fontFamily: "IBMPlexSansArabic_500Medium",
  },
});
