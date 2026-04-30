import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

type IconNode = React.ReactNode;

type Service = {
  key: string;
  label: string;
  subtitle: string;
  iconNode: IconNode;
  iconColor: string;
  iconBg: string;
  onPress: () => void;
};

type ServiceGroup = {
  title: string;
  services: Service[];
};

export default function AllServicesScreen() {
  const router = useRouter();
  const colors = useColors();
  const a = colors.accents;

  const dial911 = () => {
    const url = Platform.OS === "android" ? "tel:911" : "telprompt:911";
    Linking.openURL(url).catch(() => {
      Alert.alert("تعذّر إجراء المكالمة", "يرجى المحاولة مرة أخرى.");
    });
  };

  const groups: ServiceGroup[] = [
    {
      title: "الرعاية الطبية",
      services: [
        {
          key: "book",
          label: "احجز موعد",
          subtitle: "مع أفضل الأطباء",
          iconNode: <Feather name="calendar" size={22} color={a.blue.color} />,
          iconColor: a.blue.color,
          iconBg: a.blue.bg,
          onPress: () => router.push("/(tabs)/my-doctor"),
        },
        {
          key: "appointments",
          label: "مواعيدي",
          subtitle: "المواعيد القادمة والسابقة",
          iconNode: <Feather name="clock" size={22} color={a.amber.color} />,
          iconColor: a.amber.color,
          iconBg: a.amber.bg,
          onPress: () => router.push("/(tabs)/appointments"),
        },
        {
          key: "chats",
          label: "المحادثات",
          subtitle: "تواصل مع طبيبك",
          iconNode: <Feather name="message-circle" size={22} color={a.teal.color} />,
          iconColor: a.teal.color,
          iconBg: a.teal.bg,
          onPress: () => router.push("/(tabs)/chats"),
        },
        {
          key: "favorites",
          label: "المفضلة",
          subtitle: "أطباؤك المفضلون",
          iconNode: <Feather name="heart" size={22} color={a.rose.color} />,
          iconColor: a.rose.color,
          iconBg: a.rose.bg,
          onPress: () => router.push("/favorites"),
        },
      ],
    },
    {
      title: "السجل الصحي",
      services: [
        {
          key: "vitals",
          label: "المؤشرات الصحية",
          subtitle: "ضغط، نبض، سكر...",
          iconNode: <Feather name="activity" size={22} color={a.rose.color} />,
          iconColor: a.rose.color,
          iconBg: a.rose.bg,
          onPress: () => router.push("/vitals"),
        },
        {
          key: "lab",
          label: "نتائج التحاليل",
          subtitle: "تحاليل الدم والبول",
          iconNode: (
            <MaterialCommunityIcons name="test-tube" size={22} color={a.purple.color} />
          ),
          iconColor: a.purple.color,
          iconBg: a.purple.bg,
          onPress: () => router.push("/lab-results"),
        },
        {
          key: "meds",
          label: "الأدوية",
          subtitle: "وصفاتك الطبية",
          iconNode: (
            <MaterialCommunityIcons name="pill" size={22} color={a.teal.color} />
          ),
          iconColor: a.teal.color,
          iconBg: a.teal.bg,
          onPress: () => router.push("/medications"),
        },
        {
          key: "file",
          label: "الملف الطبي",
          subtitle: "سجلك الكامل",
          iconNode: (
            <MaterialCommunityIcons name="clipboard-pulse" size={22} color={a.indigo.color} />
          ),
          iconColor: a.indigo.color,
          iconBg: a.indigo.bg,
          onPress: () => router.push("/medical-file"),
        },
      ],
    },
    {
      title: "حسابي",
      services: [
        {
          key: "profile",
          label: "الملف الشخصي",
          subtitle: "بياناتك ومعلوماتك",
          iconNode: <Feather name="user" size={22} color={a.blue.color} />,
          iconColor: a.blue.color,
          iconBg: a.blue.bg,
          onPress: () => router.push("/profile"),
        },
        {
          key: "address",
          label: "العنوان",
          subtitle: "عنوانك للتوصيل",
          iconNode: <Feather name="map-pin" size={22} color={a.amber.color} />,
          iconColor: a.amber.color,
          iconBg: a.amber.bg,
          onPress: () => router.push("/address"),
        },
        {
          key: "payments",
          label: "المدفوعات",
          subtitle: "سجل الفواتير والدفع",
          iconNode: <Feather name="credit-card" size={22} color={a.purple.color} />,
          iconColor: a.purple.color,
          iconBg: a.purple.bg,
          onPress: () => router.push("/payments"),
        },
        {
          key: "notifications",
          label: "الإشعارات",
          subtitle: "تنبيهات ومتابعات",
          iconNode: (
            <Ionicons name="notifications-outline" size={22} color={a.rose.color} />
          ),
          iconColor: a.rose.color,
          iconBg: a.rose.bg,
          onPress: () => router.push("/notifications"),
        },
      ],
    },
    {
      title: "المساعدة",
      services: [
        {
          key: "help",
          label: "المساعدة والدعم",
          subtitle: "أسئلة شائعة وتواصل",
          iconNode: <Feather name="help-circle" size={22} color={a.teal.color} />,
          iconColor: a.teal.color,
          iconBg: a.teal.bg,
          onPress: () => router.push("/help"),
        },
        {
          key: "emergency",
          label: "الطوارئ",
          subtitle: "اتصل بـ 911",
          iconNode: (
            <MaterialCommunityIcons name="ambulance" size={22} color={a.red.color} />
          ),
          iconColor: a.red.color,
          iconBg: a.red.bg,
          onPress: () => {
            Alert.alert(
              "اتصال الطوارئ",
              "هل تريد الاتصال بالرقم 911؟",
              [
                { text: "إلغاء", style: "cancel" },
                { text: "اتصل", style: "destructive", onPress: dial911 },
              ],
              { cancelable: true }
            );
          },
        },
      ],
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {groups.map((group) => (
        <View key={group.title} style={styles.group}>
          <Text style={[styles.groupTitle, { color: colors.foreground }]}>
            {group.title}
          </Text>
          <View
            style={[
              styles.groupCard,
              {
                backgroundColor: colors.card,
                borderRadius: colors.radius,
                borderColor: colors.border,
                shadowColor: colors.foreground,
              },
            ]}
          >
            {group.services.map((service, idx) => (
              <TouchableOpacity
                key={service.key}
                onPress={service.onPress}
                activeOpacity={0.7}
                style={[
                  styles.row,
                  idx < group.services.length - 1 && {
                    borderBottomColor: colors.border,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <View style={[styles.rowIcon, { backgroundColor: service.iconBg }]}>
                  {service.iconNode}
                </View>
                <View style={styles.rowText}>
                  <Text
                    style={[styles.rowLabel, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {service.label}
                  </Text>
                  <Text
                    style={[styles.rowSubtitle, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {service.subtitle}
                  </Text>
                </View>
                <Feather
                  name="chevron-left"
                  size={20}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  group: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
    marginBottom: 10,
    marginEnd: 4,
  },
  groupCard: {
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
  },
  rowSubtitle: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_400Regular",
    textAlign: "right",
    marginTop: 2,
  },
});
