import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useMedicalFile } from "@/hooks/useGkmData";
import { ExpandableSection } from "@/components/ExpandableSection";

export default function MedicalFileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { data: file, isLoading } = useMedicalFile();

  const editButton = (
    <TouchableOpacity
      onPress={() => router.push("/medical-file-edit")}
      hitSlop={8}
      style={{ paddingHorizontal: 8 }}
      accessibilityLabel="تعديل الملف الطبي"
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

  if (!file) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerRight: () => editButton }} />
        <View style={styles.emptyState}>
          <View style={[styles.emptyIconBg, { backgroundColor: colors.primarySoft }]}>
            <Feather name="file-text" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            لم يتم إنشاء ملفك الطبي بعد
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            ابدأ بإضافة معلوماتك الصحية حتى يتمكن الأطباء من تقديم رعاية أفضل لك.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/medical-file-edit")}
            activeOpacity={0.85}
            style={[styles.emptyCta, { backgroundColor: colors.primary }]}
          >
            <Feather name="plus" size={18} color={colors.primaryForeground} />
            <Text style={[styles.emptyCtaText, { color: colors.primaryForeground }]}>
              إنشاء الملف الطبي
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const personalInfo = [
    `الاسم: ${file.full_name_ar}`,
    `العمر: ${file.age} عام`,
    `الجنس: ${file.gender}`,
    `فصيلة الدم: ${file.blood_type}`,
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ headerRight: () => editButton }} />
      <View
        style={[
          styles.profileCard,
          {
            backgroundColor: colors.card,
            borderRadius: colors.radius,
            shadowColor: colors.foreground,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
          <Feather name="user" size={36} color={colors.primary} />
        </View>
        <Text style={[styles.name, { color: colors.foreground }]}>{file.full_name_ar}</Text>
        <Text style={[styles.subInfo, { color: colors.mutedForeground }]}>
          {file.age} عام • {file.gender} • فصيلة الدم {file.blood_type}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/medical-file-edit")}
          activeOpacity={0.85}
          style={[styles.editPill, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}
        >
          <Feather name="edit-2" size={14} color={colors.primary} />
          <Text style={[styles.editPillText, { color: colors.primary }]}>تعديل البيانات</Text>
        </TouchableOpacity>
      </View>

      <ExpandableSection title="المعلومات الشخصية" items={personalInfo} icon="user" defaultExpanded />
      <ExpandableSection title="الحساسية" items={file.allergies ?? []} icon="alert-circle" />
      <ExpandableSection title="الأمراض المزمنة" items={file.chronic_diseases ?? []} icon="activity" />
      <ExpandableSection title="الأدوية الحالية" items={file.current_medications ?? []} icon="thermometer" />
      <ExpandableSection title="العمليات السابقة" items={file.past_surgeries ?? []} icon="scissors" />
      <ExpandableSection title="التطعيمات" items={file.vaccinations ?? []} icon="shield" />
    </ScrollView>
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
  profileCard: {
    alignItems: "center",
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontFamily: "IBMPlexSansArabic_700Bold",
    marginBottom: 8,
    textAlign: "center",
    writingDirection: "rtl",
  },
  subInfo: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "center",
    writingDirection: "rtl",
    marginBottom: 14,
  },
  editPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  editPillText: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  emptyState: {
    alignItems: "center",
    gap: 14,
    maxWidth: 360,
  },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "center",
    writingDirection: "rtl",
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "center",
    writingDirection: "rtl",
    lineHeight: 20,
  },
  emptyCta: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  emptyCtaText: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
});
