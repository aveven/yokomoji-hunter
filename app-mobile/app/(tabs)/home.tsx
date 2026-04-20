import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { termData } from '../../src/data/termData';
import { updateStreak } from '../../src/utils/streak';
import { setupDailyNotification } from '../../src/utils/notifications';

const STORAGE_KEY    = 'yokomoji_learned_terms';
const HISTORY_KEY    = 'yokomoji_learned_history';
const XP_STORAGE_KEY = 'yokomoji_xp';
const XP_PER_LEVEL   = 100;

type HistoryItem = { id: string; learnedAt: string | null };

function formatDate(iso: string | null): string {
  if (!iso) return '日付不明';
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

function calcLevel(xp: number) {
  const level     = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpInLevel = xp % XP_PER_LEVEL;
  const xpNeeded  = XP_PER_LEVEL - xpInLevel;
  const progress  = xpInLevel / XP_PER_LEVEL;
  return { level, xpInLevel, xpNeeded, progress };
}

// 今日の日付（YYYYMMDD）をシードにして毎日同じ用語を選ぶ
function getTodaysTerm() {
  const keys = Object.keys(termData);
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return keys[seed % keys.length];
}

const RANK_COLOR: Record<string, string> = {
  S: '#FF6B6B',
  A: '#FF9F43',
  B: '#4A90E2',
  C: '#95A5A6',
};

const CAT_LABEL: Record<string, string> = {
  agent_ai: 'AIエージェント',
  ai_data:  'AI・データ',
  it_dev:   'IT・開発',
  business: 'ビジネス',
};

export default function HomeTab() {
  const router = useRouter();
  const [xp, setXp]                   = useState(0);
  const [learnedCount, setLearnedCount] = useState(0);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory]  = useState(false);
  const [streak, setStreak]            = useState(0);

  const todayKey  = useMemo(() => getTodaysTerm(), []);
  const todayTerm = termData[todayKey];

  // 初回マウント時のみ: ストリーク更新 + 通知セットアップ
  useEffect(() => {
    updateStreak().then(setStreak).catch(() => setStreak(1));
    setupDailyNotification();
  }, []);

  // タブにフォーカスが当たるたびに最新値を読み込む
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(XP_STORAGE_KEY).then((val) => {
        setXp(val ? parseInt(val, 10) : 0);
      }).catch(() => setXp(0));
      AsyncStorage.getItem(STORAGE_KEY).then(async (json) => {
        const ids: string[] = json ? JSON.parse(json) : [];
        setLearnedCount(ids.length);
        // 履歴（日付マップ）を読み込んでリストを構築
        try {
          const hRaw = await AsyncStorage.getItem(HISTORY_KEY);
          const histMap: Record<string, string> = hRaw ? JSON.parse(hRaw) : {};
          const items: HistoryItem[] = ids.map((id) => ({
            id,
            learnedAt: histMap[id] ?? null,
          }));
          // 日付の新しい順、日付不明は末尾
          items.sort((a, b) => {
            if (!a.learnedAt && !b.learnedAt) return 0;
            if (!a.learnedAt) return 1;
            if (!b.learnedAt) return -1;
            return b.learnedAt.localeCompare(a.learnedAt);
          });
          setHistoryItems(items);
        } catch { setHistoryItems(ids.map((id) => ({ id, learnedAt: null }))); }
      }).catch(() => { setLearnedCount(0); setHistoryItems([]); });
    }, [])
  );

  const { level, xpInLevel, xpNeeded, progress } = calcLevel(xp);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── アプリヘッダー ── */}
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>🎯</Text>
          <Text style={styles.appTitle}>横文字ハンター</Text>
          <Text style={styles.appTagline}>
            AI・DX用語を「調べる・覚える・クイズで定着」
          </Text>
          <Text style={styles.appBenefit}>
            会議の横文字に置いていかれない。{'\n'}明日の一言が、昨日より一歩うまくなる。
          </Text>
        </View>

        {/* ── メイン CTA ── */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push('/(tabs)/')}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaText}>🔍 AI用語を調べてみる</Text>
        </TouchableOpacity>

        {/* ── 今日の用語 ── */}
        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <Text style={styles.todayLabel}>📅 今日の用語</Text>
            {todayTerm.category && (
              <Text style={styles.todayCat}>{CAT_LABEL[todayTerm.category] ?? todayTerm.category}</Text>
            )}
          </View>
          <View style={styles.todayTitleRow}>
            <Text style={styles.todayTerm}>{todayKey}</Text>
            <View style={[styles.rankBadge, { backgroundColor: RANK_COLOR[todayTerm.rank] }]}>
              <Text style={styles.rankText}>{todayTerm.rank}</Text>
            </View>
          </View>
          {todayTerm.reading && (
            <Text style={styles.todayReading}>{todayTerm.reading}</Text>
          )}
          <Text style={styles.todayDesc} numberOfLines={3}>{todayTerm.description}</Text>
          <TouchableOpacity
            style={styles.todayButton}
            onPress={() => router.push('/(tabs)/')}
            activeOpacity={0.7}
          >
            <Text style={styles.todayButtonText}>発見タブで調べる →</Text>
          </TouchableOpacity>
        </View>

        {/* ── レベル・XP カード ── */}
        <View style={styles.levelCard}>
          <View style={styles.levelCardTop}>
            <View>
              <Text style={styles.levelLabel}>現在のレベル</Text>
              <Text style={styles.levelValue}>Lv. {level}</Text>
            </View>
            <View style={styles.xpBadge}>
              <Text style={styles.xpBadgeText}>⚡ {xp} XP</Text>
            </View>
          </View>
          <View style={styles.barBg}>
            <View
              style={[
                styles.barFill,
                { width: `${Math.round(progress * 100)}%` as any },
              ]}
            />
          </View>
          <View style={styles.levelCardBottom}>
            <Text style={styles.xpInLevelText}>{xpInLevel} / {XP_PER_LEVEL} XP</Text>
            <Text style={styles.xpNeededText}>次のレベルまであと {xpNeeded} XP</Text>
          </View>
        </View>

        {/* ── スタッツ ── */}
        <View style={styles.statsRow}>
          {/* 覚えた用語カード：タップで履歴モーダルを開く */}
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => setShowHistory(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.statValue}>{learnedCount}</Text>
            <Text style={styles.statLabel}>覚えた用語 📋</Text>
          </TouchableOpacity>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{level}</Text>
            <Text style={styles.statLabel}>レベル</Text>
          </View>
          <View style={[styles.statCard, streak >= 3 && styles.streakCardActive]}>
            <Text style={styles.statValue}>{streak > 0 ? `🔥${streak}` : '🌱1'}</Text>
            <Text style={styles.statLabel}>日連続</Text>
          </View>
        </View>

        {/* ── 履歴モーダル ── */}
        <Modal
          visible={showHistory}
          transparent
          animationType="slide"
          onRequestClose={() => setShowHistory(false)}
        >
          <TouchableOpacity
            style={histStyles.backdrop}
            activeOpacity={1}
            onPress={() => setShowHistory(false)}
          >
            <TouchableOpacity
              style={histStyles.sheet}
              activeOpacity={1}
              onPress={() => {}}
            >
              {/* ヘッダー */}
              <View style={histStyles.header}>
                <View style={histStyles.headerSpacer} />
                <View style={histStyles.handle} />
                <TouchableOpacity
                  style={histStyles.closeBtn}
                  onPress={() => setShowHistory(false)}
                  activeOpacity={0.7}
                >
                  <Text style={histStyles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={histStyles.title}>覚えた用語の記録</Text>
              <Text style={histStyles.subtitle}>{learnedCount} 語を習得済み</Text>

              {historyItems.length === 0 ? (
                <View style={histStyles.empty}>
                  <Text style={histStyles.emptyText}>まだ覚えた用語はありません</Text>
                  <Text style={histStyles.emptyHint}>発見タブで「🧠 覚えた！」を押すと記録されます</Text>
                </View>
              ) : (
                <FlatList
                  data={historyItems}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={histStyles.list}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => {
                    const term = termData[item.id];
                    return (
                      <View style={histStyles.row}>
                        <View style={histStyles.rowLeft}>
                          <Text style={histStyles.termName}>{item.id}</Text>
                          {term?.reading && (
                            <Text style={histStyles.reading}>{term.reading}</Text>
                          )}
                        </View>
                        <Text style={histStyles.date}>{formatDate(item.learnedAt)}</Text>
                      </View>
                    );
                  }}
                />
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* ── 使い方ヒント ── */}
        <Text style={styles.hintTitle}>使い方</Text>
        <View style={styles.hintCard}>
          <Text style={styles.hintRow}>🔍 <Text style={styles.hintBold}>発見</Text>　AI用語を検索してすぐに理解する</Text>
          <Text style={styles.hintRow}>📚 <Text style={styles.hintBold}>図鑑</Text>　覚えた用語をいつでも見返せる</Text>
          <Text style={styles.hintRow}>🎮 <Text style={styles.hintBold}>クイズ</Text>　4択クイズで記憶を定着させてXP獲得</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },

  // ── ヒーロー ──
  hero: {
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 28,
  },
  heroIcon: {
    fontSize: 52,
    marginBottom: 10,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 15,
    fontWeight: '600',
    color: '#444',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  appBenefit: {
    fontSize: 13,
    color: '#4A90E2',
    textAlign: 'center',
    lineHeight: 21,
  },

  // ── メイン CTA ──
  ctaButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.3,
  },

  // ── 今日の用語 ──
  todayCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D6E8FF',
    marginBottom: 20,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  todayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
    letterSpacing: 0.3,
  },
  todayCat: {
    fontSize: 11,
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  todayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  todayTerm: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
    flexShrink: 1,
  },
  rankBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rankText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
  },
  todayReading: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  todayDesc: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
    marginBottom: 14,
  },
  todayButton: {
    alignSelf: 'flex-end',
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A90E2',
  },

  // ── レベルカード ──
  levelCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 12,
  },
  levelCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  levelLabel: {
    fontSize: 11,
    color: '#aaa',
    marginBottom: 2,
  },
  levelValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  xpBadge: {
    backgroundColor: '#FFF8E1',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: '#F5A623',
  },
  xpBadgeText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#E65100',
  },
  barBg: {
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: {
    height: 10,
    backgroundColor: '#F5A623',
    borderRadius: 5,
  },
  levelCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpInLevelText: {
    fontSize: 11,
    color: '#aaa',
  },
  xpNeededText: {
    fontSize: 11,
    color: '#aaa',
  },

  // ── スタッツ ──
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
  },
  streakCardActive: {
    borderColor: '#FF9F43',
    backgroundColor: '#FFF8EE',
  },

  // ── ヒント ──
  hintTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#aaa',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hintCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    gap: 12,
  },
  hintRow: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  hintBold: {
    fontWeight: '700',
    color: '#333',
  },
});

// ── 履歴モーダル スタイル ──────────────────────────────────
const histStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerSpacer: { width: 32, height: 32 },
  handle: {
    width: 38,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, color: '#555', fontWeight: '600' },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowLeft: { flex: 1 },
  termName: { fontSize: 15, fontWeight: '600', color: '#222' },
  reading: { fontSize: 11, color: '#aaa', marginTop: 1 },
  date: { fontSize: 12, color: '#4A90E2', fontWeight: '600', marginLeft: 12 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#777', marginBottom: 8 },
  emptyHint: { fontSize: 13, color: '#aaa', textAlign: 'center', lineHeight: 20 },
});
