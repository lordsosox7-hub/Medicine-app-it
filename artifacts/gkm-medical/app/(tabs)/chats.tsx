import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useConversations } from "@/hooks/useGkmData";
import { BrandHeader } from "@/components/BrandHeader";
import { EmptyState } from "@/components/EmptyState";
import { GradientButton } from "@/components/GradientButton";
import { Image } from "expo-image";

export default function ChatsScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: conversations, isLoading } = useConversations();

  const isWeb = Platform.OS === "web";
  const headerTop = isWeb ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: headerTop }]}>
      <BrandHeader title="المحادثات" />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : conversations && conversations.length > 0 ? (
        <ScrollView 
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {conversations.map((conv) => {
            const doc = conv.doctor;
            if (!doc) return null;
            const timeStr = conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : '';
            return (
              <TouchableOpacity 
                key={conv.id} 
                style={[styles.row, { borderBottomColor: colors.border }]}
                onPress={() => router.push(`/chat/${conv.id}?doctorId=${doc.id}`)}
              >
                <View style={styles.imageContainer}>
                  {doc.photo_url ? (
                    <Image source={{ uri: doc.photo_url }} style={styles.image} contentFit="cover" />
                  ) : (
                    <View style={[styles.placeholder, { backgroundColor: colors.primarySoft }]}>
                      <Text style={[styles.placeholderText, { color: colors.primary }]}>{doc.name_ar.charAt(0)}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.info}>
                  <View style={styles.topRow}>
                    <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{doc.name_ar}</Text>
                    {timeStr ? <Text style={[styles.time, { color: colors.mutedForeground }]}>{timeStr}</Text> : null}
                  </View>
                  <Text style={[styles.message, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {conv.last_message || 'ابدأ المحادثة...'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <EmptyState 
          icon="message-circle" 
          title="لا توجد محادثات حالياً" 
          action={
            <GradientButton 
              title="ابدأ استشارة" 
              onPress={() => router.push("/(tabs)/my-doctor")} 
            />
          } 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  imageContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginLeft: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  info: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    flex: 1,
    textAlign: 'left',
  },
  time: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: 'left',
  }
});
