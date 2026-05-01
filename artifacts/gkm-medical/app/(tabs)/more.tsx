import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { MenuRow } from "@/components/MenuRow";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserName, getUserEmail } from "@/lib/userId";
import { supabase } from "@/lib/supabase";

export default function MoreScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [userName, setUserName] = useState("أحمد");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    getUserName().then(setUserName);
    getUserEmail().then(setUserEmail);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem("rahah_user_name");
    router.replace("/welcome");
  };

  const isWeb = Platform.OS === "web";
  const headerTop = isWeb ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: headerTop }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>المزيد</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/profile")}
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 20,
            },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
            <Feather name="user" size={26} color={colors.primary} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
              {userName}
            </Text>
            <Text
              style={[styles.profileEmail, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {userEmail ?? "عرض الملف الشخصي"}
            </Text>
          </View>
          <View style={styles.editBtn}>
            <Feather name="edit-2" size={16} color={colors.primary} />
          </View>
        </TouchableOpacity>

        {/* Account section */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>الحساب</Text>
        <View
          style={[
            styles.menuGroup,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 20,
            },
          ]}
        >
          <MenuRow icon="user" label="الملف الشخصي" onPress={() => router.push("/profile")} />
          <MenuRow icon="heart" label="المفضلة" onPress={() => router.push("/favorites")} />
          <MenuRow icon="credit-card" label="المدفوعات" onPress={() => router.push("/payments")} />
          <MenuRow icon="map-pin" label="العنوان" onPress={() => router.push("/address")} />
        </View>

        {/* Preferences section */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>التفضيلات</Text>
        <View
          style={[
            styles.menuGroup,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 20,
            },
          ]}
        >
          <MenuRow icon="bell" label="الإشعارات" onPress={() => router.push("/notifications")} />
          <MenuRow icon="globe" label="اللغة" onPress={() => router.push("/language")} />
          <MenuRow icon="moon" label="المظهر" onPress={() => router.push("/appearance")} />
        </View>

        {/* Support section */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>الدعم</Text>
        <View
          style={[
            styles.menuGroup,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 20,
            },
          ]}
        >
          <MenuRow icon="help-circle" label="مساعدة ودعم" onPress={() => router.push("/help")} />
          <MenuRow icon="shield" label="سياسة الخصوصية" onPress={() => router.push("/privacy")} />
          <MenuRow icon="info" label="حول التطبيق" onPress={() => router.push("/about")} />
          <MenuRow
            icon="log-out"
            label="تسجيل الخروج"
            onPress={handleLogout}
            destructive
          />
        </View>

        <Text style={[styles.versionText, { color: colors.mutedForeground }]}>
          الإصدار 1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: "flex-start",
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 24,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontFamily: "IBMPlexSansArabic_700Bold",
    marginBottom: 2,
    textAlign: "right",
  },
  profileEmail: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
    marginHorizontal: 24,
    marginBottom: 8,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  menuGroup: {
    marginHorizontal: 16,
    marginBottom: 20,
    overflow: "hidden",
  },
  versionText: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "center",
    marginTop: 8,
  },
});
