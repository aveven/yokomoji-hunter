# 引き継ぎ指示書（2026-04-21）

## 対象プロジェクト
yokomoji-hunter: ~/Desktop/ClaudeProjects/yokomoji-hunter/

## 前セッションで完了したこと（push済み・EAS デプロイ済み）

### 機能追加 4件（3ペルソナレビュー提案を全対応）

| 機能 | commit | 場所 |
|---|---|---|
| クイズ解説カードから直接「覚えた！」登録 | `8472620` | quiz.tsx |
| 🔥 ストリーク（連続起動日数） | `7359655` | home.tsx + streak.ts |
| 🔔 毎日20時通知リマインダー | `7359655` + `0502f12` | notifications.ts + .web.ts |
| 📣 成績シェア | `4c8fd86` | home.tsx |
| 📤📥 データバックアップ（エクスポート/インポート） | `4c8fd86` | library.tsx |

**実装詳細:**
- `src/utils/streak.ts` — 連続日数管理（同日複数回は不変 / 翌日+1 / 2日以上でリセット）
- `src/utils/notifications.ts` — 毎日20:00通知（Web は `.web.ts` で no-op）
- クイズ解説カードの「🧠 覚えた！」ボタン → 発見タブと同一ロジックで AsyncStorage 登録
- 図鑑ヘッダー右上の 📤📥 ボタン → JSON エクスポート/インポートで機種変対応

---

## やること（優先度順）

### 🟢 任意機能追加（残り）
- **【高（部長視点）】管理者ダッシュボード / アカウント同期**
  - 現状は AsyncStorage のみ + JSON バックアップで対応済み
  - 本格的なクラウド同期（Firebase / Supabase）は別セッションで検討
  - 現時点では「バックアップを取る習慣」で十分

### 🔵 コンテンツ改善（任意）
- detail 欄の定型フィラー（`value` フィールド）はまだ残存 — 低優先
- 残りは用語数が少ないため次回以降でよい

### 🔵 持ち越し
- **`/handoff` 自動コミット動作確認**（`~/.claude/*` 編集可能な環境で）

---

## 注意事項
- app-mobile のデプロイ: `cd app-mobile && npm run deploy:web:prod`
- Web 版（docs/）は push で GitHub Pages 自動反映
- `.vscode/` はコミット対象外
- expo-notifications は Web ビルド非対応 → `.web.ts` で no-op スタブを提供済み
- expo-clipboard は Web/Native 両対応済み

## 参考
- 現状の公開 URL:
  - モバイル Web: https://yokomoji-hunter.expo.app
  - Web（docs）: https://aveven.github.io/yokomoji-hunter/
- EAS project ID: `3947a0ef-aad4-4698-a226-0a0121145a02`
- EAS アカウント: `aveven`
