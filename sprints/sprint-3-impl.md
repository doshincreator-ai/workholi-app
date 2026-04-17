# Sprint 3 実装記録

## 実装ファイル

### 新規作成
- `src/db/goals.ts` — goals テーブル CRUD（insertGoal / getAllGoals / deleteGoal）
- `src/store/goalStore.ts` — Zustand ストア（load / add / remove）
- `app/(tabs)/goals.tsx` — 目標一覧・作成・削除画面

### 編集
- `src/db/database.ts` — goals / badges テーブル追加、payday カラムマイグレーション追加
- `app/(tabs)/_layout.tsx` — goals / achievements タブ追加
- `app/(tabs)/index.tsx` — 上位目標カードをホーム画面に埋め込み、goalStore import
- `app/_layout.tsx` — goalStore.load() を起動時に呼び出し

## 実装の判断・考慮事項

- 目標の「現在の貯蓄額」は goals.country と一致するシフトの全時間軸 netPay 合計。「貯蓄額の手動入力禁止」制約に従い自動計算のみ
- 到達予測は直近28日間（4週間）の netPay 合計 / 4 で週平均を算出し `Math.ceil(remaining / avgWeekly)` で週数を返す
- 直近4週にシフトがない場合は `null` を返し「シフトを登録すると予測が表示されます」を表示
- F3-5（コンフェッティアニメーション）は優先度 medium かつ Sprint 5 でも同機能を実装するため、今スプリントでは「🎉 達成」バッジ表示で代替。Sprint 5 で統一的なアニメーション実装を推奨
- ホーム画面の topGoal は「達成率が最も高い目標（savings / targetAmount が最大）」を選択
- goals / achievements タブを _layout.tsx に同時追加（Sprint 4 で achievements 画面を実装）
- `CREATE TABLE IF NOT EXISTS goals/badges` を database.ts の initDatabase() に追加（既存 DB でも安全）

## 自己評価

| 基準 | スコア | コメント |
|------|--------|----------|
| 機能完全性 | 8/10 | AC 全5項目を満たした。F3-5（コンフェッティ）は簡易代替実装 |
| コード品質 | 9/10 | any なし、StyleSheet.create のみ、useMemo で重い集計をメモ化 |
| 仕様適合性 | 9/10 | out_of_scope（共有・プリセット・手動入力）に触れていない |
| セキュリティ | 10/10 | ローカル DB のみ、Firestore / 認証に無変更 |

## 既知の課題・次スプリントへの引き継ぎ

- F3-5 コンフェッティアニメーションは Sprint 5 で実装推奨（react-native-reanimated 活用）
- achievements タブの画面ファイル（achievements.tsx）は Sprint 4 で実装
- 目標の編集機能（名前・金額・絵文字の変更）は未実装（仕様に含まれていないが UX 改善に有効）
