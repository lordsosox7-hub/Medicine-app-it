import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useLabResults } from "@/hooks/useGkmData";
import { Feather } from "@expo/vector-icons";
import { StatusPill } from "@/components/StatusPill";

type FilterType = "all" | "blood" | "urine";

export default function LabResultsScreen() {
  const colors = useColors();
  const [filter, setFilter] = useState<FilterType>("all");
  const { data: results, isLoading } = useLabResults(filter);

  const getIconForType = (type: string) => {
    switch(type) {
      case 'blood': return 'droplet';
      case 'urine': return 'thermometer';
      default: return 'activity';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabsWrapper, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.segmentedControl, { backgroundColor: colors.input, borderRadius: colors.radius }]}>
          {(['all', 'blood', 'urine'] as FilterType[]).map((f) => {
            const isSelected = filter === f;
            const labels = { all: 'الكل', blood: 'الدم', urine: 'البول' };
            return (
              <TouchableOpacity
                key={f}
                activeOpacity={0.8}
                onPress={() => setFilter(f)}
                style={[
                  styles.segmentTab,
                  isSelected && { backgroundColor: colors.card, borderRadius: colors.radius - 2, shadowColor: colors.foreground, shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 }
                ]}
              >
                <Text style={[styles.segmentText, { color: isSelected ? colors.foreground : colors.mutedForeground, fontFamily: isSelected ? "IBMPlexSansArabic_700Bold" : "IBMPlexSansArabic_500Medium" }]}>
                  {labels[f]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {results && results.length > 0 ? (
            results.map((result) => {
              const dateObj = new Date(result.test_date);
              const formattedDate = dateObj.toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' });
              
              return (
                <View key={result.id} style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius, shadowColor: colors.foreground }]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                      <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
                        <Feather name={getIconForType(result.test_type)} size={20} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={[styles.testName, { color: colors.foreground }]}>{result.test_name_ar}</Text>
                        <Text style={[styles.testDate, { color: colors.mutedForeground }]}>{formattedDate}</Text>
                      </View>
                    </View>
                    <StatusPill status={result.status} />
                  </View>
                  
                  <View style={[styles.cardBody, { borderTopColor: colors.border }]}>
                    <View style={styles.resultCol}>
                      <Text style={[styles.valueLabel, { color: colors.mutedForeground }]}>النتيجة</Text>
                      <Text style={[styles.valueText, { color: colors.foreground }]}>
                        {result.result_value} <Text style={styles.unitText}>{result.unit || ''}</Text>
                      </Text>
                    </View>
                    <View style={styles.resultCol}>
                      <Text style={[styles.valueLabel, { color: colors.mutedForeground }]}>المعدل الطبيعي</Text>
                      <Text style={[styles.valueText, { color: colors.foreground }]}>
                        {result.reference_range || '—'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد نتائج مطابقة</Text>
          )}
          
          {results && results.length > 0 && (
            <TouchableOpacity style={styles.loadMoreBtn}>
              <Text style={[styles.loadMoreText, { color: colors.primary }]}>عرض المزيد</Text>
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabsWrapper: {
    padding: 16,
    borderBottomWidth: 1,
  },
  segmentedControl: {
    flexDirection: 'row',
    padding: 4,
    height: 40,
  },
  segmentTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 14,
  },
  card: {
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 12,
  },
  testName: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_700Bold",
    marginBottom: 4,
    textAlign: 'right',
  },
  testDate: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_400Regular",
    textAlign: 'right',
  },
  cardBody: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  resultCol: {
    flex: 1,
  },
  valueLabel: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_500Medium",
    marginBottom: 4,
    textAlign: 'right',
  },
  valueText: {
    fontSize: 16,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: 'right',
  },
  unitText: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_400Regular",
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontFamily: "IBMPlexSansArabic_500Medium",
  },
  loadMoreBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_700Bold",
  }
});
