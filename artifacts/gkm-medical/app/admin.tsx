import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Stack } from "expo-router";
import { useColors } from "@/hooks/useColors";
import {
  useDoctors,
  useDoctorConversations,
  useMessages,
  useRealtimeMessages,
  useSendMessageAsDoctor,
  useTypingIndicator,
  useMarkMessagesRead,
} from "@/hooks/useGkmData";
import { MessageBubble, TypingBubble } from "@/components/MessageBubble";
import { Feather } from "@expo/vector-icons";

export default function AdminScreen() {
  const colors = useColors();
  const { data: doctors, isLoading: doctorsLoading } = useDoctors();
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedConvId, setSelectedConvId] = useState<string>("");
  const [text, setText] = useState("");

  const { data: conversations, isLoading: convsLoading } = useDoctorConversations(
    selectedDoctorId || undefined,
  );
  const { data: messages } = useMessages(selectedConvId || undefined);
  useRealtimeMessages(selectedConvId || undefined);
  useMarkMessagesRead(selectedConvId || undefined, "doctor", messages);
  const { otherTyping, notifyTyping } = useTypingIndicator(
    selectedConvId || undefined,
    "doctor",
  );
  const sendAsDoctor = useSendMessageAsDoctor();

  const selectedConv = useMemo(
    () => conversations?.find((c) => c.id === selectedConvId),
    [conversations, selectedConvId],
  );

  const send = () => {
    const t = text.trim();
    if (!t || !selectedConv) return;
    sendAsDoctor.mutate({
      conversation_id: selectedConv.id,
      doctor_id: selectedConv.doctor_id,
      user_id: selectedConv.user_id,
      text: t,
    });
    setText("");
  };

  return (
    <>
      <Stack.Screen options={{ title: "Doctor Console", headerShown: true }} />
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.toolbar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.toolbarLabel, { color: colors.muted }]}>Signed in as:</Text>
          {doctorsLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {(doctors ?? []).map((d) => {
                const active = selectedDoctorId === d.id;
                return (
                  <Pressable
                    key={d.id}
                    onPress={() => {
                      setSelectedDoctorId(d.id);
                      setSelectedConvId("");
                    }}
                    style={[
                      styles.doctorChip,
                      {
                        backgroundColor: active ? colors.primary : colors.primarySoft,
                        borderColor: active ? colors.primary : "transparent",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: active ? colors.primaryForeground : colors.primary,
                        fontFamily: "Inter_600SemiBold",
                        fontSize: 13,
                      }}
                    >
                      {d.name_ar}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        {!selectedDoctorId ? (
          <View style={styles.empty}>
            <Feather name="user-check" size={42} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              Pick a doctor above to view that doctor&apos;s incoming patient messages.
            </Text>
          </View>
        ) : (
          <View style={styles.split}>
            <View style={[styles.sidebar, { borderRightColor: colors.border, borderLeftColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.sidebarHeader, { color: colors.foreground }]}>
                Conversations
              </Text>
              {convsLoading ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
              ) : (conversations?.length ?? 0) === 0 ? (
                <Text style={[styles.emptyText, { color: colors.muted, padding: 16 }]}>
                  No patient conversations yet.
                </Text>
              ) : (
                <FlatList
                  data={conversations}
                  keyExtractor={(c) => c.id}
                  renderItem={({ item }) => {
                    const active = item.id === selectedConvId;
                    return (
                      <Pressable
                        onPress={() => setSelectedConvId(item.id)}
                        style={[
                          styles.convRow,
                          { borderBottomColor: colors.border, backgroundColor: active ? colors.primarySoft : "transparent" },
                        ]}
                      >
                        <Text
                          style={[styles.convName, { color: colors.foreground }]}
                          numberOfLines={1}
                        >
                          Patient {item.user_id.slice(0, 8)}
                        </Text>
                        <Text
                          style={[styles.convPreview, { color: colors.muted }]}
                          numberOfLines={1}
                        >
                          {item.last_message ?? "(no messages yet)"}
                        </Text>
                      </Pressable>
                    );
                  }}
                />
              )}
            </View>

            <View style={styles.chatPane}>
              {!selectedConvId ? (
                <View style={styles.empty}>
                  <Feather name="message-square" size={42} color={colors.muted} />
                  <Text style={[styles.emptyText, { color: colors.muted }]}>
                    Pick a conversation on the side to start replying.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={[styles.chatHeader, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
                    <Text style={[styles.chatHeaderTitle, { color: colors.foreground }]}>
                      Patient {selectedConv?.user_id.slice(0, 8)}
                    </Text>
                    {otherTyping && (
                      <Text style={[styles.chatHeaderStatus, { color: colors.primary }]}>
                        Patient is typing...
                      </Text>
                    )}
                  </View>
                  {(() => {
                    const list: Array<{ kind: "typing" } | { kind: "msg"; id: string; msg: any }> = [];
                    if (otherTyping) list.push({ kind: "typing" });
                    (messages ?? []).forEach((m) => list.push({ kind: "msg", id: m.id, msg: m }));
                    return (
                      <FlatList
                        data={[...list].reverse()}
                        keyExtractor={(item) => (item.kind === "typing" ? "__typing" : item.id)}
                        inverted
                        contentContainerStyle={{ paddingVertical: 12 }}
                        renderItem={({ item }) =>
                          item.kind === "typing" ? (
                            <TypingBubble />
                          ) : (
                            <MessageBubble message={item.msg} viewerRole="doctor" />
                          )
                        }
                      />
                    );
                  })()}
                  <View
                    style={[
                      styles.inputBar,
                      { borderTopColor: colors.border, backgroundColor: colors.card },
                    ]}
                  >
                    <TextInput
                      value={text}
                      onChangeText={(v) => {
                        setText(v);
                        if (v.length > 0) notifyTyping();
                      }}
                      placeholder="Reply as the doctor..."
                      placeholderTextColor={colors.muted}
                      style={[
                        styles.input,
                        { backgroundColor: colors.input, color: colors.foreground },
                      ]}
                      onSubmitEditing={send}
                      multiline
                    />
                    <Pressable
                      onPress={send}
                      disabled={!text.trim()}
                      style={[
                        styles.sendBtn,
                        { backgroundColor: text.trim() ? colors.primary : colors.muted },
                      ]}
                    >
                      <Feather name="send" size={18} color={colors.primaryForeground} />
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </View>
        )}
      </View>
    </>
  );
}

const isWeb = Platform.OS === "web";

const styles = StyleSheet.create({
  root: { flex: 1 },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  toolbarLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  doctorChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  split: {
    flex: 1,
    flexDirection: isWeb ? "row" : "column",
  },
  sidebar: {
    width: isWeb ? 320 : "100%",
    maxHeight: isWeb ? "100%" : 240,
    borderRightWidth: isWeb ? 1 : 0,
    borderBottomWidth: isWeb ? 0 : 1,
  },
  sidebarHeader: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    padding: 16,
    paddingBottom: 8,
  },
  convRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  convName: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  convPreview: { fontSize: 12, fontFamily: "Inter_400Regular" },
  chatPane: { flex: 1 },
  chatHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  chatHeaderTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  chatHeaderStatus: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    maxWidth: 320,
  },
  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textAlign: "left",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
