import React from "react";
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function GradientButton({ title, onPress, style }: GradientButtonProps) {
  const colors = useColors();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={style}>
      <LinearGradient
        colors={[colors.gradientFrom, colors.gradientTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.container, { borderRadius: colors.radius }]}
      >
        <Text style={[styles.title, { color: "#ffffff" }]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
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
    fontFamily: "Tajawal_700Bold",
  },
});
