// Web では expo-notifications が未対応のため no-op を返す
export async function setupDailyNotification(): Promise<void> {
  // Web build: notifications not supported, do nothing
}
