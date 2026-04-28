import React, { useEffect, useState } from "react";
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
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { GradientButton } from "@/components/GradientButton";
import { supabase } from "@/lib/supabase";
import { setUserName } from "@/lib/userId";
import { RTLChevron } from "@/components/RTLChevron";

export default function RegisterScreen() {
  const router = useRouter();
  const colors = useColors();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        router.replace("/onboarding");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  const submit = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedName) {
      Alert.alert("خطأ", "يرجى إدخال اسمك");
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      Alert.alert("خطأ", "يرجى إدخال بريد إلكتروني صحيح");
      return;
    }
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
      await setUserName(trimmedName);
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { full_name: trimmedName },
        },
      });
      if (error) throw error;
      if (data.session) {
        return;
      }
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (signInErr) {
        setConfirmSent(true);
      }
    } catch (e: any) {
      const lower = (e?.message ?? "").toLowerCase();
      let msg = e?.message ?? "حدث خطأ";
      if (lower.includes("already") || lower.includes("registered")) {
        msg = "هذا البريد مسجّل بالفعل. سجّل الدخول بدلاً من ذلك.";
      } else if (lower.includes("password")) {
        msg = "كلمة المرور ضعيفة جداً. اختر كلمة أقوى.";
      }
      Alert.alert("تعذّر إنشاء الحساب", msg);
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.brand}>GKM&apos;s Unit</Text>
            <Text style={styles.brandSub}>Medical Care</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.background }]}>
            {confirmSent ? (
              <>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  تحقّق من بريدك
                </Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>
                  أرسلنا رسالة تفعيل إلى{"\n"}
                  <Text style={{ fontFamily: "Tajawal_700Bold" }}>{email}</Text>
                  {"\n"}اضغط على رابط التفعيل ثم سجّل الدخول.
                </Text>
                <GradientButton
                  title="الذهاب لتسجيل الدخول"
                  onPress={() => router.replace("/sign-in")}
                />
              </>
            ) : (
              <>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  إنشاء حساب جديد
                </Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>
                  أنشئ حسابك للوصول إلى خدمات الرعاية الطبية
                </Text>

                <Text style={[styles.label, { color: colors.muted }]}>
                  الاسم الكامل
                </Text>
                <View
                  style={[
                    styles.inputWrap,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="مثال: أحمد محمد"
                    placeholderTextColor={colors.muted}
                    value={name}
                    onChangeText={setName}
                    textAlign="right"
                    editable={!loading}
                  />
                </View>

                <Text style={[styles.label, { color: colors.muted }]}>
                  البريد الإلكتروني
                </Text>
                <View
                  style={[
                    styles.inputWrap,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="example@email.com"
                    placeholderTextColor={colors.muted}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    textAlign="left"
                    editable={!loading}
                  />
                </View>

                <Text style={[styles.label, { color: colors.muted }]}>
                  كلمة المرور
                </Text>
                <View
                  style={[
                    styles.inputWrap,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="6 أحرف على الأقل"
                    placeholderTextColor={colors.muted}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                    secureTextEntry
                    textAlign="left"
                    editable={!loading}
                  />
                </View>

                <Text style={[styles.label, { color: colors.muted }]}>
                  تأكيد كلمة المرور
                </Text>
                <View
                  style={[
                    styles.inputWrap,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.muted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCapitalize="none"
                    secureTextEntry
                    textAlign="left"
                    editable={!loading}
                    onSubmitEditing={submit}
                  />
                </View>

                <GradientButton
                  title={loading ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
                  onPress={submit}
                />

                <Pressable
                  onPress={() => router.replace("/sign-in")}
                  style={styles.altLink}
                >
                  <Text style={[styles.altText, { color: colors.muted }]}>
                    لديك حساب بالفعل؟{" "}
                    <Text style={{ color: colors.primary, fontFamily: "Tajawal_700Bold" }}>
                      سجّل الدخول
                    </Text>
                  </Text>
                </Pressable>

                {loading && (
                  <ActivityIndicator
                    color={colors.primary}
                    style={{ marginTop: 12 }}
                  />
                )}
              </>
            )}
          </View>
        </ScrollView>
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
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  brand: {
    color: "#ffffff",
    fontSize: 26,
    fontFamily: "Tajawal_700Bold",
  },
  brandSub: {
    color: "#ffffff",
    fontSize: 15,
    fontFamily: "Tajawal_500Medium",
    opacity: 0.85,
    marginTop: 2,
  },
  card: {
    borderRadius: 24,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontFamily: "Tajawal_700Bold",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Tajawal_400Regular",
    textAlign: "center",
    marginBottom: 18,
    lineHeight: 22,
  },
  label: {
    fontSize: 13,
    fontFamily: "Tajawal_500Medium",
    marginBottom: 6,
    textAlign: "right",
  },
  inputWrap: {
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    justifyContent: "center",
    marginBottom: 12,
  },
  input: {
    fontSize: 16,
    fontFamily: "Tajawal_500Medium",
  },
  altLink: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 4,
  },
  altText: {
    fontSize: 14,
    fontFamily: "Tajawal_500Medium",
  },
});
