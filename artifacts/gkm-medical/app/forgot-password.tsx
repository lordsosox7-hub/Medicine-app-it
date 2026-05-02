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
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { GradientButton } from "@/components/GradientButton";
import { supabase } from "@/lib/supabase";
import { RTLChevron } from "@/components/RTLChevron";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colors = useColors();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      Alert.alert("خطأ", "يرجى إدخال بريد إلكتروني صحيح");
      return;
    }
    setLoading(true);
    try {
      const redirectTo =
        Platform.OS === "web" && typeof window !== "undefined"
          ? window.location.origin
          : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        ...(redirectTo ? { redirectTo } : {}),
      });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      Alert.alert("خطأ", e?.message ?? "تعذّر إرسال رابط الاستعادة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.gradientFrom, colors.gradientTo]}
      style={styles.container}
    >
      <Pressable onPress={() => router.back()} style={styles.backChip}>
        <RTLChevron color="#ffffff" size={22} />
      </Pressable>

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
            {sent ? (
              <>
                <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
                  <Feather name="mail" size={32} color={colors.primary} />
                </View>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  تحقّق من بريدك
                </Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  أرسلنا رابط استعادة كلمة المرور إلى{"\n"}
                  <Text style={{ fontFamily: "IBMPlexSansArabic_700Bold" }}>{email}</Text>
                  {"\n"}اضغط على الرابط لتعيين كلمة مرور جديدة.
                </Text>
                <GradientButton
                  title="العودة لتسجيل الدخول"
                  onPress={() => router.replace("/sign-in")}
                />
              </>
            ) : (
              <>
                <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
                  <Feather name="lock" size={32} color={colors.primary} />
                </View>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  نسيت كلمة المرور؟
                </Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  أدخل بريدك الإلكتروني وسنرسل لك رابطاً لاستعادة حسابك
                </Text>

                <Text style={[styles.label, { color: colors.mutedForeground }]}>
                  البريد الإلكتروني
                </Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.primarySoft }]}>
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="example@email.com"
                    placeholderTextColor={colors.mutedForeground}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    textAlign="left"
                    editable={!loading}
                    onSubmitEditing={submit}
                  />
                </View>

                <GradientButton
                  title={loading ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}
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
  backChip: {
    position: "absolute",
    top: Platform.OS === "web" ? 16 : 50,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
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
    marginBottom: 16,
    alignSelf: "stretch",
  },
  input: {
    fontSize: 16,
    fontFamily: "IBMPlexSansArabic_500Medium",
    height: "100%",
    width: "100%",
    paddingVertical: 0,
  },
});
