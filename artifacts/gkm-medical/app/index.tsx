import React, { useEffect } from "react";
import { View, StyleSheet, Text, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { isOnboarded } from "@/lib/userId";
import { supabase } from "@/lib/supabase";
import { LinearGradient } from "expo-linear-gradient";

export default function GateScreen() {
  const router = useRouter();
  const colors = useColors();

  useEffect(() => {
    let fallbackTimer: ReturnType<typeof setTimeout>;
    let routed = false;

    const navigate = async (authed: boolean) => {
      if (routed) return;
      routed = true;
      clearTimeout(fallbackTimer);

      if (
        Platform.OS === "web" &&
        typeof window !== "undefined" &&
        window.location.hash === "#admin"
      ) {
        router.replace("/admin");
        return;
      }

      if (!authed) {
        router.replace("/welcome");
        return;
      }
      const onboarded = await isOnboarded();
      router.replace(onboarded ? "/(tabs)" : "/onboarding");
    };

    // Listen for auth state — this catches email-confirmation redirects
    // where the token arrives in the URL hash after the page loads.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") {
        if (session) {
          navigate(true);
        } else {
          // No session yet — wait briefly for a SIGNED_IN from hash processing,
          // then fall back to the welcome screen.
          fallbackTimer = setTimeout(() => navigate(false), 800);
        }
      } else if (event === "SIGNED_IN" && session) {
        navigate(true);
      }
    });

    return () => {
      clearTimeout(fallbackTimer);
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <LinearGradient
      colors={[colors.gradientFrom, colors.gradientTo]}
      style={styles.container}
    >
      <Text style={styles.title}>راحة</Text>
      <Text style={styles.subtitle}>Medical Care</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { color: "#ffffff", fontSize: 32, fontFamily: "IBMPlexSansArabic_700Bold" },
  subtitle: {
    color: "#ffffff",
    fontSize: 20,
    fontFamily: "IBMPlexSansArabic_500Medium",
    opacity: 0.8,
    marginTop: 8,
  },
});
