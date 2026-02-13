import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const REST_NOTIFICATION_ID = 'rest-timer';
let channelCreated = false;

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function showRestTimerNotification(
  exerciseName: string,
  remaining: number,
  total: number
): Promise<void> {
  try {
    const isOvertime = remaining < 0;
    const absSeconds = Math.abs(remaining);
    const m = Math.floor(absSeconds / 60);
    const s = absSeconds % 60;
    const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    const title = isOvertime
      ? `⏰ Перерыв! -${timeStr}`
      : `⏱ Отдых: ${timeStr}`;

    const body = exerciseName;

    if (Platform.OS === 'android' && !channelCreated) {
      await Notifications.setNotificationChannelAsync('rest-timer', {
        name: 'Таймер отдыха',
        importance: Notifications.AndroidImportance.LOW,
        sound: null,
        vibrationPattern: [],
        enableVibrate: false,
      });
      channelCreated = true;
    }

    await Notifications.scheduleNotificationAsync({
      identifier: REST_NOTIFICATION_ID,
      content: {
        title,
        body,
        sound: false,
        sticky: true,
        ...(Platform.OS === 'android' && { channelId: 'rest-timer' }),
      },
      trigger: null,
    });
  } catch {
    // Notifications not available (e.g. Expo Go)
  }
}

export async function clearRestTimerNotification(): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(REST_NOTIFICATION_ID);
  } catch {
    // Notifications not available
  }
}

export async function clearAllNotifications(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch {
    // Notifications not available
  }
}
