import React from "react";
import { StyleSheet, Text, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { PressableScale } from "./PressableScale";

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function GradientButton({ title, onPress, style }: GradientButtonProps) {
  const colors = useColors();

  return (
    <PressableScale onPress={onPress} scaleTo={0.97} style={style}>
      <LinearGradient
        colors={[colors.gradientFrom, colors.gradientTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.container, { borderRadius: colors.radius }]}
      >
        <Text style={[styles.title, { color: "#ffffff" }]}>{title}</Text>
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 16,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
});
