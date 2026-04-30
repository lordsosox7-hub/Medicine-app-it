import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Platform,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useFavorites, useToggleFavorite } from "@/hooks/useGkmData";
import { EmptyState } from "@/components/EmptyState";
import { GradientButton } from "@/components/GradientButton";
import type { Doctor } from "@/lib/supabase";

export default function FavoritesScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: favorites = [], isLoading, refetch, isRefetching } = useFavorites();
  const toggleFav = useToggleFavorite();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "المفضلة" }} />
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : favorites.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="heart"
            title="لا يوجد أطباء في المفضلة"
            description="اضغط على أيقونة القلب في صفحة الطبيب لإضافته إلى المفضلة، وستجد كل أطبائك المفضلين هنا."
            action={
              <GradientButton
                title="تصفّح الأطباء"
                onPress={() => router.replace("/(tabs)/my-doctor")}
              />
            }
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.list,
            { paddingBottom: (insets.bottom || 0) + 24 },
          ]}
          refreshControl={undefined}
        >
          <Text style={[styles.count, { color: colors.mutedForeground }]}>
            {favorites.length} {favorites.length === 1 ? "طبيب مفضّل" : "أطباء مفضّلون"}
          </Text>
          {favorites.map((doctor) => (
            <FavoriteRow
              key={doctor.id}
              doctor={doctor}
              onPress={() => router.push(`/doctor/${doctor.id}`)}
              onUnfavorite={() =>
                toggleFav.mutate({ doctor_id: doctor.id, current: true })
              }
            />
          ))}
          {isRefetching && (
            <ActivityIndicator
              color={colors.primary}
              style={{ marginTop: 12 }}
            />
          )}
          {Platform.OS === "web" && (
            <Pressable onPress={() => refetch()} style={styles.refreshBtn}>
              <Feather name="refresh-cw" size={14} color={colors.primary} />
              <Text style={[styles.refreshText, { color: colors.primary }]}>
                تحديث
              </Text>
            </Pressable>
          )}
        </ScrollView>
      )}
    </View>
  );
}

interface FavoriteRowProps {
  doctor: Doctor;
  onPress: () => void;
  onUnfavorite: () => void;
}

function FavoriteRow({ doctor, onPress, onUnfavorite }: FavoriteRowProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.imageBox}>
        {doctor.photo_url ? (
          <Image
            source={{ uri: doctor.photo_url }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View
            style={[styles.placeholder, { backgroundColor: colors.primarySoft }]}
          >
            <Text style={[styles.placeholderText, { color: colors.primary }]}>
              {doctor.name_ar.charAt(0)}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text
          style={[styles.name, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {doctor.name_ar}
        </Text>
        <Text
          style={[styles.specialty, { color: colors.mutedForeground }]}
          numberOfLines={1}
        >
          {doctor.specialty_ar}
        </Text>
        <View style={styles.meta}>
          <Feather name="star" size={13} color={colors.warning} />
          <Text style={[styles.metaText, { color: colors.foreground }]}>
            {doctor.rating.toFixed(1)}
          </Text>
          <Text style={[styles.metaDot, { color: colors.mutedForeground }]}>•</Text>
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {doctor.price} ر.س
          </Text>
        </View>
      </View>
      <Pressable
        onPress={(e) => {
          e.stopPropagation?.();
          onUnfavorite();
        }}
        hitSlop={10}
        style={styles.heartBtn}
      >
        <Feather name="heart" size={22} color="#ef4444" />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyWrap: { flex: 1, justifyContent: "center" },
  list: { padding: 16 },
  count: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_500Medium",
    marginBottom: 12,
    textAlign: "right",
  },
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    gap: 12,
  },
  imageBox: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  placeholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { fontSize: 22, fontFamily: "IBMPlexSansArabic_700Bold" },
  info: { flex: 1, justifyContent: "center", minWidth: 0 },
  name: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_700Bold",
    marginBottom: 4,
    textAlign: "right",
    writingDirection: "rtl",
  },
  specialty: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_500Medium",
    marginBottom: 6,
    textAlign: "right",
    writingDirection: "rtl",
  },
  meta: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  metaText: { fontSize: 12, fontFamily: "IBMPlexSansArabic_700Bold" },
  metaDot: { fontSize: 12 },
  heartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.1)",
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  refreshText: { fontSize: 13, fontFamily: "IBMPlexSansArabic_700Bold" },
});
