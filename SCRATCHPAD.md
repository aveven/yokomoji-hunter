# SCRATCHPAD — 横文字ハンター

## 最終作業セッション
- **日付**: 2026-04-12
- **内容**: 図鑑詳細リッチ化・usage追加・共通コンポーネント化・コード品質改善

## 現在の状態
- Phase 1（HTMLファイルとしてOneDriveで動作）: 完了
- Phase 2（用語データ分離）: 完了 — `docs/用語データ.js` に300語KBを管理
- Phase 3（GitHub Pages公開）: 完了 — https://aveven.github.io/yokomoji-hunter/
- KB拡張: 完了 — 300語、全語に explanation/value/detail/usage フィールド
- app-mobile/: Expoプロジェクト（動作確認は実機で要確認）

## 最新のファイル構成
```
docs/
  index.html        ← 横文字ハンター Web版（GitHub Pages）
  用語データ.js      ← KB 300語（value/detail/usage含む）
  .nojekyll         ← GitHub Pages設定
app-mobile/
  app/(tabs)/
    home.tsx        ← ホーム（覚えた数タップで履歴モーダル）
    index.tsx       ← 発見タブ（検索→詳細モーダル）
    library.tsx     ← 図鑑タブ（登録語一覧→詳細モーダル）
    quiz.tsx        ← クイズタブ
  src/
    data/termData.ts           ← 300語KBデータ（TypeScript型付き）
    components/
      TermDetailContent.tsx    ← 詳細モーダルの共通コンポーネント
      sharedModalStyles.ts     ← ボトムシートの共通スタイル
```

## 詳細モーダルで表示される内容（Web・モバイル共通）
1. わかりやすい解説（description/explanation）
2. 📖 もっと詳しく・例え話（detail）
3. 💬 使い方 — 普段の口語ビジネス会話例（usage）
4. 🚀 覚えるとどうなる（value）

## 次回セッションでやること（候補）
1. app-mobile の動作確認（Expo Go で実機テスト）
2. Web版の usage フィールド表示確認（GitHub Pages で実動作確認）
3. quiz.tsx の内容充実（現状スタブの可能性）

## メモ
- GitHub Pages URL: https://aveven.github.io/yokomoji-hunter/
- ルートの `index.html` は別プロジェクト（企画部会議SPA）が混入中 → 要整理
