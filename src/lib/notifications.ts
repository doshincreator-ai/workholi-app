import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Shift } from '../types';

// Android 通知チャンネル（アプリ起動時に一度だけ呼ぶ）
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'シフトリマインダー',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  }).catch(() => {});
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleShiftReminder(shift: Shift): Promise<string | null> {
  try {
    const shiftStart = new Date(`${shift.date}T${shift.startTime}:00`);
    const triggerDate = new Date(shiftStart.getTime() - (shift.reminderMinutes ?? 30) * 60 * 1000);
    const secondsUntil = Math.floor((triggerDate.getTime() - Date.now()) / 1000);
    if (secondsUntil <= 0) return null;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'シフトリマインダー',
        body: `${shift.employerName} のシフトが${shift.reminderMinutes ?? 30}分後に始まります`,
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: secondsUntil },
    });
    return id;
  } catch {
    return null;
  }
}

export async function cancelShiftReminder(notificationId: string | undefined): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {}
}
