# WorkHoli — プロジェクト概要

App display name: **WorkHoli** / package: `workholiday` / slug: `kiwilog`

NZワーキングホリデーメーカー向けシフト管理アプリ。シフト・給与の記録とフレンドとのシェアが目的。

---

## スタック

- **React Native + Expo Router**（ファイルベースのタブナビ）
- **Zustand** — ストア管理
- **expo-sqlite** — ローカルオフラインDB
- **Firebase Firestore** — ソーシャル機能・同期

## ストレージ設計

SQLite（オフラインファースト）と Firestore（ソーシャル機能）の2層構造。

## 主要画面（`app/` 以下）

`(tabs)/index`, `shifts/`, `employers/`, `report`, `friends`, `company`, `login`, `register`, `settings`

## Firestore コレクション

`users`, `shifts`, `friendships`, `friendRequests`, `companies`

---

## 税務ロジック（`src/utils/payCalculator.ts`）

- **M / M SL**: NZ 2025/26 累進PAYE計算
- **SB/S/SH/ST/SA**: 副収入フラットレート（10.5% / 17.5% / 30% / 33% / 45%）
- **ACC Levy**: 1.67%（2025/26年度）
- **Student Loan**: デフォルト12%（設定可）
- `calcHours` で日付をまたぐシフトを処理

## ソーシャル機能（`src/lib/friendService.ts`）

- フレンド追加は8桁大文字の招待コード
- `FriendShift` には給与フィールドなし（職場トラブル回避のため意図的）
- `getFriendShifts` は orderBy なしでクエリ → クライアントソート（Firestore複合インデックス回避）

## Firestore 同期（`src/lib/firestoreService.ts`）

- `wasShared` パラメータでシフト更新時の reviewCount 二重加算を防止
- `deleteShiftFromFirestore` でシェア済みシフト削除時に reviewCount をデクリメント

---

## リリース状況

- Google Play クローズドテスト（Alpha）公開中 — **versionCode 8**（2026/04/02）
- テスター募集中: nzdaisuki.com（2026/04/01〜8週間）、Threads、jams.tv
- 12人集まる or 14日経過でGoogle審査提出予定

### versionCode 履歴

| versionCode | 主な変更 |
|-------------|---------|
| 9 | バグ修正6件（payCalculator年収換算・Firestore同期エラーログ・シフトID検証・displayNameクラッシュ・曜日計算・通知エラーログ）、Firestoreテストデータリセット |
| 8 | NZ最低賃金 $23.95、AU最低賃金 $24.95、NZ ACC 1.67%、AU公休日×2.25に更新 |
| 7 | （それ以前） |

> **注意**: `eas.json` の `autoIncrement: true` により EAS ビルド時に自動インクリメント。手動変更不要。

---

## 本番リリース前にやること

- AdMob（`ca-app-pub-8389237149068331`）でリワード広告ユニットを作成し、`src/components/RewardedAdButton.tsx` の `REWARDED_AD_UNIT_ID` を差し替えてビルド
- Firestore のテストデータをリセット

---

## 実装済み機能

- レベルシステム（🥚→🐣→🐤→🐔→🦅）累計手取りベース
- ストリーク（連続勤務日数）2日以上で表示
- コミュニティ：地域フィルター＋業種フィルター、isHiring優先ソート、更新日時表示
- 企業詳細：住所タップでGoogle Maps、公開日・最終更新日表示
- フレンド：招待コードのシェア機能
- シフト：月次合計手取り表示

## 将来の候補機能

- 地図ビューで地域×職種×平均時給を可視化（データ蓄積後）
- AU 88日間カウンター（セカンドビザ条件トラッキング）
- iOSビルド（Apple Developer $99/年が必要）
- NZの3ヶ月雇用主ルールは撤廃済み（AUは6ヶ月制限あり）

---

## 自律作業ルール（Claude 必読）

**ユーザーの手を極力かけないこと。以下のルールを厳守すること。**

### マルチエージェント実行ルール
- 機能追加・バグ修正・リファクタリングなど、**2つ以上の独立したサブタスクに分解できる場合は必ず並列エージェントで実行する**
- オーケストレーター（自分）はタスクを分解して各エージェントに割り振り、完了後に統合・型チェック・報告を行う
- エージェントの分割例：
  - `DB/ロジック担当` → `src/db/`, `src/store/`, `src/utils/`
  - `UI担当` → `app/`, `src/components/`
  - `統合・品質担当` → 型チェック、既存コードとの整合性確認
- 各エージェントは作業完了後に変更ファイル一覧と概要をオーケストレーターに返す
- ユーザーへの最終報告は**オーケストレーターが1回**まとめて行う

### 判断・実行ルール
- TypeScript の型エラーは自分で調査・修正してから報告する（エラーそのままで報告しない）
- ファイル変更後は `npx tsc --noEmit` で型チェックし、エラーがあれば即座に修正する
- バグ報告を受けたら：①再現ルートを特定 → ②原因コードを読む → ③修正案を実装 → ④型チェック → ⑤報告、の順で自律処理
- 「どちらにしますか？」という質問は最小限に。本ドキュメントのルールで判断できる場合は即実行
- 新機能追加時、既存パターンと一致する実装なら確認不要で進める

### やってはいけないこと
- 型エラーを `any` で誤魔化す
- `// @ts-ignore` を使う
- 既存の命名規則を破る（Store は `use〇〇Store`、DB関数は動詞から始める）
- Firestore に給与情報を含む `FriendShift` を書き込む（意図的設計）

---

## コーディングパターン

### 新しい画面を追加する手順
1. `app/(tabs)/画面名.tsx` または `app/(tabs)/画面名/index.tsx` を作成
2. `app/(tabs)/_layout.tsx` の `<Tabs>` に `<Tabs.Screen>` を追加
3. 必要なら `src/store/` に Store を追加
4. 必要なら `src/db/` に DB関数を追加

### 画面の標準テンプレート
```tsx
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useXxxStore } from '../../../src/store/xxxStore';

export default function XxxScreen() {
  const { data } = useXxxStore();
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-4">
        {/* content */}
      </ScrollView>
    </SafeAreaView>
  );
}
```

### Zustand Store の標準テンプレート
```ts
import { create } from 'zustand';
import { useToastStore } from './toastStore';

interface XxxStore {
  items: Xxx[];
  load: () => void;
  add: (data: InsertXxxData) => void;
  remove: (id: number) => void;
}

export const useXxxStore = create<XxxStore>((set, get) => ({
  items: [],
  load: () => { /* db query */ },
  add: (data) => { /* insert + load */ },
  remove: (id) => { /* delete + load */ },
}));
```

### SQLite ↔ Firestore 使い分けルール
| データ | 場所 |
|--------|------|
| シフト・雇用主（自分のデータ） | SQLite のみ |
| シフト共有（ソーシャル） | Firestore |
| ユーザープロフィール・フレンド | Firestore |
| 設定 | SQLite（settingsStore） |

---

## UI ガイドライン（NativeWind）

- **背景**: `bg-white`（画面）、`bg-gray-50`（リスト行）
- **テキスト**: `text-gray-900`（本文）、`text-gray-500`（補足）、`text-green-700`（金額）
- **ボタン（プライマリ）**: `bg-green-600 rounded-xl px-4 py-3`
- **ボタン（セカンダリ）**: `border border-gray-300 rounded-xl px-4 py-3`
- **カード**: `bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3`
- **セクションヘッダー**: `text-sm font-semibold text-gray-500 uppercase tracking-wide`
- **アイコン**: `@expo/vector-icons` の `Ionicons` を使用
- **間隔**: `px-4`（水平パディング標準）、`mb-3`（リスト間隔）

---

## デバッグ・品質チェック手順

### バグ修正の進め方
1. エラーメッセージ or 再現手順を確認
2. 関連ファイルを `Grep` で特定
3. 原因箇所を読んで修正
4. `npx tsc --noEmit` で型チェック
5. 修正内容をユーザーに1行で報告

### TypeScript エラーの対処
- `npx tsc --noEmit 2>&1` でエラー一覧を確認
- `expo/tsconfig.base` を継承 + `strict: true`
- path alias なし（`../../../src/...` の相対パスを使う）

---

## UI 確認ワークフロー（MCP）

UIの変更をした場合：
1. `expo start --web` でWebプレビューを起動（ポート19006）
2. Claude in Chrome MCP でスクリーンショット撮影・確認
3. 問題があれば自律修正してから報告

```bash
# Webプレビュー起動コマンド
cd /c/Users/user-laptop/projects/kiwilog && npx expo start --web --port 19006
```

## 作業フロー
1. GitHub Issue を確認して着手
2. 実装 → tsc --noEmit → commit
3. 完了後に Issue にコメントで作業ログ投稿
4. エラーは3回自己解決を試みてから報告

## Commit 規則
feat / fix / chore / refactor のいずれかをプレフィックスに使う

## 並列実行ルール
- 独立ファイルの修正は必ず並列実行
- Firestore と SQLite の修正は並列可
