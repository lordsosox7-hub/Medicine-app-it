import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Platform, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDoctor, useMessages, useSendMessage, useOrCreateConversation, useRealtimeMessages } from "@/hooks/useGkmData";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { FlatList } from "react-native";
import { MessageBubble } from "@/components/MessageBubble";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { RTLChevron } from "@/components/RTLChevron";
import * as Haptics from "expo-haptics";

export default function ChatScreen() {
  const { id: conversationId, doctorId } = useLocalSearchParams<{ id: string, doctorId: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  const { data: doctor } = useDoctor(doctorId);
  const { data: messages } = useMessages(conversationId);
  const sendMessage = useSendMessage();
  useRealtimeMessages(conversationId);

  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage.mutate({
      conversation_id: conversationId,
      doctor_id: doctorId,
      text: text.trim()
    });
    setText("");
  };

  const headerTop = Platform.OS === "web" ? 67 : insets.top;

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
          <Text style={[styles.headerName, { color: colors.foreground }]}>{doctor?.name_ar}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={messages ? [...messages].reverse() : []}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
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
            onChangeText={setText}
            multiline
            maxLength={500}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 12,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  avatarInitial: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  headerName: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    textAlign: 'right',
    marginLeft: 12, // send button is on the left in RTL
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
