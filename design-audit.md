# デザイン監査レポート

生成日: 2026-04-18

---

## サマリー

| カテゴリ | 件数 |
|---|---|
| 直書き色 | 42件（ファイル数: 9） |
| 直書き fontSize | 88件（ファイル数: 18） |
| インラインスタイル（非自明） | 23件（ファイル数: 8） |
| カード borderRadius 不統一 | 8種類の値（8 / 10 / 12 / 14 / 16 / 20 / 24 / 32） |
| カード padding 不統一 | 6種類の値（10 / 12 / 14 / 16 / 18 / 20） |

最も優先度の高い問題は **直書き色** と **カード padding/borderRadius の不統一** です。特に `privacy.tsx` / `terms.tsx` はライトモード用のカラーパレットがまるごと直書きされており、テーマ整合性が完全に崩れています。

---

## 1. 直書き色

Colors.* を経由しないハードコードされた色の一覧です（`transparent` は除外）。

### `app/_layout.tsx`
| 行 | 値 | 用途 |
|---|---|---|
| 64 | `'#0e1117'` | ローディング画面の backgroundColor（Colors.background と同値だが直書き） |
| 65 | `'#39d98a'` | ActivityIndicator の color（Colors.primary と同値だが直書き） |
| 86 | `'#12151f'` | Stack.Screen headerStyle backgroundColor（Colors.headerBackground と同値） |
| 87 | `'#ffffff'` | headerTintColor（Colors.headerTint と同値） |

### `app/privacy.tsx`
| 行 | 値 | 用途 |
|---|---|---|
| 11 | `'#16a34a'` | 戻るボタンアイコン色 |
| 73 | `'#f9fafb'` | container backgroundColor（ライトテーマ） |
| 76 | `'#fff'` | header backgroundColor |
| 77 | `'#e5e7eb'` | header borderBottomColor |
| 80 | `'#111827'` | headerTitle color |
| 82 | `'#9ca3af'` | updated color |
| 83 | `'#111827'` | section color |
| 84 | `'#374151'` | body color |

> **注意**: このファイル全体がライトモード固定のカラーパレットを使用しており、アプリのダークテーマと完全に乖離しています。

### `app/terms.tsx`
| 行 | 値 | 用途 |
|---|---|---|
| 10 | `'#16a34a'` | 戻るボタンアイコン色 |
| 64 | `'#f9fafb'` | container backgroundColor |
| 66 | `'#fff'` | header backgroundColor |
| 67 | `'#e5e7eb'` | header borderBottomColor |
| 70 | `'#111827'` | headerTitle color |
| 72 | `'#9ca3af'` | updated color |
| 73 | `'#111827'` | section color |
| 74 | `'#374151'` | body color |

> **注意**: `privacy.tsx` と同じ問題。

### `app/(tabs)/community.tsx`
| 行 | 値 | 用途 |
|---|---|---|
| 24 | `'#16a34a'` | DIFFICULTY_COLOR.easy |
| 24 | `'#f59e0b'` | DIFFICULTY_COLOR.normal（Colors.warning と同値） |
| 24 | `'#ef4444'` | DIFFICULTY_COLOR.hard |
| 262 | `'#0f766e'` | filterChipSmActive backgroundColor（直書き teal） |
| 262 | `'#0f766e'` | filterChipSmActive borderColor |
| 272 | `'#000'` | card の shadowColor |

### `app/(tabs)/shifts/index.tsx`
| 行 | 値 | 用途 |
|---|---|---|
| 30–33 | `'#16a34a'`, `'#2563eb'`, `'#dc2626'`, `'#d97706'`, `'#7c3aed'`, `'#db2777'`, `'#0891b2'`, `'#65a30d'` | EMPLOYER_COLORS 配列（雇用主ドット用） |
| 337 | `'#2563eb'` | sat（土曜日テキスト色） |
| 338 | `'#dc2626'` | sun（日曜日テキスト色） |
| 357 | `'rgba(245,158,11,0.15)'` | dayCellHoliday backgroundColor |
| 365 | `'#2563eb'` | satNum |
| 366 | `'#dc2626'` | sunNum |

### `app/(tabs)/employers/index.tsx`
| 行 | 値 | 用途 |
|---|---|---|
| 152 | `'#000'` | card の shadowColor |

### `src/components/QuickClockIn.tsx`
| 行 | 値 | 用途 |
|---|---|---|
| 229 | `"#fff"` | saveBtn の Ionicons color（インライン） |

### `src/components/ShiftToast.tsx`
| 行 | 値 | 用途 |
|---|---|---|
| 63 | `'#000'` | shadowColor |

### `src/components/BadgeCelebration.tsx`
| 行 | 値 | 用途 |
|---|---|---|
| 72 | `'#000'` | shadowColor |

### `src/components/CountrySwitcher.tsx`
| 行 | 値 | 用途 |
|---|---|---|
| 86 | `'#000'` | sheet の shadowColor |

### `src/components/CopyShiftModal.tsx`
| 行 | 値 | 用途 |
|---|---|---|
| 220 | `'#60a5fa'` | sat（土曜日色） |
| 221 | `'#f87171'` | sun（日曜日色） |
| 241 | `'#60a5fa'` | satNum |
| 242 | `'#f87171'` | sunNum |

> **注意**: `shifts/index.tsx` では `#2563eb` / `#dc2626` を使用、`CopyShiftModal.tsx` では `#60a5fa` / `#f87171` を使用しており、同じ意味の色が2ファイルで異なる値になっています。

### `src/components/RewardedAdButton.tsx`
| 行 | 値 | 用途 |
|---|---|---|
| 56 | `'#16a34a'` | ActivityIndicator color |
| 58 | `'#16a34a'` | アイコン色（loaded状態） |
| 59 | `'#9ca3af'` | アイコン色（disabled状態） |
| 71 | `'#16a34a'` | btn borderColor |
| 74 | `'#f0fdf4'` | btn backgroundColor |
| 75 | `'#e5e7eb'` | btnDisabled borderColor |
| 76 | `'#f9fafb'` | btnDisabled backgroundColor |
| 77 | `'#16a34a'` | text color |
| 78 | `'#9ca3af'` | textDisabled color |

> **注意**: このコンポーネントは Colors.* を一切使用していません。完全に直書きで、しかもライトモード用の色が使われています。

---

## 2. 直書き fontSize

`Typography.*` を使わず `fontSize: <数値>` が直書きされているケースの一覧です。Typography には `caption(11)`, `bodySmall(13)`, `body(14)`, `bodyLarge(16)`, `h4(17)`, `h3(20)`, `h2(24)`, `h1(32)`, `monoXL(36)` が定義されています。

### `app/(tabs)/index.tsx`
`11`, `13`, `14`, `15`, `16`, `18`, `20` — statStyles.label, shiftCardStyles.dayTag, shiftCardStyles.phBadge, shiftCardStyles.jpy, shiftCardStyles.offText, goalCardStyles.name など多数

### `app/(tabs)/report.tsx`
`9`, `11`, `12`, `13`, `14`, `15`, `20` — barValue, barLabel, refundDisclaimer, refundNote, taxLabel など

### `app/(tabs)/settings.tsx`
`12`, `13`, `14`, `15`, `16`, `17`, `28` — sectionHeader, rowLabel, rowHint, rateInput, rateUnit, pageTitle など

### `app/(tabs)/goals.tsx`
`12`, `13`, `14`, `15`, `18`, `20`, `22`, `24`, `28`, `48` — cardStyles.name, modalStyles.title, emptyTitle など

### `app/(tabs)/achievements.tsx`
`10`, `11`, `12`, `13`, `14`, `16`, `20`, `32` — badgeStyles.badgeDesc, badgeStyles.streakEmoji, paydayStyles.cardTitle など

### `app/(tabs)/friends.tsx`
`11`, `12`, `13`, `14`, `15`, `16`, `18`, `24`, `28` — sectionLabel, codeText, rankNum, rankPay, pageTitle など

### `app/(tabs)/community.tsx`
`10`, `11`, `12`, `13`, `16`, `20` — cardUpdated, hiringText, cardCount, headerTitle など

### `app/(tabs)/shifts/index.tsx`
`7`, `8`, `10`, `11`, `12`, `13`, `15`, `17` — holidayDot, dotMore, weekdayLabel, copyHint, detailDate など

### `app/(tabs)/employers/index.tsx`
`11`, `12`, `13`, `14`, `15`, `16`, `17`, `18`, `20` — cardShiftLabel, cardIrd, cardRate, cardName, emptyHint など

### `app/(tabs)/shifts/[id].tsx`
`15`, `16` — notFoundText, deleteBtnText

### `app/login.tsx`
`13`, `14`, `17`, `36` — label, linkText, btnText, logo

### `app/register.tsx`
`13`, `14`, `16`, `17`, `36` — label, subtitle, btnText, logo

### `app/privacy.tsx`
`12`, `15`, `17` — updated, section, headerTitle（Colors も直書き）

### `app/terms.tsx`
`12`, `15`, `17` — updated, section, headerTitle（Colors も直書き）

### `app/company/[id].tsx`
`12`, `13`, `14`, `15`, `17`, `26` — sectionTitle, badgeText, infoLabel, companyName など

### `src/components/ShiftForm.tsx`
`12`, `13`, `14`, `15`, `17`, `18`, `20` — sectionLabel, calcLabel, calcTotalLabel, calcTotalValue など

### `src/components/EmployerForm.tsx`
`12`, `13`, `14`, `24` — label, hint, taxCodeText, ratePrefix/rateInput

### `src/components/QuickClockIn.tsx`
`12`, `13`, `14`, `15`, `16`, `17`, `18`, `20` — sectionLabel, breakBtnText, calcLabel, calcTotalValue など

### `src/components/TaxCodeGuideModal.tsx`
`11`, `13`, `14`, `15`, `16`, `17`, `18`, `32` — footerNote, questionSub, choiceBtnText, resultCode など

### `src/components/CopyShiftModal.tsx`
`12`, `14`, `16`, `17` — hint, dayNum, confirmBtnText, title など

### `src/components/RewardedAdButton.tsx`
`14` — text

---

## 3. インラインスタイル（非自明）

`style={{ ... }}` の形式で、`flex: 1` 以上の意味を持つスタイルが直書きされているケースです。

### `app/(tabs)/index.tsx`
- **L455**: `style={[goalCardStyles.barFill, { width: \`${Math.round(progress * 100)}%\` as \`${number}%\` }]}`
  - 動的幅の指定。ロジックとして必要だが、型キャストが煩雑。

### `app/(tabs)/goals.tsx`
- **L112**: `style={[cardStyles.barFill, { width: \`${Math.round(progress * 100)}%\` as \`${number}%\` }]}`
  - 同上。
- **L274**: `style={[styles.barFill, { height: \`${Math.max(ratio * 100, m.netPay > 0 ? 4 : 0)}%\` }]}`
  - 動的バーチャート高さ指定（report.tsx と同パターン）。

### `app/(tabs)/report.tsx`
- **L149**: `style={[styles.refundHero, taxYearRefund.refund > 0 ? styles.refundHeroPos : styles.refundHeroNeg]}`
  - StyleSheet 参照なので問題なし（インラインではない）
- **L274**: `style={[styles.barFill, { height: \`${Math.max(ratio * 100, m.netPay > 0 ? 4 : 0)}%\` }]}`
  - 動的バーチャート高さ。

### `app/(tabs)/settings.tsx`
- **L219**: `style={[styles.taxRange, { color: Colors.textMuted }]}`
- **L220**: `style={[styles.taxRate, { color: Colors.textMuted }]}`
- **L246**: `style={[styles.taxRange, { color: Colors.textMuted }]}`
- **L247**: `style={[styles.taxRate, { color: Colors.textMuted }]}`
  - 同じパターンが4か所。`styles.taxRangeMuted` のような派生スタイルを StyleSheet に追加すべき。

### `app/(tabs)/friends.tsx`
- **L222**: `style={{ marginTop: 40 }}`（ActivityIndicator）
- **L289**: `style={[styles.sectionLabel, { marginTop: 24 }]}`
- **L312**: `style={[styles.sectionLabel, { marginTop: 24 }]}`
- **L332**: `style={[styles.sectionLabel, { marginTop: 24 }]}`
- **L360**: `style={{ marginRight: 4 }}`（Ionicons）
- **L337**: `style={{ padding: 16 }}`（ActivityIndicator）
- **L387**: `style={{ marginTop: 24 }}`（ActivityIndicator）
- **L422**: `style={{ marginTop: 24 }}`（ActivityIndicator）
  - `marginTop` の差異調整がインラインで多数。定数化すべき。

### `app/(tabs)/community.tsx`
- **L222**: `<View style={{ height: 8 }} />`（ItemSeparatorComponent）
  - 軽微だが、StyleSheet に `separator` として切り出すべき。

### `app/(tabs)/employers/index.tsx`
- **L114**: `<View style={{ height: 8 }} />`（ItemSeparatorComponent）

### `app/company/[id].tsx`
- **L388**: `style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end', gap: 4 }}`
  - 複合インラインスタイル。StyleSheet に切り出すべき。
- **L389**: `style={[styles.descText, { flex: 1, textAlign: 'right' }]}`
- **L407**: `style={[styles.sectionTitle, { marginTop: 8 }]}`
- **L492–495**: `style={[styles.blurLine, { width: 80 }]}` × 3件
  - ブラー演出用の幅指定。

### `src/components/ShiftForm.tsx`
- **L168**: `style={[styles.sectionLabel, { marginTop: 20 }]}`（6か所繰り返し）
- **L221**: `style={[styles.hpCard, { marginTop: 20 }]}`
- **L227**: `style={[styles.hpBreakdown, { marginTop: 8 }]}`
- **L239**: `style={[styles.hpRow, { marginTop: 6 }]}`
- **L302**: `style={{ alignItems: 'flex-end' }}`
  - `sectionLabel` に `marginTop` を毎回インラインで追加している。`labelSpacing` のような modifier スタイルを活用すれば解決できる（EmployerForm.tsx では `labelSpacing` が使われており、ShiftForm.tsx だけ未使用）。

### `src/components/EmployerForm.tsx`
- **L234**: `style={[styles.label, { marginBottom: 0 }]}`
- **L320**: `style={[styles.hpRow, { borderTopWidth: 1, borderTopColor: Colors.border, ... }]}`
- **L372**: `style={[styles.hpRow, { borderTopWidth: 1, borderTopColor: Colors.border, ... }]}`
- **L351–407**: `style={{ marginTop: 12, gap: 10 }}`, `style={{ flex: 1 }}`, `style={{ flexDirection: 'row', ... }}` など多数
  - 夜勤・残業設定ブロックのレイアウト調整がすべてインライン。

---

## 4. カード padding/borderRadius 不統一

アプリ全体で「カード」として使われる View の `borderRadius` と `padding` の一覧と比較です。

### borderRadius の値一覧

| 値 | 使用ファイルと用途 |
|---|---|
| **8** | community.tsx (badge, hiringBadge, lockBadge), company/[id].tsx (badge), achievements.tsx (typeBtn, dayBtn), friends.tsx (acceptBtn, inviteHintBtn) |
| **10** | settings.tsx (rateInputWrap, ticketBadge), friends.tsx (codeActionBtn), EmployerPicker.tsx (search), company/[id].tsx (commentLocked, friendBadge) |
| **12** | shifts/[id].tsx (deleteBtn), login.tsx (input), register.tsx (input), ShiftForm.tsx (textInput, calcPlaceholder, hpCard), EmployerForm.tsx (input, hpCard, reviewLock, taxCodeList), QuickClockIn.tsx (breakBtn, input), TaxCodeGuideModal.tsx (choiceBtn) など |
| **14** | index.tsx (statCard, shiftCard, goalCard, quickBtn), report.tsx (taxCard, chartCard, tableCard, refundCard, exportBtn, explainCard), settings.tsx (card), goals.tsx (savingsCard), achievements.tsx (streakCard, badge), friends.tsx (codeCard, listCard, sendBtn), community.tsx (card), company/[id].tsx (card, commentInputCard, lockWrapper, previewCard, lockOverlay), ShiftForm.tsx (saveBtn), EmployerForm.tsx (saveBtn, deleteBtn), QuickClockIn.tsx (employerBtn, timeCard, calcCard, saveBtn), shifts/index.tsx (shiftCard) |
| **16** | index.tsx (chartContainer), goals.tsx (cardStyles.card), achievements.tsx (paydayCard), ShiftForm.tsx (calcCard), ShiftToast.tsx, CopyShiftModal.tsx (confirmBtn) |
| **20** | index.tsx (heroCard), report.tsx (totalCard), login.tsx (form), register.tsx (form), goals.tsx (modalStyles.sheet borderTopRadius) |
| **24** | BadgeCelebration.tsx (card) |
| **32** | BadgeCelebration.tsx (lockIconWrap half) — 実際は 28px圏内の icon wrap |

**最も顕著な不統一**: カード系コンポーネントで `14` と `16` が混在。同じ「情報カード」のコンテキストで `report.tsx` は 14 を基本としているが、`goals.tsx` の GoalCard は 16、`index.tsx` の WeeklyBarChart は 16 を使っています。

### padding の値一覧（カード内の主要 padding）

| 値 | 使用ファイルと用途 |
|---|---|
| **10** | achievements.tsx (badge padding), company/[id].tsx (reviewUnlockBadge) |
| **12** | report.tsx (tableRow), shifts/index.tsx (shiftCardBody), company/[id].tsx (commentInput, commentSubmitBtn) |
| **14** | index.tsx (shiftCard, goalCard, quickBtn paddingVertical), report.tsx (taxCard, chartCard, tableRow padding), settings.tsx (row, taxTableRow paddingVertical:11), goals.tsx (savingsCard padding:16... ← 16), achievements.tsx (streakCard, paydayCard padding:18) |
| **16** | index.tsx (chartContainer, scroll), report.tsx (totalCard padding:20... ← 20), goals.tsx (GoalCard padding:16), friends.tsx (codeCard, header), EmployerForm.tsx (saveBtn padding:16) |
| **18** | achievements.tsx (paydayCard padding:18) |
| **20** | index.tsx (heroCard), report.tsx (totalCard), login.tsx (form), register.tsx (form), BadgeCelebration.tsx (card) |

**最も顕著な不統一**: 
- `paydayCard` は `padding: 18`（他のほとんどのカードは 14 または 16）
- `taxCard` は `padding: 16`（インライン）、`chartCard` も `padding: 16` だが、`tableCard` は `padding` なし（overflow:hidden で行ごとに padding: 14）
- `heroCard` は `padding: 20`、同じホーム画面の `statCard` は `paddingVertical: 14 / paddingHorizontal: 8` と非対称

---

## 推奨アクション（優先度順）

### 🔴 優先度: 高

1. **`app/privacy.tsx` と `app/terms.tsx` を Colors.* に移行する**  
   この2ファイルはライトモード専用のカラーパレット（`#f9fafb`, `#fff`, `#111827` 等）がまるごと直書きされており、ダークテーマのアプリから完全に浮いています。Colors.background / Colors.surface / Colors.textPrimary / Colors.textSecondary / Colors.border を使うよう全面書き換えが必要です。

2. **`src/components/RewardedAdButton.tsx` を Colors.* に移行する**  
   このコンポーネントも Colors を一切参照せず、ライトモード系の色（`#f0fdf4`, `#e5e7eb` など）が直書きされています。

3. **土曜・日曜の色を統一する**  
   `shifts/index.tsx`（`#2563eb` / `#dc2626`）と `CopyShiftModal.tsx`（`#60a5fa` / `#f87171`）で同じ意味の曜日色が2種類存在します。colors.ts に `saturdayText` / `sundayText` トークンを追加して統一してください。

4. **`community.tsx` の `DIFFICULTY_COLOR` を Colors.* に統一する**  
   `easy: '#16a34a'` は Colors.positive に近いですが別値です。`filterChipSmActive` の `#0f766e` は Colors に存在しない孤立した teal 色です。

### 🟡 優先度: 中

5. **カード borderRadius を 12 / 14 / 16 の3段階に整理する**  
   - 小コンポーネント（バッジ、チップ）: `8`
   - 標準カード: `14`（現在のデファクト）
   - 大型ヒーローカード・モーダルシート: `20`
   - 現在の `16` は標準カードと大型カードの中間でどちらとも言えない中途半端な値です。`goals.tsx` の GoalCard と `achievements.tsx` の PaydayCard（16 / 18）を `14` に統一することを推奨します。

6. **カード padding を 14 / 16 / 20 の3段階に整理する**  
   - 標準カード内部: `padding: 16`（現在の最多数）
   - コンパクトカード（タブルート内のリスト行）: `padding: 14`
   - ヒーローカード: `padding: 20`
   - `paydayCard` の `padding: 18` は例外値なので `16` に変更を推奨します。

7. **`settings.tsx` のインラインカラーオーバーライドを StyleSheet に切り出す**  
   `{ color: Colors.textMuted }` が4か所インラインで使われています。`styles.taxRangeMuted` / `styles.taxRateMuted` を追加してください。

8. **`ShiftForm.tsx` の `{ marginTop: 20 }` インラインを `labelSpacing` スタイルに統一する**  
   `EmployerForm.tsx` には `labelSpacing: { marginTop: 20 }` が定義されていますが、`ShiftForm.tsx` には同スタイルがなく 6 か所インラインで `{ marginTop: 20 }` が書かれています。

### 🟢 優先度: 低

9. **`app/_layout.tsx` の初期ローディング画面の直書き色を置き換える**  
   `'#0e1117'` と `'#39d98a'` は Colors.background / Colors.primary に置き換えるだけです（1行修正）。Stack.Screen の headerStyle も同様。

10. **shadowColor の `'#000'` を定数化する**  
    複数ファイルで `shadowColor: '#000'` が使われています。Colors に `shadow: '#000'` を追加するか、shadowing が必要なコンポーネントで一元管理することを推奨します。

11. **`EmployerForm.tsx` の夜勤・残業設定ブロックのインラインスタイルを整理する**  
    動的に表示/非表示するブロックのレイアウトがインラインで書かれているため、StyleSheet に切り出すことでコードの可読性が向上します。

12. **Typography 定数の活用範囲を拡大する**  
    現在 Typography は一部のファイルでのみ使用されています（`index.tsx`, `report.tsx`, `goals.tsx`, `achievements.tsx`, `BadgeCelebration.tsx`）。フォントサイズの直書きを減らすために、`body(14)`, `bodySmall(13)`, `caption(11)` あたりから段階的に移行することを推奨します。ただし、全面移行はリグレッションリスクがあるため、新規コードから適用するルールを設けるのが現実的です。
