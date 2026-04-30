import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Message } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

interface MessageBubbleProps {
  message: Message;
  viewerRole?: "user" | "doctor";
}

export function MessageBubble({ message, viewerRole = "user" }: MessageBubbleProps) {
  const colors = useColors();
  const mine = message.sender === viewerRole;

  const dateObj = new Date(message.created_at);
  const timeStr = dateObj.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" });

  return (
    <View style={[styles.container, { alignItems: mine ? "flex-end" : "flex-start" }]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: mine ? colors.primary : colors.muted,
            borderBottomLeftRadius: mine ? 4 : 16,
            borderBottomRightRadius: mine ? 16 : 4,
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            { color: mine ? colors.primaryForeground : colors.foreground },
          ]}
        >
          {message.text}
        </Text>
      </View>
      <View style={styles.metaRow}>
        {mine && (
          <View style={styles.ticks}>
            <Feather
              name="check"
              size={12}
              color={message.read_at ? colors.primary : colors.mutedForeground}
            />
            <Feather
              name="check"
              size={12}
              color={message.read_at ? colors.primary : colors.mutedForeground}
              style={styles.secondTick}
            />
          </View>
        )}
        <Text style={[styles.time, { color: colors.mutedForeground }]}>{timeStr}</Text>
      </View>
    </View>
  );
}

export function TypingBubble() {
  const colors = useColors();
  return (
    <View style={[styles.container, { alignItems: "flex-start" }]}>
      <View
        style={[
          styles.bubble,
          styles.typingBubble,
          { backgroundColor: colors.muted, borderBottomLeftRadius: 4 },
        ]}
      >
        <View style={[styles.dot, { backgroundColor: colors.mutedForeground }]} />
        <View style={[styles.dot, { backgroundColor: colors.mutedForeground, opacity: 0.7 }]} />
        <View style={[styles.dot, { backgroundColor: colors.mutedForeground, opacity: 0.4 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  bubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
  },
  text: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_500Medium",
    lineHeight: 22,
    textAlign: "right",
  },
  metaRow: {
    alignItems: "center",
    marginTop: 4,
    marginHorizontal: 4,
    gap: 4,
  },
  time: {
    fontSize: 11,
    fontFamily: "IBMPlexSansArabic_400Regular",
  },
  ticks: {
    flexDirection: "row",
    alignItems: "center",
    width: 18,
    height: 12,
  },
  secondTick: {
    marginEnd: -7,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
