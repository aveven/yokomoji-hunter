import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_KEY = 'yokomoji_streak_v2';

type StreakData = { count: number; lastDate: string };

function toDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isConsecutive(prevDate: string, today: string): boolean {
  const d = new Date(prevDate);
  d.setDate(d.getDate() + 1);
  return toDateString(d) === today;
}

/**
 * 今日の起動でストリークを更新して現在の連続日数を返す。
 * 同日に複数回呼ばれても変化しない。
 */
export async function updateStreak(): Promise<number> {
  const today = toDateString(new Date());
  try {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    const data: StreakData = raw ? JSON.parse(raw) : { count: 0, lastDate: '' };

    if (data.lastDate === today) return data.count;

    const newCount = isConsecutive(data.lastDate, today) ? data.count + 1 : 1;
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify({ count: newCount, lastDate: today }));
    return newCount;
  } catch {
    return 1;
  }
}

export async function getStreak(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(STREAK_KEY);
    if (!raw) return 0;
    return (JSON.parse(raw) as StreakData).count;
  } catch {
    return 0;
  }
}
