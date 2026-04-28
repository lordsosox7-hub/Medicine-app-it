import React, { useEffect } from "react";
import { View, StyleSheet, Text, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { isOnboarded, isAuthenticated } from "@/lib/userId";
import { LinearGradient } from "expo-linear-gradient";

export default function GateScreen() {
  const router = useRouter();
  const colors = useColors();

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const route = async () => {
      try {
        if (
          Platform.OS === "web" &&
          typeof window !== "undefined" &&
          window.location.hash === "#admin"
        ) {
          router.replace("/admin");
          return;
        }
        const [authed, onboarded] = await Promise.all([
          isAuthenticated(),
          isOnboarded(),
        ]);
        timeout = setTimeout(() => {
          if (!authed) {
            router.replace("/sign-in");
          } else if (onboarded) {
            router.replace("/(tabs)");
          } else {
            router.replace("/onboarding");
          }
        }, 500);
      } catch {
        router.replace("/sign-in");
      }
    };
    route();
    return () => clearTimeout(timeout);
  }, []);

  return (
    <LinearGradient
      colors={[colors.gradientFrom, colors.gradientTo]}
      style={styles.container}
    >
      <Text style={styles.title}>GKM&apos;s Unit</Text>
      <Text style={styles.subtitle}>Medical Care</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { color: "#ffffff", fontSize: 32, fontFamily: "Inter_700Bold" },
  subtitle: {
    color: "#ffffff",
    fontSize: 20,
    fontFamily: "Inter_500Medium",
    opacity: 0.8,
    marginTop: 8,
  },
});
