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
import { useColors } from "@/hooks/useColors";
import { GradientButton } from "@/components/GradientButton";
import { supabase } from "@/lib/supabase";
import { isOnboarded } from "@/lib/userId";

type Step = "email" | "sent";

export default function SignInScreen() {
  const router = useRouter();
  const colors = useColors();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

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

  const sendMagicLink = async () => {
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
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          shouldCreateUser: true,
          ...(redirectTo ? { emailRedirectTo: redirectTo } : {}),
        },
      });
      if (error) throw error;
      setStep("sent");
    } catch (e: any) {
      Alert.alert("تعذّر الإرسال", e?.message ?? "حدث خطأ");
    } finally {
      setLoading(false);
    }
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
            <Text style={styles.brand}>GKM&apos;s Unit</Text>
            <Text style={styles.brandSub}>Medical Care</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.background }]}>
            {step === "email" ? (
              <>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  تسجيل الدخول
                </Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>
                  أدخل بريدك الإلكتروني وسنرسل لك رابط دخول سحري
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
                <GradientButton
                  title={loading ? "جارٍ الإرسال..." : "إرسال رابط الدخول"}
                  onPress={sendMagicLink}
                />
                {loading && (
                  <ActivityIndicator
                    color={colors.primary}
                    style={{ marginTop: 12 }}
                  />
                )}
              </>
            ) : (
              <>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  تحقّق من بريدك
                </Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>
                  أرسلنا رابط الدخول إلى{"\n"}
                  <Text style={{ fontFamily: "Inter_600SemiBold" }}>
                    {email}
                  </Text>
                  {"\n"}اضغط على الرابط في البريد لإكمال تسجيل الدخول.
                </Text>
                <Pressable
                  onPress={() => setStep("email")}
                  style={styles.backBtn}
                >
                  <Text style={[styles.backText, { color: colors.primary }]}>
                    استخدم بريداً مختلفاً
                  </Text>
                </Pressable>
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
    marginBottom: 32,
  },
  brand: {
    color: "#ffffff",
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  brandSub: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: "Inter_500Medium",
    opacity: 0.85,
    marginTop: 4,
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
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  inputWrap: {
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    justifyContent: "center",
    marginBottom: 16,
  },
  input: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  backBtn: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  backText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
