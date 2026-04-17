# SCRATCHPAD — 横文字ハンター

## 最終作業セッション
- **日付**: 2026-04-17（2回目）
- **内容**: クイズ解説画面リッチ化 + Web版 usage を独立ボックス化（モバイルとUX統一）

## 現在の状態
- Phase 1（HTML + OneDrive）: ✅完了
- Phase 2（用語データ分離）: ✅完了 — `docs/用語データ.js` に300語KB
- Phase 3（GitHub Pages公開）: ✅完了 — https://aveven.github.io/yokomoji-hunter/
- Phase 4（app-mobile Web公開）: ✅完了 — https://yokomoji-hunter.expo.app
- KB拡張: ✅完了 — 300語、全語に explanation/value/detail/usage
- 覚えた体験UX: ✅完了 — 祝福アニメ + 自動クローズ + 日時記録/表示
- 図鑑の並び替え: ✅完了 — 覚えた順 / 重要度順 / あいうえお順 / ABC順
- **クイズ解説リッチ化: ✅完了**（本セッション）— 💡 詳しく / ⭐ 覚えると / 💬 使い方
- **Web版 usage 独立ボックス: ✅完了**（本セッション）— モバイルとUX統一

## 公開URL
- **モバイルアプリWeb版（Expo）**: https://yokomoji-hunter.expo.app
- **Web版（docs）**: https://aveven.github.io/yokomoji-hunter/

## デプロイ方法（app-mobile）
```
cd app-mobile
npm run deploy:web:prod
```
Web版（docs/）は push で GitHub Pages が自動反映

## 本セッションで触ったファイル
```
app-mobile/app/(tabs)/quiz.tsx     ← 解説カード追加・型拡張・レビュー指摘反映
docs/index.html                    ← usage 独立ボックス追加（.usage-box / rc-usage）
SCRATCHPAD.md                      ← 本ファイル
HANDOFF.md                         ← 次セッション指示書
```

## 次回セッションでやること（HANDOFF.md 参照）
1. **【最優先】`/handoff` + `/ship` 自動連動の動作確認**
   - 編集対象: `~/.claude/skills/handoff/SKILL.md`
   - MacBook Pro側は `~/.claude/*` 編集禁止だったため持ち越し中
   - 既に自動コミットブロックは入っているので、動作確認が主目的
2. （任意）実機で usage ボックス見た目チェック → 調整
3. （任意）クイズ解説カードの UX 微調整（折りたたみ等）

## メモ
- EAS project ID: `3947a0ef-aad4-4698-a226-0a0121145a02`
- EAS アカウント: `aveven`
- `.vscode/` は個人設定なのでコミット対象外
- KBフィールド：web版は `explanation`、app-mobile は `description`（データソース別で整合性あり）
