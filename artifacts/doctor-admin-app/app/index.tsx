import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { getDoctorAdminSession, type DoctorAdminSession } from "@/lib/auth";
import LoginScreen from "@/components/LoginScreen";
import DashboardScreen from "@/components/DashboardScreen";

export default function App() {
  const colors = useColors();
  const [session, setSession] = useState<DoctorAdminSession | null | "loading">("loading");

  useEffect(() => {
    getDoctorAdminSession().then((s) => setSession(s));
  }, []);

  if (session === "loading") {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!session) {
    return <LoginScreen onLogin={setSession} />;
  }

  return <DashboardScreen session={session} onLogout={() => setSession(null)} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
