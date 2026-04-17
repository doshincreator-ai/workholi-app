# Sprint 6 実装記録

## 実装ファイル

- `src/lib/socialService.ts` — アクティビティ投稿・フィード購読・週次ランキング取得（新規作成）
- `src/store/socialStore.ts` — フィード・ランキング状態管理 Zustand ストア（新規作成）
- `src/lib/userService.ts` — UserProfile に `incomeRankingOptOut`, `currentWeekNetPay`, `currentWeekStart` 追加、`updateRankingOptOut()` 追加（編集）
- `src/store/shiftStore.ts` — シフト追加時に `postActivity('shift')` を非同期投稿（編集）
- `app/(tabs)/friends.tsx` — フレンド・ランキング・フィードの3タブ UI、`first_friend` バッジトリガー追加（編集）
- `app/(tabs)/achievements.tsx` — 取得済みバッジへのシェアボタン追加（編集）
- `app/(tabs)/settings.tsx` — 収入ランキング非参加トグル追加（編集）
- `firestore.rules` — `activities` コレクションのセキュリティルール追加（編集）

## 実装の判断・考慮事項

- **週次収入の集計**: フレンドの `private_shifts` サブコレクションは読み取り不可のため、ユーザープロフィールに `currentWeekNetPay` / `currentWeekStart` を保存し、ランキング画面表示時にローカル集計値を Firestore へ同期する方式を採用
- **アクティビティフィード**: Firestore `activities` コレクションに `onSnapshot` でリアルタイム購読。`uid in [friendUids]` クエリで最大30件取得（30人超は先頭30人のみ対応）
- **オフライン耐性**: `postActivity` と `syncWeeklyStats` はすべて fire-and-forget（`.catch(console.error)`）で、失敗してもローカル操作を妨げない
- **`first_friend` バッジ**: `acceptFriendRequest` 成功後に `earnBadge('first_friend')` を直接呼び出し（ストア循環依存を避けるため UI レイヤーで実行）
- **ランキングの optOut**: `users/{uid}.incomeRankingOptOut = true` のユーザーはランキング取得時にスキップ。デフォルト非参加でなく参加（`false`）として設計
- **Firestore Rules**: `activities` の読み取りは `friendships` コレクションの存在確認（双方向2パターン）でフレンド以外のデータを保護

## 自己評価

| 基準 | スコア | コメント |
|------|--------|----------|
| 機能完全性 | 9/10 | acceptance_criteria 全6項目を満たした。30人超フレンドは未対応 |
| コード品質 | 9/10 | any 型なし、型安全、副作用は fire-and-forget で分離 |
| 仕様適合性 | 9/10 | out_of_scope（グループチャット・フレンド詳細シフト閲覧）には触れていない |
| セキュリティ | 9/10 | activities rules でフレンド確認を実装。weeklyNetPay は users に保存するため既存の `allow read` ルールが適用される |

## 既知の課題・次スプリントへの引き継ぎ

- フレンドが30人超の場合、フィードのリアルタイム購読が先頭30人のみになる（Firestore `in` 制限）
- `currentWeekNetPay` の自動リセット機能なし（月曜日に自動で0にする仕組みが未実装）。現状は週が変わると `currentWeekStart` の不一致で自動的に0扱いになる
- `badge_earned` アクティビティの自動投稿は未実装（`badge_shared` の明示的シェアのみ対応）
