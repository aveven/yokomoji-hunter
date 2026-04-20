# 引き継ぎ指示書（2026-04-21）

## 対象プロジェクト
yokomoji-hunter: ~/Desktop/ClaudeProjects/yokomoji-hunter/

## 前セッションで完了したこと（push済み）

### value フィールド 105語を固有テキストに全面改訂

| カテゴリ | 修正件数 | commit |
|---|---|---|
| it_dev + ai_data | 70語 | `6b7aadf` |
| agent_ai + business | 35語 | `eef5766` |

**改訂内容:**
- 修正前: 「IT投資の議論に参加できます」「データサイエンティストとの会話で信頼感が増します」等の汎用フィラー（87%が該当）
- 修正後: DX推進担当が職場で使う具体シナリオ（ベンダー交渉・稟議・障害対応・AI評価会議など）に特化
- **全300語 value フィールドのフィラー残存 0件** 達成

---

## やること（優先度順）

### 🟢 任意機能追加（残り）
- **【高（部長視点）】管理者ダッシュボード / アカウント同期**
  - 現状は AsyncStorage のみ + JSON バックアップで対応済み
  - 本格的なクラウド同期（Firebase / Supabase）は別セッションで検討
  - 現時点では「バックアップを取る習慣」で十分

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
