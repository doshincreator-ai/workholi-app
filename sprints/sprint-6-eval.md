# Sprint 6 評価レポート

## 判定: FAIL ❌

---

## 静的解析

- TypeScript (`npx tsc --noEmit`): **PASS** — エラーなし
- expo-doctor: 未実行（CI環境なし）

---

## スコア

| 基準 | スコア | 閾値 | 判定 |
|------|--------|------|------|
| 機能完全性 | 8/10 | 7 | PASS |
| コード品質 | 6/10 | 7 | **FAIL** |
| 仕様適合性 | 9/10 | 8 | PASS |
| セキュリティ | 7/10 | 8 | **FAIL** |

---

## 良かった点

- `subscribeToFriendFeed` の `onSnapshot` リアルタイム購読は仕様通りに動作する設計
- `incomeRankingOptOut` の実装が UI・Firestore・ランキング取得ロジックまで一貫している
- `activities` の書き込みルール（`request.resource.data.uid == request.auth.uid`）が正確
- `getWeekStart` を `socialService` に一元化し、クライアント・Firestore 同期の週ずれを防いでいる設計意図は良い
- fire-and-forget パターン（`.catch(console.error)`）で副作用を適切に分離
- `first_friend` バッジが sprint-6 でついに実装された

---

## 問題点

### [FAIL] コード品質

#### P1: `any` 型の使用禁止違反
- **場所**: `src/lib/socialService.ts:29`
- `createdAt: any` が `ActivityItem` インターフェースに存在する
- Generator 制約「`any` 型の使用禁止」に直接違反

#### P2: `onSnapshot` エラーハンドリングなし
- **場所**: `src/lib/socialService.ts:80–86`
- `onSnapshot(q, successCb)` の形式でエラーコールバックを省略している
- Firestore のセキュリティルール拒否やネットワーク断絶時にサイレント失敗する
- Generator 制約「空の catch ブロック禁止」と同等の問題（エラーを無視している）

#### P3: `getWeekStart()` UTC タイムゾーン問題
- **場所**: `src/lib/socialService.ts:44–45`
- `monday.toISOString().slice(0, 10)` は UTC の日付を返す
- NZ（UTC+12/13）・AU（UTC+8/10）では、月曜日午前の現地時間が UTC では日曜日になるため、実際の週と1日ずれて集計される
- 既存の `src/db/badges.ts` の `localDate()` パターンで回避している問題と同じ

### [FAIL] セキュリティ

#### P4: `currentWeekNetPay` が全認証ユーザーに公開される（Firestore Rules の抜け）
- **場所**: `firestore.rules:8`、`src/lib/socialService.ts:93–97`
- 週次収入データを `users/{uid}` ドキュメントに保存しているが、`users/{uid}` のルールは `allow read: if request.auth != null` — 認証済みユーザーなら**誰でも**読める
- acceptance_criteria 6「Firestore Security Rulesでフレンド以外のデータを読めないことを確認する」を満たしていない
- `activities` コレクションは正しくフレンド限定だが、収入の実数値（`currentWeekNetPay`）の保護が不十分
- 悪意あるクライアントは任意ユーザーの週次収入を直接 GET できる

#### P5: `first_friend` バッジのトリガー条件が fragile
- **場所**: `app/(tabs)/friends.tsx:192`
- `const isFirst = friends.length === 0 && requests.length === 1;` という UI ステート依存の条件
- 複数の申請を同時に受信したケースや、`load()` の非同期タイミングによっては正しく判定されない
- `earnBadge()` 自体が重複防止（`INSERT OR IGNORE`）を持つため、条件なしに常に呼べば安全かつ正確

---

## Generator へのフィードバック

### 修正1: `createdAt: any` を Firestore `Timestamp` 型に変更
`src/lib/socialService.ts` の `ActivityItem` インターフェースを以下のように修正すること：

```typescript
import { Timestamp, type Unsubscribe } from 'firebase/firestore';

export interface ActivityItem {
  id: string;
  uid: string;
  displayName: string;
  type: ActivityType;
  badgeId?: BadgeId;
  badgeEmoji?: string;
  badgeName?: string;
  createdAt: Timestamp | null;  // any → Timestamp | null
}
```

`timeAgo` 関数のシグネチャは `unknown` のままで問題ない。

---

### 修正2: `onSnapshot` にエラーコールバックを追加
`src/lib/socialService.ts:80` を以下に変更すること：

```typescript
return onSnapshot(
  q,
  (snap) => {
    const items: ActivityItem[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<ActivityItem, 'id'>),
    }));
    onUpdate(items);
  },
  (error) => {
    console.error('[Feed] onSnapshot error:', error);
    onUpdate([]);
  },
);
```

---

### 修正3: `getWeekStart()` のタイムゾーン修正
`src/lib/socialService.ts:39–46` を `src/db/badges.ts` の `localDate()` パターンに倣って修正すること：

```typescript
export function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  // toISOString() は UTC 日付を返すため使用禁止。localDate() で現地時間の日付を取得
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const day2 = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${day2}`;
}
```

---

### 修正4: `currentWeekNetPay` をフレンド限定で保護する
`users/{uid}` への全認証ユーザー読み取りは招待コード検索（`where('inviteCode', '==', code)`）に必要であり、ルールの変更は困難。
代わりに、週次収入データを専用サブコレクションに分離すること：

**方法**: `users/{uid}/social/weeklyStats` ドキュメント（本人のみ read/write）に `currentWeekNetPay` と `currentWeekStart` を移動し、ランキング取得時は `friendships` の存在確認を経て読み取る。

`firestore.rules` に以下を追加：
```
match /users/{uid}/social/{docId} {
  // フレンドか本人のみ読める
  allow read: if request.auth != null && (
    request.auth.uid == uid
    || exists(/databases/$(database)/documents/friendships/$(uid + '_' + request.auth.uid))
    || exists(/databases/$(database)/documents/friendships/$(request.auth.uid + '_' + uid))
  );
  // 書き込みは本人のみ
  allow write: if request.auth != null && request.auth.uid == uid;
}
```

`socialService.ts` の `refreshMyWeeklyStats` と `getFriendRankings` で参照先を `users/{uid}` → `users/{uid}/social/weeklyStats` に変更すること。

---

### 修正5: `first_friend` バッジ条件を単純化
`app/(tabs)/friends.tsx:189–201` を以下に変更すること：

```typescript
async function handleAccept(req: FriendRequest) {
  try {
    await acceptFriendRequest(req.id, req.fromUid, user!.uid, req.fromName, myName);
    // earnBadge は INSERT OR IGNORE なので常に呼んで安全
    const isNew = earnBadge('first_friend');
    if (isNew) loadBadges();
    Alert.alert('承認しました', `${req.fromName}さんと友達になりました`);
    load();
  } catch {
    Alert.alert('エラー', '承認に失敗しました');
  }
}
```

---

## Firestore Security Rules 重点検証サマリー

| コレクション | read | create | update | delete | 評価 |
|---|---|---|---|---|---|
| `activities` | フレンド限定（双方向friendships確認） | 本人uid一致 | false | 本人uid一致 | ✅ 正しい |
| `users` | 認証済み全員 ← ⚠️ | 本人のみ | 本人のみ | 本人のみ | ⚠️ weeklyNetPay露出 |
| `friendships` | 当事者（uids配列）のみ | 当事者のみ | false | 当事者のみ | ✅ |
| `shifts` | 本人 or フレンド（isShared=true） | 本人のみ | 本人のみ | - | ✅ |

`activities` のフレンドチェックは `friendships/{uid1_uid2}` と `friendships/{uid2_uid1}` の両方向を `exists()` で確認しており、friendship ID の辞書順ソートに依存しない実装になっている点は**正しい**。

---

## 次スプリントへの引き継ぎ

- 修正5点（P1〜P5）を Generator が対応し、Evaluator が再評価すること
- `weeklyNetPay` のサブコレクション分離は `src/lib/socialService.ts` と `firestore.rules` の両方に影響するため、修正後の再テスト必須
