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
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { GradientButton } from "@/components/GradientButton";
import { supabase } from "@/lib/supabase";
import { isOnboarded } from "@/lib/userId";
import { RTLChevron } from "@/components/RTLChevron";

export default function SignInScreen() {
  const router = useRouter();
  const colors = useColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        const onboarded = await isOnboarded();
        router.replace(onboarded ? "/(tabs)" : "/onboarding");
      }
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [router]);

  const signIn = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      Alert.alert("خطأ", "يرجى إدخال بريد إلكتروني صحيح");
      return;
    }
    if (!password || password.length < 6) {
      Alert.alert("خطأ", "كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });
      if (error) throw error;
    } catch (e: any) {
      const msg =
        e?.message?.toLowerCase().includes("invalid") ||
        e?.message?.toLowerCase().includes("credentials")
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
          : e?.message ?? "حدث خطأ";
      Alert.alert("تعذّر تسجيل الدخول", msg);
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
            <Text style={styles.brand}>GKM&apos;s Unit</Text>
            <Text style={styles.brandSub}>Medical Care</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              تسجيل الدخول
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              أدخل بريدك الإلكتروني وكلمة المرور للمتابعة
            </Text>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>
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
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textAlign="left"
                editable={!loading}
              />
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              كلمة المرور
            </Text>
            <View
              style={[
                styles.inputWrap,
                styles.inputWrapRow,
                { backgroundColor: colors.primarySoft },
              ]}
            >
              <TextInput
                style={[styles.input, styles.inputFlex, { color: colors.foreground }]}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoComplete="password"
                secureTextEntry={!showPassword}
                textAlign="left"
                editable={!loading}
                onSubmitEditing={signIn}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={10}
                style={styles.eyeBtn}
                accessibilityLabel={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.mutedForeground}
                />
              </Pressable>
            </View>

            <GradientButton
              title={loading ? "جارٍ الدخول..." : "تسجيل الدخول"}
              onPress={signIn}
            />

            <Pressable
              onPress={() => router.replace("/register")}
              style={styles.altLink}
            >
              <Text style={[styles.altText, { color: colors.mutedForeground }]}>
                ليس لديك حساب؟{" "}
                <Text style={{ color: colors.primary, fontFamily: "Tajawal_700Bold" }}>
                  أنشئ حساباً جديداً
                </Text>
              </Text>
            </Pressable>

            {loading && (
              <ActivityIndicator
                color={colors.primary}
                style={{ marginTop: 12 }}
              />
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
    marginBottom: 24,
  },
  brand: {
    color: "#ffffff",
    fontSize: 28,
    fontFamily: "Tajawal_700Bold",
  },
  brandSub: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Tajawal_500Medium",
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
    marginBottom: 20,
    lineHeight: 20,
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
    height: 52,
    justifyContent: "center",
    marginBottom: 14,
  },
  inputWrapRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  input: {
    fontSize: 16,
    fontFamily: "Tajawal_500Medium",
  },
  inputFlex: {
    flex: 1,
  },
  eyeBtn: {
    paddingStart: 10,
    paddingEnd: 4,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
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
