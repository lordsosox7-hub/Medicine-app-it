import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface CategoryChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function CategoryChip({ label, selected, onPress }: CategoryChipProps) {
  const colors = useColors();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: selected ? colors.primary : colors.card,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? colors.primaryForeground : colors.foreground },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_500Medium",
  },
});
