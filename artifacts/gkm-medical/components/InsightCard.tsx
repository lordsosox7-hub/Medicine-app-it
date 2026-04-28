import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";

interface InsightCardProps {
  title: string;
  body: string;
  icon?: keyof typeof Feather.glyphMap;
}

export function InsightCard({ title, body, icon = "droplet" }: InsightCardProps) {
  const colors = useColors();

  return (
    <LinearGradient
      colors={[colors.primarySoft, "#f7fbff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { borderRadius: 20, borderColor: colors.border, borderWidth: 1 }]}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
        <Feather name={icon} size={20} color={colors.primaryForeground} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.primary }]}>{title}</Text>
        <Text style={[styles.body, { color: colors.foreground }]}>{body}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontFamily: "Tajawal_700Bold",
    textAlign: "right",
    marginBottom: 4,
  },
  body: {
    fontSize: 13,
    fontFamily: "Tajawal_500Medium",
    textAlign: "right",
    lineHeight: 20,
  },
});
