import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import type { TaxCode } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (code: TaxCode) => void;
}

type Step =
  | 'start'
  | 'main_loan'
  | 'sub_income'
  | { result: TaxCode };

const RESULT_INFO: Record<TaxCode, { title: string; desc: string }> = {
  'M':    { title: 'M — メイン雇用', desc: '主な収入源の職場に使います。学生ローン（Student Loan）がない場合はこちら。' },
  'M SL': { title: 'M SL — メイン雇用 + 学生ローン', desc: '主な収入源の職場で、NZの学生ローン（Student Loan）がある場合に使います。' },
  'S':    { title: 'S — サブ雇用', desc: '掛け持ち2つ目以降の職場に使います。年収合計が$15,601〜$53,500程度の場合。' },
  'SH':   { title: 'SH — サブ雇用（高税率）', desc: '掛け持ち2つ目以降で、年収合計が$53,501〜$78,100程度になる場合。' },
  'ST':   { title: 'ST — サブ雇用（最高税率）', desc: '掛け持ち2つ目以降で、年収合計が$78,101以上になる見込みの場合。' },
  'SB':   { title: 'SB — サブ雇用（低所得）', desc: '掛け持ち2つ目以降で、この職場での収入が年間$15,600以下になる場合。税率10.5%。' },
  'SA':   { title: 'SA — スペシャル', desc: 'IRDから特別な税率承認を受けた場合のみ使用します。通常は選択不要です。' },
};

export function TaxCodeGuideModal({ visible, onClose, onSelect }: Props) {
  const [step, setStep] = useState<Step>('start');

  function reset() {
    setStep('start');
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSelect(code: TaxCode) {
    onSelect(code);
    reset();
    onClose();
  }

  function renderContent() {
    if (typeof step === 'object' && 'result' in step) {
      const code = step.result;
      const info = RESULT_INFO[code];
      return (
        <View style={styles.resultBox}>
          <View style={styles.resultIconRow}>
            <Ionicons name="checkmark-circle" size={32} color="#16a34a" />
            <Text style={styles.resultCode}>{code}</Text>
          </View>
          <Text style={styles.resultTitle}>{info.title}</Text>
          <Text style={styles.resultDesc}>{info.desc}</Text>

          <Pressable style={styles.applyBtn} onPress={() => handleSelect(code)}>
            <Text style={styles.applyBtnText}>「{code}」を選択する</Text>
          </Pressable>
          <Pressable style={styles.retryBtn} onPress={reset}>
            <Text style={styles.retryBtnText}>最初からやり直す</Text>
          </Pressable>
        </View>
      );
    }

    if (step === 'start') {
      return (
        <View>
          <Text style={styles.questionText}>
            この職場はあなたのメインの仕事（主な収入源）ですか？
          </Text>
          <Text style={styles.questionSub}>
            掛け持ちをしていない、または1番収入が多い職場
          </Text>
          <View style={styles.btnCol}>
            <Pressable style={styles.choiceBtn} onPress={() => setStep('main_loan')}>
              <Ionicons name="checkmark" size={18} color="#16a34a" />
              <Text style={styles.choiceBtnText}>はい、メインの職場です</Text>
            </Pressable>
            <Pressable style={styles.choiceBtn} onPress={() => setStep('sub_income')}>
              <Ionicons name="git-branch-outline" size={18} color="#2563eb" />
              <Text style={[styles.choiceBtnText, { color: '#2563eb' }]}>いいえ、掛け持ちのサブ職場です</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    if (step === 'main_loan') {
      return (
        <View>
          <Text style={styles.questionText}>
            NZの学生ローン（Student Loan）はありますか？
          </Text>
          <Text style={styles.questionSub}>
            NZ国内で借りた学生ローンがある場合はいいえを選択
          </Text>
          <View style={styles.btnCol}>
            <Pressable style={styles.choiceBtn} onPress={() => setStep({ result: 'M SL' })}>
              <Ionicons name="school-outline" size={18} color="#d97706" />
              <Text style={[styles.choiceBtnText, { color: '#d97706' }]}>はい、学生ローンがあります</Text>
            </Pressable>
            <Pressable style={styles.choiceBtn} onPress={() => setStep({ result: 'M' })}>
              <Ionicons name="close" size={18} color="#16a34a" />
              <Text style={styles.choiceBtnText}>いいえ、ありません</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    if (step === 'sub_income') {
      return (
        <View>
          <Text style={styles.questionText}>
            今年の全収入（メイン＋このサブ職場）の合計はどのくらいになりそうですか？
          </Text>
          <Text style={styles.questionSub}>
            わからない場合は少し多めに見積もるのが安全です
          </Text>
          <View style={styles.btnCol}>
            <Pressable style={styles.choiceBtn} onPress={() => setStep({ result: 'SB' })}>
              <Text style={styles.choiceBtnText}>$15,600 以下</Text>
            </Pressable>
            <Pressable style={styles.choiceBtn} onPress={() => setStep({ result: 'S' })}>
              <Text style={styles.choiceBtnText}>$15,601 〜 $53,500</Text>
            </Pressable>
            <Pressable style={styles.choiceBtn} onPress={() => setStep({ result: 'SH' })}>
              <Text style={styles.choiceBtnText}>$53,501 〜 $78,100</Text>
            </Pressable>
            <Pressable style={styles.choiceBtn} onPress={() => setStep({ result: 'ST' })}>
              <Text style={styles.choiceBtnText}>$78,101 以上</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return null;
  }

  const isResult = typeof step === 'object' && 'result' in step;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#374151" />
          </Pressable>
          <Text style={styles.title}>税コードを確認する</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* ステップインジケーター */}
        {!isResult && (
          <View style={styles.stepRow}>
            {(['start', 'main_loan', 'sub_income'] as const).map((s, i) => (
              <View
                key={s}
                style={[styles.stepDot, step === s && styles.stepDotActive]}
              />
            ))}
          </View>
        )}

        <View style={styles.body}>
          {!isResult && (
            <View style={styles.iconHeader}>
              <Ionicons name="help-circle-outline" size={28} color="#6b7280" />
              <Text style={styles.iconHeaderText}>いくつかの質問に答えてください</Text>
            </View>
          )}
          {renderContent()}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerNote}>
            税コードは後からいつでも変更できます。不明な場合はIRD（0800 775 247）にお問い合わせください。
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  closeBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },

  stepRow: {
    flexDirection: 'row', gap: 8, justifyContent: 'center',
    paddingVertical: 14, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e5e7eb' },
  stepDotActive: { backgroundColor: '#16a34a', width: 20 },

  body: { flex: 1, padding: 24 },

  iconHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  iconHeaderText: { fontSize: 14, color: '#6b7280' },

  questionText: { fontSize: 18, fontWeight: '700', color: '#111827', lineHeight: 26, marginBottom: 8 },
  questionSub: { fontSize: 13, color: '#9ca3af', marginBottom: 24, lineHeight: 18 },

  btnCol: { gap: 12 },
  choiceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: '#e5e7eb',
  },
  choiceBtnText: { fontSize: 15, color: '#111827', fontWeight: '500', flex: 1 },

  resultBox: { alignItems: 'center', paddingTop: 8 },
  resultIconRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  resultCode: { fontSize: 32, fontWeight: '800', color: '#15803d' },
  resultTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 10, textAlign: 'center' },
  resultDesc: { fontSize: 14, color: '#6b7280', lineHeight: 20, textAlign: 'center', marginBottom: 28 },

  applyBtn: {
    backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32,
    width: '100%', alignItems: 'center', marginBottom: 12,
  },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  retryBtn: { paddingVertical: 10 },
  retryBtnText: { fontSize: 14, color: '#9ca3af' },

  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff' },
  footerNote: { fontSize: 11, color: '#9ca3af', textAlign: 'center', lineHeight: 16 },
});
