import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { getTheme, setTheme, Theme } from "@/lib/preferences";

const OPTIONS: Array<{ value: Theme; label: string; description: string; icon: keyof typeof Feather.glyphMap }> = [
  { value: "light", label: "فاتح", description: "مظهر فاتح طوال الوقت", icon: "sun" },
  { value: "dark", label: "داكن", description: "مظهر داكن مريح للعين", icon: "moon" },
  { value: "system", label: "تلقائي", description: "يتبع إعدادات الجهاز", icon: "smartphone" },
];

export default function AppearanceScreen() {
  const colors = useColors();
  const [current, setCurrent] = useState<Theme>("system");

  useEffect(() => {
    getTheme().then(setCurrent);
  }, []);

  const onSelect = async (t: Theme) => {
    setCurrent(t);
    await setTheme(t);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
    >
      <Text style={[styles.intro, { color: colors.mutedForeground }]}>
        اختر مظهر التطبيق المفضل لك
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {OPTIONS.map((opt, idx) => {
          const selected = current === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              activeOpacity={0.7}
              onPress={() => onSelect(opt.value)}
              style={[
                styles.row,
                idx < OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
                <Feather name={opt.icon} size={18} color={colors.primary} />
              </View>
              <View style={styles.text}>
                <Text style={[styles.label, { color: colors.foreground }]}>{opt.label}</Text>
                <Text style={[styles.desc, { color: colors.mutedForeground }]}>{opt.description}</Text>
              </View>
              {selected ? (
                <View style={[styles.check, { backgroundColor: colors.primary }]}>
                  <Feather name="check" size={14} color={colors.primaryForeground} />
                </View>
              ) : (
                <View style={[styles.checkOutline, { borderColor: colors.border }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={[styles.note, { color: colors.mutedForeground }]}>
        ملاحظة: يتم تطبيق المظهر الداكن بشكل تلقائي حسب إعدادات نظامك حالياً.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  intro: {
    fontSize: 13,
    fontFamily: "Tajawal_500Medium",
    textAlign: "right",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
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
  text: { flex: 1 },
  label: {
    fontSize: 15,
    fontFamily: "Tajawal_700Bold",
    textAlign: "right",
    marginBottom: 2,
  },
  desc: {
    fontSize: 12,
    fontFamily: "Tajawal_500Medium",
    textAlign: "right",
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOutline: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  note: {
    fontSize: 12,
    fontFamily: "Tajawal_500Medium",
    textAlign: "right",
    marginTop: 16,
    lineHeight: 18,
  },
});
