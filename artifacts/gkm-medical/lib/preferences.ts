import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  notifications: "rahah_notifications",
  theme: "rahah_theme",
  language: "rahah_language",
  paymentMethods: "rahah_payment_methods",
  addresses: "rahah_addresses",
  userPhone: "rahah_user_phone",
} as const;

export type NotificationPrefs = {
  appointments: boolean;
  messages: boolean;
  payments: boolean;
  labResults: boolean;
  promotions: boolean;
};

const defaultNotifications: NotificationPrefs = {
  appointments: true,
  messages: true,
  payments: true,
  labResults: true,
  promotions: false,
};

export async function getNotifications(): Promise<NotificationPrefs> {
  const raw = await AsyncStorage.getItem(KEYS.notifications);
  if (!raw) return defaultNotifications;
  try {
    return { ...defaultNotifications, ...JSON.parse(raw) };
  } catch {
    return defaultNotifications;
  }
}

export async function setNotifications(prefs: NotificationPrefs): Promise<void> {
  await AsyncStorage.setItem(KEYS.notifications, JSON.stringify(prefs));
}

export type Theme = "light" | "dark" | "system";

export async function getTheme(): Promise<Theme> {
  const v = (await AsyncStorage.getItem(KEYS.theme)) as Theme | null;
  return v ?? "system";
}

export async function setTheme(t: Theme): Promise<void> {
  await AsyncStorage.setItem(KEYS.theme, t);
}

export type Language = "ar" | "en";

export async function getLanguage(): Promise<Language> {
  const v = (await AsyncStorage.getItem(KEYS.language)) as Language | null;
  return v ?? "ar";
}

export async function setLanguage(l: Language): Promise<void> {
  await AsyncStorage.setItem(KEYS.language, l);
}

export type PaymentMethod = {
  id: string;
  type: "visa" | "mastercard" | "mada" | "applepay";
  last4: string;
  holderName: string;
};

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const raw = await AsyncStorage.getItem(KEYS.paymentMethods);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function setPaymentMethods(methods: PaymentMethod[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.paymentMethods, JSON.stringify(methods));
}

export type Address = {
  id: string;
  label: string;
  city: string;
  district: string;
  street: string;
  isDefault: boolean;
};

export async function getAddresses(): Promise<Address[]> {
  const raw = await AsyncStorage.getItem(KEYS.addresses);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function setAddresses(addrs: Address[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.addresses, JSON.stringify(addrs));
}

export async function getUserPhone(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.userPhone)) ?? "";
}

export async function setUserPhone(phone: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.userPhone, phone);
}
