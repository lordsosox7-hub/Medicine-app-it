import React from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { PressableScale } from "./PressableScale";

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
    <PressableScale onPress={onPress} scaleTo={0.9} style={[styles.container, style]}>
      <Feather name={icon} size={size} color={color || colors.foreground} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
