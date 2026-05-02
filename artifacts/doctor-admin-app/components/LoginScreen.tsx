import React, { useState } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { loginDoctorAdmin, type DoctorAdminSession } from "@/lib/auth";

interface Props {
  onLogin: (session: DoctorAdminSession) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const colors = useColors();
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
      const session = await loginDoctorAdmin(username.trim(), password);
      if (!session) {
        Alert.alert("خطأ في تسجيل الدخول", "اسم المستخدم أو كلمة المرور غير صحيحة");
      } else {
        onLogin(session);
      }
    } catch {
      Alert.alert("خطأ", "حدث خطأ أثناء تسجيل الدخول، حاول مجدداً");
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient colors={[colors.gradientFrom, colors.gradientTo]} style={styles.gradient}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.inner}>
          {/* Brand */}
          <View style={styles.brand}>
            <View style={[styles.brandIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Ionicons name="medkit" size={40} color="#fff" />
            </View>
            <Text style={styles.brandName}>بوابة الطبيب</Text>
            <Text style={styles.brandSub}>نظام راحة الطبي</Text>
          </View>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_700Bold" }]}>
              تسجيل الدخول
            </Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }]}>
              أدخل بيانات حسابك لمتابعة مواعيد طبيبك
            </Text>

            {/* Username */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_500Medium" }]}>
                اسم المستخدم
              </Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
                <TextInput
                  style={[styles.input, { color: colors.foreground, fontFamily: "IBMPlexSansArabic_400Regular" }]}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="أدخل اسم المستخدم"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlign="right"
                />
                <Ionicons name="person-outline" size={18} color={colors.mutedForeground} style={styles.inputIcon} />
              </View>
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_500Medium" }]}>
                كلمة المرور
              </Text>
              <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.secondary }]}>
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
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.inputIcon}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={colors.mutedForeground}
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
                <Text style={[styles.btnText, { fontFamily: "IBMPlexSansArabic_700Bold" }]}>
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
  gradient: { flex: 1 },
  flex: { flex: 1 },
  inner: { flex: 1, justifyContent: "center", padding: 24, gap: 28 },
  brand: { alignItems: "center", gap: 12 },
  brandIcon: { width: 84, height: 84, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  brandName: { fontSize: 28, fontFamily: "IBMPlexSansArabic_700Bold", color: "#fff" },
  brandSub: { fontSize: 14, color: "rgba(255,255,255,0.75)", fontFamily: "IBMPlexSansArabic_400Regular" },
  card: {
    borderRadius: 20,
    padding: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  cardTitle: { fontSize: 20, textAlign: "right" },
  cardSub: { fontSize: 13, textAlign: "right", marginTop: -8 },
  field: { gap: 6 },
  label: { fontSize: 13, textAlign: "right" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  inputIcon: { flexShrink: 0 },
  input: { flex: 1, fontSize: 14 },
  btn: { height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 4 },
  btnText: { color: "#fff", fontSize: 16 },
  footer: { textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: 12 },
});
