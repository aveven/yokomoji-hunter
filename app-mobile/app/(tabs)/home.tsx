import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { termData } from '../../src/data/termData';

const STORAGE_KEY    = 'yokomoji_learned_terms';
const XP_STORAGE_KEY = 'yokomoji_xp';
const XP_PER_LEVEL   = 100;

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

  const todayKey  = useMemo(() => getTodaysTerm(), []);
  const todayTerm = termData[todayKey];

  // タブにフォーカスが当たるたびに最新値を読み込む
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(XP_STORAGE_KEY).then((val) => {
        setXp(val ? parseInt(val, 10) : 0);
      });
      AsyncStorage.getItem(STORAGE_KEY).then((json) => {
        setLearnedCount(json ? (JSON.parse(json) as string[]).length : 0);
      });
    }, [])
  );

  const { level, xpInLevel, xpNeeded, progress } = calcLevel(xp);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── アプリヘッダー ── */}
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>🧠</Text>
          <Text style={styles.appTitle}>AI用語マスターになる！</Text>
          <Text style={styles.appTagline}>
            調べる・覚える・クイズで定着
          </Text>
          <Text style={styles.appBenefit}>
            知らないAI用語に出会っても、{'\n'}すぐ理解して前に進める
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
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{learnedCount}</Text>
            <Text style={styles.statLabel}>覚えた用語</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{level}</Text>
            <Text style={styles.statLabel}>レベル</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{xp}</Text>
            <Text style={styles.statLabel}>総 XP</Text>
          </View>
        </View>

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
