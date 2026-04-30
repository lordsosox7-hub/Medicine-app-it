import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  useVitals,
  VITALS_META,
  VitalType,
  VitalReading,
  evaluateVitalStatus,
} from "@/hooks/useVitals";
import { Sparkline } from "@/components/Sparkline";
import * as Haptics from "expo-haptics";

export default function VitalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const a = colors.accents;
  const {
    readings,
    addReading,
    deleteReading,
    getDisplayValue,
    getStatus,
    getLatest,
    getTrend,
  } = useVitals();

  const [editing, setEditing] = useState<VitalType | null>(null);
  const [inputValue, setInputValue] = useState("");

  const openEdit = (type: VitalType) => {
    const meta = VITALS_META.find((m) => m.type === type)!;
    const current = getLatest(type)?.value ?? meta.defaultValue;
    setInputValue(current);
    setEditing(type);
  };

  const closeEdit = () => {
    setEditing(null);
    setInputValue("");
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!inputValue.trim()) {
      closeEdit();
      return;
    }
    await addReading(editing, inputValue);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeEdit();
  };

  const confirmDelete = (r: VitalReading) => {
    Alert.alert("حذف القراءة", "هل تريد حذف هذه القراءة؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: () => deleteReading(r.id),
      },
    ]);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const time = d.toLocaleTimeString("ar", {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (isToday) return `اليوم · ${time}`;
    if (isYesterday) return `أمس · ${time}`;
    return d.toLocaleDateString("ar", {
      day: "numeric",
      month: "short",
    });
  };

  const editingMeta = editing
    ? VITALS_META.find((m) => m.type === editing)
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: colors.mutedForeground }]}>
          سجّل قياساتك الصحية بشكل منتظم لمتابعة حالتك الصحية بدقة.
        </Text>

        {/* Vital cards */}
        <View style={styles.grid}>
          {VITALS_META.map((meta) => {
            const value = getDisplayValue(meta.type);
            const status = getStatus(meta.type);
            const latest = getLatest(meta.type);
            const trend = getTrend(meta.type, 7);
            const accent = a[meta.accentKey];
            const statusColor =
              status === "normal"
                ? colors.success
                : status === "warning"
                ? colors.warning
                : colors.danger;
            const statusLabel =
              status === "normal"
                ? "طبيعي"
                : status === "warning"
                ? "تنبيه"
                : "مرتفع";

            return (
              <TouchableOpacity
                key={meta.type}
                activeOpacity={0.85}
                onPress={() => openEdit(meta.type)}
                style={[
                  styles.vitalCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.vitalTopRow}>
                  <View
                    style={[styles.vitalIconWrap, { backgroundColor: accent.bg }]}
                  >
                    <MaterialCommunityIcons
                      name={meta.iconName as any}
                      size={22}
                      color={accent.color}
                    />
                  </View>
                  <View
                    style={[styles.statusDot, { backgroundColor: statusColor }]}
                  />
                </View>
                <Text
                  style={[styles.vitalLabel, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {meta.label_ar}
                </Text>
                <View style={styles.vitalValueRow}>
                  <Text
                    style={[styles.vitalValue, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {value}
                  </Text>
                  <Text
                    style={[styles.vitalUnit, { color: colors.mutedForeground }]}
                  >
                    {" "}
                    {meta.unit}
                  </Text>
                </View>
                {trend.length > 1 ? (
                  <View style={styles.sparkRow}>
                    <Sparkline
                      points={trend}
                      color={accent.color}
                      width={140}
                      height={32}
                    />
                  </View>
                ) : null}
                <Text style={[styles.vitalStatus, { color: statusColor }]}>
                  {latest ? statusLabel : "اضغط للتسجيل"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* History */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          آخر القراءات
        </Text>
        {readings.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="activity" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              لا توجد قراءات بعد
            </Text>
            <Text
              style={[styles.emptyText, { color: colors.mutedForeground }]}
            >
              اضغط على أي مؤشر بالأعلى لتسجيل أول قراءة.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {readings.slice(0, 30).map((r) => {
              const meta = VITALS_META.find((m) => m.type === r.type)!;
              const accent = a[meta.accentKey];
              const status = evaluateVitalStatus(r.type, r.value);
              const statusColor =
                status === "normal"
                  ? colors.success
                  : status === "warning"
                  ? colors.warning
                  : colors.danger;
              return (
                <TouchableOpacity
                  key={r.id}
                  onLongPress={() => confirmDelete(r)}
                  activeOpacity={0.85}
                  style={[
                    styles.historyRow,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.historyIconWrap,
                      { backgroundColor: accent.bg },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={meta.iconName as any}
                      size={18}
                      color={accent.color}
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={[
                        styles.historyLabel,
                        { color: colors.foreground },
                      ]}
                      numberOfLines={1}
                    >
                      {meta.label_ar}
                    </Text>
                    <Text
                      style={[
                        styles.historyDate,
                        { color: colors.mutedForeground },
                      ]}
                      numberOfLines={1}
                    >
                      {formatDate(r.recorded_at)}
                    </Text>
                  </View>
                  <View style={styles.historyValueWrap}>
                    <Text
                      style={[
                        styles.historyValue,
                        { color: colors.foreground },
                      ]}
                    >
                      {r.value}
                      <Text
                        style={[
                          styles.historyUnit,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {" "}
                        {meta.unit}
                      </Text>
                    </Text>
                    <View
                      style={[
                        styles.historyStatusDot,
                        { backgroundColor: statusColor },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
            <Text
              style={[styles.hint, { color: colors.mutedForeground }]}
            >
              اضغط مطولاً على القراءة لحذفها
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Edit modal */}
      <Modal
        visible={editing !== null}
        transparent
        animationType="fade"
        onRequestClose={closeEdit}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={closeEdit}
          style={styles.modalBackdrop}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalCenterWrap}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                {editingMeta && (
                  <>
                    <View style={styles.modalHeader}>
                      <View
                        style={[
                          styles.modalIconWrap,
                          {
                            backgroundColor: a[editingMeta.accentKey].bg,
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={editingMeta.iconName as any}
                          size={24}
                          color={a[editingMeta.accentKey].color}
                        />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={[
                            styles.modalTitle,
                            { color: colors.foreground },
                          ]}
                          numberOfLines={1}
                        >
                          {editingMeta.label_ar}
                        </Text>
                        <Text
                          style={[
                            styles.modalHint,
                            { color: colors.mutedForeground },
                          ]}
                          numberOfLines={1}
                        >
                          أدخل القراءة الجديدة بـ {editingMeta.unit}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.inputWrap,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <TextInput
                        value={inputValue}
                        onChangeText={setInputValue}
                        placeholder={editingMeta.defaultValue}
                        placeholderTextColor={colors.mutedForeground}
                        keyboardType={
                          editingMeta.type === "blood_pressure"
                            ? "default"
                            : "decimal-pad"
                        }
                        autoFocus
                        style={[
                          styles.input,
                          { color: colors.foreground },
                        ]}
                      />
                      <Text
                        style={[
                          styles.inputUnit,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {editingMeta.unit}
                      </Text>
                    </View>

                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        onPress={closeEdit}
                        activeOpacity={0.7}
                        style={[
                          styles.modalBtn,
                          styles.modalBtnGhost,
                          { borderColor: colors.border },
                        ]}
                      >
                        <Text
                          style={[
                            styles.modalBtnText,
                            { color: colors.foreground },
                          ]}
                        >
                          إلغاء
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleSave}
                        activeOpacity={0.85}
                        style={[
                          styles.modalBtn,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <Text
                          style={[styles.modalBtnText, { color: "#ffffff" }]}
                        >
                          حفظ
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  intro: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
    writingDirection: "rtl",
    lineHeight: 20,
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 28,
  },
  vitalCard: {
    flexBasis: "47%",
    flexGrow: 1,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  vitalTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  vitalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  vitalLabel: {
    fontSize: 12.5,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: 4,
  },
  vitalValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  vitalValue: {
    fontSize: 22,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  vitalUnit: {
    fontSize: 11,
    fontFamily: "IBMPlexSansArabic_500Medium",
  },
  vitalStatus: {
    fontSize: 11.5,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: 4,
  },
  sparkRow: {
    marginTop: 8,
    alignItems: "flex-start",
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: 12,
  },
  emptyState: {
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14.5,
    fontFamily: "IBMPlexSansArabic_700Bold",
    marginTop: 6,
  },
  emptyText: {
    fontSize: 12.5,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "center",
  },
  historyRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  historyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  historyLabel: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
    writingDirection: "rtl",
  },
  historyDate: {
    fontSize: 11.5,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: 2,
  },
  historyValueWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  historyValue: {
    fontSize: 14.5,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  historyUnit: {
    fontSize: 11,
    fontFamily: "IBMPlexSansArabic_500Medium",
  },
  historyStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  hint: {
    fontSize: 11.5,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "center",
    marginTop: 6,
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  modalCenterWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalContent: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  modalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
    writingDirection: "rtl",
  },
  modalHint: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: 2,
  },
  inputWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontFamily: "IBMPlexSansArabic_700Bold",
    paddingVertical: 12,
    textAlign: "right",
    writingDirection: "rtl",
  },
  inputUnit: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_500Medium",
    marginEnd: 8,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  modalBtnText: {
    fontSize: 14.5,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
});
