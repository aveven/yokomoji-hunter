# 引き継ぎ指示書（2026-04-17）

## 対象プロジェクト
yokomoji-hunter: ~/Desktop/ClaudeProjects/yokomoji-hunter/

## 前セッションで完了したこと（Mac側でpush済み）
- `app-mobile/` を EAS Hosting で **https://yokomoji-hunter.expo.app** に公開
- 虫歯アプリと同じ方式（`expo export` + `eas deploy`）を移植
- 発見タブのプレースホルダーを薄いグレーに
- 「覚えた！」押下で画面中央に祝福アニメ表示 → 1.5秒後に詳細モーダル自動クローズ
- 覚えた日時を AsyncStorage に保存・再表示（「YYYY年M月D日 HH:MM に覚えた」）
- 図鑑に **「覚えた順」並び替え** を追加（初期表示もこれに変更）

## やること（優先順位順）

### 1. 【最優先】`/handoff` に `/ship` 自動連動を組み込む
前セッションで方針合意済み。「ハンドオフしたつもりで push 忘れた」事故を防ぐため、`/handoff` 完了の最後で自動的に `/ship`（コミット+プッシュ）を走らせる仕様にする。

**編集対象**:
- `~/.claude/skills/handoff/` 配下のスキル定義ファイル（handoff skill本体）

**仕様**:
- SCRATCHPAD.md・HANDOFF.md を生成した直後に git add/commit/push を実行
- push が失敗しても handoff 文書は必ずローカルに残す（失敗理由を表示し手動コミットを促す）
- 順序: `/handoff` 生成 → `/ship` 実行（handoff文書ごとコミット）

**注意**:
- このセッション（MacBook Pro）では「`~/.claude/*` 編集禁止」の制約がかかっていたため未実装
- Mac Studio側では制約なしに編集OK

### 2. Web版（`docs/index.html`）の動作確認
- GitHub Pages: https://aveven.github.io/yokomoji-hunter/
- `usage` フィールド（💬 使い方）が表示されるか目視確認
- 表示されていなければ `docs/index.html` の詳細モーダル部分を修正

### 3. （任意）クイズ解説画面のリッチ化
現状 `quiz.tsx` は `description` のみ表示。`detail` / `usage` / `value` も含めるかユーザーに確認してから着手。

## 注意事項
- **`~/.claude/*` は Mac Studio側なら編集可**（MacBook Pro側の制約はそちらには引き継がれない）
- デプロイ反映コマンドは `cd app-mobile && npm run deploy:web:prod`
- `app-mobile/eas.json` は追加済み、`app.json` に EAS projectId (`3947a0ef-aad4-4698-a226-0a0121145a02`) 記録済み

## 完了条件
- 【1】 `/handoff` 実行時に自動で push まで完了するようになる
- 【2】 Web版で `usage` が表示されている／もしくは修正が当たっている

## 参考（司令塔での議論の要点）
- 動作確認の手軽さを優先し、Expo Go実機テストより **Webデプロイ優先** の判断を下した（虫歯アプリと同様）
- 祝福UIは初め「ボタン位置にインライン表示」で実装 → 「画面中央」に変更要望 → `Modal` ネストで解決
- `/handoff` ＋ `/ship` 自動連動のアイデアは、1セッション=1機能原則 × 他PC連携前提の組み合わせから出た良い改善案（ユーザー発案）
