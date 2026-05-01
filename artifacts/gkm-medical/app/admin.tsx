import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import {
  useAllAppointments,
  useDoctors,
  useMessages,
  useRealtimeMessages,
  usePendingPayments,
  useUpdatePaymentStatus,
  useCreateDoctor,
  useUpdateDoctor,
  useDeleteDoctor,
  useAdminUsers,
  useDeleteUser,
  useAllConversations,
  type AdminUser,
  type NewDoctorInput,
} from "@/hooks/useGkmData";
import type { Appointment, Payment, Doctor, Conversation } from "@/lib/supabase";
import {
  isAdminLoggedIn,
  logoutAdmin,
  getAdminCredentials,
  updateAdminCredentials,
} from "@/lib/adminAuth";

// ====================================================================
// Tab definitions
// ====================================================================

type AdminTab =
  | "doctors"
  | "users"
  | "chats"
  | "appointments"
  | "payments"
  | "revenue"
  | "settings";

const TABS: Array<{
  id: AdminTab;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}> = [
  { id: "doctors", label: "الأطباء", icon: "user-plus" },
  { id: "users", label: "المرضى", icon: "users" },
  { id: "chats", label: "المحادثات", icon: "message-square" },
  { id: "appointments", label: "المواعيد", icon: "calendar" },
  { id: "payments", label: "المدفوعات", icon: "credit-card" },
  { id: "revenue", label: "الإيرادات", icon: "trending-up" },
  { id: "settings", label: "الإعدادات", icon: "settings" },
];

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  bankak: "بنكك",
  fawry: "فوري",
  ocash: "اوكاش",
  my_cashy: "ماي كاشي",
  cash: "نقداً",
};

const APPT_STATUS_LABEL: Record<Appointment["status"], string> = {
  upcoming: "قادم",
  completed: "مكتمل",
  cancelled: "ملغى",
};

const CATEGORY_LABEL: Record<string, string> = {
  heart: "قلب",
  dental: "أسنان",
  kids: "أطفال",
  women: "نساء",
  general: "عام",
};

const CATEGORIES: Doctor["category"][] = [
  "heart",
  "dental",
  "kids",
  "women",
  "general",
];

// ====================================================================
// Top-level screen with auth gate
// ====================================================================

export default function AdminScreen() {
  const colors = useColors();
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>("doctors");
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    isAdminLoggedIn().then((ok) => {
      if (!ok) {
        router.replace("/admin-login");
      } else {
        setAuthChecked(true);
      }
    });
  }, [router]);

  if (!authChecked) {
    return (
      <View
        style={[
          styles.fullCenter,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "لوحة التحكم",
          headerShown: true,
          headerRight: () => (
            <Pressable
              onPress={async () => {
                await logoutAdmin();
                router.replace("/admin-login");
              }}
              hitSlop={8}
              style={{ paddingHorizontal: 16, flexDirection: "row-reverse", alignItems: "center", gap: 6 }}
              accessibilityLabel="تسجيل الخروج"
            >
              <Feather name="log-out" size={18} color={colors.danger} />
            </Pressable>
          ),
        }}
      />
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.tabBarWrap,
            { borderBottomColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBar}
          >
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setTab(t.id)}
                  style={[
                    styles.tabBtn,
                    {
                      backgroundColor: active ? colors.primary : "transparent",
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Feather
                    name={t.icon}
                    size={14}
                    color={active ? colors.primaryForeground : colors.foreground}
                  />
                  <Text
                    style={{
                      color: active ? colors.primaryForeground : colors.foreground,
                      fontFamily: "IBMPlexSansArabic_700Bold",
                      fontSize: 13,
                    }}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {tab === "doctors" && <DoctorsTab />}
        {tab === "users" && <UsersTab />}
        {tab === "chats" && <ChatMonitorTab />}
        {tab === "appointments" && <AppointmentsTab />}
        {tab === "payments" && <PaymentsTab />}
        {tab === "revenue" && <RevenueTab />}
        {tab === "settings" && <SettingsTab />}
      </View>
    </>
  );
}

// ====================================================================
// Doctors tab — add / edit / delete
// ====================================================================

function emptyDoctor(): NewDoctorInput {
  return {
    name_ar: "",
    specialty_ar: "",
    category: "general",
    photo_url: null,
    rating: 4.5,
    years_experience: 0,
    about_ar: "",
    services_ar: [],
    price: 150,
    clinic_name_ar: "",
    clinic_address_ar: "",
    clinic_phone: "",
    clinic_maps_url: "",
  };
}

function DoctorsTab() {
  const colors = useColors();
  const { data: doctors, isLoading } = useDoctors();
  const deleteDoctor = useDeleteDoctor();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const list = doctors ?? [];
    const q = search.trim();
    if (!q) return list;
    return list.filter(
      (d) =>
        d.name_ar.includes(q) ||
        d.specialty_ar.includes(q) ||
        (CATEGORY_LABEL[d.category] ?? "").includes(q),
    );
  }, [doctors, search]);

  const askDelete = (d: Doctor) => {
    const confirmAndDelete = () => deleteDoctor.mutate(d.id);
    if (Platform.OS === "web") {
      // eslint-disable-next-line no-alert
      if (window.confirm(`هل تريد حذف الطبيب "${d.name_ar}"؟ سيتم حذف جميع المواعيد والمحادثات المرتبطة به.`)) {
        confirmAndDelete();
      }
    } else {
      Alert.alert(
        "تأكيد الحذف",
        `هل تريد حذف الطبيب "${d.name_ar}"؟ سيتم حذف جميع المواعيد والمحادثات المرتبطة به.`,
        [
          { text: "إلغاء", style: "cancel" },
          { text: "حذف", style: "destructive", onPress: confirmAndDelete },
        ],
      );
    }
  };

  return (
    <>
      <View style={styles.toolbar}>
        <View
          style={[
            styles.searchWrap,
            { backgroundColor: colors.input, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث بالاسم أو التخصص..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
        </View>
        <Pressable
          onPress={() => {
            setEditing(null);
            setEditorOpen(true);
          }}
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={16} color={colors.primaryForeground} />
          <Text
            style={{
              color: colors.primaryForeground,
              fontFamily: "IBMPlexSansArabic_700Bold",
              fontSize: 13,
            }}
          >
            إضافة طبيب
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="user-x" size={42} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            لا يوجد أطباء حالياً.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(d) => d.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.rowReverse}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.cardTitle, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {item.name_ar}
                  </Text>
                  <Text
                    style={[
                      styles.cardSub,
                      { color: colors.mutedForeground },
                    ]}
                    numberOfLines={1}
                  >
                    {item.specialty_ar} • {CATEGORY_LABEL[item.category] ?? item.category}
                  </Text>
                </View>
                <View
                  style={[
                    styles.pill,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontFamily: "IBMPlexSansArabic_700Bold",
                      fontSize: 12,
                    }}
                  >
                    {item.price} ج.س
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.metaRow}>
                <MetaChip
                  icon="star"
                  text={`${item.rating.toFixed(1)} تقييم`}
                />
                <MetaChip
                  icon="briefcase"
                  text={`${item.years_experience} سنة خبرة`}
                />
                {item.clinic_name_ar && (
                  <MetaChip icon="map-pin" text={item.clinic_name_ar} />
                )}
              </View>

              <View style={styles.actionsRow}>
                <Pressable
                  onPress={() => {
                    setEditing(item);
                    setEditorOpen(true);
                  }}
                  style={[
                    styles.outlineBtn,
                    { borderColor: colors.primary },
                  ]}
                >
                  <Feather name="edit-2" size={14} color={colors.primary} />
                  <Text
                    style={{
                      color: colors.primary,
                      fontFamily: "IBMPlexSansArabic_700Bold",
                      fontSize: 13,
                    }}
                  >
                    تعديل
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => askDelete(item)}
                  style={[
                    styles.outlineBtn,
                    {
                      borderColor: colors.danger,
                      backgroundColor: colors.accents.red.bg,
                    },
                  ]}
                >
                  <Feather name="trash-2" size={14} color={colors.danger} />
                  <Text
                    style={{
                      color: colors.danger,
                      fontFamily: "IBMPlexSansArabic_700Bold",
                      fontSize: 13,
                    }}
                  >
                    حذف
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      <DoctorEditorModal
        visible={editorOpen}
        editing={editing}
        onClose={() => setEditorOpen(false)}
      />
    </>
  );
}

function MetaChip({
  icon,
  text,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.metaChip,
        { backgroundColor: colors.muted, borderColor: colors.border },
      ]}
    >
      <Feather name={icon} size={12} color={colors.mutedForeground} />
      <Text
        style={{
          color: colors.foreground,
          fontFamily: "IBMPlexSansArabic_500Medium",
          fontSize: 12,
        }}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
}

function DoctorEditorModal({
  visible,
  editing,
  onClose,
}: {
  visible: boolean;
  editing: Doctor | null;
  onClose: () => void;
}) {
  const colors = useColors();
  const create = useCreateDoctor();
  const update = useUpdateDoctor();
  const [form, setForm] = useState<NewDoctorInput>(emptyDoctor());
  const [servicesText, setServicesText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (editing) {
        setForm({
          name_ar: editing.name_ar,
          specialty_ar: editing.specialty_ar,
          category: editing.category,
          photo_url: editing.photo_url,
          rating: editing.rating,
          years_experience: editing.years_experience,
          about_ar: editing.about_ar,
          services_ar: editing.services_ar ?? [],
          price: editing.price,
          clinic_name_ar: editing.clinic_name_ar ?? "",
          clinic_address_ar: editing.clinic_address_ar ?? "",
          clinic_phone: editing.clinic_phone ?? "",
          clinic_maps_url: editing.clinic_maps_url ?? "",
        });
        setServicesText((editing.services_ar ?? []).join("، "));
      } else {
        setForm(emptyDoctor());
        setServicesText("");
      }
      setError(null);
    }
  }, [visible, editing]);

  const set = <K extends keyof NewDoctorInput>(key: K, value: NewDoctorInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    if (!form.name_ar.trim() || !form.specialty_ar.trim()) {
      setError("الاسم والتخصص حقول مطلوبة");
      return;
    }
    const services = servicesText
      .split(/[،,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const payload: NewDoctorInput = { ...form, services_ar: services };
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...payload });
      } else {
        await create.mutateAsync(payload);
      }
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "حدث خطأ أثناء الحفظ");
    }
  };

  const busy = create.isPending || update.isPending;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View
          style={[
            styles.modalSheet,
            { backgroundColor: colors.background },
          ]}
        >
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={onClose} hitSlop={8} style={styles.modalClose}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {editing ? "تعديل بيانات الطبيب" : "إضافة طبيب جديد"}
            </Text>
            <View style={{ width: 30 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
            <FormField label="الاسم بالعربي *">
              <BasicInput
                value={form.name_ar}
                onChangeText={(v) => set("name_ar", v)}
                placeholder="د. محمد أحمد"
              />
            </FormField>

            <FormField label="التخصص *">
              <BasicInput
                value={form.specialty_ar}
                onChangeText={(v) => set("specialty_ar", v)}
                placeholder="طب أسنان"
              />
            </FormField>

            <FormField label="القسم">
              <View style={styles.categoryRow}>
                {CATEGORIES.map((c) => {
                  const active = form.category === c;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => set("category", c)}
                      style={[
                        styles.catChip,
                        {
                          backgroundColor: active
                            ? colors.primary
                            : colors.primarySoft,
                          borderColor: active ? colors.primary : "transparent",
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: active
                            ? colors.primaryForeground
                            : colors.primary,
                          fontFamily: "IBMPlexSansArabic_700Bold",
                          fontSize: 13,
                        }}
                      >
                        {CATEGORY_LABEL[c] ?? c}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </FormField>

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <FormField label="السعر (ج.س)">
                  <BasicInput
                    value={String(form.price)}
                    onChangeText={(v) => set("price", Number(v) || 0)}
                    keyboardType="numeric"
                    placeholder="150"
                  />
                </FormField>
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="سنوات الخبرة">
                  <BasicInput
                    value={String(form.years_experience)}
                    onChangeText={(v) => set("years_experience", Number(v) || 0)}
                    keyboardType="numeric"
                    placeholder="5"
                  />
                </FormField>
              </View>
            </View>

            <FormField label="التقييم (0-5)">
              <BasicInput
                value={String(form.rating)}
                onChangeText={(v) =>
                  set("rating", Math.max(0, Math.min(5, Number(v) || 0)))
                }
                keyboardType="numeric"
                placeholder="4.5"
              />
            </FormField>

            <FormField label="رابط الصورة">
              <BasicInput
                value={form.photo_url ?? ""}
                onChangeText={(v) => set("photo_url", v || null)}
                placeholder="https://..."
                autoCapitalize="none"
              />
            </FormField>

            <FormField label="نبذة">
              <BasicInput
                value={form.about_ar}
                onChangeText={(v) => set("about_ar", v)}
                placeholder="نبذة تعريفية عن الطبيب"
                multiline
                numberOfLines={3}
              />
            </FormField>

            <FormField label="الخدمات (افصل بفاصلة)">
              <BasicInput
                value={servicesText}
                onChangeText={setServicesText}
                placeholder="تنظيف، حشوات، تركيبات"
                multiline
                numberOfLines={2}
              />
            </FormField>

            <FormField label="اسم العيادة">
              <BasicInput
                value={form.clinic_name_ar ?? ""}
                onChangeText={(v) => set("clinic_name_ar", v)}
                placeholder="عيادة الشفاء"
              />
            </FormField>

            <FormField label="عنوان العيادة">
              <BasicInput
                value={form.clinic_address_ar ?? ""}
                onChangeText={(v) => set("clinic_address_ar", v)}
                placeholder="شارع المستشفى، الخرطوم"
              />
            </FormField>

            <FormField label="هاتف العيادة">
              <BasicInput
                value={form.clinic_phone ?? ""}
                onChangeText={(v) => set("clinic_phone", v)}
                placeholder="+249912345678"
                keyboardType="phone-pad"
              />
            </FormField>

            {error && (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: colors.accents.red.bg,
                    borderColor: colors.danger,
                  },
                ]}
              >
                <Feather name="alert-circle" size={14} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {error}
                </Text>
              </View>
            )}

            <Pressable
              onPress={submit}
              disabled={busy}
              style={[
                styles.submitBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: busy ? 0.7 : 1,
                },
              ]}
            >
              {busy ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text
                  style={{
                    color: colors.primaryForeground,
                    fontFamily: "IBMPlexSansArabic_700Bold",
                    fontSize: 15,
                  }}
                >
                  {editing ? "حفظ التعديلات" : "إضافة الطبيب"}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={{ gap: 6 }}>
      <Text
        style={{
          color: colors.foreground,
          fontFamily: "IBMPlexSansArabic_700Bold",
          fontSize: 13,
          textAlign: "right",
        }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

function BasicInput(props: React.ComponentProps<typeof TextInput>) {
  const colors = useColors();
  const { multiline, style, ...rest } = props;
  return (
    <TextInput
      {...rest}
      multiline={multiline}
      placeholderTextColor={colors.mutedForeground}
      style={[
        {
          backgroundColor: colors.input,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: multiline ? 12 : 0,
          minHeight: multiline ? 72 : 48,
          fontSize: 14,
          fontFamily: "IBMPlexSansArabic_500Medium",
          color: colors.foreground,
          textAlign: "right",
          textAlignVertical: multiline ? "top" : "center",
        },
        style,
      ]}
    />
  );
}

// ====================================================================
// Users tab
// ====================================================================

function UsersTab() {
  const colors = useColors();
  const { data: users, isLoading } = useAdminUsers();
  const deleteUser = useDeleteUser();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const list = users ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (u) =>
        u.user_id.toLowerCase().includes(q) ||
        (u.full_name_ar ?? "").toLowerCase().includes(q),
    );
  }, [users, search]);

  const askDelete = (u: AdminUser) => {
    const name = u.full_name_ar ?? `المستخدم ${u.user_id.slice(0, 8)}`;
    const run = () => deleteUser.mutate(u.user_id);
    if (Platform.OS === "web") {
      // eslint-disable-next-line no-alert
      if (window.confirm(`هل تريد حذف "${name}" وكل بياناته (المواعيد، المدفوعات، المحادثات، الملف الطبي)؟`)) {
        run();
      }
    } else {
      Alert.alert(
        "تأكيد حذف المريض",
        `هل تريد حذف "${name}" وكل بياناته (المواعيد، المدفوعات، المحادثات، الملف الطبي)؟ لا يمكن التراجع.`,
        [
          { text: "إلغاء", style: "cancel" },
          { text: "حذف نهائي", style: "destructive", onPress: run },
        ],
      );
    }
  };

  return (
    <>
      <View style={styles.toolbar}>
        <View
          style={[
            styles.searchWrap,
            { backgroundColor: colors.input, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث بالاسم أو المعرف..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
        </View>
        <View
          style={[
            styles.countBadge,
            { backgroundColor: colors.primarySoft },
          ]}
        >
          <Text
            style={{
              color: colors.primary,
              fontFamily: "IBMPlexSansArabic_700Bold",
              fontSize: 13,
            }}
          >
            {filtered.length}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="users" size={42} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            لا يوجد مستخدمون مسجلون.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(u) => u.user_id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.rowReverse}>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Feather name="user" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={[styles.cardTitle, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {item.full_name_ar ?? "مستخدم بدون اسم"}
                  </Text>
                  <Text
                    style={[
                      styles.cardSub,
                      { color: colors.mutedForeground },
                    ]}
                    numberOfLines={1}
                  >
                    معرف: {item.user_id.slice(0, 8)}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.metaRow}>
                {item.age != null && (
                  <MetaChip icon="calendar" text={`${item.age} سنة`} />
                )}
                {item.gender && <MetaChip icon="user" text={item.gender} />}
                {item.blood_type && (
                  <MetaChip icon="droplet" text={item.blood_type} />
                )}
                <MetaChip
                  icon="bookmark"
                  text={`${item.appointments_count} موعد`}
                />
                <MetaChip
                  icon="message-circle"
                  text={`${item.conversations_count} محادثة`}
                />
              </View>

              {item.last_seen_at && (
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontFamily: "IBMPlexSansArabic_500Medium",
                    fontSize: 11.5,
                    textAlign: "right",
                  }}
                >
                  آخر نشاط: {new Date(item.last_seen_at).toLocaleString("ar")}
                </Text>
              )}

              <View style={styles.actionsRow}>
                <Pressable
                  onPress={() => askDelete(item)}
                  style={[
                    styles.outlineBtn,
                    {
                      borderColor: colors.danger,
                      backgroundColor: colors.accents.red.bg,
                    },
                  ]}
                >
                  <Feather name="trash-2" size={14} color={colors.danger} />
                  <Text
                    style={{
                      color: colors.danger,
                      fontFamily: "IBMPlexSansArabic_700Bold",
                      fontSize: 13,
                    }}
                  >
                    حذف المستخدم
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </>
  );
}

// ====================================================================
// Chat monitor tab
// ====================================================================

function ChatMonitorTab() {
  const colors = useColors();
  const { data: conversations, isLoading } = useAllConversations();
  const [selectedId, setSelectedId] = useState<string>("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const list = conversations ?? [];
    const q = search.trim();
    if (!q) return list;
    return list.filter(
      (c) =>
        (c.doctor?.name_ar ?? "").includes(q) ||
        c.user_id.includes(q) ||
        (c.last_message ?? "").includes(q),
    );
  }, [conversations, search]);

  const selected = useMemo(
    () => filtered.find((c) => c.id === selectedId) ?? null,
    [filtered, selectedId],
  );

  if (selected) {
    return (
      <ConversationViewer
        conversation={selected}
        onBack={() => setSelectedId("")}
      />
    );
  }

  return (
    <>
      <View style={styles.toolbar}>
        <View
          style={[
            styles.searchWrap,
            { backgroundColor: colors.input, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="ابحث في المحادثات..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
        </View>
        <View
          style={[
            styles.countBadge,
            { backgroundColor: colors.primarySoft },
          ]}
        >
          <Text
            style={{
              color: colors.primary,
              fontFamily: "IBMPlexSansArabic_700Bold",
              fontSize: 13,
            }}
          >
            {filtered.length}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Feather
            name="message-square"
            size={42}
            color={colors.mutedForeground}
          />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            لا توجد محادثات حالياً.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelectedId(item.id)}
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.rowReverse}>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Feather
                    name="message-circle"
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={[styles.cardTitle, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {item.doctor?.name_ar ?? "طبيب محذوف"}
                  </Text>
                  <Text
                    style={[
                      styles.cardSub,
                      { color: colors.mutedForeground },
                    ]}
                    numberOfLines={1}
                  >
                    مع المريض {item.user_id.slice(0, 8)}
                  </Text>
                </View>
                <Feather
                  name="chevron-left"
                  size={20}
                  color={colors.mutedForeground}
                />
              </View>

              <View
                style={[
                  styles.lastMsgBox,
                  {
                    backgroundColor: colors.muted,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: colors.foreground,
                    fontFamily: "IBMPlexSansArabic_500Medium",
                    fontSize: 13,
                    textAlign: "right",
                  }}
                  numberOfLines={2}
                >
                  {item.last_message ?? "لم يتم تبادل أي رسائل بعد."}
                </Text>
              </View>

              {item.last_message_at && (
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontFamily: "IBMPlexSansArabic_500Medium",
                    fontSize: 11.5,
                    textAlign: "right",
                  }}
                >
                  {new Date(item.last_message_at).toLocaleString("ar")}
                </Text>
              )}
            </Pressable>
          )}
        />
      )}
    </>
  );
}

function ConversationViewer({
  conversation,
  onBack,
}: {
  conversation: Conversation;
  onBack: () => void;
}) {
  const colors = useColors();
  const { data: messages, isLoading } = useMessages(conversation.id);
  useRealtimeMessages(conversation.id);

  return (
    <View style={styles.flex}>
      <View
        style={[
          styles.viewerHeader,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={onBack} hitSlop={8}>
          <Feather name="chevron-right" size={24} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Text
            style={[styles.cardTitle, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {conversation.doctor?.name_ar ?? "طبيب محذوف"}
          </Text>
          <Text
            style={[styles.cardSub, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            المريض {conversation.user_id.slice(0, 8)}
          </Text>
        </View>
        <View
          style={[
            styles.eyeBadge,
            { backgroundColor: colors.accents.amber.bg },
          ]}
        >
          <Feather name="eye" size={14} color={colors.accents.amber.color} />
          <Text
            style={{
              color: colors.accents.amber.color,
              fontFamily: "IBMPlexSansArabic_700Bold",
              fontSize: 11,
            }}
          >
            مراقبة
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (messages?.length ?? 0) === 0 ? (
        <View style={styles.empty}>
          <Feather name="inbox" size={42} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            لا توجد رسائل في هذه المحادثة.
          </Text>
        </View>
      ) : (
        <FlatList
          data={messages ?? []}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => {
            const isDoctor = item.sender === "doctor";
            return (
              <View
                style={[
                  styles.msgBubble,
                  {
                    alignSelf: isDoctor ? "flex-start" : "flex-end",
                    backgroundColor: isDoctor
                      ? colors.primarySoft
                      : colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: isDoctor ? colors.primary : colors.mutedForeground,
                    fontFamily: "IBMPlexSansArabic_700Bold",
                    fontSize: 11,
                    marginBottom: 4,
                    textAlign: "right",
                  }}
                >
                  {isDoctor ? "الطبيب" : "المريض"}
                </Text>
                <Text
                  style={{
                    color: colors.foreground,
                    fontFamily: "IBMPlexSansArabic_500Medium",
                    fontSize: 14,
                    textAlign: "right",
                  }}
                >
                  {item.text}
                </Text>
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontFamily: "IBMPlexSansArabic_500Medium",
                    fontSize: 10.5,
                    marginTop: 4,
                    textAlign: "right",
                  }}
                >
                  {new Date(item.created_at).toLocaleString("ar")}
                </Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

// ====================================================================
// Appointments tab (Arabic)
// ====================================================================

type ApptFilter = "all" | "upcoming" | "completed" | "cancelled";

function AppointmentsTab() {
  const colors = useColors();
  const { data: appointments, isLoading } = useAllAppointments();
  const [filter, setFilter] = useState<ApptFilter>("all");

  const filtered = useMemo(() => {
    const list = appointments ?? [];
    if (filter === "all") return list;
    return list.filter((a) => a.status === filter);
  }, [appointments, filter]);

  const counts = useMemo(() => {
    const list = appointments ?? [];
    return {
      all: list.length,
      upcoming: list.filter((a) => a.status === "upcoming").length,
      completed: list.filter((a) => a.status === "completed").length,
      cancelled: list.filter((a) => a.status === "cancelled").length,
    };
  }, [appointments]);

  const filters: Array<{ id: ApptFilter; label: string; count: number }> = [
    { id: "all", label: "الكل", count: counts.all },
    { id: "upcoming", label: "قادم", count: counts.upcoming },
    { id: "completed", label: "مكتمل", count: counts.completed },
    { id: "cancelled", label: "ملغى", count: counts.cancelled },
  ];

  if (isLoading) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {filters.map((f) => {
          const active = filter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? colors.primary : colors.primarySoft,
                  borderColor: active ? colors.primary : "transparent",
                },
              ]}
            >
              <Text
                style={{
                  color: active ? colors.primaryForeground : colors.primary,
                  fontFamily: "IBMPlexSansArabic_700Bold",
                  fontSize: 13,
                }}
              >
                {f.label}
              </Text>
              <View
                style={[
                  styles.filterBadge,
                  {
                    backgroundColor: active
                      ? "rgba(255,255,255,0.25)"
                      : colors.background,
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? colors.primaryForeground : colors.primary,
                    fontFamily: "IBMPlexSansArabic_700Bold",
                    fontSize: 11,
                  }}
                >
                  {f.count}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="calendar" size={42} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            لا توجد مواعيد في هذا التصنيف.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.rowReverse}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.cardTitle, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {item.doctor?.name_ar ?? "—"}
                  </Text>
                  <Text
                    style={[styles.cardSub, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {item.doctor?.specialty_ar ?? ""}
                  </Text>
                </View>
                <StatusPill status={item.status} />
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.metaRow}>
                <MetaChip
                  icon="calendar"
                  text={item.appointment_date}
                />
                <MetaChip icon="clock" text={item.appointment_time} />
                <MetaChip
                  icon="user"
                  text={`المريض ${item.user_id.slice(0, 8)}`}
                />
                <MetaChip
                  icon="dollar-sign"
                  text={`${item.doctor?.price ?? 0} ج.س`}
                />
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

function StatusPill({ status }: { status: Appointment["status"] }) {
  const colors = useColors();
  const map = {
    upcoming: { bg: colors.primarySoft, fg: colors.primary },
    completed: { bg: colors.accents.green.bg, fg: colors.success },
    cancelled: { bg: colors.accents.red.bg, fg: colors.danger },
  } as const;
  const t = map[status];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      <Text
        style={{
          color: t.fg,
          fontFamily: "IBMPlexSansArabic_700Bold",
          fontSize: 11,
        }}
      >
        {APPT_STATUS_LABEL[status]}
      </Text>
    </View>
  );
}

// ====================================================================
// Payments tab (Arabic)
// ====================================================================

function PaymentsTab() {
  const colors = useColors();
  const { data: payments, isLoading } = usePendingPayments();
  const updateStatus = useUpdatePaymentStatus();
  const [actingId, setActingId] = useState<string>("");

  if (isLoading) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const list = payments ?? [];

  if (list.length === 0) {
    return (
      <View style={styles.empty}>
        <Feather name="check-circle" size={42} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          لا توجد مدفوعات قيد المراجعة.
        </Text>
      </View>
    );
  }

  const handle = (
    p: Payment,
    status: "confirmed" | "rejected",
    reason?: string,
  ) => {
    setActingId(p.id);
    updateStatus.mutate(
      { id: p.id, appointment_id: p.appointment_id, status, reason },
      { onSettled: () => setActingId("") },
    );
  };

  return (
    <FlatList
      data={list}
      keyExtractor={(p) => p.id}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      renderItem={({ item }) => {
        const doctor = (item as Payment & { doctor?: Doctor }).doctor;
        const busy = actingId === item.id && updateStatus.isPending;
        return (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.rowReverse}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.cardTitle, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {doctor?.name_ar ?? "—"}
                </Text>
                <Text
                  style={[styles.cardSub, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {doctor?.specialty_ar ?? ""}
                </Text>
              </View>
              <View
                style={[
                  styles.pill,
                  { backgroundColor: colors.accents.amber.bg },
                ]}
              >
                <Text
                  style={{
                    color: colors.accents.amber.color,
                    fontFamily: "IBMPlexSansArabic_700Bold",
                    fontSize: 11,
                  }}
                >
                  قيد المراجعة
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.metaRow}>
              <MetaChip
                icon="credit-card"
                text={PAYMENT_METHOD_LABEL[item.method] ?? item.method}
              />
              <MetaChip icon="hash" text={item.txn_ref ?? "----"} />
              <MetaChip
                icon="dollar-sign"
                text={`${Math.round(item.amount)} ج.س`}
              />
              <MetaChip
                icon="user"
                text={`المريض ${item.user_id.slice(0, 8)}`}
              />
              <MetaChip
                icon="clock"
                text={new Date(item.created_at).toLocaleString("ar", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              />
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                disabled={busy}
                onPress={() =>
                  handle(item, "rejected", "رقم العملية غير مطابق")
                }
                style={[
                  styles.outlineBtn,
                  {
                    borderColor: colors.danger,
                    backgroundColor: colors.accents.red.bg,
                    opacity: busy ? 0.5 : 1,
                  },
                ]}
              >
                <Feather name="x" size={14} color={colors.danger} />
                <Text
                  style={{
                    color: colors.danger,
                    fontFamily: "IBMPlexSansArabic_700Bold",
                    fontSize: 13,
                  }}
                >
                  رفض
                </Text>
              </Pressable>
              <Pressable
                disabled={busy}
                onPress={() => handle(item, "confirmed")}
                style={[
                  styles.outlineBtn,
                  {
                    borderColor: colors.primary,
                    backgroundColor: colors.primary,
                    opacity: busy ? 0.7 : 1,
                  },
                ]}
              >
                {busy ? (
                  <ActivityIndicator
                    color={colors.primaryForeground}
                    size="small"
                  />
                ) : (
                  <Feather
                    name="check"
                    size={14}
                    color={colors.primaryForeground}
                  />
                )}
                <Text
                  style={{
                    color: colors.primaryForeground,
                    fontFamily: "IBMPlexSansArabic_700Bold",
                    fontSize: 13,
                  }}
                >
                  تأكيد
                </Text>
              </Pressable>
            </View>
          </View>
        );
      }}
    />
  );
}

// ====================================================================
// Revenue tab (Arabic)
// ====================================================================

function RevenueTab() {
  const colors = useColors();
  const { data: appointments, isLoading } = useAllAppointments();

  const stats = useMemo(() => {
    const list = appointments ?? [];
    const completed = list.filter((a) => a.status === "completed");
    const upcoming = list.filter((a) => a.status === "upcoming");
    const cancelled = list.filter((a) => a.status === "cancelled");
    const sumPrice = (arr: Appointment[]) =>
      arr.reduce((s, a) => s + (a.doctor?.price ?? 0), 0);

    const totalRevenue = sumPrice(completed);
    const projected = sumPrice(upcoming);
    const lost = sumPrice(cancelled);

    const byDoctor = new Map<
      string,
      { name: string; specialty: string; bookings: number; revenue: number }
    >();
    for (const a of completed) {
      const key = a.doctor_id;
      const prev = byDoctor.get(key) ?? {
        name: a.doctor?.name_ar ?? "غير معروف",
        specialty: a.doctor?.specialty_ar ?? "",
        bookings: 0,
        revenue: 0,
      };
      prev.bookings += 1;
      prev.revenue += a.doctor?.price ?? 0;
      byDoctor.set(key, prev);
    }
    const doctorRows = Array.from(byDoctor.values()).sort(
      (a, b) => b.revenue - a.revenue,
    );

    const byMonth = new Map<string, number>();
    for (const a of completed) {
      const d = new Date(a.appointment_date);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonth.set(key, (byMonth.get(key) ?? 0) + (a.doctor?.price ?? 0));
    }
    const monthRows = Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([key, value]) => {
        const [yy, mm] = key.split("-");
        const labelDate = new Date(Number(yy), Number(mm) - 1, 1);
        return {
          key,
          label: labelDate.toLocaleDateString("ar", {
            month: "short",
            year: "numeric",
          }),
          value,
        };
      });
    const monthMax = Math.max(1, ...monthRows.map((m) => m.value));

    return {
      totalRevenue,
      projected,
      lost,
      completedCount: completed.length,
      upcomingCount: upcoming.length,
      cancelledCount: cancelled.length,
      doctorRows,
      monthRows,
      monthMax,
    };
  }, [appointments]);

  if (isLoading) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={styles.kpiGrid}>
        <KpiCard
          label="إجمالي الإيرادات"
          value={`${stats.totalRevenue.toLocaleString()} ج.س`}
          sub={`${stats.completedCount} موعد مكتمل`}
          tone="success"
          icon="trending-up"
        />
        <KpiCard
          label="الإيرادات المتوقعة"
          value={`${stats.projected.toLocaleString()} ج.س`}
          sub={`${stats.upcomingCount} موعد قادم`}
          tone="primary"
          icon="clock"
        />
        <KpiCard
          label="إيرادات مفقودة"
          value={`${stats.lost.toLocaleString()} ج.س`}
          sub={`${stats.cancelledCount} موعد ملغى`}
          tone="danger"
          icon="x-circle"
        />
        <KpiCard
          label="إجمالي الحجوزات"
          value={String(
            stats.completedCount + stats.upcomingCount + stats.cancelledCount,
          )}
          sub="منذ البداية"
          tone="muted"
          icon="calendar"
        />
      </View>

      <View
        style={[
          styles.section,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          الإيرادات الشهرية
        </Text>
        {stats.monthRows.length === 0 ? (
          <Text
            style={[
              styles.emptyText,
              { color: colors.mutedForeground, paddingVertical: 8 },
            ]}
          >
            لا توجد مواعيد مكتملة بعد.
          </Text>
        ) : (
          <View style={{ gap: 10, marginTop: 8 }}>
            {stats.monthRows.map((m) => {
              const pct = m.value / stats.monthMax;
              return (
                <View key={m.key} style={{ gap: 4 }}>
                  <View style={styles.monthHeader}>
                    <Text
                      style={{
                        color: colors.primary,
                        fontFamily: "IBMPlexSansArabic_700Bold",
                        fontSize: 13,
                      }}
                    >
                      {m.value.toLocaleString()} ج.س
                    </Text>
                    <Text
                      style={{
                        color: colors.foreground,
                        fontFamily: "IBMPlexSansArabic_500Medium",
                        fontSize: 12.5,
                      }}
                    >
                      {m.label}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.barTrack,
                      { backgroundColor: colors.primarySoft },
                    ]}
                  >
                    <View
                      style={[
                        styles.barFill,
                        {
                          backgroundColor: colors.primary,
                          width: `${Math.max(4, pct * 100)}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View
        style={[
          styles.section,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          الإيرادات حسب الطبيب
        </Text>
        {stats.doctorRows.length === 0 ? (
          <Text
            style={[
              styles.emptyText,
              { color: colors.mutedForeground, paddingVertical: 8 },
            ]}
          >
            لا توجد مواعيد مكتملة بعد.
          </Text>
        ) : (
          <View style={{ gap: 10, marginTop: 8 }}>
            {stats.doctorRows.map((d, idx) => (
              <View
                key={`${d.name}-${idx}`}
                style={[
                  styles.doctorRevRow,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontFamily: "IBMPlexSansArabic_700Bold",
                    fontSize: 14,
                  }}
                >
                  {d.revenue.toLocaleString()} ج.س
                </Text>
                <View style={{ flex: 1, minWidth: 0, alignItems: "flex-end" }}>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontFamily: "IBMPlexSansArabic_700Bold",
                      fontSize: 14,
                      textAlign: "right",
                    }}
                    numberOfLines={1}
                  >
                    {d.name}
                  </Text>
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontFamily: "IBMPlexSansArabic_500Medium",
                      fontSize: 12,
                      textAlign: "right",
                    }}
                    numberOfLines={1}
                  >
                    {d.specialty} • {d.bookings} حجز
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function KpiCard({
  label,
  value,
  sub,
  tone,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "primary" | "success" | "danger" | "muted";
  icon: keyof typeof Feather.glyphMap;
}) {
  const colors = useColors();
  const tones = {
    primary: { fg: colors.primary, bg: colors.primarySoft },
    success: { fg: colors.success, bg: colors.accents.green.bg },
    danger: { fg: colors.danger, bg: colors.accents.red.bg },
    muted: { fg: colors.mutedForeground, bg: colors.muted },
  } as const;
  const t = tones[tone];
  return (
    <View
      style={[
        styles.kpiCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.kpiIcon, { backgroundColor: t.bg }]}>
        <Feather name={icon} size={18} color={t.fg} />
      </View>
      <Text style={{ color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_500Medium", fontSize: 12, textAlign: "right" }}>
        {label}
      </Text>
      <Text
        style={{ color: colors.foreground, fontFamily: "IBMPlexSansArabic_700Bold", fontSize: 18, textAlign: "right" }}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text style={{ color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_500Medium", fontSize: 11.5, textAlign: "right" }}>
        {sub}
      </Text>
    </View>
  );
}

// ====================================================================
// Settings tab — change admin credentials
// ====================================================================

function SettingsTab() {
  const colors = useColors();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getAdminCredentials().then((c) => setUsername(c.username));
  }, []);

  const save = async () => {
    setError(null);
    setInfo(null);
    if (!username.trim()) {
      setError("اسم المستخدم مطلوب");
      return;
    }
    const stored = await getAdminCredentials();
    if (currentPassword !== stored.password) {
      setError("كلمة المرور الحالية غير صحيحة");
      return;
    }
    const finalPassword = newPassword || stored.password;
    if (newPassword) {
      if (newPassword.length < 4) {
        setError("كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("كلمتا المرور غير متطابقتين");
        return;
      }
    }
    setBusy(true);
    try {
      await updateAdminCredentials({
        username: username.trim(),
        password: finalPassword,
      });
      setInfo("تم حفظ بيانات الدخول بنجاح.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      setError(e?.message ?? "حدث خطأ أثناء الحفظ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
      <View
        style={[
          styles.section,
          { backgroundColor: colors.card, borderColor: colors.border, gap: 14 },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          تغيير بيانات الدخول
        </Text>

        <FormField label="اسم المستخدم">
          <BasicInput
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </FormField>

        <FormField label="كلمة المرور الحالية">
          <BasicInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </FormField>

        <FormField label="كلمة مرور جديدة (اختياري)">
          <BasicInput
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </FormField>

        <FormField label="تأكيد كلمة المرور الجديدة">
          <BasicInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </FormField>

        {error && (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor: colors.accents.red.bg,
                borderColor: colors.danger,
              },
            ]}
          >
            <Feather name="alert-circle" size={14} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {error}
            </Text>
          </View>
        )}

        {info && (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor: colors.accents.green.bg,
                borderColor: colors.success,
              },
            ]}
          >
            <Feather name="check-circle" size={14} color={colors.success} />
            <Text style={[styles.errorText, { color: colors.success }]}>
              {info}
            </Text>
          </View>
        )}

        <Pressable
          onPress={save}
          disabled={busy}
          style={[
            styles.submitBtn,
            { backgroundColor: colors.primary, opacity: busy ? 0.7 : 1 },
          ]}
        >
          {busy ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text
              style={{
                color: colors.primaryForeground,
                fontFamily: "IBMPlexSansArabic_700Bold",
                fontSize: 15,
              }}
            >
              حفظ
            </Text>
          )}
        </Pressable>
      </View>

      <Pressable
        onPress={async () => {
          await logoutAdmin();
          router.replace("/admin-login");
        }}
        style={[
          styles.section,
          {
            backgroundColor: colors.accents.red.bg,
            borderColor: colors.danger,
            flexDirection: "row-reverse",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          },
        ]}
      >
        <Feather name="log-out" size={18} color={colors.danger} />
        <Text
          style={{
            color: colors.danger,
            fontFamily: "IBMPlexSansArabic_700Bold",
            fontSize: 15,
          }}
        >
          تسجيل الخروج من اللوحة
        </Text>
      </Pressable>
    </ScrollView>
  );
}

// ====================================================================
// Styles
// ====================================================================

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  fullCenter: { flex: 1, alignItems: "center", justifyContent: "center" },

  tabBarWrap: { borderBottomWidth: 1 },
  tabBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tabBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },

  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
    textAlignVertical: "center",
  },
  primaryBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
  },
  countBadge: {
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 44,
  },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  rowReverse: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
  },
  cardSub: {
    fontSize: 12.5,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
    marginTop: 2,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  divider: { height: 1 },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  outlineBtn: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  lastMsgBox: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "center",
    maxWidth: 320,
  },

  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  barTrack: { height: 10, borderRadius: 5, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 5 },
  doctorRevRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  kpiCard: {
    flexBasis: "47%",
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    marginBottom: 4,
  },

  // Modal editor
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    maxHeight: "92%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalClose: { padding: 4 },
  modalTitle: {
    fontSize: 16,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "center",
    flex: 1,
  },
  twoCol: { flexDirection: "row", gap: 10 },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12.5,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
    flex: 1,
  },
  submitBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  // Conversation viewer
  viewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  eyeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  msgBubble: {
    maxWidth: "85%",
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
});
