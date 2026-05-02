import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Switch } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { getNotifications, setNotifications, NotificationPrefs } from "@/lib/preferences";

export default function NotificationSettingsScreen() {
  const colors = useColors();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);

  useEffect(() => {
    getNotifications().then(setPrefs);
  }, []);

  const update = async (key: keyof NotificationPrefs, value: boolean) => {
    if (!prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    await setNotifications(next);
  };

  if (!prefs) return <View style={[styles.container, { backgroundColor: colors.background }]} />;

  const items: Array<{
    key: keyof NotificationPrefs;
    icon: keyof typeof Feather.glyphMap;
    label: string;
    description: string;
    iconBg: string;
    iconColor: string;
  }> = [
    { key: "appointments", icon: "calendar", label: "تذكير المواعيد", description: "تنبيهات قبل موعدك بساعة", iconBg: "#e8f0ff", iconColor: "#1e6bf0" },
    { key: "messages", icon: "message-circle", label: "الرسائل", description: "رسائل جديدة من الأطباء", iconBg: "#e7f7ee", iconColor: "#16a34a" },
    { key: "payments", icon: "credit-card", label: "تأكيد الدفع", description: "إشعار فور قبول أو رفض تحويلك", iconBg: "#fef3d7", iconColor: "#f59e0b" },
    { key: "labResults", icon: "activity", label: "نتائج التحاليل", description: "تنبيه عند توفر نتائج جديدة", iconBg: "#f1ebff", iconColor: "#7c3aed" },
    { key: "promotions", icon: "tag", label: "العروض والتخفيضات", description: "تخفيضات على الخدمات الطبية", iconBg: "#fef3d7", iconColor: "#f59e0b" },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
    >
      <Text style={[styles.intro, { color: colors.mutedForeground }]}>
        تحكم في الإشعارات التي تصلك من التطبيق
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {items.map((item, idx) => (
          <View
            key={item.key}
            style={[
              styles.row,
              idx < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
            ]}
          >
            <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
              <Feather name={item.icon} size={18} color={item.iconColor} />
            </View>
            <View style={styles.text}>
              <Text style={[styles.label, { color: colors.foreground }]}>{item.label}</Text>
              <Text style={[styles.desc, { color: colors.mutedForeground }]}>{item.description}</Text>
            </View>
            <Switch
              value={prefs[item.key]}
              onValueChange={(v) => update(item.key, v)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  intro: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, minWidth: 0 },
  label: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: 2,
  },
  desc: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
    writingDirection: "rtl",
  },
});
