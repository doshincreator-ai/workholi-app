import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import { EmployerPicker } from './EmployerPicker';
import { TimeInput } from './TimeInput';
import { useEmployerStore } from '../store/employerStore';
import { useShiftStore } from '../store/shiftStore';
import { useSettingsStore } from '../store/settingsStore';
import { calculatePay, calculatePayAU, calcHours, calcNightShiftHours, calcOvertimeExtra } from '../utils/payCalculator';
import { COUNTRIES } from '../config/countries';
import { Colors } from '../constants/colors';
import type { Shift } from '../types';

const REMINDER_OPTIONS: { label: string; value: number }[] = [
  { label: 'なし', value: -1 },
  { label: '当日朝8時', value: 0 },
  { label: '15分前', value: 15 },
  { label: '30分前', value: 30 },
  { label: '1時間前', value: 60 },
  { label: '2時間前', value: 120 },
];

interface Props {
  existing?: Shift;
  initialDate?: string;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ShiftForm({ existing, initialDate }: Props) {
  const employers = useEmployerStore((s) => s.employers);
  const addShift = useShiftStore((s) => s.add);
  const updateShift = useShiftStore((s) => s.update);
  const { useStudentLoan, studentLoanRate, jpyRate } = useSettingsStore();

  const [employerId, setEmployerId] = useState<number | null>(
    existing?.employerId ?? null,
  );
  const [date, setDate] = useState(existing?.date ?? initialDate ?? todayStr());
  const [startTime, setStartTime] = useState(existing?.startTime ?? '09:00');
  const [endTime, setEndTime] = useState(existing?.endTime ?? '17:00');
  const [breakMin, setBreakMin] = useState(
    String(existing?.breakMinutes ?? 60),
  );
  const shiftTypeInit = existing?.isHolidayRest ? 'rest' : existing?.isPublicHoliday ? 'holiday' : 'normal';
  const [shiftType, setShiftType] = useState<'normal' | 'holiday' | 'rest'>(shiftTypeInit);
  const isHoliday = shiftType === 'holiday';
  const isHolidayRest = shiftType === 'rest';
  const [holidayPayAmount, setHolidayPayAmount] = useState(
    existing?.holidayPayAmount != null ? String(existing.holidayPayAmount) : '',
  );
  const [memo, setMemo] = useState(existing?.memo ?? '');
  const [reminderMinutes, setReminderMinutes] = useState<number>(existing?.reminderMinutes ?? -1);

  const employer = useMemo(
    () => employers.find((e) => e.id === employerId) ?? null,
    [employers, employerId],
  );
  const isAU = employer?.country === 'AU';
  const countryConfig = COUNTRIES[(employer?.country ?? 'NZ') as keyof typeof COUNTRIES] ?? COUNTRIES.NZ;
  const currency = countryConfig.currency;
  const rate = jpyRate();

  // 公休日休業手当選択時にデフォルト時間を自動入力
  function handleShiftTypeChange(type: 'normal' | 'holiday' | 'rest') {
    setShiftType(type);
    if (type === 'rest' && employer?.defaultStartTime && employer?.defaultEndTime) {
      setStartTime(employer.defaultStartTime);
      setEndTime(employer.defaultEndTime);
      if (employer.defaultBreakMinutes != null) setBreakMin(String(employer.defaultBreakMinutes));
    }
  }

  const allowances = useMemo(() => {
    if (!employer) return { nightShift: 0, overtime: 0 };
    const isValidTime = (t: string) => /^\d{2}:\d{2}$/.test(t);
    if (!isValidTime(startTime) || !isValidTime(endTime)) return { nightShift: 0, overtime: 0 };
    const hours = calcHours(startTime, endTime, Number(breakMin) || 0);

    const nightShift = employer.nightShiftStart && employer.nightShiftBonus
      ? Math.round(calcNightShiftHours(startTime, endTime, employer.nightShiftStart) * employer.nightShiftBonus * 100) / 100
      : 0;

    const overtime = employer.overtimeThreshold && employer.overtimeMultiplier
      ? Math.round(calcOvertimeExtra(hours, employer.hourlyRate, employer.overtimeThreshold, employer.overtimeMultiplier) * 100) / 100
      : 0;

    return { nightShift, overtime };
  }, [employer, startTime, endTime, breakMin]);

  const calc = useMemo(() => {
    if (!employer) return null;
    const isValidTime = (t: string) => /^\d{2}:\d{2}$/.test(t);
    if (!isValidTime(startTime) || !isValidTime(endTime)) return null;
    const hours = calcHours(startTime, endTime, Number(breakMin) || 0);
    if (hours <= 0) return null;
    const extraAllowances = allowances.nightShift + allowances.overtime;
    if (isAU) {
      return calculatePayAU(hours, employer.hourlyRate, isHoliday, extraAllowances);
    }
    return calculatePay(
      hours,
      employer.hourlyRate,
      isHoliday,
      employer.taxCode,
      useStudentLoan,
      studentLoanRate,
      extraAllowances,
    );
  }, [employer, startTime, endTime, breakMin, isHoliday, useStudentLoan, studentLoanRate, isAU, allowances]);

  function handleSave() {
    if (!employer || !calc) {
      Alert.alert('入力エラー', '雇用主・時間を正しく入力してください');
      return;
    }
    const data = {
      employerId: employer.id,
      date,
      startTime,
      endTime,
      breakMinutes: Number(breakMin) || 0,
      isPublicHoliday: isHoliday,
      holidayPayAmount: employer.holidayPaySeparate && holidayPayAmount ? parseFloat(holidayPayAmount) : undefined,
      nightShiftAllowance: allowances.nightShift > 0 ? allowances.nightShift : undefined,
      overtimeAllowance: allowances.overtime > 0 ? allowances.overtime : undefined,
      country: employer.country,
      isShared: false,
      isHolidayRest,
      memo,
      reminderMinutes,
      hourlyRate: employer.hourlyRate,
      grossPay: calc.grossPay,
      taxAmount: calc.taxAmount,
      accLevy: calc.accLevy,
      studentLoanDeduction: calc.studentLoanDeduction,
      netPay: calc.netPay,
    };
    if (existing) {
      updateShift(existing.id, data);
    } else {
      addShift(data);
    }
    router.back();
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* 雇用主 */}
      <Text style={styles.sectionLabel}>雇用主</Text>
      <EmployerPicker
        selectedId={employerId}
        onSelect={(e) => setEmployerId(e.id)}
      />

      {/* 日付 */}
      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>日付</Text>
      <TextInput
        style={styles.textInput}
        value={date}
        onChangeText={setDate}
        placeholder="2026-03-22"
        keyboardType="number-pad"
      />

      {/* 時間 */}
      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>時間</Text>
      <View style={styles.timeRow}>
        <TimeInput label="開始" value={startTime} onChange={setStartTime} />
        <Text style={styles.timeSep}>–</Text>
        <TimeInput label="終了" value={endTime} onChange={setEndTime} />
      </View>

      {/* 休憩 */}
      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>休憩（分）</Text>
      <TextInput
        style={styles.textInput}
        value={breakMin}
        onChangeText={setBreakMin}
        keyboardType="number-pad"
        placeholder="30"
      />

      {/* シフトタイプ */}
      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>シフトタイプ</Text>
      <View style={styles.segmentRow}>
        {(isAU
          ? [['normal', '通常'], ['holiday', '公休日出勤 ×2.25']] as ['normal' | 'holiday' | 'rest', string][]
          : [['normal', '通常'], ['holiday', '公休日出勤 ×1.5'], ['rest', '公休日休業手当']] as ['normal' | 'holiday' | 'rest', string][]
        ).map(([val, label]) => (
          <Pressable
            key={val}
            style={[styles.segment, shiftType === val && styles.segmentActive]}
            onPress={() => handleShiftTypeChange(val)}
          >
            <Text style={[styles.segmentText, shiftType === val && styles.segmentTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      {isHolidayRest && (
        <Text style={styles.restHint}>
          出勤なしで通常1日分の給与が支払われます（Relevant Daily Pay）
        </Text>
      )}

      {/* Holiday Pay（NZのみ・雇用主設定から参照） */}
      {!isAU && employer && (employer.holidayPayIncluded || employer.holidayPaySeparate) && (
        <View style={[styles.hpCard, { marginTop: 20 }]}>
          <Text style={styles.hpTitle}>Holiday Pay (8%)</Text>
          {employer.holidayPayIncluded && (
            <>
              <Text style={styles.switchLabel}>時給に含まれている（雇用主設定）</Text>
              {calc && (
                <View style={[styles.hpBreakdown, { marginTop: 8 }]}>
                  <Text style={styles.hpBreakdownText}>
                    HP相当額: NZD {(calc.grossPay * 8 / 108).toFixed(2)}（総支給の約7.4%）
                  </Text>
                </View>
              )}
            </>
          )}
          {employer.holidayPaySeparate && (
            <View style={{ marginTop: employer.holidayPayIncluded ? 12 : 0 }}>
              <Text style={styles.switchLabel}>別途支給（雇用主設定）</Text>
              <Text style={[styles.switchSub, { marginTop: 4 }]}>今回の受取額（NZD）</Text>
              <View style={[styles.hpRow, { marginTop: 6 }]}>
                <Text style={{ fontSize: 18, color: Colors.textSecondary, fontWeight: '600', marginRight: 8 }}>$</Text>
                <TextInput
                  style={styles.hpAmountInput}
                  value={holidayPayAmount}
                  onChangeText={setHolidayPayAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />
              </View>
            </View>
          )}
        </View>
      )}

      {/* 給与プレビュー */}
      {calc ? (
        <View style={styles.calcCard}>
          <Text style={styles.calcTitle}>給与計算プレビュー</Text>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>労働時間</Text>
            <Text style={styles.calcValue}>{calc.hours.toFixed(1)}h</Text>
          </View>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>時給{isHoliday ? (isAU ? ' ×2.25' : ' ×1.5') : ''}</Text>
            <Text style={styles.calcValue}>
              {currency} {(isHoliday ? employer!.hourlyRate * (isAU ? 2.25 : 1.5) : employer!.hourlyRate).toFixed(2)}
            </Text>
          </View>
          {allowances.nightShift > 0 && (
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>夜勤手当</Text>
              <Text style={styles.calcValue}>+ {currency} {allowances.nightShift.toFixed(2)}</Text>
            </View>
          )}
          {allowances.overtime > 0 && (
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>残業手当</Text>
              <Text style={styles.calcValue}>+ {currency} {allowances.overtime.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.calcRow, styles.calcDivider]}>
            <Text style={styles.calcLabel}>総支給</Text>
            <Text style={styles.calcValue}>{currency} {calc.grossPay.toFixed(2)}</Text>
          </View>
          <View style={styles.calcRow}>
            <Text style={styles.calcLabelSub}>PAYE 税{isAU ? '（15%）' : ''}</Text>
            <Text style={styles.calcValueSub}>− {currency} {calc.taxAmount.toFixed(2)}</Text>
          </View>
          {!isAU && calc.accLevy > 0 && (
            <View style={styles.calcRow}>
              <Text style={styles.calcLabelSub}>ACC Levy</Text>
              <Text style={styles.calcValueSub}>− {currency} {calc.accLevy.toFixed(2)}</Text>
            </View>
          )}
          {calc.studentLoanDeduction > 0 && (
            <View style={styles.calcRow}>
              <Text style={styles.calcLabelSub}>Student Loan</Text>
              <Text style={styles.calcValueSub}>− {currency} {calc.studentLoanDeduction.toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.calcRow, styles.calcTotal]}>
            <Text style={styles.calcTotalLabel}>手取り</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.calcTotalValue}>{currency} {calc.netPay.toFixed(2)}</Text>
              <Text style={styles.calcJpy}>
                ≈ ¥{Math.round(calc.netPay * rate).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.calcPlaceholder}>
          <Text style={styles.calcPlaceholderText}>
            雇用主と時間を入力すると給与が自動計算されます
          </Text>
        </View>
      )}

      {/* メモ */}
      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>メモ</Text>
      <TextInput
        style={[styles.textInput, styles.memoInput]}
        value={memo}
        onChangeText={setMemo}
        placeholder="自由記入欄（仕事内容・気づきなど）"
        multiline
        numberOfLines={3}
      />

      {/* リマインド */}
      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>リマインド通知</Text>
      <View style={styles.segmentRow}>
        {REMINDER_OPTIONS.map(({ label, value }) => (
          <Pressable
            key={value}
            style={[styles.segment, reminderMinutes === value && styles.segmentActive]}
            onPress={() => setReminderMinutes(value)}
          >
            <Text style={[styles.segmentText, reminderMinutes === value && styles.segmentTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 保存ボタン */}
      <Pressable
        style={[styles.saveBtn, !calc && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={!calc}
      >
        <Text style={styles.saveBtnText}>
          {existing ? '更新する' : 'シフトを保存'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  textInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
  },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  timeSep: { fontSize: 20, color: Colors.textMuted, marginBottom: 14, paddingHorizontal: 4 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  switchLabel: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  switchSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  calcCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
  },
  calcTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  calcDivider: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8, marginTop: 4 },
  calcLabel: { fontSize: 15, color: Colors.textSecondary },
  calcValue: { fontSize: 15, color: Colors.textSecondary, fontWeight: '500' },
  calcLabelSub: { fontSize: 13, color: Colors.textMuted },
  calcValueSub: { fontSize: 13, color: Colors.textMuted },
  calcTotal: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 0,
  },
  calcTotalLabel: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  calcTotalValue: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  calcJpy: { fontSize: 13, color: Colors.textMuted, marginTop: 2 },
  calcPlaceholder: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    alignItems: 'center',
  },
  calcPlaceholderText: { color: Colors.textMuted, fontSize: 14, textAlign: 'center' },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnDisabled: { backgroundColor: Colors.textMuted },
  saveBtnText: { color: Colors.textInverse, fontSize: 17, fontWeight: '700' },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center',
  },
  segmentActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  segmentText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  segmentTextActive: { color: Colors.textInverse },
  memoInput: { height: 80, textAlignVertical: 'top', paddingTop: 12 },
  restHint: { fontSize: 12, color: Colors.primary, marginTop: 6, lineHeight: 17 },
  hpCard: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  hpTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 12 },
  hpRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hpBreakdown: {
    marginTop: 10, backgroundColor: Colors.primarySubtle, borderRadius: 8, padding: 10,
  },
  hpBreakdownText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
  hpAmountInput: {
    flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: 10, padding: 12,
    fontSize: 16, borderWidth: 1, borderColor: Colors.border, color: Colors.textPrimary,
  },
});
