import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Platform, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useDoctor,
  useMessages,
  useSendMessage,
  useRealtimeMessages,
  useTypingIndicator,
  useMarkMessagesRead,
} from "@/hooks/useGkmData";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { FlatList } from "react-native";
import { MessageBubble, TypingBubble } from "@/components/MessageBubble";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { RTLChevron } from "@/components/RTLChevron";
import * as Haptics from "expo-haptics";

export default function ChatScreen() {
  const { id: conversationId, doctorId } = useLocalSearchParams<{ id: string; doctorId: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data: doctor } = useDoctor(doctorId);
  const { data: messages } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  useRealtimeMessages(conversationId);
  useMarkMessagesRead(conversationId, "user", messages);
  const { otherTyping, notifyTyping } = useTypingIndicator(conversationId, "user");

  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage.mutate({
      conversation_id: conversationId,
      doctor_id: doctorId,
      text: text.trim(),
    });
    setText("");
  };

  const onChangeText = (v: string) => {
    setText(v);
    if (v.length > 0) notifyTyping();
  };

  const headerTop = Platform.OS === "web" ? 67 : insets.top;

  const listData: Array<{ kind: "typing" } | { kind: "msg"; id: string; msg: any }> = [];
  if (otherTyping) listData.push({ kind: "typing" });
  (messages ?? []).forEach((m) => listData.push({ kind: "msg", id: m.id, msg: m }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: headerTop + 10, paddingBottom: 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <RTLChevron color={colors.foreground} size={24} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          {doctor?.photo_url ? (
            <Image source={{ uri: doctor.photo_url }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primarySoft }]}>
              <Text style={[styles.avatarInitial, { color: colors.primary }]}>{doctor?.name_ar?.charAt(0) || "د"}</Text>
            </View>
          )}
          <View style={styles.headerTextWrap}>
            <Text style={[styles.headerName, { color: colors.foreground }]} numberOfLines={1}>
              {doctor?.name_ar || ""}
            </Text>
            {otherTyping && (
              <Text style={[styles.headerStatus, { color: colors.primary }]}>يكتب الآن...</Text>
            )}
          </View>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
        <FlatList
          data={[...listData].reverse()}
          keyExtractor={(item) => (item.kind === "typing" ? "__typing" : item.id)}
          renderItem={({ item }) =>
            item.kind === "typing" ? <TypingBubble /> : <MessageBubble message={item.msg} viewerRole="user" />
          }
          inverted
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        />

        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom || 16 }]}>
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: text.trim() ? colors.primary : colors.muted }]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Feather name="send" size={18} color={text.trim() ? colors.primaryForeground : colors.mutedForeground} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { backgroundColor: colors.input, color: colors.foreground, borderRadius: colors.radius }]}
            placeholder="اكتب رسالتك..."
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={onChangeText}
            multiline
            maxLength={500}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  backBtn: { padding: 8, marginStart: -8 },
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginStart: 8,
  },
  avatar: { width: 36, height: 36, borderRadius: 18, marginEnd: 12 },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginEnd: 12,
  },
  avatarInitial: { fontSize: 16, fontFamily: "Tajawal_700Bold" },
  headerTextWrap: { flex: 1 },
  headerName: { fontSize: 16, fontFamily: "Tajawal_700Bold", textAlign: "right" },
  headerStatus: { fontSize: 11, fontFamily: "Tajawal_500Medium", marginTop: 1, textAlign: "right" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontFamily: "Tajawal_500Medium",
    fontSize: 15,
    textAlign: "right",
    writingDirection: "rtl",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
