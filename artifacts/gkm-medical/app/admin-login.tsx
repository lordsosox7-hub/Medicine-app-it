import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { loginAdmin, isAdminLoggedIn } from "@/lib/adminAuth";

export default function AdminLoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    isAdminLoggedIn().then((ok) => {
      if (ok) router.replace("/admin");
    });
  }, [router]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const style = document.createElement("style");
    style.textContent = [
      "input[type='password']::-ms-reveal { display: none !important; }",
      "input[type='password']::-ms-clear { display: none !important; }",
      "input[type='password']::-webkit-credentials-auto-fill-button { visibility: hidden !important; display: none !important; }",
      "input[type='password']::-webkit-textfield-decoration-container { display: none !important; }",
      "input[type='password'] { -webkit-appearance: none; appearance: none; }",
    ].join("\n");
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      setError("الرجاء إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const ok = await loginAdmin(username, password);
      if (!ok) {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة");
        return;
      }
      router.replace("/admin");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandWrap}>
            <View
              style={[styles.brandBadge, { backgroundColor: colors.primarySoft }]}
            >
              <Feather name="shield" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.brand, { color: colors.foreground }]}>
              لوحة التحكم
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              تسجيل الدخول للمشرف
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                اسم المستخدم
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  { backgroundColor: colors.input, borderColor: colors.border },
                ]}
              >
                <Feather name="user" size={18} color={colors.mutedForeground} />
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="أدخل اسم المستخدم"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.input, { color: colors.foreground }]}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                كلمة المرور
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  { backgroundColor: colors.input, borderColor: colors.border },
                ]}
              >
                <Feather name="lock" size={18} color={colors.mutedForeground} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="أدخل كلمة المرور"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[styles.input, { color: colors.foreground, paddingLeft: 36 }]}
                  onSubmitEditing={handleLogin}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeBtn}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={18}
                    color={colors.mutedForeground}
                  />
                </Pressable>
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

            <Pressable
              onPress={handleLogin}
              disabled={busy}
              style={[
                styles.submitBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: busy ? 0.7 : 1,
                },
              ]}
            >
              {busy ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <>
                  <Feather
                    name="log-in"
                    size={18}
                    color={colors.primaryForeground}
                  />
                  <Text
                    style={[styles.submitText, { color: colors.primaryForeground }]}
                  >
                    تسجيل الدخول
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={[styles.back, { color: colors.mutedForeground }]}>
              عودة
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
    gap: 20,
  },
  brandWrap: { alignItems: "center", gap: 10, marginBottom: 4 },
  brandBadge: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  brand: {
    fontSize: 22,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "center",
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  field: { gap: 8 },
  label: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
  },
  eyeBtn: {
    position: "absolute",
    left: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    padding: 4,
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
  submitBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  submitText: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  back: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "center",
    paddingVertical: 8,
  },
});
