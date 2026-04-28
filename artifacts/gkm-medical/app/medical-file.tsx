import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useMedicalFile } from "@/hooks/useGkmData";
import { ExpandableSection } from "@/components/ExpandableSection";

export default function MedicalFileScreen() {
  const colors = useColors();
  const { data: file, isLoading } = useMedicalFile();

  if (isLoading || !file) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const personalInfo = [
    `الاسم: ${file.full_name_ar}`,
    `العمر: ${file.age} عام`,
    `الجنس: ${file.gender}`,
    `فصيلة الدم: ${file.blood_type}`
  ];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderRadius: colors.radius, shadowColor: colors.foreground }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{file.full_name_ar.charAt(0)}</Text>
        </View>
        <Text style={[styles.name, { color: colors.foreground }]}>{file.full_name_ar}</Text>
        <Text style={[styles.subInfo, { color: colors.mutedForeground }]}>
          {file.age} عام • {file.gender} • فصيلة الدم {file.blood_type}
        </Text>
      </View>

      <ExpandableSection title="المعلومات الشخصية" items={personalInfo} icon="user" defaultExpanded />
      <ExpandableSection title="الحساسية" items={file.allergies} icon="alert-circle" />
      <ExpandableSection title="الأمراض المزمنة" items={file.chronic_diseases} icon="activity" />
      <ExpandableSection title="الأدوية الحالية" items={file.current_medications} icon="thermometer" />
      <ExpandableSection title="العمليات السابقة" items={file.past_surgeries} icon="scissors" />
      <ExpandableSection title="التطعيمات" items={file.vaccinations} icon="shield" />
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
  },
  profileCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: "Tajawal_700Bold",
  },
  name: {
    fontSize: 20,
    fontFamily: "Tajawal_700Bold",
    marginBottom: 8,
  },
  subInfo: {
    fontSize: 14,
    fontFamily: "Tajawal_500Medium",
  }
});
