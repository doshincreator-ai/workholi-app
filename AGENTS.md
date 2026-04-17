# AGENTS.md — WorkHoli Agent Pipeline

WorkHoli の実装・評価ループを担う3つのサブエージェントの定義。
Claude Code の `Task` ツールでサブエージェントを起動し、スプリント単位で実装→評価→修正を繰り返す。

---

## エージェント構成

```
Planner ──→ Generator ──→ Evaluator
                ↑               │
                └───── FAIL ────┘
```

1. **Planner** — 要件を受け取り、スプリント分割された仕様書を生成
2. **Generator** — 仕様書の1スプリントを実装
3. **Evaluator** — 実装を検証し、PASS/FAIL と具体的フィードバックを返す

---

## Agent 1: Planner

### 役割
1〜数行の要件から、実装可能なスプリント仕様書 (`sprint-N.json`) を生成する。
「何を作るか」だけを定義し、「どう作るか」は Generator に委ねる。

### 起動条件
- ユーザーから新機能・新画面の追加要求があったとき
- 既存機能の大幅改修が必要なとき

### 入力
```
INPUT_REQUIREMENT="<1〜数行の要件>"
```

### 出力形式
`sprints/sprint-N.json` を作成する（N は既存スプリント数 + 1）。

```json
{
  "id": 1,
  "title": "スプリントタイトル（例: シフト登録フォームの実装）",
  "overview": "このスプリントで達成すること（2文以内）",
  "features": [
    {
      "id": "F1",
      "name": "機能名",
      "description": "ユーザー視点での説明",
      "priority": "high | medium | low"
    }
  ],
  "acceptance_criteria": [
    "シフトを登録するとローカルDB（expo-sqlite）に保存される",
    "Firestore にリアルタイム同期される",
    "バリデーションエラーはトースト表示される"
  ],
  "out_of_scope": [
    "このスプリントでは扱わないこと"
  ],
  "estimated_days": 3
}
```

### Planner の制約
- SQLite のスキーマ、コンポーネント名、関数名は指定しない
- 技術的実装詳細を含めない（「Zustand store を使う」等はNG）
- 1スプリント = 1機能領域。詰め込みすぎない
- acceptance_criteria は動作ベースで書く（「〜できる」の形）

---

## Agent 2: Generator

### 役割
`sprints/sprint-N.json` を読み込み、WorkHoli の技術スタックに従って実装する。

### 技術スタック（必ず遵守）
| 領域 | 使用技術 |
|------|----------|
| フレームワーク | React Native + Expo SDK 52 |
| ルーティング | Expo Router v3（`app/` ディレクトリ） |
| 状態管理 | Zustand（`store/` 以下） |
| ローカルDB | expo-sqlite（`lib/db.ts` 経由） |
| リモートDB | Firebase Firestore |
| 認証 | Firebase Auth |
| 型 | TypeScript strict mode |
| スタイル | StyleSheet.create（inline style 禁止） |
| テスト | Jest + React Native Testing Library |

### 起動条件
```bash
# 1スプリントを実装する
Task: "sprints/sprint-N.json を読み込み、Generator として実装してください"
```

### 実装手順
1. `sprints/sprint-N.json` を読む
2. 関連する既存ファイルを調査（`app/`, `store/`, `lib/`, `components/`）
3. 実装（新規ファイル作成 or 既存ファイル編集）
4. `npx tsc --noEmit` でコンパイルエラーがないことを確認
5. 実装したファイル一覧と自己評価を `sprints/sprint-N-impl.md` に記録

### `sprint-N-impl.md` の形式
```markdown
# Sprint N 実装記録

## 実装ファイル
- `app/shifts/new.tsx` — 新規シフト登録画面（新規作成）
- `store/shiftStore.ts` — addShift アクション追加（編集）
- `lib/db.ts` — shifts テーブルスキーマ追加（編集）

## 実装の判断・考慮事項
- expo-sqlite の非同期APIを使用（runAsync / getFirstAsync）
- Firestore 書き込みはローカル保存成功後に実行（オフライン耐性）

## 自己評価
| 基準 | スコア | コメント |
|------|--------|----------|
| 機能完全性 | 8/10 | バリデーションの網羅が不完全 |
| コード品質 | 9/10 | 型安全、副作用分離できている |
| 仕様適合性 | 9/10 | acceptance_criteria を全て満たした |
| セキュリティ | 8/10 | Firestore rules は別途要更新 |

## 既知の課題・次スプリントへの引き継ぎ
- Firestore Security Rules の `shifts` コレクション更新が必要
```

### Generator の制約
- `any` 型の使用禁止
- `console.log` はデバッグ用途でも残さない（`console.error` はOK）
- 空の catch ブロック禁止（必ずエラーハンドリングを実装）
- Firestore 書き込みは必ずローカルDB保存の成功後に行う
- `StyleSheet.create` 以外でのスタイル定義禁止

---

## Agent 3: Evaluator

### 役割
`sprint-N-impl.md` と実装ファイルを検証し、PASS/FAIL を判定する。
FAILの場合は Generator への具体的フィードバックを生成する。

### 起動条件
```bash
# Generator が sprint-N-impl.md を作成した後
Task: "Sprint N の実装を Evaluator として評価してください"
```

### 評価フェーズ（順番に実行）

#### Phase 1: 静的解析（自動）
```bash
npx tsc --noEmit                          # 型エラー検出
npx expo-doctor                           # Expo 設定の整合性確認
```
いずれかが失敗した時点で即 FAIL。

#### Phase 2: コードレビュー（AI判定）
実装ファイルを読み込み、以下を評価する。

| 基準 | 閾値 | チェック内容 |
|------|------|------------|
| 機能完全性 | **7/10以上** | acceptance_criteria を全て満たしているか |
| コード品質 | **7/10以上** | `any` なし、型安全、副作用が適切に分離されているか |
| 仕様適合性 | **8/10以上** | out_of_scope に触れていないか、技術スタックに準拠しているか |
| セキュリティ | **8/10以上** | 認証チェック漏れ、Firestore rules との整合性、センシティブ情報の露出 |

**1つでも閾値を下回ったらスプリント全体が FAIL。**

#### Phase 3: Firestore Security Rules チェック（該当時）
Firestore の読み書きが含まれる実装の場合、以下を確認する。
- 新しいコレクションへのアクセスが `firestore.rules` に定義されているか
- `allow read, write: if true;` のような穴が開いていないか
- 友達間のデータ共有は `friendships/{uid1_uid2}` の存在確認を経ているか

#### Phase 4: オフライン耐性チェック（該当時）
Firestore 書き込みを含む実装の場合：
- expo-sqlite への書き込みが先行しているか
- Firestore 書き込み失敗時にローカルデータが失われないか

### 出力形式
`sprints/sprint-N-eval.md` を作成する。

```markdown
# Sprint N 評価レポート

## 判定: PASS ✅ / FAIL ❌

## 静的解析
- TypeScript: PASS / FAIL（エラー内容）
- expo-doctor: PASS / FAIL（警告内容）

## スコア
| 基準 | スコア | 閾値 | 判定 |
|------|--------|------|------|
| 機能完全性 | X/10 | 7 | PASS/FAIL |
| コード品質 | X/10 | 7 | PASS/FAIL |
| 仕様適合性 | X/10 | 8 | PASS/FAIL |
| セキュリティ | X/10 | 8 | PASS/FAIL |

## 良かった点
-

## 問題点（FAILの場合）
- [ ] 具体的なファイル名と行番号を含む問題点

## Generator へのフィードバック（FAILの場合）
Generator が次の修正で参照する、具体的・実行可能な指示を書く。
曖昧な指摘（「改善してください」等）は禁止。

- `store/shiftStore.ts` の `addShift` にエラーハンドリングがない。
  catch ブロックで Zustand の `error` ステートを更新し、
  UIに伝播できるようにすること。

## 次スプリントへの引き継ぎ
-
```

---

## ループ制御

```
Planner
  │
  └─→ Generator (Sprint N)
          │
          └─→ Evaluator
                  │
                  ├─ PASS ─→ Generator (Sprint N+1) または完了
                  │
                  └─ FAIL ─→ Generator (修正ラン、最大2回)
                                  │
                                  └─ 2回FAIL ─→ 人間にエスカレーション
```

### エスカレーション条件
- 同一スプリントが2回連続 FAIL
- `tsc` エラーが修正後も残る
- セキュリティスコアが 6 以下

エスカレーション時は `sprints/sprint-N-escalate.md` を作成し、人間の判断を仰ぐ。

---

## ディレクトリ構成

```
workholi-app/
├── AGENTS.md              ← このファイル
├── CLAUDE.md              ← プロジェクト全体のルール
├── sprints/
│   ├── sprint-1.json      ← Planner が生成
│   ├── sprint-1-impl.md   ← Generator が生成
│   ├── sprint-1-eval.md   ← Evaluator が生成
│   └── sprint-1-escalate.md  ← エスカレーション時のみ
├── app/                   ← Expo Router
├── store/                 ← Zustand
├── lib/                   ← db.ts など
└── components/
```

---

## Claude Code での実行例

```bash
# 新機能の実装を1サイクル回す
claude "AGENTS.md の手順に従い、以下の要件を Planner → Generator → Evaluator の順で処理してください。
要件: 給与明細画面に月次サマリーグラフを追加する。週ごとの収入をバーチャートで表示。"
```

```bash
# 特定スプリントの評価だけ実行
claude "AGENTS.md の Evaluator として sprints/sprint-3.json と実装ファイルを評価してください"
```
