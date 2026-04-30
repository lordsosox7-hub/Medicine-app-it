import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useMedicalFile } from "@/hooks/useGkmData";

export default function MedicationsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data: file, isLoading } = useMedicalFile();

  const editButton = (
    <TouchableOpacity
      onPress={() => router.push("/medical-file-edit")}
      hitSlop={8}
      style={{ paddingHorizontal: 8 }}
      accessibilityLabel="تعديل الأدوية"
    >
      <Feather name="edit-2" size={18} color={colors.foreground} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerRight: () => editButton }} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const medications = file?.current_medications ?? [];

  if (medications.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerRight: () => editButton }} />
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconBg, { backgroundColor: colors.primarySoft }]}>
            <MaterialCommunityIcons name="pill" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            لا توجد أدوية مسجّلة
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            أضف أدويتك الحالية لمتابعتها بسهولة ومشاركتها مع طبيبك عند الحاجة.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/medical-file-edit")}
            activeOpacity={0.85}
            style={[styles.emptyCta, { backgroundColor: colors.primary }]}
          >
            <Feather name="plus" size={18} color={colors.primaryForeground} />
            <Text style={[styles.emptyCtaText, { color: colors.primaryForeground }]}>
              إضافة دواء
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerRight: () => editButton }} />
      <View style={[styles.summaryWrapper, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.summaryIcon, { backgroundColor: colors.primarySoft }]}>
          <MaterialCommunityIcons name="pill" size={24} color={colors.primary} />
        </View>
        <View style={styles.summaryTextBlock}>
          <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
            وصفاتك الطبية
          </Text>
          <Text style={[styles.summarySubtitle, { color: colors.mutedForeground }]}>
            {medications.length} دواء حالي
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {medications.map((med, idx) => (
          <View
            key={`${med}-${idx}`}
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderRadius: colors.radius,
                shadowColor: colors.foreground,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
              <MaterialCommunityIcons name="pill" size={20} color={colors.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.medName, { color: colors.foreground }]} numberOfLines={2}>
                {med}
              </Text>
              <Text style={[styles.medHint, { color: colors.mutedForeground }]}>
                دواء حالي
              </Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          onPress={() => router.push("/medical-file-edit")}
          activeOpacity={0.85}
          style={[styles.addBtn, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}
        >
          <Feather name="plus" size={16} color={colors.primary} />
          <Text style={[styles.addBtnText, { color: colors.primary }]}>إضافة / تعديل الأدوية</Text>
        </TouchableOpacity>
      </ScrollView>
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
    padding: 24,
  },
  emptyState: {
    alignItems: "center",
    maxWidth: 320,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  emptyCtaText: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  summaryWrapper: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTextBlock: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
  },
  summarySubtitle: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_400Regular",
    textAlign: "right",
    marginTop: 2,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    flex: 1,
  },
  medName: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
    marginBottom: 2,
  },
  medHint: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_400Regular",
    textAlign: "right",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  addBtnText: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
});
