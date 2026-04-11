import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { termData, Rank } from '../data/termData';

const RANK_COLORS: Record<Rank, string> = {
  S: '#E8335D',
  A: '#F5A623',
  B: '#4A90E2',
  C: '#7ED321',
};

type Props = {
  termId: string;
  learnedIds?: string[];
  onLearn?: (id: string) => void;
};

export function TermDetailContent({ termId, learnedIds, onLearn }: Props) {
  const term = termData[termId];
  if (!term) return null;

  const isLearned = learnedIds?.includes(termId) ?? false;

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

      {onLearn && (
        <TouchableOpacity
          style={[styles.learnBtn, isLearned && styles.learnBtnDone]}
          onPress={() => !isLearned && onLearn(termId)}
          activeOpacity={isLearned ? 1 : 0.7}
        >
          <Text style={[styles.learnBtnText, isLearned && styles.learnBtnTextDone]}>
            {isLearned ? '✅ 覚えた済み' : '🧠 覚えた！'}
          </Text>
        </TouchableOpacity>
      )}
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
  learnBtnDone: {
    backgroundColor: '#e8f5e9',
  },
  learnBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  learnBtnTextDone: {
    color: '#2e7d32',
  },
});
