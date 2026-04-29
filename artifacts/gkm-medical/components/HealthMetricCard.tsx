import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface HealthMetricCardProps {
  icon?: keyof typeof Feather.glyphMap;
  iconNode?: React.ReactNode;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  unit?: string;
  status: "normal" | "warning" | "alert";
  onPress?: () => void;
}

export function HealthMetricCard({ icon, iconNode, iconColor, iconBg, label, value, unit, status, onPress }: HealthMetricCardProps) {
  const colors = useColors();

  const statusColor =
    status === "normal" ? colors.success : status === "warning" ? colors.warning : colors.danger;
  const statusLabel = status === "normal" ? "طبيعي" : status === "warning" ? "تنبيه" : "مرتفع";

  const Wrapper: any = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress, activeOpacity: 0.85 } : {};

  return (
    <Wrapper
      {...wrapperProps}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderRadius: 20,
          borderColor: colors.border,
          borderWidth: 1,
          shadowColor: colors.foreground,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          {iconNode ?? (icon ? <Feather name={icon} size={18} color={iconColor} /> : null)}
        </View>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      </View>
      <Text style={[styles.label, { color: colors.mutedForeground }]} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
        {unit && <Text style={[styles.unit, { color: colors.mutedForeground }]}> {unit}</Text>}
      </View>
      <Text style={[styles.status, { color: statusColor }]}>{statusLabel}</Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 150,
    padding: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: 12,
    fontFamily: "Tajawal_500Medium",
    textAlign: "right",
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "flex-start",
  },
  value: {
    fontSize: 20,
    fontFamily: "Tajawal_700Bold",
    textAlign: "right",
  },
  unit: {
    fontSize: 11,
    fontFamily: "Tajawal_500Medium",
  },
  status: {
    fontSize: 11,
    fontFamily: "Tajawal_700Bold",
    marginTop: 4,
    textAlign: "right",
  },
});
