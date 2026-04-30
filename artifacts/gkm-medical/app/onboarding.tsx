import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { markOnboarded } from "@/lib/userId";
import { GradientButton } from "@/components/GradientButton";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const handleNext = async () => {
    await markOnboarded();
    router.replace("/(tabs)");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.imageContainer}>
        <Image 
          source={require("@/assets/images/onboarding-doctor.png")} 
          style={styles.image} 
          contentFit="contain" 
        />
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          خدمات طبية بسهولة وأمان
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          احجز مواعيدك مع أفضل الأطباء، واحصل على رعاية صحية متكاملة أينما كنت
        </Text>
        
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive, { backgroundColor: colors.primary }]} />
          <View style={[styles.dot, { backgroundColor: colors.muted }]} />
          <View style={[styles.dot, { backgroundColor: colors.muted }]} />
        </View>
        
        <View style={styles.buttonContainer}>
          <GradientButton title="التالي" onPress={handleNext} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  image: {
    width: '100%',
    height: '100%',
    maxWidth: 400,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
  },
  buttonContainer: {
    width: '100%',
  }
});
