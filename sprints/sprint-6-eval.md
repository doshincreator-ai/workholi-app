# Sprint 6 評価レポート（再評価）

## 判定: PASS ✅

> 初回評価 FAIL（コード品質 6/10、セキュリティ 7/10）から修正ラン後に再評価。

---

## 静的解析

- TypeScript (`npx tsc --noEmit`): **PASS** — エラーなし
- expo-doctor: 未実行（CI環境なし）

---

## スコア

| 基準 | 初回 | 今回 | 閾値 | 判定 |
|------|------|------|------|------|
| 機能完全性 | 8/10 | 8/10 | 7 | PASS |
| コード品質 | 6/10 | 8/10 | 7 | PASS |
| 仕様適合性 | 9/10 | 9/10 | 8 | PASS |
| セキュリティ | 7/10 | 9/10 | 8 | PASS |

---

## 静的解析 詳細

### TypeScript
```
npx tsc --noEmit → 出力なし（エラー0件）
```

---

## Acceptance Criteria 検証

| # | 基準 | 判定 | 根拠 |
|---|------|------|------|
| 1 | フレンドが1人以上いるとき、週次ランキングが表示される | ✅ | `handleTabChange('ranking')` が `friends.length > 0` 時に `loadRankings` を呼ぶ |
| 2 | ランキングの収入公開をオフにしたとき、自分がランキングから消える | ✅ | `getFriendRankings` が `stats.incomeRankingOptOut` を確認しスキップ。自分の画面では `isMe: true` で常に表示（仕様通り） |
| 3 | フレンドがシフトを登録するとフィードに表示される（30秒以内） | ✅ | `onSnapshot` リアルタイム購読。シフト追加時に `postActivity('shift')` を fire-and-forget で投稿 |
| 4 | バッジをシェアするとフレンドのフィードに反映される | ✅ | `handleShareBadge` → `postActivity('badge_shared', badge)` → フィードにリアルタイム反映 |
| 5 | フレンドが0人のときはランキング画面に招待を促すメッセージが出る | ✅ | `friends.length === 0` 時に「友達を追加するとランキングが表示されます」＋招待タブへのリンクを表示 |
| 6 | Firestore Security Rules でフレンド以外のデータを読めない | ✅ | `activities`・`users/{uid}/social` 共にフレンドシップ確認済み（後述） |

---

## Firestore Security Rules 重点検証

### `activities` コレクション

```
allow read: if request.auth != null && (
  resource.data.uid == request.auth.uid
  || exists(.../friendships/$(resource.data.uid + '_' + request.auth.uid))
  || exists(.../friendships/$(request.auth.uid + '_' + resource.data.uid))
);
```

- 本人のアクティビティは常に読める ✅
- フレンドのアクティビティは friendship ドキュメントの存在確認（双方向2パターン）で保護 ✅
- `allow create: request.resource.data.uid == request.auth.uid` — 他人名義の投稿不可 ✅
- `allow update: if false` — 改ざん不可 ✅

### `users/{uid}/social/{docId}` サブコレクション（今回の修正で追加）

```
allow read: if request.auth != null && (
  request.auth.uid == uid
  || exists(.../friendships/$(uid + '_' + request.auth.uid))
  || exists(.../friendships/$(request.auth.uid + '_' + uid))
);
allow write: if request.auth != null && request.auth.uid == uid;
```

- `currentWeekNetPay`（週次収入）がフレンド以外から読めない ✅
- `incomeRankingOptOut` もフレンド以外から読めない ✅
- 書き込みは本人のみ ✅
- 既存の `match /users/{uid}` ルール（認証済み全員読み取り可）はサブコレクションに**継承されない**（Firestore の仕様通り）✅
- キャッチオール `match /{document=**} { allow read, write: if false; }` は否定のみなので、本ルールの許可に干渉しない ✅

### 全コレクション セキュリティマトリクス

| コレクション | read | write | 評価 |
|---|---|---|---|
| `users/{uid}` | 認証済み全員（招待コード検索に必要） | 本人のみ | ✅ 設計上のトレードオフ（収入データは分離済み） |
| `users/{uid}/social/{docId}` | 本人またはフレンドのみ | 本人のみ | ✅ 週次収入を正しく保護 |
| `activities/{activityId}` | 本人またはフレンドのみ | 本人作成・本人削除 | ✅ |
| `friendships/{id}` | 当事者（uids配列）のみ | 当事者のみ | ✅ |
| `shifts/{id}` | 本人 or フレンド(isShared=true) | 本人のみ | ✅ |

---

## コード品質 検証

### 修正確認

| 初回問題 | 修正内容 | 確認 |
|---|---|---|
| P1: `createdAt: any` | `Timestamp \| null` に変更（`socialService.ts:29`） | ✅ |
| P2: `onSnapshot` エラーコールバックなし | 第3引数に `(error) => console.error(...)` 追加 | ✅ |
| P3: `getWeekStart()` UTC問題 | `toISOString()` を廃止し `getFullYear/getMonth/getDate` で現地時刻演算 | ✅ |
| P4: `currentWeekNetPay` 露出 | `users/{uid}/social/weeklyStats` サブコレクションへ移動 | ✅ |

### 残存する軽微な課題

**P5（低リスク）: `first_friend` バッジの `isFirst` 条件**
- `app/(tabs)/friends.tsx:192` — `friends.length === 0 && requests.length === 1` という UI ステート依存の条件が残っている
- ただし `earnBadge()` は `INSERT OR IGNORE` で重複を防ぐため、**最悪でも「バッジが取れないケースがある」だけで、不正取得は起きない**
- 安全方向の欠陥（機能不全）であり、セキュリティ・データ破壊には影響しない

**P6（設計上の制約）: `snap.exists() === false` のフレンドは $0 でランキングに表示される**
- `getFriendRankings` の実装（`socialService.ts:146–148`）: `weeklyStats` ドキュメントが未作成のフレンドは $0 エントリとして追加される
- 新規ユーザーや未ログイン時間が長いユーザーが常に最下位に表示される
- opt-out している場合は `continue` でスキップされるため問題なし
- 許容可能な設計選択

---

## 良かった点

- `WeeklyStats` インターフェースを `socialService.ts` 内に閉じ込め（非公開型）、外部への型漏洩がない
- `refreshMyWeeklyStats` が `setDoc(..., { merge: true })` を使用しているため、ドキュメント未存在の初回でもエラーにならない
- `getWeekStart()` の修正が `src/db/badges.ts` の `localDate()` と同じパターンで統一されており、週計算と日計算でタイムゾーンの扱いが一致している
- `updateRankingOptOut` が `userService` から `socialService` へ移動したことで、社会機能の責務が1ファイルに集約された
- Firestore Rules の `users/{uid}/social/{docId}` ルールが friendship チェックで双方向（`uid_authUid` / `authUid_uid`）をカバーしており、friendship ID のソート順に依存しない

---

## 次スプリントへの引き継ぎ

- P5（`first_friend` バッジ条件）は次スプリントの友達機能関連作業時にまとめて修正を推奨
- P6（未初期化フレンドの $0 表示）は UX 改善として「データなし」表示への切り替えを検討
- フレンドが30人超の場合のフィード購読制限（`in` クエリの30件上限）は引き続き未対応
