import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { termData } from '../../src/data/termData';

const STORAGE_KEY = 'yokomoji_learned_terms';
const XP_STORAGE_KEY = 'yokomoji_xp';
const XP_PER_CORRECT = 10;

// ─── 型定義 ────────────────────────────────────────────────
type Choice = {
  id: string;
  isCorrect: boolean;
};

type QuizQuestion = {
  correctId: string;
  explanation: string;
  detail: string;
  value: string;
  usage: string;
  choices: Choice[];
};

// ─── 問題生成ヘルパー ───────────────────────────────────────
/**
 * learnedIds から1件正解を選び、termData 全体から不正解を補完して
 * 4択 QuizQuestion を返す。
 * learnedIds が空の場合は null を返す。
 */
function generateQuestion(
  learnedIds: string[],
  usedCorrectIds: Set<string>
): QuizQuestion | null {
  if (learnedIds.length === 0) return null;

  // まだ正解に使っていない覚えた用語を候補にする
  const available = learnedIds.filter((id) => !usedCorrectIds.has(id));
  // すべて使い切ったらリセット（周回）
  const pool = available.length > 0 ? available : learnedIds;

  // 正解をランダムに選ぶ
  const correctId = pool[Math.floor(Math.random() * pool.length)];

  // 不正解候補：termData 全体から正解以外
  const allOtherIds = Object.keys(termData).filter((id) => id !== correctId);

  // Fisher-Yates shuffle で上位3件を取り出す
  for (let i = allOtherIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allOtherIds[i], allOtherIds[j]] = [allOtherIds[j], allOtherIds[i]];
  }
  const wrongIds = allOtherIds.slice(0, Math.min(3, allOtherIds.length));

  // 4択をシャッフル
  const choices: Choice[] = [
    { id: correctId, isCorrect: true },
    ...wrongIds.map((id) => ({ id, isCorrect: false })),
  ];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  const t = termData[correctId];
  return {
    correctId,
    explanation: t.description,
    detail: t.detail || '',
    value: t.value || '',
    usage: t.usage || '',
    choices,
  };
}

// ─── レベル計算ヘルパー ─────────────────────────────────────
const XP_PER_LEVEL = 100;

function calcLevel(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpInLevel = xp % XP_PER_LEVEL;          // 現レベル内の累積XP
  const xpNeeded = XP_PER_LEVEL - xpInLevel;    // 次のレベルまで残りXP
  const progress = xpInLevel / XP_PER_LEVEL;    // 0.0 〜 1.0
  return { level, xpInLevel, xpNeeded, progress };
}

// ─── メイン画面 ─────────────────────────────────────────────
export default function QuizScreen() {
  const router = useRouter();
  const [learnedIds, setLearnedIds] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [usedCorrectIds, setUsedCorrectIds] = useState<Set<string>>(new Set());
  const [totalCount, setTotalCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [xp, setXp] = useState(0);
  const [expandedDetail, setExpandedDetail] = useState(false);

  // タブにフォーカスが当たるたびに再読込・問題リセット
  useFocusEffect(
    useCallback(() => {
      // 覚えた用語の読み込み（セッションスコアはリセット）
      AsyncStorage.getItem(STORAGE_KEY).then((json) => {
        const ids: string[] = json
          ? (JSON.parse(json) as string[]).filter((id) => termData[id])
          : [];
        setLearnedIds(ids);
        const fresh = new Set<string>();
        setUsedCorrectIds(fresh);
        setCurrentQuestion(ids.length > 0 ? generateQuestion(ids, fresh) : null);
        setSelectedId(null);
        setTotalCount(0);
        setCorrectCount(0);
        setExpandedDetail(false);
      }).catch(() => {
        // ストレージエラー時は空の状態にフォールバック
        setLearnedIds([]);
        setCurrentQuestion(null);
      });
      // XP は累積値なので上書きせず読み込みのみ
      AsyncStorage.getItem(XP_STORAGE_KEY).then((val) => {
        setXp(val ? parseInt(val, 10) : 0);
      }).catch(() => setXp(0));
    }, [])
  );

  // 選択肢タップ
  const handleSelect = useCallback(async (choice: Choice) => {
    if (selectedId !== null) return; // 回答済みは無視（二重カウント防止）
    setSelectedId(choice.id);
    setTotalCount((n) => n + 1);
    if (choice.isCorrect) {
      setCorrectCount((n) => n + 1);
      const next = xp + XP_PER_CORRECT;
      setXp(next);
      try {
        await AsyncStorage.setItem(XP_STORAGE_KEY, String(next));
      } catch {
        // 書き込み失敗時もXP表示は更新済み（次の読み込みで修正される）
      }
    }
  }, [selectedId, xp]);

  // 「次の問題へ」ボタン
  const handleNext = useCallback(() => {
    if (!currentQuestion) return;

    const newUsed = new Set(usedCorrectIds);
    newUsed.add(currentQuestion.correctId);

    // 全問使い切り → リセット（generateQuestion 内で自動周回するが state も更新）
    const remaining = learnedIds.filter((id) => !newUsed.has(id));
    const nextUsed = remaining.length > 0 ? newUsed : new Set<string>();

    setUsedCorrectIds(nextUsed);
    setCurrentQuestion(generateQuestion(learnedIds, nextUsed));
    setSelectedId(null);
    setExpandedDetail(false);
  }, [currentQuestion, usedCorrectIds, learnedIds]);

  // XP から自動計算（state 不要：xp が変わるたびに自動で再計算）
  const { level, xpInLevel, xpNeeded, progress } = calcLevel(xp);

  // ─── 空状態 ──────────────────────────────────────────────
  if (learnedIds.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headingRow}>
          <Text style={styles.heading}>クイズ</Text>
          <View style={styles.xpBadge}>
            <Text style={styles.xpBadgeText}>⚡ XP {xp}</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>マスターした用語を4択クイズで記憶に定着させよう</Text>
        <View style={styles.levelCard}>
          <View style={styles.levelCardTop}>
            <Text style={styles.levelText}>Lv. {level}</Text>
            <Text style={styles.xpNeededText}>次のレベルまであと {xpNeeded} XP</Text>
          </View>
          <View style={styles.levelBarBg}>
            <View style={[styles.levelBarFill, { width: `${Math.round(progress * 100)}%` as any }]} />
          </View>
          <Text style={styles.xpInLevelText}>{xpInLevel} / {XP_PER_LEVEL} XP</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎮</Text>
          <Text style={styles.emptyText}>まだクイズに出せる用語がありません</Text>
          <Text style={styles.emptyHint}>
            発見タブでAI用語を調べて{'\n'}「🧠 覚えた！」を押すとここで出題されます
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push('/(tabs)/')}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyBtnText}>🔍 AI用語を探しに行く</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 問題ロード中（通常は一瞬）
  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.heading}>クイズ</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>読み込み中…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isAnswered = selectedId !== null;
  const isCorrect =
    isAnswered && currentQuestion.choices.find((c) => c.id === selectedId)?.isCorrect;

  // ─── クイズ UI ───────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 見出し行：タイトル ＋ XP バッジ */}
        <View style={styles.headingRow}>
          <Text style={styles.heading}>クイズ</Text>
          <View style={styles.xpBadge}>
            <Text style={styles.xpBadgeText}>⚡ XP {xp}</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>マスターした用語を4択クイズで記憶に定着させよう</Text>

        {/* レベルカード */}
        <View style={styles.levelCard}>
          <View style={styles.levelCardTop}>
            <Text style={styles.levelText}>Lv. {level}</Text>
            <Text style={styles.xpNeededText}>次のレベルまであと {xpNeeded} XP</Text>
          </View>
          <View style={styles.levelBarBg}>
            <View style={[styles.levelBarFill, { width: `${Math.round(progress * 100)}%` as any }]} />
          </View>
          <Text style={styles.xpInLevelText}>{xpInLevel} / {XP_PER_LEVEL} XP</Text>
        </View>

        {/* スコア表示 */}
        <View style={styles.scoreBar}>
          <Text style={styles.scoreText}>
            {totalCount}問中 {correctCount}問正解
          </Text>
          {totalCount > 0 && (
            <Text style={styles.accuracyText}>
              正答率 {Math.round((correctCount / totalCount) * 100)}%
            </Text>
          )}
        </View>

        {/* 問題カード */}
        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>この説明に当てはまる用語はどれ？</Text>
          <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
        </View>

        {/* 選択肢 */}
        <View style={styles.choicesContainer}>
          {currentQuestion.choices.map((choice) => {
            const isSelected = choice.id === selectedId;
            return (
              <TouchableOpacity
                key={choice.id}
                style={[
                  styles.choiceBtn,
                  isAnswered && choice.isCorrect && styles.choiceCorrect,
                  isAnswered && isSelected && !choice.isCorrect && styles.choiceWrong,
                ]}
                onPress={() => handleSelect(choice)}
                activeOpacity={isAnswered ? 1 : 0.7}
              >
                <Text
                  style={[
                    styles.choiceBtnText,
                    isAnswered && choice.isCorrect && styles.choiceTextCorrect,
                    isAnswered && isSelected && !choice.isCorrect && styles.choiceTextWrong,
                  ]}
                >
                  {choice.id}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 結果 & 解説 & 次へ */}
        {isAnswered && (
          <View style={styles.resultContainer}>
            <Text style={[styles.resultText, isCorrect ? styles.resultCorrect : styles.resultWrong]}>
              {isCorrect
                ? `✅ 正解！　+${XP_PER_CORRECT} XP`
                : `❌ 不正解　正解は「${currentQuestion.correctId}」`}
            </Text>

            {/* 解説カード（detail/value/usage が1つ以上あるときだけ表示） */}
            {(!!currentQuestion.detail || !!currentQuestion.value || !!currentQuestion.usage) && (
              <View style={styles.explanationCard}>
                {!!currentQuestion.value && (
                  <View style={styles.explanationSection}>
                    <Text style={styles.explanationCardLabel}>⭐ 覚えるとどうなる？</Text>
                    <Text style={styles.explanationCardText}>{currentQuestion.value}</Text>
                  </View>
                )}
                {!!currentQuestion.usage && (
                  <View style={styles.explanationSection}>
                    <Text style={styles.explanationCardLabel}>💬 使い方</Text>
                    <Text style={[styles.explanationCardText, styles.usageText]}>「{currentQuestion.usage}」</Text>
                  </View>
                )}
                {!!currentQuestion.detail && (
                  <View style={styles.explanationSection}>
                    <TouchableOpacity
                      onPress={() => setExpandedDetail((v) => !v)}
                      activeOpacity={0.7}
                      style={styles.detailToggle}
                    >
                      <Text style={styles.explanationCardLabel}>
                        💡 詳しく {expandedDetail ? '▲' : '▼'}
                      </Text>
                    </TouchableOpacity>
                    {expandedDetail && (
                      <Text style={styles.explanationCardText}>{currentQuestion.detail}</Text>
                    )}
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>次の問題へ →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── スタイル ────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 48,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
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
  xpBadge: {
    backgroundColor: '#FFF8E1',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1.5,
    borderColor: '#F5A623',
  },
  xpBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E65100',
  },

  // レベルカード
  levelCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  levelCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  xpNeededText: {
    fontSize: 12,
    color: '#888',
  },
  levelBarBg: {
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  levelBarFill: {
    height: 8,
    backgroundColor: '#F5A623',
    borderRadius: 4,
  },
  xpInLevelText: {
    fontSize: 11,
    color: '#aaa',
    textAlign: 'right',
  },

  // スコア
  scoreBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  accuracyText: {
    fontSize: 13,
    color: '#4A90E2',
    fontWeight: '600',
  },

  // 空状態
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

  // 問題カード
  questionCard: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#4A90E2',
    marginBottom: 16,
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  explanationText: {
    fontSize: 15,
    color: '#222',
    lineHeight: 24,
  },

  // 選択肢
  choicesContainer: {
    marginHorizontal: 16,
    gap: 10,
  },
  choiceBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: '#ddd',
  },
  choiceCorrect: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2e7d32',
  },
  choiceWrong: {
    backgroundColor: '#fdecea',
    borderColor: '#c62828',
  },
  choiceBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  choiceTextCorrect: {
    color: '#2e7d32',
  },
  choiceTextWrong: {
    color: '#c62828',
  },

  // 結果
  resultContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  resultCorrect: {
    color: '#2e7d32',
  },
  resultWrong: {
    color: '#c62828',
  },
  nextBtn: {
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 40,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },

  // 解説カード
  explanationCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  explanationSection: {
    gap: 4,
  },
  explanationCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4A90E2',
    letterSpacing: 0.5,
  },
  explanationCardText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  usageText: {
    color: '#555',
    fontStyle: 'italic',
  },
  detailToggle: {
    paddingVertical: 2,
  },
});
