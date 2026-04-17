# SCRATCHPAD — 横文字ハンター

## 最終作業セッション
- **日付**: 2026-04-17
- **内容**: app-mobile を EAS Hosting で公開 + 覚えた体験をリッチ化

## 現在の状態
- Phase 1（HTML + OneDrive）: ✅完了
- Phase 2（用語データ分離）: ✅完了 — `docs/用語データ.js` に300語KB
- Phase 3（GitHub Pages公開）: ✅完了 — https://aveven.github.io/yokomoji-hunter/
- Phase 4（app-mobile Web公開）: ✅完了 — **https://yokomoji-hunter.expo.app**
- KB拡張: ✅完了 — 300語、全語に explanation/value/detail/usage
- 覚えた体験UX: ✅完了 — 祝福アニメ + 自動クローズ + 日時記録/表示
- 図鑑の並び替え: ✅完了 — 覚えた順 / 重要度順 / あいうえお順 / ABC順

## 公開URL
- **モバイルアプリWeb版（Expo）**: https://yokomoji-hunter.expo.app
- **Web版（docs）**: https://aveven.github.io/yokomoji-hunter/

## デプロイ方法（app-mobile）
```
cd app-mobile
npm run deploy:web:prod
```

## 最新ファイル構成（変更のあった場所のみ）
```
app-mobile/
  app.json               ← web bundler metro + EAS projectId 追加
  eas.json               ← 新規。EAS Hosting設定
  package.json           ← build:web / deploy:web / deploy:web:prod 追加
  app/(tabs)/
    index.tsx            ← placeholder色 + learnedDates state + onClose連携
    library.tsx          ← 覚えた順ソート追加 + HISTORY_KEY読み込み
  src/components/
    TermDetailContent.tsx ← 祝福Modal + 日時フォーマット + learnedDate prop
```

## 次回セッションでやること（HANDOFF.md 参照）
1. **【最優先】`/handoff` に `/ship` 自動連動を組み込む**
   - 編集対象: `~/.claude/skills/handoff/`
   - 前セッションでユーザー合意済み
2. Web版（`docs/index.html`）の `usage` 表示確認
3. （任意）`quiz.tsx` の解説画面に detail/usage/value を追加するか検討

## メモ
- EAS project ID: `3947a0ef-aad4-4698-a226-0a0121145a02`
- EAS アカウント: `aveven`
- `.vscode/` は個人設定なのでコミット対象外
