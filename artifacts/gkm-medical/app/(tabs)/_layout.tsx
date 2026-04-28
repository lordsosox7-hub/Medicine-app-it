import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  
  // RTL flips the order visually, so we define them left-to-right in code
  // visually they will appear right-to-left: Home on the right.
  
  const tabBarHeight = isWeb ? 76 : 64 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: "Tajawal_500Medium",
          fontSize: 11,
          marginTop: 2,
          marginBottom: isWeb ? 6 : 0,
          textAlign: "center",
          includeFontPadding: false,
        },
        tabBarItemStyle: {
          paddingTop: 6,
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 8,
          shadowColor: colors.foreground,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          height: tabBarHeight,
          paddingBottom: isWeb ? 0 : insets.bottom,
        },
      }}
    >
      <Tabs.Screen
        name="more"
        options={{
          title: "المزيد",
          tabBarIcon: ({ focused }) => (
            <Feather name="grid" size={22} color={focused ? colors.primary : colors.mutedForeground} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-doctor"
        options={{
          title: "طبيبي",
          tabBarIcon: ({ focused }) => (
            <Feather name="user" size={22} color={focused ? colors.primary : colors.mutedForeground} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "المحادثات",
          tabBarIcon: ({ focused }) => (
            <Feather name="message-circle" size={22} color={focused ? colors.primary : colors.mutedForeground} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "المواعيد",
          tabBarIcon: ({ focused }) => (
            <Feather name="calendar" size={22} color={focused ? colors.primary : colors.mutedForeground} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "الرئيسية",
          tabBarIcon: ({ focused }) => (
            <Feather name="home" size={22} color={focused ? colors.primary : colors.mutedForeground} />
          ),
        }}
      />
    </Tabs>
  );
}
