import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// ─── Configure how incoming notifications are presented ──────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── Request permission & return push token ───────────────────────────────────
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[Notifications] Push notifications only work on physical devices.');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('fund-reminders', {
      name: 'Fund Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#208AEF',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Permission not granted.');
    return null;
  }

  return null; // We use local notifications only — no Expo push token needed.
}

// ─── Schedule a local fund reminder ──────────────────────────────────────────
export async function scheduleFundReminder(params: {
  fundName: string;
  targetAmount?: number | null;
  currentAmount: number;
  daysFromNow?: number; // default: 7
}): Promise<string | null> {
  const { fundName, targetAmount, currentAmount, daysFromNow = 7 } = params;

  const trigger = new Date();
  trigger.setDate(trigger.getDate() + daysFromNow);
  trigger.setHours(9, 0, 0, 0); // 9 AM

  const remaining = targetAmount ? targetAmount - currentAmount : null;
  const body = remaining !== null && remaining > 0
    ? `You need ₨${Math.round(remaining).toLocaleString()} more to reach your goal!`
    : `Keep it up! Your fund currently holds ₨${Math.round(currentAmount).toLocaleString()}.`;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `💰 ${fundName} Reminder`,
        body,
        sound: true,
        data: { type: 'fund_reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
      },
    });
    return id;
  } catch (e) {
    console.warn('[Notifications] Failed to schedule:', e);
    return null;
  }
}

// ─── Schedule a daily spending summary notification ───────────────────────────
export async function scheduleDailySummary(): Promise<string | null> {
  // Cancel any existing daily summary first
  await cancelNotificationsByTag('daily-summary');

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Daily Spending Check-in',
        body: 'Open Finora to review your spending today and stay on track!',
        sound: true,
        data: { type: 'daily_summary', tag: 'daily-summary' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 20,   // 8 PM
        minute: 0,
      },
    });
    return id;
  } catch (e) {
    console.warn('[Notifications] Failed to schedule daily summary:', e);
    return null;
  }
}

// ─── Cancel all scheduled notifications ──────────────────────────────────────
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Cancel by tag stored in notification data ────────────────────────────────
async function cancelNotificationsByTag(tag: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if ((n.content.data as any)?.tag === tag) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
}
