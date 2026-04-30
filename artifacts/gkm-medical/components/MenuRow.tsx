import React from "react";
import { Text, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { RTLChevron } from "./RTLChevron";
import { PressableScale } from "./PressableScale";

interface MenuRowProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

export function MenuRow({ icon, label, onPress, destructive }: MenuRowProps) {
  const colors = useColors();
  const textColor = destructive ? colors.destructive : colors.foreground;
  const iconColor = destructive ? colors.destructive : colors.primary;

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      style={[styles.container, { borderBottomColor: colors.border }]}
    >
      <View style={styles.left}>
        <View style={[styles.iconContainer, { backgroundColor: destructive ? `${colors.destructive}15` : colors.primarySoft }]}>
          <Feather name={icon} size={20} color={iconColor} />
        </View>
        <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>{label}</Text>
      </View>
      <RTLChevron color={colors.mutedForeground} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: 'right',
    flex: 1,
  },
});
