import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { termData, Rank } from '../../src/data/termData';
import { TermDetailContent } from '../../src/components/TermDetailContent';
import { modalStyles } from '../../src/components/sharedModalStyles';

// AsyncStorage の保存キー
const STORAGE_KEY    = 'yokomoji_learned_terms';
const HISTORY_KEY    = 'yokomoji_learned_history'; // { termId: ISODateString }

type TermItem = {
  id: string;
  rank: Rank;
};

const RANK_COLORS: Record<Rank, string> = {
  S: '#E8335D',
  A: '#F5A623',
  B: '#4A90E2',
  C: '#7ED321',
};

const allTerms: TermItem[] = Object.keys(termData).map((key) => ({
  id: key,
  rank: termData[key].rank,
}));

// ─── 検索正規化 ────────────────────────────────────────────
function normalize(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/\u3000/g, ' ')
    .trim();
}

// ─── メイン画面 ───────────────────────────────────────────
export default function DiscoverScreen() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [learnedIds, setLearnedIds] = useState<string[]>([]);
  const [learnedDates, setLearnedDates] = useState<Record<string, string>>({});

  // 起動時に保存済み用語と日時履歴を読み込む
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => { if (json) setLearnedIds(JSON.parse(json)); })
      .catch(() => setLearnedIds([]));
    AsyncStorage.getItem(HISTORY_KEY)
      .then((json) => { if (json) setLearnedDates(JSON.parse(json)); })
      .catch(() => setLearnedDates({}));
  }, []);

  // 覚えた！ボタンを押したとき
  const handleLearn = useCallback(async (id: string) => {
    if (learnedIds.includes(id)) return;
    const next = [...learnedIds, id];
    setLearnedIds(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    // 日付履歴を記録（stateにも即時反映）
    const nowIso = new Date().toISOString();
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      const history: Record<string, string> = raw ? JSON.parse(raw) : {};
      history[id] = nowIso;
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      setLearnedDates(history);
    } catch {
      setLearnedDates((prev) => ({ ...prev, [id]: nowIso }));
    }
  }, [learnedIds]);

  // モーダルを閉じる（クエリは維持）
  const handleClose = useCallback(() => setSelectedId(null), []);

  // 検索欄変更：クエリをセット＆空になったら選択をリセット
  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    if (!text.trim()) setSelectedId(null);
  }, []);

  // 入力が空の時は一覧を出さない。マッチした語を関連度順に返す
  // スコア: 0=完全一致 / 1=前方一致 / 2=部分一致 / 3=aliases一致
  // 同スコア内は impact 降順
  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return [];

    type Scored = { item: TermItem; score: number };
    const results: Scored[] = [];

    for (const item of allTerms) {
      const normId = normalize(item.id);
      let score = -1;

      if (normId === q) {
        score = 0; // 完全一致
      } else if (normId.startsWith(q)) {
        score = 1; // 前方一致
      } else if (normId.includes(q)) {
        score = 2; // 部分一致
      } else {
        // aliases チェック（未設定の用語は自動スキップ）
        const aliases = termData[item.id].aliases;
        if (aliases?.some((alias) => normalize(alias).includes(q))) {
          score = 3; // aliases 一致
        }
      }

      if (score >= 0) results.push({ item, score });
    }

    // score 昇順（高優先）→ impact 降順（重要語が上）
    results.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return (termData[b.item.id]?.impact ?? 0) - (termData[a.item.id]?.impact ?? 0);
    });

    return results.map((r) => r.item);
  }, [query]);

  // ── 0件時の近似候補（最大5件） ────────────────────────────
  // filtered が空のときだけ動く。文字一致率でスコアを算出。
  const suggestions = useMemo(() => {
    const q = normalize(query);
    if (!q || filtered.length > 0) return [];

    type SugScored = { item: TermItem; score: number };
    const results: SugScored[] = [];

    for (const item of allTerms) {
      // 比較対象：id + aliases（全て normalize 済み）
      const targets = [
        normalize(item.id),
        ...(termData[item.id].aliases?.map((a) => normalize(a)) ?? []),
      ];

      // q の各文字が target に含まれる割合を最大スコアとする
      let best = 0;
      for (const target of targets) {
        let matched = 0;
        for (const ch of q) {
          if (target.includes(ch)) matched++;
        }
        const score = matched / q.length;
        if (score > best) best = score;
      }

      // 半数以上の文字が一致すれば候補として採用
      if (best >= 0.5) results.push({ item, score: best });
    }

    // score 降順 → 同率は impact 降順
    results.sort((a, b) => {
      const diff = b.score - a.score;
      if (Math.abs(diff) > 0.05) return diff;
      return (termData[b.item.id]?.impact ?? 0) - (termData[a.item.id]?.impact ?? 0);
    });

    return results.slice(0, 5).map((r) => r.item);
  }, [query, filtered]);

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.heading}>発見</Text>
      <Text style={styles.subtitle}>気になったAI用語を検索して、意味をすぐに確認しよう</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="LLM、CVR… AI用語を検索"
        placeholderTextColor="#bbb"
        value={query}
        onChangeText={handleQueryChange}
        clearButtonMode="while-editing"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isLearned = learnedIds.includes(item.id);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setSelectedId(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.termName}>{item.id}</Text>
                {termData[item.id]?.reading && (
                  <Text style={styles.termReading}>{termData[item.id].reading}</Text>
                )}
              </View>
              <View style={styles.cardRight}>
                {isLearned && <Text style={styles.learnedBadge}>✅</Text>}
                <View style={[styles.rankBadge, { backgroundColor: RANK_COLORS[item.rank] }]}>
                  <Text style={styles.rankText}>{item.rank}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          query.trim() === '' ? (
            // ── 初期状態 ──
            <View style={styles.initialContainer}>
              <Text style={styles.initialPrompt}>気になったAI用語を入力してみましょう</Text>
              <Text style={styles.initialExample}>LLM / CVR / KPI</Text>
            </View>
          ) : suggestions.length > 0 ? (
            // ── 近似候補あり ──
            <View style={styles.suggestContainer}>
              <Text style={styles.suggestLabel}>🔍 もしかしてこちらですか？</Text>
              {suggestions.map((item) => {
                const isLearned = learnedIds.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.card}
                    onPress={() => setSelectedId(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.cardLeft}>
                      <Text style={styles.termName}>{item.id}</Text>
                      {termData[item.id]?.reading && (
                        <Text style={styles.termReading}>{termData[item.id].reading}</Text>
                      )}
                    </View>
                    <View style={styles.cardRight}>
                      {isLearned && <Text style={styles.learnedBadge}>✅</Text>}
                      <View style={[styles.rankBadge, { backgroundColor: RANK_COLORS[item.rank] }]}>
                        <Text style={styles.rankText}>{item.rank}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            // ── 候補なし ──
            <Text style={styles.empty}>その用語はまだ登録されていません。{'\n'}別の表記でも試してみてください</Text>
          )
        }
      />

      {/* ─── 詳細モーダル ─── */}
      <Modal
        visible={selectedId !== null}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        {/* 背景タップで閉じる（Modal の直下に配置してシートより先に描画） */}
        <TouchableOpacity
          style={modalStyles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        >
          {/* ボトムシート（backdrop の子として配置し確実にタッチを遮断） */}
          <TouchableOpacity
            style={modalStyles.sheet}
            activeOpacity={1}
            onPress={() => {/* シート内タップは閉じない */}}
          >
            {/* ── シートヘッダー：ハンドル ＋ × ボタン ── */}
            <View style={modalStyles.sheetHeader}>
              {/* 左の空きスペース（× ボタンと対称） */}
              <View style={modalStyles.headerSpacer} />
              {/* 中央ハンドル */}
              <View style={modalStyles.handle} />
              {/* 右 × ボタン */}
              <TouchableOpacity
                style={modalStyles.closeBtn}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={modalStyles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* ── スクロールコンテンツ ── */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={modalStyles.scroll}
            >
              {selectedId && (
                <TermDetailContent
                  termId={selectedId}
                  learnedIds={learnedIds}
                  learnedDate={learnedDates[selectedId] ?? null}
                  onLearn={handleLearn}
                  onClose={handleClose}
                />
              )}
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
    paddingBottom: 10,
  },
  searchInput: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 15,
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
  learnedBadge: {
    fontSize: 16,
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
  initialContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  initialPrompt: {
    fontSize: 15,
    color: '#888',
    marginBottom: 10,
  },
  initialExample: {
    fontSize: 13,
    color: '#bbb',
    letterSpacing: 1,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
    fontSize: 14,
  },
  // ── 近似候補 ──
  suggestContainer: {
    paddingTop: 4,
  },
  suggestLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
    marginTop: 4,
  },
});
