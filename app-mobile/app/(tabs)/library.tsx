import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { termData, Rank } from '../../src/data/termData';
import { TermDetailContent } from '../../src/components/TermDetailContent';
import { modalStyles } from '../../src/components/sharedModalStyles';

const STORAGE_KEY = 'yokomoji_learned_terms';
const HISTORY_KEY = 'yokomoji_learned_history';
const XP_STORAGE_KEY = 'yokomoji_xp';
const STREAK_KEY = 'yokomoji_streak_v2';

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

type SortKey = 'recent' | 'impact' | 'aiueo' | 'alphabet';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'recent',   label: '覚えた順' },
  { key: 'impact',   label: '重要度順' },
  { key: 'aiueo',    label: 'あいうえお順' },
  { key: 'alphabet', label: 'ABC順' },
];

// ─── メイン画面 ───────────────────────────────────────────
export default function LibraryScreen() {
  const router = useRouter();
  const [learnedItems, setLearnedItems] = useState<LearnedItem[]>([]);
  const [learnedDates, setLearnedDates] = useState<Record<string, string>>({});
  const [sort, setSort]                 = useState<SortKey>('recent');
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [showExport, setShowExport]     = useState(false);
  const [showImport, setShowImport]     = useState(false);
  const [exportText, setExportText]     = useState('');
  const [importText, setImportText]     = useState('');
  const [copied, setCopied]             = useState(false);

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
      AsyncStorage.getItem(HISTORY_KEY).then((json) => {
        setLearnedDates(json ? JSON.parse(json) : {});
      }).catch(() => setLearnedDates({}));
    }, [])
  );

  const sortedItems = useMemo(() => {
    const items = [...learnedItems];
    switch (sort) {
      case 'recent':
        // 覚えた日時の新しい順。履歴なしは末尾に。
        return items.sort((a, b) => {
          const da = learnedDates[a.id];
          const db = learnedDates[b.id];
          if (!da && !db) return 0;
          if (!da) return 1;
          if (!db) return -1;
          return db.localeCompare(da);
        });
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
  }, [learnedItems, learnedDates, sort]);

  const handleClose = useCallback(() => setSelectedId(null), []);

  // ── エクスポート ──────────────────────────────────────────
  const handleExport = useCallback(async () => {
    const [termsRaw, histRaw, xpRaw, streakRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY).catch(() => null),
      AsyncStorage.getItem(HISTORY_KEY).catch(() => null),
      AsyncStorage.getItem(XP_STORAGE_KEY).catch(() => null),
      AsyncStorage.getItem(STREAK_KEY).catch(() => null),
    ]);
    const backup = JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      terms: termsRaw ? JSON.parse(termsRaw) : [],
      history: histRaw ? JSON.parse(histRaw) : {},
      xp: xpRaw ? parseInt(xpRaw, 10) : 0,
      streak: streakRaw ? JSON.parse(streakRaw) : null,
    });
    setExportText(backup);
    setCopied(false);
    setShowExport(true);
  }, []);

  const handleCopyExport = useCallback(async () => {
    await Clipboard.setStringAsync(exportText);
    setCopied(true);
  }, [exportText]);

  // ── インポート ────────────────────────────────────────────
  const handleImport = useCallback(async () => {
    try {
      const data = JSON.parse(importText);
      if (!Array.isArray(data.terms)) throw new Error('invalid');

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.terms));
      if (data.history)
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(data.history));
      if (typeof data.xp === 'number')
        await AsyncStorage.setItem(XP_STORAGE_KEY, String(data.xp));
      if (data.streak)
        await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(data.streak));

      const items = (data.terms as string[])
        .filter((id) => termData[id])
        .map((id) => ({ id, rank: termData[id].rank }));
      setLearnedItems(items);
      setLearnedDates(data.history ?? {});
      setImportText('');
      setShowImport(false);
      Alert.alert('インポート完了', `${items.length} 語の学習データを復元しました`);
    } catch {
      Alert.alert('エラー', 'バックアップデータの形式が正しくありません。\nもう一度コピーして貼り付けてください。');
    }
  }, [importText]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>図鑑</Text>
          <Text style={styles.subtitle}>覚えたAI用語がここに貯まっていきます</Text>
        </View>
        <View style={styles.backupBtns}>
          <TouchableOpacity style={styles.backupBtn} onPress={handleExport} activeOpacity={0.7}>
            <Text style={styles.backupBtnText}>📤</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backupBtn} onPress={() => { setImportText(''); setShowImport(true); }} activeOpacity={0.7}>
            <Text style={styles.backupBtnText}>📥</Text>
          </TouchableOpacity>
        </View>
      </View>
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
              {selectedId && (
                <TermDetailContent
                  termId={selectedId}
                  learnedDate={learnedDates[selectedId] ?? null}
                />
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── エクスポートモーダル ── */}
      <Modal visible={showExport} transparent animationType="slide" onRequestClose={() => setShowExport(false)}>
        <TouchableOpacity style={backupStyles.backdrop} activeOpacity={1} onPress={() => setShowExport(false)}>
          <TouchableOpacity style={backupStyles.sheet} activeOpacity={1} onPress={() => {}}>
            <Text style={backupStyles.title}>📤 バックアップをコピー</Text>
            <Text style={backupStyles.hint}>
              このテキストをメモ帳などに保存しておくと、機種変更時にデータを復元できます。
            </Text>
            <ScrollView style={backupStyles.codeBox} contentContainerStyle={{ padding: 10 }}>
              <Text style={backupStyles.codeText} selectable>{exportText}</Text>
            </ScrollView>
            <TouchableOpacity
              style={[backupStyles.actionBtn, copied && backupStyles.actionBtnDone]}
              onPress={handleCopyExport}
              activeOpacity={0.8}
            >
              <Text style={backupStyles.actionBtnText}>{copied ? '✅ コピー済み' : '📋 クリップボードにコピー'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={backupStyles.closeBtn} onPress={() => setShowExport(false)}>
              <Text style={backupStyles.closeBtnText}>閉じる</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── インポートモーダル ── */}
      <Modal visible={showImport} transparent animationType="slide" onRequestClose={() => setShowImport(false)}>
        <TouchableOpacity style={backupStyles.backdrop} activeOpacity={1} onPress={() => setShowImport(false)}>
          <TouchableOpacity style={backupStyles.sheet} activeOpacity={1} onPress={() => {}}>
            <Text style={backupStyles.title}>📥 バックアップから復元</Text>
            <Text style={backupStyles.hint}>
              以前コピーしたバックアップテキストを下の欄に貼り付けてください。
            </Text>
            <TextInput
              style={backupStyles.importInput}
              value={importText}
              onChangeText={setImportText}
              placeholder='{"version":1,"terms":[...] の形式で貼り付け'
              placeholderTextColor="#bbb"
              multiline
              autoCorrect={false}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[backupStyles.actionBtn, !importText && backupStyles.actionBtnDisabled]}
              onPress={handleImport}
              activeOpacity={importText ? 0.8 : 1}
            >
              <Text style={backupStyles.actionBtnText}>✅ インポートする</Text>
            </TouchableOpacity>
            <TouchableOpacity style={backupStyles.closeBtn} onPress={() => setShowImport(false)}>
              <Text style={backupStyles.closeBtnText}>キャンセル</Text>
            </TouchableOpacity>
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
    gap: 6,
  },
  sortBtn: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 2,
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
    fontSize: 11,
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
  // ── ヘッダー行 ──
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  backupBtns: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 16,
  },
  backupBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backupBtnText: {
    fontSize: 18,
  },
});

// ─── バックアップモーダル スタイル ──────────────────────────
const backupStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: '#888',
    lineHeight: 19,
    marginBottom: 14,
  },
  codeBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    maxHeight: 160,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  codeText: {
    fontSize: 11,
    color: '#555',
    fontFamily: 'monospace',
  },
  importInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    height: 120,
    fontSize: 12,
    color: '#333',
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  actionBtn: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionBtnDone: {
    backgroundColor: '#2e7d32',
  },
  actionBtnDisabled: {
    backgroundColor: '#bbb',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  closeBtnText: {
    fontSize: 14,
    color: '#888',
  },
});
