import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { getLanguage, setLanguage, Language } from "@/lib/preferences";

const LANGUAGES: Array<{ code: Language; name: string; nativeName: string; available: boolean }> = [
  { code: "ar", name: "العربية", nativeName: "العربية", available: true },
  { code: "en", name: "الإنجليزية", nativeName: "English", available: false },
];

export default function LanguageScreen() {
  const colors = useColors();
  const [current, setCurrent] = useState<Language>("ar");

  useEffect(() => {
    getLanguage().then(setCurrent);
  }, []);

  const onSelect = async (lang: Language, available: boolean) => {
    if (!available) {
      const msg = "اللغة الإنجليزية ستتوفر قريباً";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("قريباً", msg);
      return;
    }
    setCurrent(lang);
    await setLanguage(lang);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
    >
      <Text style={[styles.intro, { color: colors.mutedForeground }]}>
        اختر لغة عرض التطبيق
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {LANGUAGES.map((lang, idx) => {
          const selected = current === lang.code && lang.available;
          return (
            <TouchableOpacity
              key={lang.code}
              activeOpacity={0.7}
              onPress={() => onSelect(lang.code, lang.available)}
              style={[
                styles.row,
                idx < LANGUAGES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={styles.text}>
                <Text style={[styles.name, { color: lang.available ? colors.foreground : colors.mutedForeground }]}>
                  {lang.name}
                </Text>
                <Text style={[styles.native, { color: colors.mutedForeground }]}>
                  {lang.nativeName} {!lang.available && "(قريباً)"}
                </Text>
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
    gap: 12,
  },
  text: { flex: 1 },
  name: {
    fontSize: 15,
    fontFamily: "Tajawal_700Bold",
    textAlign: "right",
  },
  native: {
    fontSize: 12,
    fontFamily: "Tajawal_500Medium",
    textAlign: "right",
    marginTop: 2,
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
});
