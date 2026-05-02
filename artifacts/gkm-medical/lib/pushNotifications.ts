import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const REMINDER_KEY_PREFIX = "rahah_reminder_";

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleLocalNotification(opts: {
  title: string;
  body: string;
}): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: opts.title,
        body: opts.body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  } catch {
    // Silently ignore if not available
  }
}

/**
 * Parses Arabic time strings like "10:30 صباحاً", "04:30 مساءً", "12:30 ظهراً"
 * into { hours, minutes } in 24-hour format.
 */
function parseArabicTimeTo24h(timeStr: string): { hours: number; minutes: number } {
  const match = timeStr.match(/(\d+):(\d+)/);
  if (!match) return { hours: 12, minutes: 0 };

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (timeStr.includes("صباحاً")) {
    // AM — keep hour as-is; treat 12 صباحاً as midnight (edge case)
    if (hours === 12) hours = 0;
  } else {
    // ظهراً (noon) or مساءً (evening) — treat as PM
    if (hours !== 12) hours += 12;
  }

  return { hours, minutes };
}

/**
 * Converts appointment date (YYYY-MM-DD) and Arabic time string to a UTC Date.
 */
function appointmentToDate(dateStr: string, timeStr: string): Date | null {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const { hours, minutes } = parseArabicTimeTo24h(timeStr);
    // Construct as local time — JS handles UTC offset automatically
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  } catch {
    return null;
  }
}

/**
 * Schedules a local notification 1 hour before the appointment.
 * Stores the notification identifier so it can be cancelled later.
 * Safe to call multiple times — cancels any previous reminder first.
 */
export async function scheduleAppointmentReminder(
  appointmentId: string,
  doctorName: string,
  dateStr: string,
  timeStr: string,
): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return;

    // Cancel any existing reminder for this appointment
    await cancelAppointmentReminder(appointmentId);

    const appointmentDate = appointmentToDate(dateStr, timeStr);
    if (!appointmentDate) return;

    // Reminder = 1 hour before appointment
    const reminderDate = new Date(appointmentDate.getTime() - 60 * 60 * 1000);

    // Only schedule if reminder time is in the future
    if (reminderDate.getTime() <= Date.now()) return;

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "تذكير بموعدك ⏰",
        body: `موعدك مع ${doctorName} بعد ساعة الساعة ${timeStr}`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { appointmentId, type: "appointment_reminder" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });

    // Persist identifier so we can cancel later
    await AsyncStorage.setItem(`${REMINDER_KEY_PREFIX}${appointmentId}`, identifier);
  } catch {
    // Silently ignore if scheduling fails (Expo Go limitations, etc.)
  }
}

/**
 * Cancels a previously scheduled appointment reminder.
 */
export async function cancelAppointmentReminder(appointmentId: string): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const key = `${REMINDER_KEY_PREFIX}${appointmentId}`;
    const identifier = await AsyncStorage.getItem(key);
    if (identifier) {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      await AsyncStorage.removeItem(key);
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Reschedules reminders for all upcoming appointments on app start.
 * Prevents reminders disappearing if the app is reinstalled or cleared.
 */
export async function rescheduleAllReminders(
  appointments: Array<{
    id: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
    doctor?: { name_ar?: string } | null;
  }>,
): Promise<void> {
  if (Platform.OS === "web") return;
  const upcoming = appointments.filter((a) => a.status === "upcoming");
  for (const a of upcoming) {
    const doctorName = a.doctor?.name_ar ?? "الطبيب";
    await scheduleAppointmentReminder(a.id, doctorName, a.appointment_date, a.appointment_time);
  }
}
