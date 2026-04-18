# SCRATCHPAD — 横文字ハンター

## 最終作業セッション
- **日付**: 2026-04-19
- **内容**: クイズ解説カード UX 改善（表示順変更 + detail 折りたたみ化）+ EASデプロイ

## 現在の状態
- Phase 1（HTML + OneDrive）: ✅完了
- Phase 2（用語データ分離）: ✅完了 — `docs/用語データ.js` に300語KB
- Phase 3（GitHub Pages公開）: ✅完了 — https://aveven.github.io/yokomoji-hunter/
- Phase 4（app-mobile Web公開）: ✅完了 — https://yokomoji-hunter.expo.app
- KB拡張: ✅完了 — 300語、全語に explanation/value/detail/usage
- 覚えた体験UX: ✅完了 — 祝福アニメ + 自動クローズ + 日時記録/表示
- 図鑑の並び替え: ✅完了 — 覚えた順 / 重要度順 / あいうえお順 / ABC順
- **クイズ解説リッチ化: ✅完了** — 💡 詳しく / ⭐ 覚えると / 💬 使い方
- **Web版 usage 独立ボックス: ✅完了** — モバイルとUX統一
- **クイズ解説カード UX 改善: ✅完了**（2026-04-19）— value/usage/detail 順 + detail 折りたたみ化

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
app-mobile/app/(tabs)/quiz.tsx     ← 解説カード表示順変更・detail 折りたたみ化
SCRATCHPAD.md                      ← 本ファイル
HANDOFF.md                         ← 次セッション指示書
```

## 次回セッションでやること（HANDOFF.md 参照）
1. **【最優先・持ち越し】`/handoff` 自動コミット動作確認**（`~/.claude/*` 編集可能な環境で）
2. （任意）実機でクイズ解説カード折りたたみ UX 確認
3. （任意）次フェーズ検討（クイズ履歴・苦手語ピックアップ等）

## メモ
- EAS project ID: `3947a0ef-aad4-4698-a226-0a0121145a02`
- EAS アカウント: `aveven`
- `.vscode/` は個人設定なのでコミット対象外
- KBフィールド：web版は `explanation`、app-mobile は `description`（データソース別で整合性あり）
