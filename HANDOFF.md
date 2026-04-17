# 引き継ぎ指示書（2026-04-17 / 2回目セッション）

## 対象プロジェクト
yokomoji-hunter: ~/Desktop/ClaudeProjects/yokomoji-hunter/

## 前セッションで完了したこと（本セッション成果・push済み）

### 1. クイズ解説画面のリッチ化（app-mobile）
- `quiz.tsx`：回答後の結果表示の下に「解説カード」を追加
- 表示フィールド：
  - 💡 詳しく（`detail` — HTMLタグなし、改行そのまま表示）
  - ⭐ 覚えるとどうなる？（`value`）
  - 💬 使い方（`usage` — 斜体・カギ括弧付き）
- 3フィールドすべて空のときはカード自体が非表示（空白カード防止）
- 回答済み連打は既存の `selectedId !== null` で二重カウント防止

### 2. レビュー指摘3件の反映
- 空カード描画防止（条件付きレンダリング）
- `detail` の `\n` を除去せず保持（React Native の `<Text>` が改行として表示）
- 日本語ラベルに無効だった `textTransform: 'uppercase'` を削除

### 3. Web版（docs/index.html）に `usage` 独立ボックス追加
- これまで `usage` は「▼ もっと詳しく」トグル内に隠れていた
- モバイル版と同じく専用ボックス（💬 使い方）として常時表示に変更
- CSS: `.usage-box` を新規追加（`.value-box` と同系統の配色、斜体）
- `detail-box` 内の `usage-label` 表示ロジックは削除済み

## やること（この順番で）

### 1. 【最優先】`/handoff` に `/ship` 自動連動を組み込む
MacBook Pro 側は `~/.claude/*` 編集禁止の制約で未実装。Mac Studio 側なら編集OK。

**編集対象**:
- `~/.claude/skills/handoff/SKILL.md` 本体

**仕様**:
- SCRATCHPAD.md・HANDOFF.md 生成 → history.json 更新 → ダッシュボード再生成 の後に、既に実装されている「自動コミット＆プッシュ」ブロックがあれば確認して動作を担保
- 既に手順7として入っているので、**スキル改修というより動作確認**が主目的

**確認コマンド**:
```bash
cat ~/.claude/skills/handoff/SKILL.md | grep -A10 "自動コミット"
```

### 2. 実機での usage ボックス見た目チェック（任意）
- Web版: https://aveven.github.io/yokomoji-hunter/
  - 用語を入力 → 登録モーダル内で「💬 使い方」ボックスが表示されるか目視
- モバイル版: https://yokomoji-hunter.expo.app
  - 発見タブで用語を選ぶ → 詳細モーダル内で「💬 使い方」が出るか
  - クイズタブで正解/不正解時に解説カードに usage が出るか
- 色味・斜体・括弧の組み合わせが読みにくければ調整

### 3. （任意）クイズ解説カードの UX 微調整
現状：回答直後にすべて展開される形で 3 フィールド全部表示。
候補：`detail` だけ長いので折りたたみ方式にするか、`value` をもっと目立たせるか、などユーザーの使用感しだい。

## 注意事項
- **`~/.claude/*` は Mac Studio 側なら編集可**（MacBook Pro 側の制約はそちらに引き継がれない）
- app-mobile のデプロイは `cd app-mobile && npm run deploy:web:prod`
- Web版（docs/）は push するだけで GitHub Pages が自動反映
- KB は 300 語全てに `detail`/`value`/`usage` 有り（空カードは現在のデータでは起きない）

## 完了条件
- 【1】 `/handoff` 実行時に自動で push まで完了するようになる（動作確認済み）
- 【2】 Web版 / モバイル版どちらでも `usage` が独立ボックスで見えている（✅ 本セッションで達成）

## 参考（司令塔での議論の要点）
- レビューエージェントの指摘を「必須修正」「要注意」「良い点」に分けて整理し、必須のみ即修正・要注意は据え置き判断（`isCorrect` の型ゆるさ・XP書き込み失敗時の先行UI）とした
- Web版の `usage` がトグルの裏に隠れているのは、モバイル版と比較して初めて気づいた UX の差分。並べて見ることで「ここは統一するべき」と判断できた
- HANDOFF の残タスク「usage 表示確認」を「コードを読むだけ」で済ませず、モバイルとの UX 差分まで踏み込んで対応した
