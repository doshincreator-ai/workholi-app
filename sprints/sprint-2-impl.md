# Sprint 2 実装記録

## 実装ファイル

### 編集
- `app/(tabs)/index.tsx` — ホーム画面を全面リデザイン（編集）

## 実装の判断・考慮事項

### F2-1: 収入ヒーローセクション
- 月ナビゲーション（前月 / 今月 ↩ / 翌月）をヒーローカード内に統合
- 今月手取り（勤務終了分）を `Typography.monoXL` で最大表示
- 先週比デルタは現在月表示時のみ表示。「今週 vs 先週（月〜日）」のネット差分を `trending-up / trending-down` アイコンと色（positive/negative）で表現
- `±` 表記を避け `+XXX / -XXX` 形式でわかりやすく表示

### F2-2: クイックスタッツカード
- 総労働時間・平均時給・シフト数を横並び3カード（`flex: 1` 均等配置）
- 平均時給は `netPay / totalHours` で算出（既存ロジック流用、`totalHours === 0` は 0 を返す）
- 数値は `Typography.mono` で視認性を確保

### F2-3: 直近シフトリスト（今日・明日）
- `todayShifts` / `tomorrowShifts` をそれぞれフィルタし、シフトありなら `TodayShiftCard`、なければ `OffCard` を表示
- 「今日はオフ 🌴」「明日はオフ」でデータなし状態を明示（レイアウト崩れなし）
- カードタップで `/shifts/${id}` に遷移（`router.push`）
- 公休日バッジ（小ラベル）を `primarySubtle` 背景で表示

### F2-4: 週次バーチャート
- 外部ライブラリ不使用。純粋な `View` スタックでバー高さを計算
- 過去7日間（今日含む）の日別 netPay を `maxNet` 基準の相対高さで表示
- 今日（最右バー）は `Colors.primary`、他は `Colors.primaryMuted` で区別
- 収入ゼロの日は `Colors.border` の細線（2px）で存在を示す

### 制約遵守
- `any` 型: 使用なし
- `console.log`: 使用なし
- インラインスタイル: 使用なし（全て `StyleSheet.create` 内）
- スタイル管理: `styles` / `statStyles` / `shiftCardStyles` / `chartStyles` に分割し可読性を維持

## 自己評価

| 基準 | スコア | コメント |
|------|--------|----------|
| 機能完全性 | 9/10 | acceptance_criteria 全5項目を満たした。バーチャートはライブラリなしのため見た目はシンプル |
| コード品質 | 9/10 | any なし、StyleSheet.create のみ、副作用は useMemo/useState に閉じている |
| 仕様適合性 | 9/10 | out_of_scope（目標貯金・ストリーク・プッシュ通知）に一切触れていない |
| セキュリティ | 10/10 | UI変更のみ、認証・DB・Firestoreに無変更 |

## 既知の課題・次スプリントへの引き継ぎ

- 週次バーチャートはライブラリなし実装のため、タップでその日の収入内訳を見る機能は未実装（Sprint 4 以降で対応可）
- `app/(tabs)/shifts/` 配下・`app/(tabs)/employers/` 配下・`community.tsx`・`friends.tsx` は依然旧テーマのまま（Sprint 3 以降で段階的に移行）
- 平均時給は「手取りベース」で計算。グロスベースが必要な場合は Sprint 3 以降でオプション追加を検討
