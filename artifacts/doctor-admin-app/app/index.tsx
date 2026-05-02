import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { getDoctorAdminSession, loginDoctorAdmin, type DoctorAdminSession } from "@/lib/auth";

export default function IndexScreen() {
  const colors = useColors();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getDoctorAdminSession().then((session) => {
      if (session) {
        router.replace({ pathname: "/dashboard", params: { session: JSON.stringify(session) } });
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  if (checking) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return <LoginScreen colors={colors} router={router} />;
}

function LoginScreen({ colors, router }: { colors: any; router: any }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert("خطأ", "الرجاء إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    setBusy(true);
    try {
      const session = await loginDoctorAdmin(username, password);
      if (!session) {
        Alert.alert("خطأ في تسجيل الدخول", "اسم المستخدم أو كلمة المرور غير صحيحة");
      } else {
        router.replace({ pathname: "/dashboard", params: { session: JSON.stringify(session) } });
      }
    } catch {
      Alert.alert("خطأ", "حدث خطأ أثناء تسجيل الدخول، حاول مجدداً");
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.gradientFrom, colors.gradientTo]}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.inner}>
          <View style={styles.brand}>
            <View style={[styles.brandIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Ionicons name="medkit" size={36} color="#fff" />
            </View>
            <Text style={styles.brandName}>بوابة الطبيب</Text>
            <Text style={styles.brandSub}>نظام راحة الطبي</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.background }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_700Bold" }]}>
              تسجيل الدخول
            </Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>
              أدخل بيانات حسابك لمتابعة مواعيد طبيبك
            </Text>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_500Medium" }]}>
                اسم المستخدم
              </Text>
              <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
                <Ionicons name="person-outline" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_400Regular", textAlign: "right" }]}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="أدخل اسم المستخدم"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_500Medium" }]}>
                كلمة المرور
              </Text>
              <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.inputIcon}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_400Regular", textAlign: "right" }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="أدخل كلمة المرور"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onSubmitEditing={handleLogin}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: colors.primary, opacity: busy ? 0.7 : 1 }]}
              onPress={handleLogin}
              disabled={busy}
              activeOpacity={0.85}
            >
              {busy ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[styles.loginBtnText, { fontFamily: "IBMPlexSansArabic_700Bold" }]}>
                  تسجيل الدخول
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.footer, { fontFamily: "IBMPlexSansArabic_400Regular" }]}>
            للدعم التقني تواصل مع مدير النظام
          </Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  gradient: { flex: 1 },
  flex: { flex: 1 },
  inner: { flex: 1, justifyContent: "center", padding: 24, gap: 24 },
  brand: { alignItems: "center", gap: 12 },
  brandIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    fontSize: 28,
    fontFamily: "IBMPlexSansArabic_700Bold",
    color: "#fff",
  },
  brandSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "IBMPlexSansArabic_400Regular",
  },
  card: {
    borderRadius: 20,
    padding: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: { fontSize: 20, textAlign: "right" },
  cardSub: { fontSize: 13, textAlign: "right", marginTop: -8 },
  field: { gap: 6 },
  label: { fontSize: 13, textAlign: "right" },
  inputWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 8,
  },
  inputIcon: { flexShrink: 0 },
  input: { flex: 1, fontSize: 14, height: 48 },
  loginBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  loginBtnText: { color: "#fff", fontSize: 16 },
  footer: { textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: 12 },
});
