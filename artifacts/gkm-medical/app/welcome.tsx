import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

const FEATURES = [
  { icon: "medkit",          label: "طبيبك بضغطة",  size: 28, accent: "#3b82f6" },
  { icon: "calendar-clear",  label: "حجز المواعيد",  size: 28, accent: "#8b5cf6" },
  { icon: "pulse",           label: "متابعة صحتك",   size: 28, accent: "#ec4899" },
  { icon: "chatbubbles",     label: "استشارة فورية",  size: 28, accent: "#f59e0b" },
  { icon: "document-text",   label: "ملفك الطبي",    size: 28, accent: "#10b981" },
  { icon: "shield-checkmark",label: "آمن وموثوق",    size: 28, accent: "#06b6d4" },
] as const;

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <LinearGradient
      colors={[colors.gradientFrom, colors.gradientTo]}
      style={styles.container}
    >
      {/* Illustration area */}
      <View style={styles.illustrationWrap}>
        {/* Centre brand icon */}
        <View style={[styles.centerRing, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
          <View style={[styles.centerInner, { backgroundColor: "rgba(255,255,255,0.28)" }]}>
            <Ionicons name="heart-circle" size={64} color="#fff" />
          </View>
        </View>

        {/* Feature cards in a 3×2 grid */}
        <View style={styles.grid}>
          {FEATURES.map((f) => (
            <View
              key={f.label}
              style={[styles.featureCard, { backgroundColor: "rgba(255,255,255,0.14)" }]}
            >
              <View style={[styles.iconCircle, { backgroundColor: f.accent + "33" }]}>
                <Ionicons name={f.icon} size={f.size} color="#fff" />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom text + buttons */}
      <View style={styles.bottom}>
        <Text style={styles.brand}>راحة</Text>
        <Text style={styles.brandSub}>رعاية طبية بين يديك</Text>
        <Text style={styles.tagline}>
          احجز مواعيدك، تابع صحتك، وتواصل مع طبيبك بكل سهولة وأمان
        </Text>

        <Pressable
          style={[styles.primaryBtn, { backgroundColor: colors.background }]}
          onPress={() => router.push("/register")}
        >
          <Text style={[styles.primaryBtnText, { color: colors.primary }]}>
            إنشاء حساب جديد
          </Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryBtn, { borderColor: "rgba(255,255,255,0.6)" }]}
          onPress={() => router.push("/sign-in")}
        >
          <Text style={styles.secondaryBtnText}>تسجيل الدخول</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  illustrationWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingTop: 56,
    gap: 24,
  },

  /* Pulsing centre icon */
  centerRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  centerInner: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
  },

  /* 3-column grid */
  grid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    width: "100%",
  },
  featureCard: {
    width: "30%",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "center",
    opacity: 0.95,
  },

  /* Bottom */
  bottom: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    paddingTop: 20,
  },
  brand: {
    color: "#ffffff",
    fontSize: 34,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "center",
  },
  brandSub: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "center",
    opacity: 0.9,
    marginTop: 4,
  },
  tagline: {
    color: "#ffffff",
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_400Regular",
    textAlign: "center",
    opacity: 0.82,
    marginTop: 10,
    marginBottom: 28,
    lineHeight: 22,
  },
  primaryBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  secondaryBtn: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "IBMPlexSansArabic_500Medium",
  },
});
