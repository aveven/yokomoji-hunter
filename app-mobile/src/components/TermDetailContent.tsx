import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Modal } from 'react-native';
import { termData, Rank } from '../data/termData';

const RANK_COLORS: Record<Rank, string> = {
  S: '#E8335D',
  A: '#F5A623',
  B: '#4A90E2',
  C: '#7ED321',
};

// ISO文字列 → 「2026年4月17日 15:30 に覚えた」
function formatLearnedDate(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${hh}:${mm} に覚えた`;
}

type Props = {
  termId: string;
  learnedIds?: string[];
  learnedDate?: string | null;
  onLearn?: (id: string) => void;
  onClose?: () => void;
};

export function TermDetailContent({ termId, learnedIds, learnedDate, onLearn, onClose }: Props) {
  const term = termData[termId];
  const [celebrating, setCelebrating] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.3)).current;

  if (!term) return null;

  const isLearned = !!learnedDate || (learnedIds?.includes(termId) ?? false);

  const handleLearnPress = () => {
    if (isLearned || !onLearn || celebrating) return;
    onLearn(termId);
    setCelebrating(true);
    scaleAnim.setValue(0.3);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 80,
      useNativeDriver: true,
    }).start();

    // 祝福を閉じてから、詳細モーダルを自動で閉じる
    setTimeout(() => {
      setCelebrating(false);
      onClose?.();
    }, 1500);
  };

  return (
    <View style={styles.inner}>
      <Text style={styles.termName}>{termId}</Text>
      {term.reading && (
        <Text style={styles.reading}>読み方：{term.reading}</Text>
      )}
      <View style={styles.rankRow}>
        <View style={[styles.rankBadge, { backgroundColor: RANK_COLORS[term.rank] }]}>
          <Text style={styles.rankText}>{term.rank}</Text>
        </View>
      </View>
      <Text style={styles.label}>実務インパクト</Text>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${term.impact}%` as any }]} />
      </View>
      <Text style={styles.impactValue}>{term.impact} / 100</Text>
      <Text style={styles.label}>解説</Text>
      <Text style={styles.explanation}>{term.description}</Text>

      {term.detail && (
        <View style={styles.detailBox}>
          <Text style={styles.detailLabel}>📖 もっと詳しく・例え話</Text>
          <Text style={styles.detailText}>{term.detail}</Text>
        </View>
      )}
      {term.usage && (
        <View style={styles.usageBox}>
          <Text style={styles.usageLabel}>💬 使い方</Text>
          <Text style={styles.usageText}>{term.usage}</Text>
        </View>
      )}
      {term.value && (
        <View style={styles.valueBox}>
          <Text style={styles.valueLabel}>🚀 覚えるとどうなる</Text>
          <Text style={styles.valueText}>{term.value}</Text>
        </View>
      )}

      {/* ── アクション領域：既習表示 or 覚えたボタン ── */}
      {isLearned ? (
        <View style={styles.learnedInfo}>
          <Text style={styles.learnedInfoText}>
            ✅ {learnedDate ? formatLearnedDate(learnedDate) : '覚えた済み'}
          </Text>
        </View>
      ) : onLearn ? (
        <TouchableOpacity
          style={styles.learnBtn}
          onPress={handleLearnPress}
          activeOpacity={0.7}
        >
          <Text style={styles.learnBtnText}>🧠 覚えた！</Text>
        </TouchableOpacity>
      ) : null}

      {/* ── 祝福オーバーレイ（画面中央に表示） ── */}
      <Modal
        visible={celebrating}
        transparent
        animationType="fade"
      >
        <View style={styles.celebrationBackdrop} pointerEvents="none">
          <Animated.View
            style={[styles.celebrationBox, { transform: [{ scale: scaleAnim }] }]}
          >
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.celebrationText}>覚えました！</Text>
            <Text style={styles.celebrationSub}>図鑑に追加しました</Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {},
  termName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  reading: {
    fontSize: 15,
    color: '#555',
    marginBottom: 14,
  },
  rankRow: {
    marginBottom: 16,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  barBg: {
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  barFill: {
    height: 10,
    backgroundColor: '#4A90E2',
    borderRadius: 5,
  },
  impactValue: {
    fontSize: 12,
    color: '#555',
    marginBottom: 16,
    textAlign: 'right',
  },
  explanation: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  detailBox: {
    backgroundColor: '#f0f4ff',
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4A90E2',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  usageBox: {
    backgroundColor: '#f0faff',
    borderLeftWidth: 3,
    borderLeftColor: '#7ec8e3',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  usageLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0d8fa6',
    marginBottom: 6,
  },
  usageText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  valueBox: {
    backgroundColor: '#fff8e1',
    borderLeftWidth: 3,
    borderLeftColor: '#F5A623',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  valueLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#c87800',
    marginBottom: 6,
  },
  valueText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  learnBtn: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  learnBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  learnedInfo: {
    backgroundColor: '#e8f5e9',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  learnedInfoText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '600',
  },
  celebrationBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationBox: {
    backgroundColor: '#fff8e1',
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 36,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F5A623',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  celebrationEmoji: {
    fontSize: 56,
    marginBottom: 6,
  },
  celebrationText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 4,
  },
  celebrationSub: {
    fontSize: 13,
    color: '#8a5a00',
  },
});
