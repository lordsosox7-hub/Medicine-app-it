import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Platform, Alert } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { getPaymentMethods, setPaymentMethods, PaymentMethod } from "@/lib/preferences";

const TYPE_LABELS: Record<PaymentMethod["type"], string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  mada: "مدى",
  applepay: "Apple Pay",
};

const TYPE_COLORS: Record<PaymentMethod["type"], string> = {
  visa: "#1a1f71",
  mastercard: "#eb001b",
  mada: "#84bd00",
  applepay: "#000",
};

export default function PaymentsScreen() {
  const colors = useColors();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState<PaymentMethod["type"]>("visa");
  const [newNumber, setNewNumber] = useState("");
  const [newHolder, setNewHolder] = useState("");

  useEffect(() => {
    getPaymentMethods().then(setMethods);
  }, []);

  const onAdd = async () => {
    if (newNumber.length < 4 || !newHolder.trim()) {
      const msg = "الرجاء إدخال رقم البطاقة واسم حاملها";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("تنبيه", msg);
      return;
    }
    const m: PaymentMethod = {
      id: Date.now().toString(),
      type: newType,
      last4: newNumber.slice(-4),
      holderName: newHolder.trim(),
    };
    const next = [...methods, m];
    setMethods(next);
    await setPaymentMethods(next);
    setNewNumber("");
    setNewHolder("");
    setShowAdd(false);
  };

  const onRemove = async (id: string) => {
    const doRemove = async () => {
      const next = methods.filter((m) => m.id !== id);
      setMethods(next);
      await setPaymentMethods(next);
    };
    if (Platform.OS === "web") {
      if (window.confirm("حذف وسيلة الدفع؟")) await doRemove();
    } else {
      Alert.alert("حذف", "هل تريد حذف وسيلة الدفع؟", [
        { text: "إلغاء", style: "cancel" },
        { text: "حذف", style: "destructive", onPress: doRemove },
      ]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {methods.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
              <Feather name="credit-card" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              لا توجد وسائل دفع
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              أضف بطاقتك الائتمانية لتسهيل عملية الدفع
            </Text>
          </View>
        ) : (
          methods.map((m) => (
            <View
              key={m.id}
              style={[styles.cardItem, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.brand, { backgroundColor: TYPE_COLORS[m.type] }]}>
                <Text style={styles.brandText}>{TYPE_LABELS[m.type]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardNumber, { color: colors.foreground }]}>
                  •••• •••• •••• {m.last4}
                </Text>
                <Text style={[styles.cardHolder, { color: colors.mutedForeground }]}>{m.holderName}</Text>
              </View>
              <TouchableOpacity onPress={() => onRemove(m.id)} hitSlop={10}>
                <Feather name="trash-2" size={18} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          ))
        )}

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
          onPress={() => setShowAdd(true)}
        >
          <Feather name="plus" size={18} color={colors.primaryForeground} />
          <Text style={[styles.addText, { color: colors.primaryForeground }]}>إضافة وسيلة دفع</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>إضافة وسيلة دفع</Text>

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>نوع البطاقة</Text>
            <View style={styles.typeRow}>
              {(Object.keys(TYPE_LABELS) as PaymentMethod["type"][]).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setNewType(t)}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: newType === t ? colors.primary : colors.muted,
                    },
                  ]}
                >
                  <Text style={{ color: newType === t ? colors.primaryForeground : colors.foreground, fontFamily: "Tajawal_700Bold", fontSize: 12 }}>
                    {TYPE_LABELS[t]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>رقم البطاقة</Text>
            <TextInput
              value={newNumber}
              onChangeText={(v) => setNewNumber(v.replace(/\D/g, "").slice(0, 16))}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="number-pad"
              style={[styles.modalInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            />

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>اسم حامل البطاقة</Text>
            <TextInput
              value={newHolder}
              onChangeText={setNewHolder}
              placeholder="الاسم كما هو على البطاقة"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.modalInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            />

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

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: {
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Tajawal_700Bold",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Tajawal_500Medium",
    textAlign: "center",
  },
  cardItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  brand: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  brandText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Tajawal_700Bold",
  },
  cardNumber: {
    fontSize: 15,
    fontFamily: "Tajawal_700Bold",
    textAlign: "right",
    letterSpacing: 1,
  },
  cardHolder: {
    fontSize: 12,
    fontFamily: "Tajawal_500Medium",
    textAlign: "right",
    marginTop: 2,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 14,
    gap: 8,
    marginTop: 20,
  },
  addText: {
    fontSize: 15,
    fontFamily: "Tajawal_700Bold",
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Tajawal_700Bold",
    textAlign: "right",
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Tajawal_700Bold",
    textAlign: "right",
    marginBottom: 6,
    marginTop: 4,
  },
  modalInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: "Tajawal_500Medium",
    textAlign: "right",
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnText: {
    fontSize: 14,
    fontFamily: "Tajawal_700Bold",
  },
});
