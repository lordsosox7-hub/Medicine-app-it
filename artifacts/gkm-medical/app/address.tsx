import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Platform, Alert } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { getAddresses, setAddresses, Address } from "@/lib/preferences";

export default function AddressScreen() {
  const colors = useColors();
  const [addresses, setList] = useState<Address[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [label, setLabel] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [street, setStreet] = useState("");

  useEffect(() => {
    getAddresses().then(setList);
  }, []);

  const onAdd = async () => {
    if (!label.trim() || !city.trim() || !street.trim()) {
      const msg = "الرجاء تعبئة الحقول المطلوبة";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("تنبيه", msg);
      return;
    }
    const next: Address[] = [
      ...addresses,
      {
        id: Date.now().toString(),
        label: label.trim(),
        city: city.trim(),
        district: district.trim(),
        street: street.trim(),
        isDefault: addresses.length === 0,
      },
    ];
    setList(next);
    await setAddresses(next);
    setLabel("");
    setCity("");
    setDistrict("");
    setStreet("");
    setShowAdd(false);
  };

  const onRemove = async (id: string) => {
    const doRemove = async () => {
      const next = addresses.filter((a) => a.id !== id);
      if (next.length > 0 && !next.some((a) => a.isDefault)) next[0].isDefault = true;
      setList(next);
      await setAddresses(next);
    };
    if (Platform.OS === "web") {
      if (window.confirm("حذف العنوان؟")) await doRemove();
    } else {
      Alert.alert("حذف", "هل تريد حذف العنوان؟", [
        { text: "إلغاء", style: "cancel" },
        { text: "حذف", style: "destructive", onPress: doRemove },
      ]);
    }
  };

  const onSetDefault = async (id: string) => {
    const next = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    setList(next);
    await setAddresses(next);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {addresses.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
              <Feather name="map-pin" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد عناوين</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              أضف عنوانك لاستقبال الزيارات المنزلية
            </Text>
          </View>
        ) : (
          addresses.map((a) => (
            <View
              key={a.id}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={styles.cardHead}>
                <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
                  <Feather name="map-pin" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={[styles.label, { color: colors.foreground }]}>{a.label}</Text>
                    {a.isDefault && (
                      <View style={[styles.defaultBadge, { backgroundColor: colors.primarySoft }]}>
                        <Text style={[styles.defaultText, { color: colors.primary }]}>افتراضي</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.addressLine, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {a.street}، {a.district ? `${a.district}، ` : ""}{a.city}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => onRemove(a.id)} hitSlop={10}>
                  <Feather name="trash-2" size={18} color={colors.destructive} />
                </TouchableOpacity>
              </View>
              {!a.isDefault && (
                <TouchableOpacity
                  style={[styles.setDefault, { borderTopColor: colors.border }]}
                  onPress={() => onSetDefault(a.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.setDefaultText, { color: colors.primary }]}>
                    تعيين كعنوان افتراضي
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
          onPress={() => setShowAdd(true)}
        >
          <Feather name="plus" size={18} color={colors.primaryForeground} />
          <Text style={[styles.addText, { color: colors.primaryForeground }]}>إضافة عنوان جديد</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>عنوان جديد</Text>

            <FormInput label="اسم العنوان (المنزل، العمل...)" value={label} onChange={setLabel} placeholder="المنزل" />
            <FormInput label="المدينة" value={city} onChange={setCity} placeholder="الرياض" />
            <FormInput label="الحي" value={district} onChange={setDistrict} placeholder="حي العليا" />
            <FormInput label="الشارع" value={street} onChange={setStreet} placeholder="شارع الملك فهد" />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.muted }]}
                onPress={() => setShowAdd(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={onAdd}
              >
                <Text style={[styles.modalBtnText, { color: colors.primaryForeground }]}>حفظ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function FormInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.modalInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { alignItems: "center", paddingVertical: 50 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontFamily: "IBMPlexSansArabic_700Bold", marginBottom: 6 },
  emptyText: { fontSize: 13, fontFamily: "IBMPlexSansArabic_500Medium", textAlign: "center" },
  card: { borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  cardHead: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 15, fontFamily: "IBMPlexSansArabic_700Bold", textAlign: "right" },
  defaultBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  defaultText: { fontSize: 10, fontFamily: "IBMPlexSansArabic_700Bold" },
  addressLine: { fontSize: 12, fontFamily: "IBMPlexSansArabic_500Medium", textAlign: "right", marginTop: 4, lineHeight: 18 },
  setDefault: { padding: 12, alignItems: "center", borderTopWidth: 1 },
  setDefaultText: { fontSize: 13, fontFamily: "IBMPlexSansArabic_700Bold" },
  addBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    height: 52, borderRadius: 14, gap: 8, marginTop: 20,
  },
  addText: { fontSize: 15, fontFamily: "IBMPlexSansArabic_700Bold" },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalCard: { padding: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
  modalTitle: { fontSize: 18, fontFamily: "IBMPlexSansArabic_700Bold", textAlign: "right", marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontFamily: "IBMPlexSansArabic_700Bold", textAlign: "right", marginBottom: 6 },
  modalInput: {
    height: 48, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14,
    fontSize: 14, fontFamily: "IBMPlexSansArabic_500Medium", textAlign: "right",
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 16 },
  modalBtn: { flex: 1, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  modalBtnText: { fontSize: 14, fontFamily: "IBMPlexSansArabic_700Bold" },
});
