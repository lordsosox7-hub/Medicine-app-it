import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface ExpandableSectionProps {
  title: string;
  items: string[];
  icon: keyof typeof Feather.glyphMap;
  defaultExpanded?: boolean;
}

export function ExpandableSection({ title, items, icon, defaultExpanded = false }: ExpandableSectionProps) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderRadius: colors.radius, shadowColor: colors.foreground }]}>
      <TouchableOpacity 
        activeOpacity={0.7} 
        onPress={() => setExpanded(!expanded)}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <Feather name={icon} size={20} color={colors.primary} />
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        </View>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={20} color={colors.mutedForeground} />
      </TouchableOpacity>
      
      {expanded && (
        <View style={[styles.content, { borderTopColor: colors.border }]}>
          {items.length > 0 ? (
            items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
                <Text style={[styles.itemText, { color: colors.foreground }]}>{item}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد بيانات</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
    justifyContent: 'flex-end',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemText: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_500Medium",
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_400Regular",
    fontStyle: 'italic',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
