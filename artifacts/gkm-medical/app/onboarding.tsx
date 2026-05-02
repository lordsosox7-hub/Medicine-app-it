import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { markOnboarded, setUserName } from "@/lib/userId";
import { GradientButton } from "@/components/GradientButton";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUpdateMedicalFile } from "@/hooks/useGkmData";
import { Feather } from "@expo/vector-icons";

const TOTAL_STEPS = 3;

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS: { label: string; value: string }[] = [
  { label: "ذكر", value: "ذكر" },
  { label: "أنثى", value: "أنثى" },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const updateMedicalFile = useUpdateMedicalFile();

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("ذكر");
  const [bloodType, setBloodType] = useState("O+");
  const [error, setError] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateToNext = (nextStep: number) => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setStep(nextStep);
  };

  const handleNext = async () => {
    setError(null);

    if (step === 1) {
      if (!fullName.trim()) {
        setError("الرجاء إدخال اسمك الكريم");
        return;
      }
      const ageNum = parseInt(age, 10);
      if (!age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        setError("الرجاء إدخال عمر صحيح");
        return;
      }
      animateToNext(2);
      return;
    }

    if (step === 2) {
      try {
        await updateMedicalFile.mutateAsync({
          full_name_ar: fullName.trim(),
          age: parseInt(age, 10),
          gender,
          blood_type: bloodType,
        });
        await setUserName(fullName.trim());
        await markOnboarded();
        router.replace("/(tabs)");
      } catch {
        setError("حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى");
      }
      return;
    }

    animateToNext(step + 1);
  };

  const handleBack = () => {
    if (step > 0) {
      setError(null);
      animateToNext(step - 1);
    }
  };

  const isLoading = updateMedicalFile.isPending;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {/* Back button */}
      {step > 0 && (
        <Pressable
          onPress={handleBack}
          style={[styles.backBtn, { top: insets.top + 16 }]}
          hitSlop={12}
        >
          <Feather name="arrow-right" size={22} color={colors.foreground} />
        </Pressable>
      )}

      {/* Step dots */}
      <View style={styles.dotsRow}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === step
                ? [styles.dotActive, { backgroundColor: colors.primary }]
                : { backgroundColor: colors.muted },
            ]}
          />
        ))}
      </View>

      <Animated.View
        style={[styles.body, { transform: [{ translateX: slideAnim }] }]}
      >
        {/* ── Step 0: Welcome ── */}
        {step === 0 && (
          <>
            <View style={styles.imageContainer}>
              <Image
                source={require("@/assets/images/onboarding-doctor.png")}
                style={styles.image}
                contentFit="contain"
              />
            </View>
            <View style={styles.textBlock}>
              <Text style={[styles.title, { color: colors.foreground }]}>
                خدمات طبية بسهولة وأمان
              </Text>
              <Text
                style={[styles.subtitle, { color: colors.mutedForeground }]}
              >
                احجز مواعيدك مع أفضل الأطباء، واحصل على رعاية صحية متكاملة
                أينما كنت
              </Text>
            </View>
          </>
        )}

        {/* ── Step 1: Personal info ── */}
        {step === 1 && (
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.stepHeader}>
              <View
                style={[
                  styles.stepIcon,
                  { backgroundColor: colors.primarySoft },
                ]}
              >
                <Feather name="user" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                أخبرنا عنك
              </Text>
              <Text
                style={[styles.stepSub, { color: colors.mutedForeground }]}
              >
                هذه المعلومات تساعدنا على تقديم رعاية أفضل لك
              </Text>
            </View>

            {/* Full name */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                الاسم الكامل
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="مثال: محمد عبدالله"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.input, { color: colors.foreground }]}
                  textAlign="right"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Age */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                العمر
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TextInput
                  value={age}
                  onChangeText={(v) => setAge(v.replace(/[^0-9]/g, ""))}
                  placeholder="مثال: 30"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="number-pad"
                  maxLength={3}
                  style={[styles.input, { color: colors.foreground }]}
                  textAlign="right"
                />
              </View>
            </View>

            {/* Gender */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                الجنس
              </Text>
              <View style={styles.chipRow}>
                {GENDERS.map((g) => {
                  const selected = gender === g.value;
                  return (
                    <Pressable
                      key={g.value}
                      onPress={() => setGender(g.value)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected
                            ? colors.primary
                            : colors.input,
                          borderColor: selected
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: selected
                              ? colors.primaryForeground
                              : colors.foreground,
                          },
                        ]}
                      >
                        {g.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {error && (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: colors.accents.red.bg,
                    borderColor: colors.danger,
                  },
                ]}
              >
                <Feather name="alert-circle" size={14} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {error}
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* ── Step 2: Blood type ── */}
        {step === 2 && (
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.stepHeader}>
              <View
                style={[
                  styles.stepIcon,
                  { backgroundColor: colors.accents.red.bg },
                ]}
              >
                <Feather name="activity" size={28} color={colors.danger} />
              </View>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>
                فصيلة الدم
              </Text>
              <Text
                style={[styles.stepSub, { color: colors.mutedForeground }]}
              >
                تُستخدم في حالات الطوارئ وعند التنسيق مع الأطباء
              </Text>
            </View>

            <View style={styles.bloodGrid}>
              {BLOOD_TYPES.map((bt) => {
                const selected = bloodType === bt;
                return (
                  <Pressable
                    key={bt}
                    onPress={() => setBloodType(bt)}
                    style={[
                      styles.bloodChip,
                      {
                        backgroundColor: selected
                          ? colors.danger
                          : colors.input,
                        borderColor: selected ? colors.danger : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.bloodChipText,
                        {
                          color: selected ? "#fff" : colors.foreground,
                        },
                      ]}
                    >
                      {bt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: colors.primarySoft,
                  borderColor: colors.border,
                },
              ]}
            >
              <Feather name="check-circle" size={18} color={colors.primary} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text
                  style={[styles.summaryTitle, { color: colors.foreground }]}
                >
                  ملخص معلوماتك
                </Text>
                <Text
                  style={[
                    styles.summaryLine,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {fullName} · {age} سنة · {gender}
                </Text>
              </View>
            </View>

            {error && (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: colors.accents.red.bg,
                    borderColor: colors.danger,
                  },
                ]}
              >
                <Feather name="alert-circle" size={14} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {error}
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </Animated.View>

      {/* Bottom button */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 20) + 8 },
        ]}
      >
        {isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              جاري الحفظ...
            </Text>
          </View>
        ) : (
          <GradientButton
            title={step === TOTAL_STEPS - 1 ? "ابدأ الآن" : "التالي"}
            onPress={handleNext}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    padding: 4,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 8,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
    borderRadius: 4,
  },
  body: {
    flex: 1,
  },
  imageContainer: {
    flex: 1.4,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  image: {
    width: "100%",
    height: "100%",
    maxWidth: 400,
  },
  textBlock: {
    paddingHorizontal: 28,
    paddingBottom: 12,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "center",
    lineHeight: 24,
  },
  formScroll: { flex: 1 },
  formContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 20,
  },
  stepHeader: { alignItems: "center", gap: 10, marginBottom: 8 },
  stepIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 22,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "center",
  },
  stepSub: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "center",
    lineHeight: 22,
  },
  field: { gap: 8 },
  label: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
  },
  inputWrap: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
    justifyContent: "center",
  },
  input: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_500Medium",
    flex: 1,
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}),
  },
  chipRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  chip: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  bloodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  bloodChip: {
    width: "22%",
    aspectRatio: 1.3,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  bloodChipText: {
    fontSize: 16,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 4,
  },
  summaryTitle: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
  },
  summaryLine: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12.5,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_500Medium",
  },
});
