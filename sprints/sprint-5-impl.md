# Sprint 5 実装記録

## 実装ファイル

### 新規作成
- `src/db/badges.ts` — badges テーブル CRUD、BADGE_DEFS 定数、getStreak() ロジック
- `src/store/badgeStore.ts` — Zustand ストア（load / checkAndEarn / clearNewBadge）
- `src/components/BadgeCelebration.tsx` — バッジ解除アニメーション（react-native-reanimated）

### 編集
- `app/(tabs)/achievements.tsx` — BadgeGrid + StreakCard を追加（Sprint 4 プレースホルダー → 本実装）
- `src/store/shiftStore.ts` — add() 内で `useBadgeStore.checkAndEarn()` を呼び出し
- `app/_layout.tsx` — loadBadges() 起動時追加、BadgeCelebration をルートに配置

## 実装の判断・考慮事項

### F5-1: ストリーク
- `getStreak(shifts)` を `badges.ts` に純粋関数として実装
- 「今日シフトがある → 今日から過去に遡ってカウント」、「今日シフトがない → 昨日から過去に遡ってカウント」の2パターンで連続日数を算出
- ストリーク値は `badgeStore.streak` として保持し、`checkAndEarn` 呼び出し時に更新

### F5-2: バッジ判定
- `checkAndEarn(shifts)` で全バッジ条件を一括チェック
- `earnBadge(id)` は INSERT OR IGNORE で冪等性を確保。新規解除の場合 `true` を返す
- バッジ条件: 初回シフト / 累計時間 50h・100h・500h / 累計収入 1000・5000・10000 / ストリーク 7・30日
- `first_friend` バッジはフレンド機能との連携が必要なため今スプリントでは未トリガー（条件定義のみ）

### F5-3: バッジ解除アニメーション
- `react-native-reanimated` の `withSequence / withTiming / withDelay` で scale+opacity アニメーション
- フェードイン(300ms) → 表示(2000ms) → フェードアウト(400ms) の計2.7秒
- `runOnJS(onDone)` でアニメーション完了後に `clearNewBadge()` を呼び出しオーバーレイを除去
- `pointerEvents="none"` でオーバーレイ下の操作を妨げない

### F5-4: Achievementsタブ
- Sprint 4 の PaydayCard をそのまま保持し、上部に配置
- BadgeGrid: 10バッジを3列グリッドで表示。未解除バッジは opacity: 0.5 + 🔒 アイコン
- StreakCard: 現在のストリーク日数を大きく表示
- `shiftStore.shifts` を参照するだけで Zustand のリアクティビティにより自動更新

## 自己評価

| 基準 | スコア | コメント |
|------|--------|----------|
| 機能完全性 | 9/10 | AC 全5項目を満たした。first_friend バッジは条件定義済みだがトリガー未実装 |
| コード品質 | 9/10 | any なし、StyleSheet.create のみ、reanimated で型安全なアニメーション |
| 仕様適合性 | 9/10 | out_of_scope（共有・XP/レベル・サーバー管理）に触れていない |
| セキュリティ | 10/10 | ローカルDBのみ。Firestore / 認証に無変更 |

## 既知の課題・次スプリントへの引き継ぎ

- `first_friend` バッジはフレンド追加フロー（friendsStore 等）からの `checkAndEarn` 呼び出しが必要
- バッジ解除は `shiftStore.add()` でのみチェック。`update()` や `remove()` 後は再チェックなし（収入減少時のバッジ剥奪はしない設計）
- Sprint 3 の F3-5（目標達成コンフェッティ）は Sprint 5 の BadgeCelebration と統合可能
