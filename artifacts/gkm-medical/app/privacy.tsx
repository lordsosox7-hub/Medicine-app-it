import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useColors } from "@/hooks/useColors";

const SECTIONS = [
  {
    title: "1. جمع المعلومات",
    body: "نقوم بجمع المعلومات التي تقدمها لنا مباشرة عند إنشاء حسابك، مثل الاسم، البريد الإلكتروني، رقم الهاتف، وعنوان السكن. كما نجمع البيانات الطبية التي تشاركها معنا أو مع الأطباء عبر التطبيق.",
  },
  {
    title: "2. استخدام المعلومات",
    body: "نستخدم معلوماتك لتقديم الخدمات الطبية، تأكيد المواعيد، إرسال الإشعارات والتذكيرات، تحسين تجربتك في التطبيق، والتواصل معك بشأن حسابك.",
  },
  {
    title: "3. حماية البيانات",
    body: "نتبع أعلى معايير الأمان لحماية معلوماتك، بما في ذلك التشفير الكامل أثناء النقل والتخزين. لا يتم مشاركة بياناتك الطبية مع أي طرف ثالث دون موافقتك الصريحة.",
  },
  {
    title: "4. حقوقك",
    body: "لديك الحق في الوصول إلى بياناتك، تعديلها، أو طلب حذفها في أي وقت. يمكنك أيضاً سحب موافقتك على أي معالجة من خلال إعدادات الحساب أو التواصل مع الدعم.",
  },
  {
    title: "5. ملفات تعريف الارتباط",
    body: "قد نستخدم ملفات تعريف الارتباط وتقنيات مماثلة لتحسين أداء التطبيق وتجربة المستخدم. يمكنك التحكم في هذه الإعدادات من جهازك.",
  },
  {
    title: "6. التحديثات على السياسة",
    body: "قد نقوم بتحديث هذه السياسة من وقت لآخر. سيتم إشعارك بأي تغييرات جوهرية عبر التطبيق أو البريد الإلكتروني.",
  },
  {
    title: "7. التواصل معنا",
    body: "إذا كان لديك أي استفسار حول سياسة الخصوصية، يمكنك التواصل معنا عبر البريد الإلكتروني: privacy@gkm-medical.app",
  },
];

export default function PrivacyScreen() {
  const colors = useColors();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
    >
      <Text style={[styles.intro, { color: colors.mutedForeground }]}>
        آخر تحديث: 1 يناير 2026
      </Text>
      <Text style={[styles.preface, { color: colors.foreground }]}>
        نحرص في GKM للرعاية الطبية على حماية خصوصيتك وسرية معلوماتك الطبية. توضح هذه السياسة كيف نقوم بجمع، استخدام، وحماية بياناتك.
      </Text>
      {SECTIONS.map((s, i) => (
        <View
          key={i}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>{s.title}</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>{s.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  intro: {
    fontSize: 12, fontFamily: "Tajawal_500Medium", textAlign: "right", marginBottom: 8,
  },
  preface: {
    fontSize: 14, fontFamily: "Tajawal_500Medium", textAlign: "right", lineHeight: 22, marginBottom: 20,
  },
  card: {
    padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12,
  },
  title: {
    fontSize: 15, fontFamily: "Tajawal_700Bold", textAlign: "right", marginBottom: 8,
  },
  body: {
    fontSize: 13, fontFamily: "Tajawal_500Medium", textAlign: "right", lineHeight: 22,
  },
});
