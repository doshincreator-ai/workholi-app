# Sprint 1 実装記録

## 実装ファイル

### 新規作成
- `src/constants/colors.ts` — NZ Night カラートークン定義（新規作成）
- `src/constants/typography.ts` — タイポグラフィスケール定義（新規作成）

### 編集
- `app/(tabs)/_layout.tsx` — タブバーをダークテーマにリデザイン
- `app/(tabs)/index.tsx` — ホーム画面をNZ Nightテーマに全面リスキン（金額にmonoフォント適用）
- `app/(tabs)/report.tsx` — レポート画面をNZ Nightテーマに全面リスキン（金額にmonoフォント適用）
- `app/(tabs)/settings.tsx` — 設定画面をNZ Nightテーマにリスキン
- `app/_layout.tsx` — ローディング画面・ヘッダーカラーをダークテーマに更新
- `app/login.tsx` — ログイン画面をNZ Nightテーマにリスキン
- `app/register.tsx` — 登録画面をNZ Nightテーマにリスキン
- `src/components/CountrySwitcher.tsx` — モーダルをダークテーマにリスキン
- `src/components/HintBanner.tsx` — バナーをダークテーマにリスキン

## 実装の判断・考慮事項

- カラートークンは `src/constants/colors.ts` 1ファイルに集約。変更が全体に即時反映される設計
- ダークテーマ固定（ライトモード切替はスコープ外）とし、シンプルに維持
- 金額表示箇所には `Typography.monoXL` / `Typography.monoLarge` / `Typography.monoSmall` を使用し、iOS/Android両対応のモノスペースフォントを適用
- プライマリカラーを `#16a34a` から `#39d98a` に変更。背景 `#0e1117`、サーフェス `#1a1d26` でNZ Nightテーマを実現
- AUDアクセントは `#f59e0b`（ゴールド）をトークンとして定義済み（Sprint 2以降で活用）
- コントラスト比：textPrimary(`#fff`) / background(`#0e1117`) = ~21:1、textSecondary(`#9ba3b2`) / background = ~5.4:1（いずれも WCAG AA基準4.5:1を超過）

## 自己評価

| 基準 | スコア | コメント |
|------|--------|----------|
| 機能完全性 | 9/10 | acceptance_criteria 全4項目を満たした。shifts画面・employers画面・community画面・friends画面の細かいスタイルは未対応だが、主要画面は完了 |
| コード品質 | 9/10 | `any` なし、トークン参照で一元管理、StyleSheet.create のみ使用 |
| 仕様適合性 | 9/10 | out_of_scope（ライトモード切替・アニメーション・新規コンポーネント）に触れていない |
| セキュリティ | 10/10 | UIテーマ変更のみ、認証・DB・Firestore に無変更 |

## 既知の課題・次スプリントへの引き継ぎ

- `app/(tabs)/shifts/` 配下・`app/(tabs)/employers/` 配下・`app/(tabs)/community.tsx` ・`app/(tabs)/friends.tsx` はライトテーマのままで残存。Sprint 2のリデザイン時に合わせてColors/Typography参照へ移行推奨
- `src/components/ShiftForm.tsx`・`src/components/EmployerForm.tsx` など入力フォームも未変換（Sprint 2以降で対応）
