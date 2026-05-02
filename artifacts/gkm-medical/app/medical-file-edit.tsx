import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useMedicalFile, useUpdateMedicalFile } from "@/hooks/useGkmData";
import { getUserName, setUserName } from "@/lib/userId";

const GENDERS = ["ذكر", "أنثى"];
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function MedicalFileEditScreen() {
  const router = useRouter();
  const colors = useColors();
  const { data: file, isLoading } = useMedicalFile();
  const update = useUpdateMedicalFile();

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("ذكر");
  const [bloodType, setBloodType] = useState("O+");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [chronic, setChronic] = useState<string[]>([]);
  const [meds, setMeds] = useState<string[]>([]);
  const [surgeries, setSurgeries] = useState<string[]>([]);
  const [vaccinations, setVaccinations] = useState<string[]>([]);

  useEffect(() => {
    if (file) {
      setFullName(file.full_name_ar ?? "");
      setAge(String(file.age ?? ""));
      setGender(file.gender ?? "ذكر");
      setBloodType(file.blood_type ?? "O+");
      setAllergies(file.allergies ?? []);
      setChronic(file.chronic_diseases ?? []);
      setMeds(file.current_medications ?? []);
      setSurgeries(file.past_surgeries ?? []);
      setVaccinations(file.vaccinations ?? []);
    } else if (!isLoading && !file) {
      getUserName().then((n) => setFullName((prev) => prev || n));
    }
  }, [file, isLoading]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      const msg = "الرجاء إدخال الاسم الكامل";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("الاسم مطلوب", msg);
      return;
    }
    const ageNum = parseInt(age, 10);
    try {
      const trimmedName = fullName.trim();
      await update.mutateAsync({
        full_name_ar: trimmedName,
        age: Number.isFinite(ageNum) ? ageNum : 0,
        gender,
        blood_type: bloodType,
        allergies: allergies.filter((s) => s.trim().length > 0),
        chronic_diseases: chronic.filter((s) => s.trim().length > 0),
        current_medications: meds.filter((s) => s.trim().length > 0),
        past_surgeries: surgeries.filter((s) => s.trim().length > 0),
        vaccinations: vaccinations.filter((s) => s.trim().length > 0),
      });
      await setUserName(trimmedName);
      router.back();
    } catch (e: any) {
      const msg = e?.message || "تعذر حفظ التغييرات";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("خطأ", msg);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <SectionTitle title="المعلومات الأساسية" colors={colors} />
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextField
          label="الاسم الكامل"
          value={fullName}
          onChange={setFullName}
          placeholder="أدخل اسمك الكامل"
          colors={colors}
        />
        <TextField
          label="العمر"
          value={age}
          onChange={(t) => setAge(t.replace(/[^0-9]/g, ""))}
          placeholder="مثال: 28"
          keyboardType="numeric"
          colors={colors}
        />
        <ChipPicker
          label="الجنس"
          options={GENDERS}
          selected={gender}
          onSelect={setGender}
          colors={colors}
        />
        <ChipPicker
          label="فصيلة الدم"
          options={BLOOD_TYPES}
          selected={bloodType}
          onSelect={setBloodType}
          colors={colors}
          last
        />
      </View>

      <SectionTitle title="الحساسية" colors={colors} />
      <ListEditor
        items={allergies}
        setItems={setAllergies}
        placeholder="مثال: حساسية البنسلين"
        colors={colors}
      />

      <SectionTitle title="الأمراض المزمنة" colors={colors} />
      <ListEditor
        items={chronic}
        setItems={setChronic}
        placeholder="مثال: ارتفاع ضغط الدم"
        colors={colors}
      />

      <SectionTitle title="الأدوية الحالية" colors={colors} />
      <ListEditor
        items={meds}
        setItems={setMeds}
        placeholder="مثال: أملوديبين 5 ملغ"
        colors={colors}
      />

      <SectionTitle title="العمليات السابقة" colors={colors} />
      <ListEditor
        items={surgeries}
        setItems={setSurgeries}
        placeholder="مثال: استئصال الزائدة الدودية 2018"
        colors={colors}
      />

      <SectionTitle title="التطعيمات" colors={colors} />
      <ListEditor
        items={vaccinations}
        setItems={setVaccinations}
        placeholder="مثال: لقاح الإنفلونزا 2024"
        colors={colors}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleSave}
          disabled={update.isPending}
          activeOpacity={0.85}
          style={[
            styles.saveBtn,
            { backgroundColor: colors.primary, opacity: update.isPending ? 0.6 : 1 },
          ]}
        >
          {update.isPending ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <>
              <Feather name="check" size={18} color={colors.primaryForeground} />
              <Text style={[styles.saveText, { color: colors.primaryForeground }]}>
                حفظ التغييرات
              </Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.85}
          style={[styles.cancelBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.cancelText, { color: colors.foreground }]}>إلغاء</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function SectionTitle({ title, colors }: { title: string; colors: any }) {
  return (
    <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  colors,
  last,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
  colors: any;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.field,
        !last && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType ?? "default"}
        style={[
          styles.fieldInput,
          { color: colors.foreground, fontFamily: "IBMPlexSansArabic_500Medium" },
        ]}
      />
    </View>
  );
}

function ChipPicker({
  label,
  options,
  selected,
  onSelect,
  colors,
  last,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  colors: any;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.field,
        !last && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((opt) => {
          const active = selected === opt;
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => onSelect(opt)}
              activeOpacity={0.8}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.input,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? colors.primaryForeground : colors.foreground },
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function ListEditor({
  items,
  setItems,
  placeholder,
  colors,
}: {
  items: string[];
  setItems: (v: string[]) => void;
  placeholder: string;
  colors: any;
}) {
  const [draft, setDraft] = useState("");
  const filtered = useMemo(() => items, [items]);

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    setItems([...items, v]);
    setDraft("");
  };
  const remove = (idx: number) => {
    const next = items.slice();
    next.splice(idx, 1);
    setItems(next);
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, padding: 12 },
      ]}
    >
      {filtered.length === 0 ? (
        <Text
          style={{
            color: colors.mutedForeground,
            fontFamily: "IBMPlexSansArabic_500Medium",
            textAlign: "right",
            writingDirection: "rtl",
            fontSize: 13,
            paddingVertical: 4,
            paddingHorizontal: 4,
          }}
        >
          لا توجد بيانات. أضف عنصراً جديداً أدناه.
        </Text>
      ) : (
        filtered.map((item, idx) => (
          <View
            key={`${item}-${idx}`}
            style={[
              styles.listRow,
              { backgroundColor: colors.input, borderColor: colors.border },
            ]}
          >
            <Text
              style={[styles.listText, { color: colors.foreground }]}
              numberOfLines={2}
            >
              {item}
            </Text>
            <TouchableOpacity
              onPress={() => remove(idx)}
              hitSlop={8}
              style={styles.removeBtn}
              accessibilityLabel="حذف العنصر"
            >
              <Feather name="x" size={16} color={colors.destructive ?? "#ef4444"} />
            </TouchableOpacity>
          </View>
        ))
      )}

      <View style={[styles.addRow, { borderColor: colors.border }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          onSubmitEditing={add}
          returnKeyType="done"
          style={[
            styles.addInput,
            { color: colors.foreground, fontFamily: "IBMPlexSansArabic_500Medium" },
          ]}
        />
        <TouchableOpacity
          onPress={add}
          activeOpacity={0.85}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={16} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
    writingDirection: "rtl",
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 4,
  },
  field: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: "IBMPlexSansArabic_700Bold",
    textAlign: "right",
    writingDirection: "rtl",
    marginBottom: 6,
  },
  fieldInput: {
    fontSize: 15,
    textAlign: "right",
    writingDirection: "rtl",
    paddingVertical: 4,
  },
  chipRow: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  listRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_500Medium",
    textAlign: "right",
    writingDirection: "rtl",
  },
  removeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  addRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  addInput: {
    flex: 1,
    fontSize: 14,
    textAlign: "right",
    writingDirection: "rtl",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    marginTop: 24,
    gap: 10,
  },
  saveBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  saveText: {
    fontSize: 15,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic_700Bold",
  },
});
