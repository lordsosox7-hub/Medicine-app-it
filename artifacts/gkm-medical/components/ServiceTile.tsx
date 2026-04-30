import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface ServiceTileProps {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
}

export function ServiceTile({ label, icon, onPress }: ServiceTileProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.container, { backgroundColor: colors.card, borderRadius: colors.radius, shadowColor: colors.foreground }]}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.primarySoft, borderRadius: 12 }]}>
        <Feather name={icon} size={24} color={colors.primary} />
      </View>
      <Text style={[styles.label, { color: colors.foreground }]} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    aspectRatio: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: 'center',
  },
});
