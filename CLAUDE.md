# 横文字ハンター — プロジェクト概要

## アプリの目的
AIやマーケティングなどで出てくる横文字（専門用語）に遭遇した時、即座に登録・学習できるアプリ。
「発見の喜び」「覚えた報酬」をゲーミフィケーションで醸成し、自分の成長を実感できる仕様。

## 現在のフェーズ
**Phase 1 — ローカルHTMLファイル（OneDrive）**
- 単一HTMLファイル（用語集_AI・マーケティング.html）
- データはlocalStorageに保存
- GitHub Pages への移行を検討中

## ファイル構成（現在）
```
OneDrive-個人用/
├── 用語集_AI・マーケティング.html   # アプリ本体
├── CLAUDE.md                        # このファイル
└── 用語データ.js                    # ※分離予定（未実装）
```

## ファイル構成（目標）
```
yokomoji-hunter/          # GitHubリポジトリ名（予定）
├── index.html
├── 用語データ.js          # KBデータのみ。HTMLとは分離
├── manifest.json          # PWA用（Phase 2）
├── sw.js                  # Service Worker（Phase 2）
└── CLAUDE.md
```

## ロードマップ
| Phase | 内容 | 状態 |
|---|---|---|
| 1 | HTMLファイルとしてOneDriveで動作 | ✅ 完了 |
| 2 | データファイル（用語データ.js）を分離 | 🔲 未着手 |
| 3 | GitHubリポジトリ作成・GitHub Pages公開 | 🔲 未着手 |
| 4 | PWA化（スマホのホーム画面にインストール可能） | 🔲 未着手 |
| 5 | ユーザー設計の決定（アカウントあり/なし） | 🔲 検討中 |
| 6 | Expo（React Native）でアプリ化 | 🔲 将来 |

## コア機能
- **発見（Discover）**：用語を入力 → KBから自動入力 → カード表示
- **図鑑（Library）**：登録済み用語をあいうえお順/ABC順で一覧
- **クイズ（Quiz）**：4択クイズで復習・⭐マスター度管理
- **ゲーミフィケーション**：XP・レベル・ストリーク・レベルアップ演出

## 用語カードの表示項目
- 重要度ランク（S/A/B/C）
- 実務インパクト（0〜100点、バーアニメーション）
- 遭遇率（高/中/低）
- 中学生でもわかる解説
- 使用例
- 「覚えるとどうなる？」（調べ直しコスト削減メッセージ）
- 獲得XP

## 技術スタック（現在）
- Vanilla HTML / CSS / JavaScript（フレームワークなし）
- localStorage（データ永続化）
- 外部依存ゼロ（オフライン動作）

## 技術スタック（将来候補）
- フロント: React / Next.js または Expo（React Native）
- DB: Supabase（無料枠あり・日本語ドキュメント充実）
- 認証: Supabase Auth または Firebase Auth
- ホスティング: GitHub Pages（Phase 3）→ Vercel（Phase 5以降）

## KBデータ（用語データ）の構造
```js
"用語キー": {
  fullName: "英語正式名",
  reading: "よみがな",
  cat: "AI" | "マーケティング" | "ビジネス" | "IT" | "その他",
  rank: "S" | "A" | "B" | "C",
  impact: 0〜100,
  freq: "高" | "中" | "低",
  explanation: "中学生でもわかる解説",
  example: "使用例",
  value: "覚えるとどうなる？（補助メッセージ）"
}
```

## Claude Codeへの作業依頼ルール
- **設計・議論はGPT/Geminiで行い、仕様が決まってからここに持ち込む**
- 依頼は「何を・どのファイルの・どう変えるか」を明示する
- 一度に一つのタスクに絞る

## ユーザー情報
- GitHubアカウント：あり
- GitHub Desktop：あり
- 用途：自分 + 他のユーザーに公開
- 最終目標：スマホアプリ化（App Store / Google Play）
