import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandHeader } from "@/components/BrandHeader";
import { MenuRow } from "@/components/MenuRow";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserName, getUserEmail } from "@/lib/userId";
import { supabase } from "@/lib/supabase";
import { Image } from "expo-image";

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
    await AsyncStorage.removeItem("gkm_user_name");
    router.replace("/welcome");
  };

  const isWeb = Platform.OS === "web";
  const headerTop = isWeb ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: headerTop }]}>
      <BrandHeader title="المزيد" />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{userName.charAt(0)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: colors.foreground }]}>{userName}</Text>
            <Text style={[styles.viewProfile, { color: colors.primary }]} numberOfLines={1}>
              {userEmail ?? "عرض الملف الشخصي"}
            </Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          <MenuRow icon="bell" label="الإشعارات" onPress={() => {}} />
          <MenuRow icon="heart" label="المفضلة" onPress={() => router.push("/favorites")} />
          <MenuRow icon="credit-card" label="المدفوعات" onPress={() => {}} />
          <MenuRow icon="map-pin" label="العنوان" onPress={() => {}} />
          <MenuRow icon="help-circle" label="مساعدة ودعم" onPress={() => {}} />
          <MenuRow icon="settings" label="الإعدادات" onPress={() => {}} />
          <MenuRow icon="log-out" label="تسجيل الخروج" onPress={handleLogout} destructive />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 16,
  },
  avatarText: {
    fontSize: 24,
    fontFamily: "Tajawal_700Bold",
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontFamily: "Tajawal_700Bold",
    marginBottom: 4,
    textAlign: 'right',
  },
  viewProfile: {
    fontSize: 14,
    fontFamily: "Tajawal_500Medium",
    textAlign: 'right',
  },
  menuSection: {
    marginTop: 8,
  }
});
