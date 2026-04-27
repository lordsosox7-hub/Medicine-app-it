import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { isOnboarded } from "@/lib/userId";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "react-native";

export default function GateScreen() {
  const router = useRouter();
  const colors = useColors();

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const checkOnboarding = async () => {
      try {
        const onboarded = await isOnboarded();
        timeout = setTimeout(() => {
          if (onboarded) {
            router.replace("/(tabs)");
          } else {
            router.replace("/onboarding");
          }
        }, 500); // Short delay to show splash
      } catch (e) {
        router.replace("/onboarding");
      }
    };
    checkOnboarding();
    
    return () => clearTimeout(timeout);
  }, []);

  return (
    <LinearGradient
      colors={[colors.gradientFrom, colors.gradientTo]}
      style={styles.container}
    >
      <Text style={styles.title}>GKM's Unit</Text>
      <Text style={styles.subtitle}>Medical Care</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: "Inter_500Medium",
    opacity: 0.8,
    marginTop: 8,
  }
});
