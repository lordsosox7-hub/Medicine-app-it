import {
  Tajawal_400Regular,
  Tajawal_500Medium,
  Tajawal_700Bold,
  useFonts,
} from "@expo-google-fonts/tajawal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { I18nManager, Platform } from "react-native";
import { ensureDemoData } from "@/hooks/useGkmData";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Force RTL BEFORE any rendering
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

// On web, also flip the document direction so flex-direction:row visually reverses
if (Platform.OS === "web" && typeof document !== "undefined") {
  document.documentElement.setAttribute("dir", "rtl");
  document.documentElement.setAttribute("lang", "ar");
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "رجوع", headerTitleAlign: 'center', headerTitleStyle: { fontFamily: 'Tajawal_700Bold' } }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: true, title: "Doctor Console" }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="doctor/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="booking/[doctorId]" options={{ title: "احجز موعد" }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="medical-file" options={{ title: "الملف الطبي" }} />
      <Stack.Screen name="lab-results" options={{ title: "نتائج التحاليل" }} />
      <Stack.Screen name="favorites" options={{ title: "المفضلة" }} />
      <Stack.Screen name="profile" options={{ title: "الملف الشخصي" }} />
      <Stack.Screen name="payments" options={{ title: "المدفوعات" }} />
      <Stack.Screen name="address" options={{ title: "العنوان" }} />
      <Stack.Screen name="notifications" options={{ title: "الإشعارات" }} />
      <Stack.Screen name="language" options={{ title: "اللغة" }} />
      <Stack.Screen name="appearance" options={{ title: "المظهر" }} />
      <Stack.Screen name="help" options={{ title: "مساعدة ودعم" }} />
      <Stack.Screen name="privacy" options={{ title: "سياسة الخصوصية" }} />
      <Stack.Screen name="about" options={{ title: "حول التطبيق" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Tajawal_400Regular,
    Tajawal_500Medium,
    Tajawal_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // Seed demo data for the user on mount
    const seedData = async () => {
      try {
        await ensureDemoData();
      } catch (e) {
        console.warn("Failed to seed demo data", e);
      }
    };
    seedData();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
