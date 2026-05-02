import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { GradientButton } from "@/components/GradientButton";
import { supabase } from "@/lib/supabase";
import { isOnboarded, markOnboarded } from "@/lib/userId";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const colors = useColors();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!password || password.length < 6) {
      Alert.alert("خطأ", "كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("خطأ", "كلمتا المرور غير متطابقتين");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
    } catch (e: any) {
      Alert.alert("خطأ", e?.message ?? "تعذّر تغيير كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  const goToApp = async () => {
    const onboarded = await isOnboarded();
    router.replace(onboarded ? "/(tabs)" : "/onboarding");
  };

  return (
    <LinearGradient
      colors={[colors.gradientFrom, colors.gradientTo]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.inner}>
          <View style={styles.header}>
            <Text style={styles.brand}>راحة</Text>
            <Text style={styles.brandSub}>Medical Care</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.background }]}>
            {done ? (
              <>
                <View style={[styles.iconCircle, { backgroundColor: "#d1fae5" }]}>
                  <Feather name="check-circle" size={32} color="#10b981" />
                </View>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  تم تغيير كلمة المرور
                </Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  يمكنك الآن تسجيل الدخول بكلمة مرورك الجديدة
                </Text>
                <GradientButton title="الدخول إلى التطبيق" onPress={goToApp} />
              </>
            ) : (
              <>
                <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
                  <Feather name="key" size={32} color={colors.primary} />
                </View>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  كلمة مرور جديدة
                </Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  اختر كلمة مرور قوية لا تقل عن 6 أحرف
                </Text>

                <Text style={[styles.label, { color: colors.mutedForeground }]}>
                  كلمة المرور الجديدة
                </Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.primarySoft }]}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, { color: colors.foreground }]}
                    placeholder="6 أحرف على الأقل"
                    placeholderTextColor={colors.mutedForeground}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    secureTextEntry={!showPassword}
                    textAlign="left"
                    editable={!loading}
                  />
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={10}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.mutedForeground}
                    />
                  </Pressable>
                </View>

                <Text style={[styles.label, { color: colors.mutedForeground }]}>
                  تأكيد كلمة المرور
                </Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.primarySoft }]}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, { color: colors.foreground }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.mutedForeground}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCapitalize="none"
                    secureTextEntry={!showConfirm}
                    textAlign="left"
                    editable={!loading}
                    onSubmitEditing={submit}
                  />
                  <Pressable
                    onPress={() => setShowConfirm((v) => !v)}
                    hitSlop={10}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showConfirm ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.mutedForeground}
                    />
                  </Pressable>
                </View>

                <GradientButton
                  title={loading ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
                  onPress={submit}
                />

                {loading && (
                  <ActivityIndicator
                    color={colors.primary}
                    style={{ marginTop: 12 }}
                  />
                )}
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  brand: {
    color: "#ffffff",
    fontSize: 26,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  brandSub: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_500Medium",
    opacity: 0.85,
    marginTop: 2,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    alignItems: "center",
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_400Regular",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
    width: "100%",
  },
  label: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_500Medium",
    marginBottom: 6,
    textAlign: "right",
    alignSelf: "stretch",
  },
  inputWrap: {
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    justifyContent: "center",
    marginBottom: 12,
    alignSelf: "stretch",
    position: "relative",
  },
  input: {
    fontSize: 16,
    fontFamily: "IBMPlexSansArabic_500Medium",
    height: "100%",
    width: "100%",
    paddingVertical: 0,
  },
  passwordInput: {
    paddingLeft: 40,
  },
  eyeBtn: {
    position: "absolute",
    left: 8,
    top: 0,
    bottom: 0,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
