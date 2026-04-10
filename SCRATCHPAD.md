# SCRATCHPAD — 横文字ハンター

## 最終作業セッション
- **日付**: 2026-04-11
- **内容**: Phase2（用語データ分離）+ Phase3（GitHub Pages公開）+ app-mobile AsyncStorage修正

## 現在の状態
- Phase 1（HTMLファイルとしてOneDriveで動作）: 完了
- Phase 2（用語データ分離）: **完了** — `docs/用語データ.js` に35語のKBを切り出し
- Phase 3（GitHub Pages公開）: **完了** — https://aveven.github.io/yokomoji-hunter/
- app-mobile/: Expoプロジェクト初期構成済み（AsyncStorageエラーハンドリング修正済み・動作未確認）

## ファイル構成
```
docs/
  index.html      ← 横文字ハンターアプリ本体（GitHub Pages & OneDrive用）
  用語データ.js    ← KB 35語（AI・マーケティング用語）
  .nojekyll       ← GitHub Pages設定
app-mobile/       ← Expoモバイルアプリ（未動作確認）
ai_terms_300_master.csv ← 300語マスターデータ（KBへの取り込みに使える）
```

## 次回セッションでやること（候補）
1. ai_terms_300_master.csv の300語を docs/用語データ.js に取り込む（現在35語 → 300語へ拡張）
2. app-mobile の動作確認（Expo Go で実機テスト）
3. GitHub Pages の動作確認・ブラッシュアップ

## メモ
- GitHub Pages URL: https://aveven.github.io/yokomoji-hunter/
- 引き継ぎメモ（GPT用・設計用）に設計経緯が記録されている
