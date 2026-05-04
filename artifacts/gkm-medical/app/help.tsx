import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform, Alert } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

const FAQ = [
  {
    q: "كيف أحجز موعد مع طبيب؟",
    a: "اذهب إلى تبويب الأطباء، اختر التخصص المناسب، ثم اختر الطبيب وحدد التاريخ والوقت المناسبين لك ثم اضغط على زر تأكيد الحجز.",
  },
  {
    q: "هل يمكنني إلغاء أو تعديل الموعد؟",
    a: "نعم، يمكنك إلغاء أو تعديل أي موعد قبل ساعتين على الأقل من موعده من خلال صفحة المواعيد.",
  },
  {
    q: "كيف أتواصل مع الطبيب بعد الحجز؟",
    a: "بعد تأكيد الحجز، ستجد محادثة جديدة في تبويب الرسائل تتيح لك التواصل المباشر مع الطبيب.",
  },
  {
    q: "متى تظهر نتائج التحاليل؟",
    a: "تظهر نتائج التحاليل عادة خلال 24 إلى 72 ساعة من إجراء الفحص، وستصلك إشعار فور توفرها.",
  },
  {
    q: "هل بياناتي الطبية آمنة؟",
    a: "نعم، نستخدم أعلى معايير التشفير وحماية البيانات، ولا يتم مشاركة معلوماتك مع أي طرف ثالث دون إذنك.",
  },
];

export default function HelpScreen() {
  const colors = useColors();
  const [open, setOpen] = useState<number | null>(0);

  const contact = (kind: "phone" | "email" | "whatsapp") => {
    const targets = {
      phone: "tel:+00249908123165",
      email: "mailto:lordsosox9@gmail.com",
      whatsapp: "https://wa.me/00249908123165",
    };
    Linking.openURL(targets[kind]).catch(() => {
      const msg = "تعذّر فتح الرابط";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("خطأ", msg);
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
    >
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>تواصل معنا</Text>
      <View style={styles.contactRow}>
        <ContactBtn icon="phone" label="اتصال" color="#16a34a" bg="#e7f7ee" onPress={() => contact("phone")} />
        <ContactBtn icon="mail" label="بريد" color="#1e6bf0" bg="#e8f0ff" onPress={() => contact("email")} />
        <ContactBtn icon="message-circle" label="واتساب" color="#25D366" bg="#e7f9ee" onPress={() => contact("whatsapp")} />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 24 }]}>
        الأسئلة الشائعة
      </Text>
      <View style={[styles.faqCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {FAQ.map((item, idx) => {
          const isOpen = open === idx;
          return (
            <View key={idx} style={[idx < FAQ.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={styles.faqHead}
                onPress={() => setOpen(isOpen ? null : idx)}
                activeOpacity={0.7}
              >
                <Text style={[styles.faqQ, { color: colors.foreground }]}>{item.q}</Text>
                <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
              {isOpen && (
                <Text style={[styles.faqA, { color: colors.mutedForeground }]}>{item.a}</Text>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function ContactBtn({ icon, label, color, bg, onPress }: { icon: keyof typeof Feather.glyphMap; label: string; color: string; bg: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.contactBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={[styles.contactIcon, { backgroundColor: bg }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.contactLabel, { color: colors.foreground }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionLabel: { fontSize: 12, fontFamily: "IBMPlexSansArabic_700Bold", textAlign: "right", marginBottom: 10, paddingHorizontal: 4 },
  contactRow: { flexDirection: "row", gap: 12 },
  contactBtn: {
    flex: 1, alignItems: "center", padding: 16, borderRadius: 16, borderWidth: 1, gap: 8,
  },
  contactIcon: {
    width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center",
  },
  contactLabel: { fontSize: 13, fontFamily: "IBMPlexSansArabic_700Bold" },
  faqCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  faqHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, gap: 12 },
  faqQ: { flex: 1, fontSize: 14, fontFamily: "IBMPlexSansArabic_700Bold", textAlign: "right" },
  faqA: { fontSize: 13, fontFamily: "IBMPlexSansArabic_500Medium", textAlign: "right", lineHeight: 22, paddingHorizontal: 16, paddingBottom: 16 },
});
