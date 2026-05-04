import {
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
  useFonts,
} from "@expo-google-fonts/ibm-plex-sans-arabic";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { I18nManager, Platform, View, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

if (Platform.OS === "web" && typeof document !== "undefined") {
  document.documentElement.setAttribute("dir", "rtl");
  document.documentElement.setAttribute("lang", "ar");

  const style = document.createElement("style");
  style.textContent = `
    html, body, #root { height: 100%; margin: 0; padding: 0; }
    body {
      background: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    #root {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }
  `;
  document.head.appendChild(style);
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const PHONE_W = 390;
const PHONE_H = 844;

function RootLayoutNav() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const inner = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <RootLayoutNav />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );

  if (Platform.OS === "web") {
    return (
      <View style={styles.webOuter}>
        <View style={styles.phoneShell}>
          <View style={styles.phoneNotch} />
          <View style={styles.phoneScreen}>{inner}</View>
          <View style={styles.phoneHomeBar} />
        </View>
      </View>
    );
  }

  return inner;
}

const styles = StyleSheet.create({
  webOuter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
    minHeight: "100vh" as any,
    width: "100vw" as any,
  },
  phoneShell: {
    width: PHONE_W,
    height: PHONE_H,
    borderRadius: 48,
    backgroundColor: "#1e293b",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.6,
    shadowRadius: 60,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    flexDirection: "column",
  },
  phoneNotch: {
    height: 12,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  phoneScreen: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 4,
  },
  phoneHomeBar: {
    height: 20,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
