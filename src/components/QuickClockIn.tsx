import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TimeInput } from './TimeInput';
import { useEmployerStore } from '../store/employerStore';
import { useShiftStore } from '../store/shiftStore';
import { useSettingsStore } from '../store/settingsStore';
import { calculatePay, calculatePayAU, calcHours } from '../utils/payCalculator';
import { COUNTRIES } from '../config/countries';
import type { Employer } from '../types';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function QuickClockIn({ visible, onClose }: Props) {
  const employers = useEmployerStore((s) => s.employers);
  const addShift = useShiftStore((s) => s.add);
  const removeShift = useShiftStore((s) => s.remove);
  const { useStudentLoan, studentLoanRate } = useSettingsStore();

  const { currentCountry, jpyRate } = useSettingsStore();
  const rate = jpyRate();

  const quickEmployers = employers.filter(
    (e) => e.defaultStartTime && e.defaultEndTime && e.country === currentCountry,
  );

  const [selected, setSelected] = useState<Employer | null>(null);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [breakMin, setBreakMin] = useState('60');

  function handleSelect(employer: Employer) {
    setSelected(employer);
    setStartTime(employer.defaultStartTime!);
    setEndTime(employer.defaultEndTime!);
    setBreakMin(String(employer.defaultBreakMinutes ?? 60));
  }

  function handleClose() {
    setSelected(null);
    onClose();
  }

  const countryConfig = selected
    ? (COUNTRIES[selected.country as keyof typeof COUNTRIES] ?? COUNTRIES.NZ)
    : COUNTRIES.NZ;

  const calc = useMemo(() => {
    if (!selected) return null;
    const hours = calcHours(startTime, endTime, Number(breakMin) || 0);
    if (hours <= 0) return null;
    if (selected.country === 'AU') {
      return calculatePayAU(hours, selected.hourlyRate, false);
    }
    return calculatePay(
      hours,
      selected.hourlyRate,
      false,
      selected.taxCode,
      useStudentLoan,
      studentLoanRate,
    );
  }, [selected, startTime, endTime, breakMin, useStudentLoan, studentLoanRate]);

  function handleSave() {
    if (!selected || !calc) return;
    const saved = addShift({
      employerId: selected.id,
      country: selected.country ?? 'NZ',
      date: todayStr(),
      startTime,
      endTime,
      breakMinutes: Number(breakMin) || 0,
      isPublicHoliday: false,
      isHolidayRest: false,
      isShared: false,
      memo: '',
      holidayPayIncluded: false,
      holidayPaySeparate: false,
      hourlyRate: selected.hourlyRate,
      grossPay: calc.grossPay,
      taxAmount: calc.taxAmount,
      accLevy: calc.accLevy,
      studentLoanDeduction: calc.studentLoanDeduction,
      netPay: calc.netPay,
    });
    handleClose();
    Alert.alert(
      '記録しました',
      `${selected.name} の出勤を記録しました`,
      [
        {
          text: '取り消す',
          style: 'destructive',
          onPress: () => removeShift(saved.id),
        },
        { text: 'OK', style: 'cancel' },
      ],
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>ワンタップ出勤</Text>
          <Pressable onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {quickEmployers.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="briefcase-outline" size={48} color={Colors.border} />
              <Text style={styles.emptyText}>デフォルト時間が設定されていません</Text>
              <Text style={styles.emptyHint}>
                雇用主の編集画面でデフォルト勤務時間を設定してください
              </Text>
            </View>
          ) : (
            <>
              {/* 雇用主選択 */}
              <Text style={styles.sectionLabel}>職場を選択</Text>
              <View style={styles.employerList}>
                {quickEmployers.map((e, i) => (
                  <Pressable
                    key={e.id}
                    style={[
                      styles.employerBtn,
                      selected?.id === e.id && styles.employerBtnSelected,
                      i > 0 && { marginTop: 8 },
                    ]}
                    onPress={() => handleSelect(e)}
                  >
                    <View style={styles.employerIcon}>
                      <Text style={styles.employerIconText}>{e.name[0]}</Text>
                    </View>
                    <View style={styles.employerInfo}>
                      <Text style={[styles.employerName, selected?.id === e.id && styles.employerNameSelected]}>
                        {e.name}
                      </Text>
                      <Text style={styles.employerDefault}>
                        {e.defaultStartTime}–{e.defaultEndTime}　休憩 {e.defaultBreakMinutes ?? 30}分
                      </Text>
                    </View>
                    {selected?.id === e.id && (
                      <Ionicons name="checkmark-circle" size={22} color={Colors.positive} />
                    )}
                  </Pressable>
                ))}
              </View>

              {/* 時間調整 */}
              {selected && (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: 24 }]}>時間を確認・調整</Text>
                  <View style={styles.timeCard}>
                    <View style={styles.timeRow}>
                      <TimeInput label="開始" value={startTime} onChange={setStartTime} />
                      <Text style={styles.timeSep}>–</Text>
                      <TimeInput label="終了" value={endTime} onChange={setEndTime} />
                    </View>
                    <View style={styles.breakRow}>
                      <Text style={styles.breakLabel}>休憩</Text>
                      {[0, 15, 30, 45, 60, 90].map((min) => (
                        <Pressable
                          key={min}
                          style={[styles.breakBtn, String(min) === breakMin && styles.breakBtnActive]}
                          onPress={() => setBreakMin(String(min))}
                        >
                          <Text style={[styles.breakBtnText, String(min) === breakMin && styles.breakBtnTextActive]}>
                            {min}分
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* 給与プレビュー */}
                  {calc && (
                    <View style={styles.calcCard}>
                      <View style={styles.calcRow}>
                        <Text style={styles.calcLabel}>労働時間</Text>
                        <Text style={styles.calcValue}>{calc.hours.toFixed(1)}h</Text>
                      </View>
                      <View style={styles.calcRow}>
                        <Text style={styles.calcLabel}>総支給</Text>
                        <Text style={styles.calcValue}>{countryConfig.currency} {calc.grossPay.toFixed(2)}</Text>
                      </View>
                      <View style={[styles.calcRow, styles.calcTotalRow]}>
                        <Text style={styles.calcTotalLabel}>手取り</Text>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.calcTotalValue}>{countryConfig.currency} {calc.netPay.toFixed(2)}</Text>
                          <Text style={styles.calcJpy}>≈ ¥{Math.round(calc.netPay * rate).toLocaleString()}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  <Pressable
                    style={[styles.saveBtn, !calc && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={!calc}
                  >
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={styles.saveBtnText}>今日の出勤を記録する</Text>
                  </Pressable>
                </>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.padding.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  closeBtn: { padding: 4 },
  scroll: { padding: 16, paddingBottom: 40 },

  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },

  employerList: {},
  employerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: Spacing.radius.md, padding: Spacing.padding.sm,
    borderWidth: 2, borderColor: Colors.border,
  },
  employerBtnSelected: { borderColor: Colors.primary, backgroundColor: Colors.primarySubtle },
  employerIcon: {
    width: 40, height: 40, borderRadius: Spacing.radius.lg,
    backgroundColor: Colors.primarySubtle, alignItems: 'center', justifyContent: 'center',
  },
  employerIconText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  employerInfo: { flex: 1 },
  employerName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  employerNameSelected: { color: Colors.primary },
  employerDefault: { fontSize: 12, color: Colors.textMuted },

  timeCard: {
    backgroundColor: Colors.surface, borderRadius: Spacing.radius.md, padding: Spacing.padding.md,
    borderWidth: 1, borderColor: Colors.border, gap: 16,
  },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  timeSep: { fontSize: 20, color: Colors.textMuted, marginBottom: 14, paddingHorizontal: 4 },
  breakRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  breakLabel: { fontSize: 13, color: Colors.textSecondary, marginRight: 4 },
  breakBtn: {
    paddingHorizontal: Spacing.padding.sm, paddingVertical: 6, borderRadius: Spacing.radius.sm,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceElevated,
  },
  breakBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  breakBtnText: { fontSize: 13, color: Colors.textSecondary },
  breakBtnTextActive: { color: Colors.textInverse, fontWeight: '600' },

  calcCard: {
    backgroundColor: Colors.surface, borderRadius: Spacing.radius.md, padding: Spacing.padding.md,
    borderWidth: 1, borderColor: Colors.primaryMuted, marginTop: 16,
  },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  calcLabel: { fontSize: 14, color: Colors.textSecondary },
  calcValue: { fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  calcTotalRow: {
    borderTopWidth: 1, borderTopColor: Colors.border,
    paddingTop: 12, marginTop: 4, marginBottom: 0,
  },
  calcTotalLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  calcTotalValue: { fontSize: 20, fontWeight: '700', color: Colors.positive },
  calcJpy: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: Spacing.radius.md, padding: Spacing.padding.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 20,
  },
  saveBtnDisabled: { backgroundColor: Colors.border },
  saveBtnText: { color: Colors.textInverse, fontSize: 17, fontWeight: '700' },

  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 16, color: Colors.textSecondary, fontWeight: '600' },
  emptyHint: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});
