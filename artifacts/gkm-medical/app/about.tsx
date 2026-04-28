import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";

export default function AboutScreen() {
  const colors = useColors();

  const links = [
    { label: "الموقع الإلكتروني", icon: "globe" as const, url: "https://gkm-medical.app" },
    { label: "تابعنا على تويتر", icon: "twitter" as const, url: "https://twitter.com/gkm_medical" },
    { label: "تابعنا على إنستغرام", icon: "instagram" as const, url: "https://instagram.com/gkm_medical" },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 60, alignItems: "center" }}
    >
      <View style={[styles.logoBox, { backgroundColor: colors.primarySoft }]}>
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.logo}
          contentFit="contain"
        />
      </View>
      <Text style={[styles.appName, { color: colors.foreground }]}>GKM للرعاية الطبية</Text>
      <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
        رعاية صحية متكاملة بين يديك
      </Text>
      <Text style={[styles.version, { color: colors.mutedForeground }]}>الإصدار 1.0.0</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>عن التطبيق</Text>
        <Text style={[styles.cardBody, { color: colors.mutedForeground }]}>
          GKM للرعاية الطبية هو تطبيق متكامل يربطك بأفضل الأطباء والمستشفيات في المملكة. يمكنك حجز المواعيد، التواصل مع الأطباء، متابعة نتائج التحاليل، وإدارة ملفك الطبي بكل سهولة وأمان.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 0 }]}>
        {links.map((l, i) => (
          <TouchableOpacity
            key={l.url}
            style={[
              styles.linkRow,
              i < links.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
            ]}
            activeOpacity={0.7}
            onPress={() => Linking.openURL(l.url).catch(() => {})}
          >
            <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
              <Feather name={l.icon} size={18} color={colors.primary} />
            </View>
            <Text style={[styles.linkLabel, { color: colors.foreground }]}>{l.label}</Text>
            <Feather name="external-link" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.copyright, { color: colors.mutedForeground }]}>
        © 2026 GKM للرعاية الطبية{"\n"}جميع الحقوق محفوظة
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  logoBox: {
    width: 100, height: 100, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    marginTop: 12, marginBottom: 16,
  },
  logo: { width: 64, height: 64 },
  appName: { fontSize: 22, fontFamily: "Tajawal_700Bold", marginBottom: 4 },
  tagline: { fontSize: 14, fontFamily: "Tajawal_500Medium", marginBottom: 8 },
  version: { fontSize: 12, fontFamily: "Tajawal_500Medium", marginBottom: 24 },
  card: {
    width: "100%", padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontFamily: "Tajawal_700Bold", textAlign: "right", marginBottom: 8 },
  cardBody: { fontSize: 13, fontFamily: "Tajawal_500Medium", textAlign: "right", lineHeight: 22 },
  linkRow: {
    flexDirection: "row", alignItems: "center", padding: 16, gap: 12,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center",
  },
  linkLabel: { flex: 1, fontSize: 14, fontFamily: "Tajawal_700Bold", textAlign: "right" },
  copyright: {
    fontSize: 11, fontFamily: "Tajawal_500Medium", textAlign: "center", marginTop: 16, lineHeight: 18,
  },
});
