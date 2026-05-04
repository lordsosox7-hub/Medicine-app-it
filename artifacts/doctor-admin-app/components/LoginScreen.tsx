import React, { useState } from "react";
import {
  View, Text, TextInput, StyleSheet, ActivityIndicator,
  TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { loginDoctorAdmin, type DoctorAdminSession } from "@/lib/auth";

interface Props {
  onLogin: (session: DoctorAdminSession) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<"username" | "password" | null>(null);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert("تنبيه", "الرجاء إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    setBusy(true);
    try {
      const session = await loginDoctorAdmin(username.trim(), password);
      if (!session) {
        Alert.alert("خطأ في تسجيل الدخول", "اسم المستخدم أو كلمة المرور غير صحيحة");
      } else {
        onLogin(session);
      }
    } catch {
      Alert.alert("خطأ", "حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مجدداً");
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.gradientFrom, colors.gradientTo]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand */}
          <View style={styles.brand}>
            <View style={styles.brandIconWrap}>
              <View style={styles.brandIconRing}>
                <Ionicons name="medkit" size={42} color="#fff" />
              </View>
            </View>
            <Text style={[styles.brandName, { fontFamily: "IBMPlexSansArabic_700Bold" }]}>بوابة الطبيب</Text>
            <Text style={[styles.brandSub, { fontFamily: "IBMPlexSansArabic_400Regular" }]}>نظام راحة الطبي — لوحة إدارة المواعيد</Text>
          </View>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardHeaderIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="lock-closed" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_700Bold" }]}>
                  تسجيل الدخول
                </Text>
                <Text style={[styles.cardSub, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>
                  أدخل بيانات حسابك للمتابعة
                </Text>
              </View>
            </View>

            {/* Username */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_500Medium" }]}>
                اسم المستخدم
              </Text>
              <View style={[
                styles.inputRow,
                {
                  borderColor: focusedField === "username" ? colors.primary : colors.border,
                  backgroundColor: colors.secondary,
                  borderWidth: focusedField === "username" ? 1.5 : 1,
                },
              ]}>
                <TextInput
                  style={[styles.input, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_400Regular" }]}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="أدخل اسم المستخدم"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlign="right"
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                />
                <Ionicons name="person-outline" size={18} color={focusedField === "username" ? colors.primary : colors.mutedForeground} />
              </View>
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_500Medium" }]}>
                كلمة المرور
              </Text>
              <View style={[
                styles.inputRow,
                {
                  borderColor: focusedField === "password" ? colors.primary : colors.border,
                  backgroundColor: colors.secondary,
                  borderWidth: focusedField === "password" ? 1.5 : 1,
                },
              ]}>
                <TextInput
                  style={[styles.input, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_400Regular" }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="أدخل كلمة المرور"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  textAlign="right"
                  onSubmitEditing={handleLogin}
                  returnKeyType="done"
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={focusedField === "password" ? colors.primary : colors.mutedForeground}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.primary, opacity: busy ? 0.7 : 1 }]}
              onPress={handleLogin}
              disabled={busy}
              activeOpacity={0.85}
            >
              {busy ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={18} color="#fff" />
                  <Text style={[styles.btnText, { fontFamily: "IBMPlexSansArabic_700Bold" }]}>تسجيل الدخول</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={[styles.footer, { fontFamily: "IBMPlexSansArabic_400Regular" }]}>
            للدعم التقني تواصل مع مدير النظام
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, gap: 28 },
  brand: { alignItems: "center", gap: 14 },
  brandIconWrap: { alignItems: "center", justifyContent: "center" },
  brandIconRing: {
    width: 96, height: 96, borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center", justifyContent: "center",
  },
  brandName: { fontSize: 30, color: "#fff" },
  brandSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", textAlign: "center" },
  card: {
    borderRadius: 24, padding: 24, gap: 18,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18, shadowRadius: 24, elevation: 12,
  },
  cardHeader: { flexDirection: "row-reverse", alignItems: "center", gap: 12 },
  cardHeaderIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 20, textAlign: "right" },
  cardSub: { fontSize: 13, textAlign: "right", marginTop: 2 },
  field: { gap: 8 },
  label: { fontSize: 13, textAlign: "right" },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, paddingHorizontal: 14, height: 52, gap: 10,
  },
  input: { flex: 1, fontSize: 15 },
  btn: {
    height: 54, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 10, marginTop: 4,
  },
  btnText: { color: "#fff", fontSize: 16 },
  footer: { textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: 12 },
});
