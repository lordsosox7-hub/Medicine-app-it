import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  
  // RTL flips the order visually, so we define them left-to-right in code
  // visually they will appear right-to-left: Home on the right.
  
  const tabBarHeight = isWeb ? 84 : 70 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryForeground,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 10,
          marginTop: -4,
          marginBottom: 4,
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
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: colors.primary }]}>
              <Feather name="grid" size={20} color={focused ? colors.primaryForeground : colors.mutedForeground} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="my-doctor"
        options={{
          title: "الطبيب الخاص",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: colors.primary }]}>
              <Feather name="user" size={20} color={focused ? colors.primaryForeground : colors.mutedForeground} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "المحادثات",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: colors.primary }]}>
              <Feather name="message-circle" size={20} color={focused ? colors.primaryForeground : colors.mutedForeground} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "المواعيد",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: colors.primary }]}>
              <Feather name="calendar" size={20} color={focused ? colors.primaryForeground : colors.mutedForeground} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "الرئيسية",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: colors.primary }]}>
              <Feather name="home" size={20} color={focused ? colors.primaryForeground : colors.mutedForeground} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  }
});
