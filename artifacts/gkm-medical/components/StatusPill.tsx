import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface StatusPillProps {
  status: "upcoming" | "completed" | "cancelled" | "normal" | "high" | "low";
}

export function StatusPill({ status }: StatusPillProps) {
  const colors = useColors();

  let label = "";
  let bg = colors.muted;
  let text = colors.mutedForeground;

  switch (status) {
    case "upcoming":
      label = "قادم";
      bg = colors.primarySoft;
      text = colors.primary;
      break;
    case "completed":
      label = "مكتمل";
      bg = `${colors.success}20`;
      text = colors.success;
      break;
    case "cancelled":
      label = "ملغي";
      bg = colors.muted;
      text = colors.mutedForeground;
      break;
    case "normal":
      label = "طبيعي";
      bg = `${colors.success}20`;
      text = colors.success;
      break;
    case "high":
      label = "مرتفع";
      bg = `${colors.danger}20`;
      text = colors.danger;
      break;
    case "low":
      label = "منخفض";
      bg = `${colors.warning}20`;
      text = colors.warning;
      break;
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontFamily: "Tajawal_700Bold",
  },
});
