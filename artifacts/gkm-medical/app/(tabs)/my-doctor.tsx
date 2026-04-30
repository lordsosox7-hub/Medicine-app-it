import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDoctors } from "@/hooks/useGkmData";
import { BrandHeader } from "@/components/BrandHeader";
import { SearchBar } from "@/components/SearchBar";
import { CategoryChip } from "@/components/CategoryChip";
import { DoctorCard } from "@/components/DoctorCard";
import { DOCTOR_CATEGORIES } from "@/constants/categories";

export default function DoctorsScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string }>();
  const initialQ = typeof params.q === "string" ? params.q : "";
  const [search, setSearch] = useState(initialQ);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { data: doctors, isLoading } = useDoctors(selectedCategory);

  useEffect(() => {
    if (typeof params.q === "string" && params.q !== search) {
      setSearch(params.q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.q]);

  const isWeb = Platform.OS === "web";
  const headerTop = isWeb ? 67 : insets.top;

  const normalize = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/[\u064B-\u0652]/g, "") // strip Arabic diacritics
      .replace(/[إأآا]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه");

  const filteredDoctors = useMemo(() => {
    if (!doctors) return [];
    const q = normalize(search);
    if (!q) return doctors;
    return doctors.filter((d) => {
      const hay = normalize(`${d.name_ar} ${d.specialty_ar} ${d.category}`);
      return hay.includes(q);
    });
  }, [doctors, search]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: headerTop }]}>
      <BrandHeader title="الأطباء" />
      
      <View style={styles.searchContainer}>
        <SearchBar 
          placeholder="ابحث عن طبيب أو تخصص" 
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.categoriesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {DOCTOR_CATEGORIES.map(cat => (
            <CategoryChip 
              key={cat.key} 
              label={cat.labelAr} 
              selected={selectedCategory === cat.key}
              onPress={() => setSelectedCategory(cat.key)} 
            />
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredDoctors.map(doc => (
            <DoctorCard 
              key={doc.id} 
              doctor={doc} 
              onPress={() => router.push(`/doctor/${doc.id}`)} 
            />
          ))}
          {filteredDoctors.length === 0 && (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              لم يتم العثور على أطباء.
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 32,
    fontFamily: "IBMPlexSansArabic_500Medium",
  }
});
