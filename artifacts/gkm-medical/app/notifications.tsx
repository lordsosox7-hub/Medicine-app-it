import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useNotifications, type NotificationItem } from "@/hooks/useNotifications";

function formatRelative(ts: string): string {
  const t = new Date(ts).getTime();
  if (!t || t <= 0) return "";
  const diffMs = Date.now() - t;
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "الآن";
  if (min < 60) return `قبل ${min} دقيقة`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `قبل ${hr} ساعة`;
  const day = Math.round(hr / 24);
  if (day < 7) return `قبل ${day} يوم`;
  try {
    return new Date(ts).toLocaleDateString("ar", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

export default function NotificationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const {
    items,
    unreadCount,
    markRead,
    markAllRead,
    clearAll,
    refresh,
  } = useNotifications();

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handlePress = async (item: NotificationItem) => {
    if (!item.read) await markRead([item.id]);
    if (item.kind === "appointment") {
      router.push("/(tabs)/appointments");
    } else if (item.kind === "message") {
      if (item.conversationId) {
        const did = item.doctorId ? `?doctorId=${item.doctorId}` : "";
        router.push(`/chat/${item.conversationId}${did}` as any);
      } else {
        router.push("/(tabs)/chats");
      }
    } else if (item.kind === "payment") {
      router.push("/(tabs)/appointments");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/notification-settings")}
              hitSlop={8}
              style={{ paddingHorizontal: 16 }}
              accessibilityLabel="إعدادات الإشعارات"
            >
              <Feather name="settings" size={20} color={colors.foreground} />
            </TouchableOpacity>
          ),
        }}
      />

      {items.length > 0 && (
        <View style={styles.toolbar}>
          <Text style={[styles.toolbarCount, { color: colors.mutedForeground }]}>
            {unreadCount > 0 ? `${unreadCount} غير مقروء` : "تم قراءة الكل"}
          </Text>
          <View style={styles.toolbarActions}>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllRead} hitSlop={8} style={styles.toolbarBtn}>
                <Feather name="check" size={14} color={colors.primary} />
                <Text style={[styles.toolbarBtnText, { color: colors.primary }]}>
                  تعليم الكل كمقروء
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={clearAll} hitSlop={8} style={styles.toolbarBtn}>
              <Feather name="trash-2" size={14} color={colors.mutedForeground} />
              <Text style={[styles.toolbarBtnText, { color: colors.mutedForeground }]}>
                مسح الكل
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        {items.length === 0 ? (
          <View style={styles.empty}>
            <View
              style={[
                styles.emptyIconBg,
                { backgroundColor: colors.primarySoft },
              ]}
            >
              <Feather name="bell" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              لا توجد إشعارات
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              ستظهر هنا تذكيرات مواعيدك ورسائل الأطباء.
            </Text>
          </View>
        ) : (
          items.map((it) => (
            <TouchableOpacity
              key={it.id}
              activeOpacity={0.85}
              onPress={() => handlePress(it)}
              style={[
                styles.row,
                {
                  backgroundColor: it.read ? colors.card : colors.primarySoft,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: it.iconBg }]}>
                <Feather name={it.icon} size={18} color={it.iconColor} />
              </View>
              <View style={styles.content}>
                <View style={styles.headerRow}>
                  <Text
                    style={[styles.title, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {it.title}
                  </Text>
                  <Text style={[styles.time, { color: colors.mutedForeground }]}>
                    {formatRelative(it.timestamp)}
                  </Text>
                </View>
                <Text
                  style={[styles.body, { color: colors.mutedForeground }]}
                  numberOfLines={2}
                >
                  {it.body}
                </Text>
              </View>
              {!it.read && (
                <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  toolbarCount: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
    writingDirection: "rtl",
  },
  toolbarActions: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 14,
  },
  toolbarBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  toolbarBtnText: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_700Bold",
    writingDirection: "rtl",
  },
  list: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 60,
    gap: 10,
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
    writingDirection: "rtl",
  },
  time: {
    fontSize: 11,
    fontFamily: "IBMPlexSansArabic_500Medium",
    writingDirection: "rtl",
  },
  body: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
