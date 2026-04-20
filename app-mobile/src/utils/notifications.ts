import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

const NOTIF_HOUR = 20;
const NOTIF_MINUTE = 0;

/**
 * 毎日20:00に「今日のクイズ」リマインダーをスケジュールする。
 * Web では通知APIが未対応のため何もしない。
 * 既存のスケジュール済み通知を一度キャンセルしてから再登録するため、
 * アプリ起動ごとに呼んでも二重にはならない。
 */
export async function setupDailyNotification(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '今日の横文字、チェックした？ 🎯',
        body: '1語を覚えるだけでいい。今日のクイズに挑戦しよう！',
        sound: true,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour: NOTIF_HOUR,
        minute: NOTIF_MINUTE,
      },
    });
  } catch {
    // 通知のセットアップ失敗はサイレントに無視（機能の根幹ではない）
  }
}
