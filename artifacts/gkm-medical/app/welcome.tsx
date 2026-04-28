import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { Image } from "expo-image";

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <LinearGradient
      colors={[colors.gradientFrom, colors.gradientTo]}
      style={styles.container}
    >
      <View style={styles.illustrationWrap}>
        <View style={[styles.illustrationCard, { backgroundColor: colors.background }]}>
          <Image
            source={require("../assets/images/onboarding-doctor.png")}
            style={styles.illustration}
            contentFit="contain"
          />
        </View>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.brand}>GKM&apos;s Unit</Text>
        <Text style={styles.brandSub}>وحدة GKM للرعاية الطبية</Text>
        <Text style={styles.tagline}>
          رعاية صحية سهلة وآمنة بين يديك
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
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  illustrationCard: {
    width: "100%",
    maxWidth: 320,
    aspectRatio: 1,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  illustration: { width: "100%", height: "100%" },
  bottom: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    paddingTop: 24,
  },
  brand: {
    color: "#ffffff",
    fontSize: 32,
    fontFamily: "Tajawal_700Bold",
    textAlign: "center",
  },
  brandSub: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Tajawal_500Medium",
    textAlign: "center",
    opacity: 0.9,
    marginTop: 4,
  },
  tagline: {
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "Tajawal_400Regular",
    textAlign: "center",
    opacity: 0.85,
    marginTop: 12,
    marginBottom: 32,
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
    fontFamily: "Tajawal_700Bold",
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
    fontFamily: "Tajawal_500Medium",
  },
});
