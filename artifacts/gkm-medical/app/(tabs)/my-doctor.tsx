import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
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
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { data: doctors, isLoading } = useDoctors(selectedCategory);

  const isWeb = Platform.OS === "web";
  const headerTop = isWeb ? 67 : insets.top;

  const filteredDoctors = doctors?.filter(d => 
    d.name_ar.includes(search) || d.specialty_ar.includes(search)
  ) || [];

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
    fontFamily: "Inter_500Medium",
  }
});
