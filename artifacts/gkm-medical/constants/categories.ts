import { Feather } from "@expo/vector-icons";

export const DOCTOR_CATEGORIES = [
  { key: "all", labelAr: "الكل", icon: "grid" as keyof typeof Feather.glyphMap },
  { key: "heart", labelAr: "القلب", icon: "heart" as keyof typeof Feather.glyphMap },
  { key: "women", labelAr: "النساء", icon: "user" as keyof typeof Feather.glyphMap },
  { key: "kids", labelAr: "الأطفال", icon: "smile" as keyof typeof Feather.glyphMap },
  { key: "dental", labelAr: "الأسنان", icon: "smile" as keyof typeof Feather.glyphMap },
  { key: "general", labelAr: "عام", icon: "activity" as keyof typeof Feather.glyphMap },
];
