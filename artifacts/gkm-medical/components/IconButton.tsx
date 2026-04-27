import React from "react";
import { TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface IconButtonProps {
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export function IconButton({ icon, onPress, size = 24, color, style }: IconButtonProps) {
  const colors = useColors();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.container, style]}>
      <Feather name={icon} size={size} color={color || colors.foreground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
