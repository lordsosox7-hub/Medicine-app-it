import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { getUserName, setUserName, getUserEmail } from "@/lib/userId";
import { getUserPhone, setUserPhone } from "@/lib/preferences";

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const [name, setName] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getUserName().then(setName);
    getUserEmail().then(setEmail);
    getUserPhone().then(setPhone);
  }, []);

  const onSave = async () => {
    if (!name.trim()) {
      if (Platform.OS === "web") {
        window.alert("الرجاء إدخال الاسم");
      } else {
        Alert.alert("تنبيه", "الرجاء إدخال الاسم");
      }
      return;
    }
    setSaving(true);
    await setUserName(name.trim());
    await setUserPhone(phone.trim());
    setSaving(false);
    if (Platform.OS === "web") {
      window.alert("تم حفظ التغييرات");
    } else {
      Alert.alert("تم", "تم حفظ التغييرات بنجاح");
    }
    router.back();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
    >
      <View style={[styles.avatarBlock]}>
        <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
          <Feather name="user" size={36} color={colors.primary} />
        </View>
        <TouchableOpacity style={[styles.avatarEdit, { backgroundColor: colors.primary }]}>
          <Feather name="camera" size={14} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      <Field
        label="الاسم الكامل"
        value={name}
        onChange={setName}
        placeholder="أدخل اسمك الكامل"
        icon="user"
      />
      <Field
        label="البريد الإلكتروني"
        value={email ?? ""}
        onChange={() => {}}
        placeholder="—"
        icon="mail"
        editable={false}
      />
      <Field
        label="رقم الهاتف"
        value={phone}
        onChange={setPhone}
        placeholder="05xxxxxxxx"
        icon="phone"
        keyboardType="phone-pad"
      />

      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
        onPress={onSave}
        disabled={saving}
        activeOpacity={0.85}
      >
        <Text style={[styles.saveText, { color: colors.primaryForeground }]}>
          {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  icon,
  editable = true,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: keyof typeof Feather.glyphMap;
  editable?: boolean;
  keyboardType?: "default" | "phone-pad" | "email-address";
}) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: editable ? colors.card : colors.muted,
            borderColor: colors.border,
          },
        ]}
      >
        <Feather name={icon} size={18} color={colors.mutedForeground} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          editable={editable}
          keyboardType={keyboardType}
          style={[styles.input, { color: colors.foreground }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  avatarBlock: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 36,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  avatarEdit: {
    position: "absolute",
    bottom: 0,
    insetInlineStart: "38%",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
    height: "100%",
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  saveText: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
});
