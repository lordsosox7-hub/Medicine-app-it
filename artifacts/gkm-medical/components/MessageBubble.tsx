import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Message } from "@/lib/supabase";
import { useColors } from "@/hooks/useColors";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const colors = useColors();
  const isUser = message.sender === "user";

  const dateObj = new Date(message.created_at);
  const timeStr = dateObj.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.container, { alignItems: isUser ? 'flex-end' : 'flex-start' }]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.primary : colors.muted,
            borderBottomRightRadius: isUser ? 4 : 16,
            borderBottomLeftRadius: !isUser ? 4 : 16,
          },
        ]}
      >
        <Text style={[styles.text, { color: isUser ? colors.primaryForeground : colors.foreground }]}>
          {message.text}
        </Text>
      </View>
      <Text style={[styles.time, { color: colors.mutedForeground, textAlign: isUser ? 'right' : 'left' }]}>
        {timeStr}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  text: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    lineHeight: 22,
    textAlign: 'left',
  },
  time: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    marginHorizontal: 4,
  },
});
