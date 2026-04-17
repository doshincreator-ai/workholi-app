# Sprint 2 評価レポート

## 判定: PASS ✅

> 対象コミット: ea365ff

---

## 静的解析

- TypeScript (`npx tsc --noEmit`): **PASS** — 型エラー 0
- `any` 型: **なし**
- `console.log`: **なし**
- インラインスタイル (`style={{}}`): **なし**
- expo-doctor: 対象外（UIレイアウト変更のみ）

---

## スコア

| 基準 | スコア | 閾値 | 判定 |
|------|--------|------|------|
| 機能完全性 | 9/10 | 7 | PASS |
| コード品質 | 8/10 | 7 | PASS |
| 仕様適合性 | 9/10 | 8 | PASS |
| セキュリティ | 10/10 | 8 | PASS |

---

## Acceptance Criteria 検証

| # | 基準 | 結果 | 根拠 |
|---|------|------|------|
| 1 | ホーム画面を開いたとき今月の手取り収入が最初に目に入る | ✅ | `heroNet`（monoXL）が ScrollView 最上部のヒーローカードに配置 |
| 2 | NZD・AUDの切替が即座に全数値に反映される | ✅ | `countryShifts`・`currency`・`rate` はいずれも `currentCountry` に依存し、`CountrySwitcher` の store 更新で全再計算 |
| 3 | 今日シフトがある場合、ホーム画面から確認できる | ✅ | `todayShifts` セクションで `TodayShiftCard` を表示 |
| 4 | シフトカードをタップするとシフト詳細画面に遷移する | ✅ | `router.push('/shifts/${shift.id}')` を `onPress` に設定 |
| 5 | データがない初期状態でもレイアウトが崩れない | ✅ | `OffCard` で空状態を明示、`maxNet = 0.01` でゼロ割り防止、`netPay` デフォルト 0 |

---

## 良かった点

- 3つの `useMemo`（`completedSummary` / `weekDelta` / `chartData`）で重い集計をメモ化し、`CountrySwitcher` 切替時の再レンダリングに対応
- 先週比デルタは「今月表示時のみ表示」と条件制御されており、過去月表示時に意味のない比較を出さない設計が適切
- バーチャートは外部ライブラリなしで実装し、新依存を一切追加していない。ゼロ収入の日は 2px 細線で"存在"を示す工夫がある
- `OffCard` / `TodayShiftCard` / `StatCard` / `WeeklyBarChart` を独立コンポーネントに分離し、`HomeScreen` 本体をロジック記述に集中させた
- Sprint 1 で構築したカラートークン・タイポグラフィを一貫して流用しており、デザイン統一性を維持

---

## 軽微な指摘（FAIL には至らない）

- **`StatCard` の平均時給が通貨記号なし**: `value={completedSummary.avgRate.toFixed(2)}` だけでは単位が不明。ラベル「平均時給」で文脈はわかるが、次スプリント以降で `NZD 8.50/h` 形式への改善を推奨
- **`isToday` 判定の冗長性**: `WeeklyBarChart` の `isToday` は `data.indexOf(d) === data.length - 1` だけで十分だが、`d.dowLabel === DOW_LABELS[new Date().getDay()]` の二重チェックが加わっている。バグではないが、読みやすさのため次スプリントで整理を推奨
- **`now` のメモ化外キャプチャ**: `completedSummary` の useMemo 内で参照する `now` はコンポーネントのトップレベルで作成されているため、アプリを日をまたいで起動したままにすると古い `now` を参照し続ける。既存パターンの踏襲であり今スプリントの責任範囲外だが、将来的に `useMemo` 内で `new Date()` を生成する形に修正を検討

---

## 次スプリントへの引き継ぎ

- `app/(tabs)/shifts/` 配下・`employers/` 配下・`community.tsx`・`friends.tsx` は旧テーマのまま残存。Sprint 3 以降で段階的移行
- 週次バーチャートのバータップ時に「その日の収入詳細」を表示する機能は未実装（Sprint 4 以降で対応可）
- 平均時給の通貨単位表示を次スプリントで対応推奨
