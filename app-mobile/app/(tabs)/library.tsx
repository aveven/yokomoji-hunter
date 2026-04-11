import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { termData, Rank } from '../../src/data/termData';
import { TermDetailContent } from '../../src/components/TermDetailContent';
import { modalStyles } from '../../src/components/sharedModalStyles';

const STORAGE_KEY = 'yokomoji_learned_terms';

const RANK_COLORS: Record<Rank, string> = {
  S: '#E8335D',
  A: '#F5A623',
  B: '#4A90E2',
  C: '#7ED321',
};

type LearnedItem = {
  id: string;
  rank: Rank;
};

type SortKey = 'impact' | 'aiueo' | 'alphabet';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'impact',   label: '重要度順' },
  { key: 'aiueo',    label: 'あいうえお順' },
  { key: 'alphabet', label: 'ABC順' },
];

// ─── メイン画面 ───────────────────────────────────────────
export default function LibraryScreen() {
  const router = useRouter();
  const [learnedItems, setLearnedItems] = useState<LearnedItem[]>([]);
  const [sort, setSort]                 = useState<SortKey>('impact');
  const [selectedId, setSelectedId]     = useState<string | null>(null);

  // タブにフォーカスが当たるたびに再読込
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(STORAGE_KEY).then((json) => {
        if (!json) {
          setLearnedItems([]);
          return;
        }
        const ids: string[] = JSON.parse(json);
        const items = ids
          .filter((id) => termData[id])
          .map((id) => ({ id, rank: termData[id].rank }));
        setLearnedItems(items);
      }).catch(() => setLearnedItems([]));
    }, [])
  );

  const sortedItems = useMemo(() => {
    const items = [...learnedItems];
    switch (sort) {
      case 'impact':
        return items.sort(
          (a, b) => (termData[b.id]?.impact ?? 0) - (termData[a.id]?.impact ?? 0)
        );
      case 'aiueo':
        return items.sort((a, b) => {
          const ra = termData[a.id]?.reading ?? a.id;
          const rb = termData[b.id]?.reading ?? b.id;
          return ra.localeCompare(rb, 'ja');
        });
      case 'alphabet':
        return items.sort((a, b) => a.id.localeCompare(b.id, 'en'));
      default:
        return items;
    }
  }, [learnedItems, sort]);

  const handleClose = useCallback(() => setSelectedId(null), []);

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.heading}>図鑑</Text>
      <Text style={styles.subtitle}>覚えたAI用語がここに貯まっていきます。いつでも見返せます</Text>
      {learnedItems.length > 0 && (
        <Text style={styles.count}>覚えた用語：{learnedItems.length} 件</Text>
      )}

      {learnedItems.length > 0 && (
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.sortBtn, sort === opt.key && styles.sortBtnActive]}
              onPress={() => setSort(opt.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.sortBtnText, sort === opt.key && styles.sortBtnTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={sortedItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const term = termData[item.id];
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setSelectedId(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.termName}>{item.id}</Text>
                {term?.reading && (
                  <Text style={styles.termReading}>{term.reading}</Text>
                )}
              </View>
              <View style={styles.cardRight}>
                <View style={[styles.rankBadge, { backgroundColor: RANK_COLORS[item.rank] }]}>
                  <Text style={styles.rankText}>{item.rank}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>まだここに用語は貯まっていません</Text>
            <Text style={styles.emptyHint}>
              発見タブでAI用語を調べて{'\n'}「🧠 覚えた！」を押すとここに追加されます
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/(tabs)/')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyBtnText}>🔍 AI用語を探しに行く</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal
        visible={selectedId !== null}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <TouchableOpacity
          style={modalStyles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableOpacity
            style={modalStyles.sheet}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={modalStyles.sheetHeader}>
              <View style={modalStyles.headerSpacer} />
              <View style={modalStyles.handle} />
              <TouchableOpacity
                style={modalStyles.closeBtn}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={modalStyles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={modalStyles.scroll}
            >
              {selectedId && <TermDetailContent termId={selectedId} />}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── スタイル（一覧） ──────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 2,
    color: '#111',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  count: {
    fontSize: 13,
    color: '#888',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  sortRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  sortBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  sortBtnActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  sortBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  sortBtnTextActive: {
    color: '#fff',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cardLeft: {
    flex: 1,
  },
  termName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  termReading: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 28,
  },
  emptyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
