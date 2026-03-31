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

// ─── 詳細モーダルの中身（発見タブと同一構成） ──────────────
type DetailContentProps = { termId: string };

function DetailContent({ termId }: DetailContentProps) {
  const term = termData[termId];
  if (!term) return null;

  return (
    <View style={detailStyles.inner}>
      {/* 用語名 */}
      <Text style={detailStyles.termName}>{termId}</Text>

      {/* 読み方（あれば） */}
      {term.reading && (
        <Text style={detailStyles.reading}>読み方：{term.reading}</Text>
      )}

      {/* ランク */}
      <View style={detailStyles.rankRow}>
        <View style={[detailStyles.rankBadge, { backgroundColor: RANK_COLORS[term.rank] }]}>
          <Text style={detailStyles.rankText}>{term.rank}</Text>
        </View>
      </View>

      {/* インパクトバー */}
      <Text style={detailStyles.label}>実務インパクト</Text>
      <View style={detailStyles.barBg}>
        <View style={[detailStyles.barFill, { width: `${term.impact}%` as any }]} />
      </View>
      <Text style={detailStyles.impactValue}>{term.impact} / 100</Text>

      {/* 解説 */}
      <Text style={detailStyles.label}>解説</Text>
      <Text style={detailStyles.explanation}>{term.description}</Text>
    </View>
  );
}

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
      });
    }, [])
  );

  // 選択中のソートキーで並び替え（learnedItems は変更しない）
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

  // モーダルを閉じる
  const handleClose = useCallback(() => setSelectedId(null), []);

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.heading}>図鑑</Text>
      <Text style={styles.subtitle}>覚えたAI用語がここに貯まっていきます。いつでも見返せます</Text>
      {learnedItems.length > 0 && (
        <Text style={styles.count}>覚えた用語：{learnedItems.length} 件</Text>
      )}

      {/* 並び替えボタン（用語がある時だけ表示） */}
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

      {/* ─── 詳細モーダル（発見タブと同一構造） ─── */}
      <Modal
        visible={selectedId !== null}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        {/* 背景タップで閉じる */}
        <TouchableOpacity
          style={modalStyles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        >
          {/* ボトムシート（シート内タップは閉じない） */}
          <TouchableOpacity
            style={modalStyles.sheet}
            activeOpacity={1}
            onPress={() => {/* シート内タップは閉じない */}}
          >
            {/* シートヘッダー：ハンドル ＋ × ボタン */}
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

            {/* スクロールコンテンツ */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={modalStyles.scroll}
            >
              {selectedId && <DetailContent termId={selectedId} />}
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

// ─── スタイル（モーダル） ──────────────────────────────────
const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 40,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerSpacer: {
    width: 32,
    height: 32,
  },
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
  closeBtnText: {
    fontSize: 14,
    color: '#555',
    fontWeight: '600',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
});

// ─── スタイル（詳細コンテンツ） ────────────────────────────
const detailStyles = StyleSheet.create({
  inner: {
    // モーダルシートの中に直接置くので外枠なし
  },
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
    marginBottom: 8,
  },
});
