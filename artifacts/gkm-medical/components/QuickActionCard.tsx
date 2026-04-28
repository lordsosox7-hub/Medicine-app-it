import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface QuickActionCardProps {
  label: string;
  subtitle?: string;
  icon?: keyof typeof Feather.glyphMap;
  iconNode?: React.ReactNode;
  iconColor: string;
  iconBg: string;
  onPress: () => void;
}

export function QuickActionCard({ label, subtitle, icon, iconNode, iconColor, iconBg, onPress }: QuickActionCardProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderRadius: 20,
          shadowColor: colors.foreground,
          borderColor: colors.border,
          borderWidth: 1,
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        {iconNode ?? (icon ? <Feather name={icon} size={22} color={iconColor} /> : null)}
      </View>
      <Text style={[styles.label, { color: colors.foreground }]} numberOfLines={1}>
        {label}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    minHeight: 110,
  },
  iconContainer: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderRadius: 14,
  },
  label: {
    fontSize: 13,
    fontFamily: "Tajawal_700Bold",
    textAlign: "right",
    width: "100%",
  },
  subtitle: {
    fontSize: 11,
    fontFamily: "Tajawal_500Medium",
    textAlign: "right",
    width: "100%",
    marginTop: 2,
  },
});
