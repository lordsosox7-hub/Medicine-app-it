import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { CameraView, useCameraPermissions } from "expo-camera";
import { Stack, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import {
  useAllAppointments,
  useAllAppointmentsWithPatients,
  useMarkTicketScanned,
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
  useDoctorAdmins,
  useCreateDoctorAdmin,
  useDeleteDoctorAdmin,
  type AdminUser,
  type NewDoctorInput,
  type AppointmentWithPatient,
  type DoctorAdminRow,
  usePendingRefunds,
  useUpdateRefundStatus,
} from "@/hooks/useGkmData";
import type { Appointment, Payment, Doctor, Conversation, Refund } from "@/lib/supabase";
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
  | "refunds"
  | "revenue"
  | "scanner"
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
  { id: "refunds", label: "الاستردادات", icon: "rotate-ccw" },
  { id: "revenue", label: "الإيرادات", icon: "trending-up" },
  { id: "scanner", label: "ماسح QR", icon: "camera" },
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
  no_show: "لم يحضر",
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
        {tab === "refunds" && <RefundsTab />}
        {tab === "revenue" && <RevenueTab />}
        {tab === "scanner" && <ScannerTab />}
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
  const { data: appointments, isLoading } = useAllAppointmentsWithPatients();
  const [filter, setFilter] = useState<ApptFilter>("all");

  const confirmed = useMemo(
    () => (appointments ?? []).filter((a) => a.status === "upcoming"),
    [appointments],
  );

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
    <ScrollView style={styles.flex} showsVerticalScrollIndicator={false}>
      {/* ── Confirmed appointments section ── */}
      <View style={[styles.confirmedSection, { backgroundColor: colors.primarySoft }]}>
        <View style={styles.confirmedHeader}>
          <Feather name="check-circle" size={18} color={colors.primary} />
          <Text style={[styles.confirmedTitle, { color: colors.primary }]}>
            المواعيد المؤكدة
          </Text>
          <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
            <Text style={{ color: colors.primaryForeground, fontFamily: "IBMPlexSansArabic_700Bold", fontSize: 11 }}>
              {confirmed.length}
            </Text>
          </View>
        </View>

        {confirmed.length === 0 ? (
          <View style={styles.confirmedEmpty}>
            <Text style={[styles.confirmedEmptyText, { color: colors.mutedForeground }]}>
              لا توجد مواعيد مؤكدة حالياً
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {confirmed.map((item) => (
              <ConfirmedAppointmentRow key={item.id} item={item} />
            ))}
          </View>
        )}
      </View>

      {/* ── Filter chips ── */}
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
        <View style={{ padding: 16, gap: 12 }}>
          {filtered.map((item) => (
            <View
              key={item.id}
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
                <MetaChip icon="calendar" text={item.appointment_date} />
                <MetaChip icon="clock" text={item.appointment_time} />
                <MetaChip
                  icon="user"
                  text={item.patient_name ?? item.user_id.slice(0, 8)}
                />
                <MetaChip
                  icon="dollar-sign"
                  text={`${item.doctor?.price ?? 0} ج.س`}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function ConfirmedAppointmentRow({ item }: { item: AppointmentWithPatient }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.confirmedRow,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {/* Patient */}
      <View style={styles.confirmedParty}>
        <View style={[styles.confirmedAvatar, { backgroundColor: colors.primarySoft }]}>
          <Feather name="user" size={14} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.confirmedLabel, { color: colors.mutedForeground }]}>المريض</Text>
          <Text style={[styles.confirmedName, { color: colors.foreground }]} numberOfLines={1}>
            {item.patient_name ?? "غير محدد"}
          </Text>
        </View>
      </View>

      {/* Arrow */}
      <Feather name="arrow-left" size={14} color={colors.mutedForeground} />

      {/* Doctor */}
      <View style={styles.confirmedParty}>
        <View style={[styles.confirmedAvatar, { backgroundColor: colors.accents.green.bg }]}>
          <Feather name="activity" size={14} color={colors.success} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.confirmedLabel, { color: colors.mutedForeground }]}>الطبيب</Text>
          <Text style={[styles.confirmedName, { color: colors.foreground }]} numberOfLines={1}>
            {item.doctor?.name_ar ?? "—"}
          </Text>
        </View>
      </View>

      {/* Date/time */}
      <View style={[styles.confirmedDateBadge, { backgroundColor: colors.primarySoft }]}>
        <Text style={[styles.confirmedDateText, { color: colors.primary }]}>
          {item.appointment_date}
        </Text>
        <Text style={[styles.confirmedTimeText, { color: colors.primary }]}>
          {item.appointment_time}
        </Text>
      </View>
    </View>
  );
}

// ====================================================================
// QR Scanner tab
// ====================================================================

function ScannerTab() {
  const colors = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const markScanned = useMarkTicketScanned();
  const [parseError, setParseError] = useState(false);
  const scannedRef = useRef(false);

  const reset = () => {
    scannedRef.current = false;
    setParseError(false);
    markScanned.reset();
  };

  const handleBarcode = useCallback(
    ({ data }: { data: string }) => {
      if (scannedRef.current || markScanned.isPending) return;
      scannedRef.current = true;
      setParseError(false);
      try {
        const parsed = JSON.parse(data);
        if (!parsed?.id) throw new Error("no_id");
        markScanned.mutate(parsed.id);
      } catch {
        setParseError(true);
      }
    },
    [markScanned],
  );

  const result = markScanned.data;
  const isLoading = markScanned.isPending;
  const isError = markScanned.isError || parseError;
  const done = !!result || isError;

  if (!permission) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.empty}>
        <View style={[styles.scanPermBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="camera-off" size={40} color={colors.mutedForeground} />
          <Text style={[styles.scanPermTitle, { color: colors.foreground }]}>
            يلزم إذن الكاميرا
          </Text>
          <Text style={[styles.scanPermSub, { color: colors.mutedForeground }]}>
            للمسح الضوئي لرموز QR يرجى السماح باستخدام الكاميرا
          </Text>
          <Pressable
            onPress={requestPermission}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, marginTop: 8 }]}
          >
            <Feather name="camera" size={16} color={colors.primaryForeground} />
            <Text style={{ color: colors.primaryForeground, fontFamily: "IBMPlexSansArabic_700Bold", fontSize: 14 }}>
              السماح بالكاميرا
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {/* Camera view */}
      {!done && (
        <View style={styles.scanCameraWrap}>
          <CameraView
            style={styles.scanCamera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={handleBarcode}
          />
          {/* Overlay frame */}
          <View style={styles.scanOverlay} pointerEvents="none">
            <View style={styles.scanDimTop} />
            <View style={styles.scanMiddleRow}>
              <View style={styles.scanDimSide} />
              <View style={styles.scanFrame}>
                <View style={[styles.scanCorner, styles.scanCornerTL, { borderColor: colors.primary }]} />
                <View style={[styles.scanCorner, styles.scanCornerTR, { borderColor: colors.primary }]} />
                <View style={[styles.scanCorner, styles.scanCornerBL, { borderColor: colors.primary }]} />
                <View style={[styles.scanCorner, styles.scanCornerBR, { borderColor: colors.primary }]} />
              </View>
              <View style={styles.scanDimSide} />
            </View>
            <View style={styles.scanDimBottom}>
              <Text style={styles.scanHint}>وجّه الكاميرا نحو رمز QR في التذكرة</Text>
            </View>
          </View>
          {isLoading && (
            <View style={[styles.scanLoadingOverlay, { backgroundColor: "rgba(0,0,0,0.55)" }]}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={{ color: "#ffffff", fontFamily: "IBMPlexSansArabic_700Bold", fontSize: 14, marginTop: 10 }}>
                جارٍ التحقق...
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Result panel */}
      {done && (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16, alignItems: "stretch" }}>
          {isError && (
            <View style={[styles.scanResultCard, { backgroundColor: colors.accents.red.bg, borderColor: colors.danger }]}>
              <Feather name="alert-circle" size={36} color={colors.danger} />
              <Text style={[styles.scanResultTitle, { color: colors.danger }]}>رمز غير صالح</Text>
              <Text style={[styles.scanResultSub, { color: colors.danger, opacity: 0.8 }]}>
                لم يتم التعرف على هذا الرمز. تأكد أنه رمز تذكرة راحة.
              </Text>
            </View>
          )}

          {result?.status === "marked_used" && (
            <View style={[styles.scanResultCard, { backgroundColor: colors.accents.green.bg, borderColor: colors.success }]}>
              <Feather name="check-circle" size={44} color={colors.success} />
              <Text style={[styles.scanResultTitle, { color: colors.success }]}>تم التحقق ✓</Text>
              <Text style={[styles.scanResultSub, { color: colors.success, opacity: 0.85 }]}>
                تم تسجيل دخول المريض بنجاح
              </Text>
            </View>
          )}

          {result?.status === "already_used" && (
            <View style={[styles.scanResultCard, { backgroundColor: colors.accents.red.bg, borderColor: colors.danger }]}>
              <Feather name="x-circle" size={44} color={colors.danger} />
              <Text style={[styles.scanResultTitle, { color: colors.danger }]}>تم الاستخدام من قبل</Text>
              <Text style={[styles.scanResultSub, { color: colors.danger, opacity: 0.85 }]}>
                هذه التذكرة سبق مسحها وتسجيل استخدامها
              </Text>
            </View>
          )}

          {result?.status === "cancelled" && (
            <View style={[styles.scanResultCard, { backgroundColor: colors.accents.red.bg, borderColor: colors.danger }]}>
              <Feather name="slash" size={44} color={colors.danger} />
              <Text style={[styles.scanResultTitle, { color: colors.danger }]}>موعد ملغى</Text>
              <Text style={[styles.scanResultSub, { color: colors.danger, opacity: 0.85 }]}>
                هذا الموعد تم إلغاؤه ولا يمكن استخدامه
              </Text>
            </View>
          )}

          {/* Appointment details card */}
          {result?.appointment && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.scanDetailLabel, { color: colors.mutedForeground }]}>تفاصيل الموعد</Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.scanDetailRow}>
                <View style={[styles.confirmedAvatar, { backgroundColor: colors.primarySoft }]}>
                  <Feather name="user" size={14} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.scanDetailKey, { color: colors.mutedForeground }]}>المريض</Text>
                  <Text style={[styles.scanDetailValue, { color: colors.foreground }]}>
                    {result.appointment.patient_name ?? "غير محدد"}
                  </Text>
                </View>
              </View>

              <View style={styles.scanDetailRow}>
                <View style={[styles.confirmedAvatar, { backgroundColor: colors.accents.green.bg }]}>
                  <Feather name="activity" size={14} color={colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.scanDetailKey, { color: colors.mutedForeground }]}>الطبيب</Text>
                  <Text style={[styles.scanDetailValue, { color: colors.foreground }]}>
                    {(result.appointment as any).doctor?.name_ar ?? "—"}
                  </Text>
                </View>
              </View>

              <View style={styles.scanDetailRow}>
                <View style={[styles.confirmedAvatar, { backgroundColor: colors.primarySoft }]}>
                  <Feather name="calendar" size={14} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.scanDetailKey, { color: colors.mutedForeground }]}>التاريخ والوقت</Text>
                  <Text style={[styles.scanDetailValue, { color: colors.foreground }]}>
                    {result.appointment.appointment_date} · {result.appointment.appointment_time}
                  </Text>
                </View>
              </View>

              <View style={styles.scanDetailRow}>
                <View style={[styles.confirmedAvatar, { backgroundColor: colors.primarySoft }]}>
                  <Feather name="hash" size={14} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.scanDetailKey, { color: colors.mutedForeground }]}>رقم التذكرة</Text>
                  <Text style={[styles.scanDetailValue, { color: colors.foreground, writingDirection: "ltr" }]}>
                    #{String(result.appointment.id).slice(0, 8).toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
          )}

          <Pressable
            onPress={reset}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, justifyContent: "center" }]}
          >
            <Feather name="refresh-cw" size={16} color={colors.primaryForeground} />
            <Text style={{ color: colors.primaryForeground, fontFamily: "IBMPlexSansArabic_700Bold", fontSize: 14 }}>
              مسح تذكرة أخرى
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

function StatusPill({ status }: { status: Appointment["status"] }) {
  const colors = useColors();
  const map: Record<Appointment["status"], { bg: string; fg: string }> = {
    upcoming: { bg: colors.primarySoft, fg: colors.primary },
    completed: { bg: colors.accents.green.bg, fg: colors.success },
    cancelled: { bg: colors.accents.red.bg, fg: colors.danger },
    no_show: { bg: `${colors.warning}22`, fg: colors.warning },
  };
  const t = map[status] ?? map.cancelled;
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
    p: Payment & { doctor?: Doctor },
    status: "confirmed" | "rejected",
    reason?: string,
  ) => {
    setActingId(p.id);
    updateStatus.mutate(
      {
        id: p.id,
        appointment_id: p.appointment_id,
        status,
        reason,
        user_id: p.user_id,
        amount: p.amount,
        doctor_name_ar: p.doctor?.name_ar,
      },
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
// Refunds tab (Arabic)
// ====================================================================

const REFUND_STATUS_LABEL: Record<Refund["status"], string> = {
  pending: "قيد المعالجة",
  processed: "تم الاسترداد",
  rejected: "مرفوض",
};

function RefundsTab() {
  const colors = useColors();
  const { data: refunds, isLoading } = usePendingRefunds();
  const updateStatus = useUpdateRefundStatus();
  const [actingId, setActingId] = useState<string>("");

  if (isLoading) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!refunds || refunds.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular" }}>
          لا توجد طلبات استرداد
        </Text>
      </View>
    );
  }

  const handle = async (id: string, status: "processed" | "rejected") => {
    setActingId(id);
    await updateStatus.mutateAsync({ id, status });
    setActingId("");
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      {refunds.map((r) => (
        <View
          key={r.id}
          style={{
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 14,
            gap: 6,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
            <View
              style={[
                styles.pill,
                {
                  backgroundColor:
                    r.status === "pending"
                      ? `${colors.warning}22`
                      : r.status === "processed"
                        ? colors.accents.green.bg
                        : colors.accents.red.bg,
                },
              ]}
            >
              <Text
                style={{
                  color:
                    r.status === "pending"
                      ? colors.warning
                      : r.status === "processed"
                        ? colors.success
                        : colors.danger,
                  fontFamily: "IBMPlexSansArabic_700Bold",
                  fontSize: 11,
                }}
              >
                {REFUND_STATUS_LABEL[r.status]}
              </Text>
            </View>
            <Text style={{ color: colors.foreground, fontFamily: "IBMPlexSansArabic_700Bold", fontSize: 14 }}>
              {new Date(r.created_at).toLocaleDateString("ar-SA")}
            </Text>
          </View>

          <View style={{ flexDirection: "row-reverse", gap: 16 }}>
            <Text style={{ color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular", fontSize: 13 }}>
              المبلغ الأصلي: {r.original_amount} ج.س
            </Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular", fontSize: 13 }}>
              الرسوم: {r.fee_amount} ج.س
            </Text>
            <Text style={{ color: colors.success, fontFamily: "IBMPlexSansArabic_700Bold", fontSize: 13 }}>
              الاسترداد: {r.refund_amount} ج.س
            </Text>
          </View>

          {r.status === "pending" && (
            <View style={{ flexDirection: "row-reverse", gap: 10, marginTop: 6 }}>
              <Pressable
                onPress={() => handle(r.id, "processed")}
                disabled={actingId === r.id}
                style={{
                  flex: 1,
                  backgroundColor: colors.accents.green.bg,
                  borderRadius: 8,
                  padding: 10,
                  alignItems: "center",
                }}
              >
                {actingId === r.id ? (
                  <ActivityIndicator size="small" color={colors.success} />
                ) : (
                  <Text style={{ color: colors.success, fontFamily: "IBMPlexSansArabic_700Bold", fontSize: 13 }}>
                    تأكيد الاسترداد
                  </Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => handle(r.id, "rejected")}
                disabled={actingId === r.id}
                style={{
                  flex: 1,
                  backgroundColor: colors.accents.red.bg,
                  borderRadius: 8,
                  padding: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.danger, fontFamily: "IBMPlexSansArabic_700Bold", fontSize: 13 }}>
                  رفض الطلب
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
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

      {/* ── Doctor Admins Management ── */}
      <DoctorAdminsSection />

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

function DoctorAdminsSection() {
  const colors = useColors();
  const doctors = useDoctors();
  const admins = useDoctorAdmins();
  const createMut = useCreateDoctorAdmin();
  const deleteMut = useDeleteDoctorAdmin();

  const [showForm, setShowForm] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreate = async () => {
    setFormError(null);
    if (!newUsername.trim()) { setFormError("اسم المستخدم مطلوب"); return; }
    if (!newPassword.trim()) { setFormError("كلمة المرور مطلوبة"); return; }
    if (!selectedDoctorId) { setFormError("اختر طبيباً"); return; }
    try {
      await createMut.mutateAsync({
        username: newUsername.trim(),
        password: newPassword.trim(),
        doctor_id: selectedDoctorId,
      });
      setNewUsername("");
      setNewPassword("");
      setSelectedDoctorId("");
      setShowForm(false);
    } catch (e: any) {
      setFormError(e?.message?.includes("unique") ? "اسم المستخدم مستخدم من قبل" : (e?.message ?? "حدث خطأ"));
    }
  };

  const list: DoctorAdminRow[] = admins.data ?? [];

  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border, gap: 12 }]}>
      <View style={{ flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>مشرفو الأطباء</Text>
        <Pressable
          onPress={() => { setShowForm(!showForm); setFormError(null); }}
          style={[styles.primaryBtn, { backgroundColor: colors.primary, paddingVertical: 6, paddingHorizontal: 12 }]}
        >
          <Feather name={showForm ? "x" : "plus"} size={14} color={colors.primaryForeground} />
          <Text style={{ color: colors.primaryForeground, fontFamily: "IBMPlexSansArabic_700Bold", fontSize: 13 }}>
            {showForm ? "إلغاء" : "إضافة"}
          </Text>
        </Pressable>
      </View>

      {showForm && (
        <View style={{ gap: 10, paddingTop: 4 }}>
          <FormField label="اسم المستخدم">
            <BasicInput value={newUsername} onChangeText={setNewUsername} autoCapitalize="none" />
          </FormField>
          <FormField label="كلمة المرور">
            <BasicInput value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" />
          </FormField>
          <FormField label="الطبيب المسؤول">
            <View style={[styles.inputWrap, { flexDirection: "column", gap: 6, paddingHorizontal: 0, paddingVertical: 6 }]}>
              {(doctors.data ?? []).map((doc) => (
                <Pressable
                  key={doc.id}
                  onPress={() => setSelectedDoctorId(doc.id)}
                  style={[
                    { flexDirection: "row-reverse", alignItems: "center", gap: 8, padding: 8, borderRadius: 10, borderWidth: 1 },
                    {
                      borderColor: selectedDoctorId === doc.id ? colors.primary : colors.border,
                      backgroundColor: selectedDoctorId === doc.id ? colors.primarySoft : "transparent",
                    },
                  ]}
                >
                  <View style={[{ width: 10, height: 10, borderRadius: 5, borderWidth: 2 }, { borderColor: selectedDoctorId === doc.id ? colors.primary : colors.mutedForeground, backgroundColor: selectedDoctorId === doc.id ? colors.primary : "transparent" }]} />
                  <Text style={{ flex: 1, color: colors.foreground, fontFamily: "IBMPlexSansArabic_500Medium", fontSize: 13, textAlign: "right" }}>{doc.name_ar}</Text>
                  <Text style={{ color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular", fontSize: 11 }}>{doc.specialty_ar}</Text>
                </Pressable>
              ))}
            </View>
          </FormField>
          {formError && (
            <View style={[styles.errorBox, { backgroundColor: colors.accents.red.bg, borderColor: colors.danger }]}>
              <Feather name="alert-circle" size={13} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>{formError}</Text>
            </View>
          )}
          <Pressable
            onPress={handleCreate}
            disabled={createMut.isPending}
            style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: createMut.isPending ? 0.7 : 1 }]}
          >
            {createMut.isPending ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={{ color: colors.primaryForeground, fontFamily: "IBMPlexSansArabic_700Bold", fontSize: 14 }}>إنشاء الحساب</Text>
            )}
          </Pressable>
        </View>
      )}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {admins.isLoading && <ActivityIndicator color={colors.primary} />}
      {list.length === 0 && !admins.isLoading && (
        <Text style={{ color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular", fontSize: 13, textAlign: "center" }}>
          لا يوجد مشرفو أطباء حتى الآن
        </Text>
      )}
      {list.map((da) => (
        <View key={da.id} style={[{ flexDirection: "row-reverse", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: 1 }, { borderColor: colors.border }]}>
          <View style={[styles.confirmedAvatar, { backgroundColor: colors.primarySoft }]}>
            <Feather name="user-check" size={14} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontFamily: "IBMPlexSansArabic_700Bold", fontSize: 13, textAlign: "right" }}>{da.username}</Text>
            <Text style={{ color: colors.mutedForeground, fontFamily: "IBMPlexSansArabic_400Regular", fontSize: 11, textAlign: "right" }}>
              {da.doctor?.name_ar ?? da.doctor_id}
            </Text>
          </View>
          <Pressable
            onPress={() => deleteMut.mutate(da.id)}
            style={[{ padding: 6, borderRadius: 8, backgroundColor: colors.accents.red.bg }]}
          >
            <Feather name="trash-2" size={14} color={colors.danger} />
          </Pressable>
        </View>
      ))}
    </View>
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

  confirmedSection: {
    margin: 16,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  confirmedHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  confirmedTitle: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_700Bold",
    flex: 1,
    textAlign: "right",
  },
  confirmedEmpty: {
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmedEmptyText: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_500Medium",
  },
  confirmedRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  confirmedParty: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  confirmedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmedLabel: {
    fontSize: 10,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
  },
  confirmedName: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
  },
  confirmedDateBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 64,
  },
  confirmedDateText: {
    fontSize: 11,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "center",
  },
  confirmedTimeText: {
    fontSize: 10,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "center",
    opacity: 0.8,
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

  // Scanner tab
  scanPermBox: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 12,
    maxWidth: 340,
    width: "100%",
  },
  scanPermTitle: {
    fontSize: 18,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "center",
  },
  scanPermSub: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  scanCameraWrap: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
  scanCamera: {
    flex: 1,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "column",
  },
  scanDimTop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  scanMiddleRow: {
    flexDirection: "row",
    height: 240,
  },
  scanDimSide: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  scanFrame: {
    width: 240,
    height: 240,
    position: "relative",
  },
  scanCorner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderWidth: 3,
  },
  scanCornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 6,
  },
  scanCornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 6,
  },
  scanCornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 6,
  },
  scanCornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 6,
  },
  scanDimBottom: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 16,
  },
  scanHint: {
    color: "#ffffff",
    fontFamily: "IBMPlexSansArabic_400Regular",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  scanLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  scanResultCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  scanResultTitle: {
    fontSize: 20,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "center",
  },
  scanResultSub: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  scanDetailLabel: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
    marginBottom: 2,
  },
  scanDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  scanDetailKey: {
    fontSize: 11,
    fontFamily: "IBMPlexSansArabic_400Regular",
    textAlign: "right",
  },
  scanDetailValue: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
  },
});
