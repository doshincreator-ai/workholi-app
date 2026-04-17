import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  FlatList,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useGoalStore } from '../../src/store/goalStore';
import { useShiftStore } from '../../src/store/shiftStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { Colors } from '../../src/constants/colors';
import { Typography } from '../../src/constants/typography';
import type { Shift } from '../../src/types';
import type { Goal } from '../../src/db/goals';

const PRESET_EMOJIS = [
  '🎯', '🏔️', '🤿', '🚁', '🏄', '🎸',
  '🍺', '🌴', '🚗', '✈️', '🏕️', '🎭',
  '🐄', '🎿', '🛥️', '🎪', '🌊', '🦁',
];

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function calcCurrentSavings(shifts: Shift[], country: string): number {
  return shifts
    .filter((s) => s.country === country)
    .reduce((sum, s) => sum + s.netPay, 0);
}

function calcWeeksToGoal(
  remaining: number,
  shifts: Shift[],
  country: string,
): number | null {
  const today = localDateStr(new Date());
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const agoStr = localDateStr(fourWeeksAgo);

  const recent = shifts.filter(
    (s) => s.country === country && s.date >= agoStr && s.date <= today,
  );
  if (recent.length === 0) return null;

  const totalNet = recent.reduce((sum, s) => sum + s.netPay, 0);
  const avgWeekly = totalNet / 4;
  if (avgWeekly <= 0) return null;

  return Math.ceil(remaining / avgWeekly);
}

// ── GoalCard ──────────────────────────────────────────────────

function GoalCard({
  goal,
  savings,
  currency,
  shifts,
  onDelete,
}: {
  goal: Goal;
  savings: number;
  currency: string;
  shifts: Shift[];
  onDelete: (id: number) => void;
}) {
  const progress = Math.min(savings / goal.targetAmount, 1);
  const remaining = Math.max(goal.targetAmount - savings, 0);
  const achieved = savings >= goal.targetAmount;
  const weeksLeft = achieved ? 0 : calcWeeksToGoal(remaining, shifts, goal.country);

  function handleDelete() {
    Alert.alert('目標を削除', `「${goal.name}」を削除しますか？`, [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: () => onDelete(goal.id),
      },
    ]);
  }

  return (
    <View style={[cardStyles.card, achieved && cardStyles.cardAchieved]}>
      <View style={cardStyles.header}>
        <Text style={cardStyles.emoji}>{goal.emoji}</Text>
        <View style={cardStyles.titleBlock}>
          <Text style={cardStyles.name}>{goal.name}</Text>
          <Text style={cardStyles.target}>目標: {currency} {goal.targetAmount.toFixed(0)}</Text>
        </View>
        {achieved && <Text style={cardStyles.achievedBadge}>🎉 達成</Text>}
        <Pressable onPress={handleDelete} style={cardStyles.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
        </Pressable>
      </View>

      <View style={cardStyles.barBg}>
        <View style={[cardStyles.barFill, { width: `${Math.round(progress * 100)}%` as `${number}%` }]} />
      </View>
      <View style={cardStyles.progressRow}>
        <Text style={cardStyles.progressPct}>{Math.round(progress * 100)}%</Text>
        {!achieved && (
          <Text style={cardStyles.remaining}>あと {currency} {remaining.toFixed(0)}</Text>
        )}
      </View>

      {!achieved && (
        <Text style={cardStyles.prediction}>
          {weeksLeft === null
            ? 'シフトを登録すると到達予測が表示されます'
            : `直近4週の平均ペースで約 ${weeksLeft} 週間後`}
        </Text>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardAchieved: { borderColor: Colors.primary, borderWidth: 1.5 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  emoji: { fontSize: 28 },
  titleBlock: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  target: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  achievedBadge: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  deleteBtn: { padding: 4 },
  barBg: {
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressPct: { ...Typography.monoSmall, color: Colors.primary },
  remaining: { fontSize: 12, color: Colors.textMuted },
  prediction: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
});

// ── AddGoalModal ──────────────────────────────────────────────

function AddGoalModal({
  visible,
  country,
  currency,
  onAdd,
  onClose,
}: {
  visible: boolean;
  country: string;
  currency: string;
  onAdd: (data: { name: string; emoji: string; targetAmount: number; country: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [emoji, setEmoji] = useState('🎯');

  function handleAdd() {
    const trimmed = name.trim();
    const num = parseFloat(amount);
    if (!trimmed) {
      Alert.alert('エラー', '目標名を入力してください');
      return;
    }
    if (isNaN(num) || num <= 0) {
      Alert.alert('エラー', '正しい金額を入力してください');
      return;
    }
    onAdd({ name: trimmed, emoji, targetAmount: num, country });
    setName('');
    setAmount('');
    setEmoji('🎯');
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={modalStyles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={modalStyles.backdrop} onPress={onClose} />
        <View style={modalStyles.sheet}>
          <Text style={modalStyles.title}>新しい目標</Text>

          <Text style={modalStyles.label}>絵文字</Text>
          <FlatList
            data={PRESET_EMOJIS}
            horizontal
            keyExtractor={(e) => e}
            showsHorizontalScrollIndicator={false}
            style={modalStyles.emojiList}
            renderItem={({ item }) => (
              <Pressable
                style={[modalStyles.emojiBtn, item === emoji && modalStyles.emojiBtnActive]}
                onPress={() => setEmoji(item)}
              >
                <Text style={modalStyles.emojiText}>{item}</Text>
              </Pressable>
            )}
          />

          <Text style={modalStyles.label}>目標名</Text>
          <TextInput
            style={modalStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="例: Queenstown旅行"
            placeholderTextColor={Colors.textMuted}
            maxLength={30}
          />

          <Text style={modalStyles.label}>目標金額 ({currency})</Text>
          <TextInput
            style={modalStyles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="例: 1500"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
          />

          <View style={modalStyles.btnRow}>
            <Pressable style={modalStyles.cancelBtn} onPress={onClose}>
              <Text style={modalStyles.cancelText}>キャンセル</Text>
            </Pressable>
            <Pressable style={modalStyles.addBtn} onPress={handleAdd}>
              <Text style={modalStyles.addText}>追加</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  title: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  emojiList: { marginBottom: 16 },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emojiBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySubtle },
  emojiText: { fontSize: 22 },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelText: { color: Colors.textSecondary, fontWeight: '600' },
  addBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  addText: { color: Colors.textInverse, fontWeight: '700', fontSize: 16 },
});

// ── GoalsScreen ───────────────────────────────────────────────

export default function GoalsScreen() {
  const { goals, add, remove } = useGoalStore();
  const { shifts } = useShiftStore();
  const { currentCountry } = useSettingsStore();
  const [showModal, setShowModal] = useState(false);

  const countryConfig = useMemo(() => {
    const map: Record<string, { currency: string }> = {
      NZ: { currency: 'NZD' },
      AU: { currency: 'AUD' },
    };
    return map[currentCountry] ?? { currency: 'NZD' };
  }, [currentCountry]);
  const currency = countryConfig.currency;

  const savings = useMemo(
    () => calcCurrentSavings(shifts, currentCountry),
    [shifts, currentCountry],
  );

  const countryGoals = goals.filter((g) => g.country === currentCountry);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>目標</Text>
        <Pressable style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={22} color={Colors.textInverse} />
          <Text style={styles.addBtnText}>新しい目標</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {countryGoals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>目標を設定してみよう</Text>
            <Text style={styles.emptyDesc}>
              旅行・体験の目標金額を設定すると、{'\n'}
              シフト収入から到達予測が計算されます
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.savingsCard}>
              <Text style={styles.savingsLabel}>現在の累計手取り ({currency})</Text>
              <Text style={styles.savingsAmount}>{currency} {savings.toFixed(2)}</Text>
            </View>
            {countryGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                savings={savings}
                currency={currency}
                shifts={shifts}
                onDelete={remove}
              />
            ))}
          </>
        )}
      </ScrollView>

      <AddGoalModal
        visible={showModal}
        country={currentCountry}
        currency={currency}
        onAdd={add}
        onClose={() => setShowModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: { color: Colors.textInverse, fontWeight: '700', fontSize: 14 },
  scroll: { padding: 16, paddingBottom: 32 },

  savingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  savingsLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  savingsAmount: { ...Typography.monoLarge, color: Colors.primary },

  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
