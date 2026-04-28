import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { RTLChevron } from "./RTLChevron";

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
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.container, { borderBottomColor: colors.border }]}
    >
      <View style={styles.left}>
        <View style={[styles.iconContainer, { backgroundColor: destructive ? `${colors.destructive}15` : colors.primarySoft }]}>
          <Feather name={icon} size={20} color={iconColor} />
        </View>
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </View>
      <RTLChevron color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  label: {
    fontSize: 16,
    fontFamily: "Tajawal_700Bold",
  },
});
