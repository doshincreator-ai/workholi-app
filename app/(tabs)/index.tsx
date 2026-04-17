import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useShiftStore } from '../../src/store/shiftStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useEmployerStore } from '../../src/store/employerStore';
import { calcHours } from '../../src/utils/payCalculator';
import { HintBanner } from '../../src/components/HintBanner';
import { QuickClockIn } from '../../src/components/QuickClockIn';
import { CountrySwitcher } from '../../src/components/CountrySwitcher';
import { COUNTRIES } from '../../src/config/countries';
import { Colors } from '../../src/constants/colors';
import { Typography } from '../../src/constants/typography';
import type { Shift } from '../../src/types';

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function getLevel(totalNet: number): { emoji: string; label: string } {
  if (totalNet >= 10000) return { emoji: '🦅', label: 'レジェンド' };
  if (totalNet >= 5000) return { emoji: '🐔', label: 'ベテラン' };
  if (totalNet >= 1500) return { emoji: '🐤', label: 'ハーフイヤー' };
  if (totalNet >= 500) return { emoji: '🐣', label: 'ひよっこ' };
  return { emoji: '🥚', label: 'たまご' };
}

function calcStreak(shifts: Shift[], todayStr: string): number {
  const pastDates = new Set(shifts.filter((s) => s.date <= todayStr).map((s) => s.date));
  let streak = 0;
  const cursor = new Date(todayStr + 'T00:00:00');
  while (true) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, '0');
    const d = String(cursor.getDate()).padStart(2, '0');
    if (pastDates.has(`${y}-${m}-${d}`)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getWeekRange(date: Date): { monday: string; sunday: string; label: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const label = `${monday.getMonth() + 1}/${monday.getDate()}〜${sunday.getMonth() + 1}/${sunday.getDate()}`;
  return { monday: localDateStr(monday), sunday: localDateStr(sunday), label };
}

function calcShiftHours(s: Shift): number {
  return calcHours(s.startTime, s.endTime, s.breakMinutes);
}

function ShiftRow({ shift, rate, currency }: { shift: Shift; rate: number; currency: string }) {
  return (
    <Pressable style={styles.shiftRow} onPress={() => router.push(`/shifts/${shift.id}`)}>
      <View style={styles.shiftLeft}>
        <Text style={styles.shiftDate}>{shift.date}</Text>
        <Text style={styles.shiftEmployer}>{shift.employerName}</Text>
        <Text style={styles.shiftTime}>
          {shift.startTime}–{shift.endTime}
          {shift.isPublicHoliday ? '  公休日' : ''}
        </Text>
      </View>
      <View style={styles.shiftRight}>
        <Text style={styles.shiftNet}>{currency} {shift.netPay.toFixed(2)}</Text>
        <Text style={styles.shiftJpy}>¥{Math.round(shift.netPay * rate).toLocaleString()}</Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const { currentYear, currentMonth, monthlySummary, loadMonth, shifts } = useShiftStore();
  const { currentCountry, jpyRate } = useSettingsStore();
  const employers = useEmployerStore((s) => s.employers);
  const [quickVisible, setQuickVisible] = useState(false);

  const countryConfig = COUNTRIES[currentCountry as keyof typeof COUNTRIES] ?? COUNTRIES.NZ;
  const currency = countryConfig.currency;
  const rate = jpyRate();

  const countryShifts = shifts.filter((s) => s.country === currentCountry);
  const countryEmployers = employers.filter((e) => e.country === currentCountry);

  const hasQuickEmployers = countryEmployers.some((e) => e.defaultStartTime && e.defaultEndTime);

  const todayStr = localDateStr(new Date());
  const { monday, sunday, label: weekLabel } = getWeekRange(new Date());
  const weekShifts = countryShifts.filter((s) => s.date >= monday && s.date <= sunday);

  const allTimeNet = shifts.reduce((sum, s) => sum + s.netPay, 0);
  const level = getLevel(allTimeNet);
  const streak = calcStreak(shifts, todayStr);
  const weekHours = weekShifts.reduce((s, sh) => s + calcShiftHours(sh), 0);
  const weekNet = weekShifts.reduce((s, sh) => s + sh.netPay, 0);

  const recentShifts = countryShifts.slice(0, 5);

  const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const completedSummary = useMemo(() => {
    const now = new Date();
    const completed = countryShifts.filter((s) => {
      if (!s.date.startsWith(monthPrefix)) return false;
      return new Date(`${s.date}T${s.endTime}`) <= now;
    });
    return {
      grossPay: completed.reduce((sum, s) => sum + s.grossPay, 0),
      taxAmount: completed.reduce((sum, s) => sum + s.taxAmount, 0),
      accLevy: completed.reduce((sum, s) => sum + s.accLevy, 0),
      studentLoanDeduction: completed.reduce((sum, s) => sum + s.studentLoanDeduction, 0),
      netPay: completed.reduce((sum, s) => sum + s.netPay, 0),
      totalHours: completed.reduce((sum, s) => sum + calcShiftHours(s), 0),
      shiftCount: completed.length,
    };
  }, [countryShifts, monthPrefix]);

  const { grossPay, taxAmount, accLevy, studentLoanDeduction, netPay, totalHours, shiftCount } = completedSummary;
  const totalDeduction = taxAmount + accLevy + studentLoanDeduction;

  function prevMonth() {
    if (currentMonth === 1) loadMonth(currentYear - 1, 12);
    else loadMonth(currentYear, currentMonth - 1);
  }
  function nextMonth() {
    const now = new Date();
    if (currentYear > now.getFullYear() || (currentYear === now.getFullYear() && currentMonth >= now.getMonth() + 1)) return;
    if (currentMonth === 12) loadMonth(currentYear + 1, 1);
    else loadMonth(currentYear, currentMonth + 1);
  }

  const now2 = new Date();
  const isCurrentMonth = currentYear === now2.getFullYear() && currentMonth === now2.getMonth() + 1;

  function goToCurrentMonth() {
    if (!isCurrentMonth) loadMonth(now2.getFullYear(), now2.getMonth() + 1);
  }

  return (
    <SafeAreaView style={styles.container}>
      <QuickClockIn visible={quickVisible} onClose={() => setQuickVisible(false)} />
      <View style={styles.topBar}>
        <Text style={styles.appName}>WorkHoli</Text>
        <CountrySwitcher />
      </View>

      <View style={styles.statusBar}>
        <View style={styles.statusChip}>
          <Text style={styles.statusEmoji}>{level.emoji}</Text>
          <Text style={styles.statusLabel}>{level.label}</Text>
        </View>
        {streak >= 2 && (
          <View style={[styles.statusChip, styles.streakChip]}>
            <Text style={styles.statusEmoji}>🔥</Text>
            <Text style={styles.streakLabel}>{streak}日連続</Text>
          </View>
        )}
      </View>

      <HintBanner hintKey="home" message="まず「雇用主」タブで職場を登録すると、シフト記録がかんたんになります。" />
      <ScrollView contentContainerStyle={styles.scroll}>

        <Pressable
          style={[styles.quickBtn, !hasQuickEmployers && styles.quickBtnDisabled]}
          onPress={() => setQuickVisible(true)}
        >
          <Ionicons name="time-outline" size={22} color={Colors.textInverse} />
          <Text style={styles.quickBtnText}>ワンタップ出勤</Text>
        </Pressable>

        <View style={styles.monthNav}>
          <Pressable style={styles.navBtn} onPress={prevMonth}>
            <Text style={styles.navBtnText}>‹</Text>
          </Pressable>
          <Pressable onPress={goToCurrentMonth}>
            <Text style={[styles.monthLabel, !isCurrentMonth && styles.monthLabelPast]}>
              {currentYear}年 {MONTHS[currentMonth - 1]}
              {!isCurrentMonth && ' ↩'}
            </Text>
          </Pressable>
          <Pressable style={[styles.navBtn, isCurrentMonth && styles.navBtnDisabled]} onPress={nextMonth}>
            <Text style={[styles.navBtnText, isCurrentMonth && styles.navBtnTextDisabled]}>›</Text>
          </Pressable>
        </View>

        <View style={styles.mainCard}>
          <Text style={styles.mainLabel}>手取り合計（勤務終了分）</Text>
          <Text style={styles.mainNet}>{currency} {netPay.toFixed(2)}</Text>
          <Text style={styles.mainJpy}>¥{Math.round(netPay * rate).toLocaleString()}</Text>

          <View style={styles.divider} />

          <View style={styles.breakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>総支給</Text>
              <Text style={styles.breakdownValue}>{currency} {grossPay.toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>控除合計</Text>
              <Text style={styles.breakdownValueNeg}>− {totalDeduction.toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>シフト数</Text>
              <Text style={styles.breakdownValue}>{shiftCount}回</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>総時間</Text>
              <Text style={styles.breakdownValue}>{totalHours}h</Text>
            </View>
          </View>

          {grossPay > 0 && (
            <View style={styles.taxBreakdown}>
              <View style={styles.taxRow}>
                <Text style={styles.taxLabel}>PAYE 税</Text>
                <Text style={styles.taxValue}>− {currency} {taxAmount.toFixed(2)}</Text>
              </View>
              {accLevy > 0 && (
                <View style={styles.taxRow}>
                  <Text style={styles.taxLabel}>ACC Levy</Text>
                  <Text style={styles.taxValue}>− {currency} {accLevy.toFixed(2)}</Text>
                </View>
              )}
              {studentLoanDeduction > 0 && (
                <View style={styles.taxRow}>
                  <Text style={styles.taxLabel}>Student Loan</Text>
                  <Text style={styles.taxValue}>− {currency} {studentLoanDeduction.toFixed(2)}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>今週の予想</Text>
          <Text style={styles.weekRangeLabel}>{weekLabel}</Text>
        </View>
        <View style={styles.weekCard}>
          <View style={styles.weekItem}>
            <Text style={styles.weekLabel}>シフト</Text>
            <Text style={styles.weekValue}>{weekShifts.length}回</Text>
          </View>
          <View style={styles.weekSep} />
          <View style={styles.weekItem}>
            <Text style={styles.weekLabel}>時間</Text>
            <Text style={styles.weekValue}>{weekHours.toFixed(1)}h</Text>
          </View>
          <View style={styles.weekSep} />
          <View style={styles.weekItem}>
            <Text style={styles.weekLabel}>手取り予想</Text>
            <Text style={[styles.weekValue, styles.weekValueGreen]}>
              {currency} {weekNet.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>直近のシフト</Text>
          <Pressable onPress={() => router.push('/shifts')}>
            <Text style={styles.sectionLink}>すべて見る</Text>
          </Pressable>
        </View>

        <View style={styles.recentCard}>
          {recentShifts.length === 0 ? (
            <Text style={styles.emptyText}>シフトがありません</Text>
          ) : (
            recentShifts.map((shift, i) => (
              <View key={shift.id}>
                {i > 0 && <View style={styles.rowSep} />}
                <ShiftRow shift={shift} rate={rate} currency={currency} />
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  appName: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  scroll: { padding: 16, paddingBottom: 32 },

  quickBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 14, marginBottom: 16,
  },
  quickBtnDisabled: { backgroundColor: Colors.primaryMuted },
  quickBtnText: { color: Colors.textInverse, fontSize: 16, fontWeight: '700' },

  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navBtnDisabled: { borderColor: Colors.borderSubtle },
  navBtnText: { fontSize: 22, color: Colors.primary, lineHeight: 26 },
  navBtnTextDisabled: { color: Colors.textMuted },
  monthLabel: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  monthLabelPast: { color: Colors.primary },

  statusBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.background, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  streakChip: { borderColor: '#7a3a00', backgroundColor: '#1a0e00' },
  statusEmoji: { fontSize: 14 },
  statusLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  streakLabel: { fontSize: 12, color: Colors.warning, fontWeight: '700' },

  mainCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mainLabel: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: 4 },
  mainNet: { ...Typography.monoXL, color: Colors.primary },
  mainJpy: { ...Typography.monoSmall, color: Colors.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },
  breakdown: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  breakdownItem: { flex: 1, minWidth: '40%' },
  breakdownLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  breakdownValue: { ...Typography.monoSmall, color: Colors.textPrimary },
  breakdownValueNeg: { ...Typography.monoSmall, color: Colors.negative },
  taxBreakdown: {
    marginTop: 14,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  taxRow: { flexDirection: 'row', justifyContent: 'space-between' },
  taxLabel: { fontSize: 13, color: Colors.textSecondary },
  taxValue: { ...Typography.monoSmall, color: Colors.textMuted },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  sectionLink: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  weekRangeLabel: { fontSize: 13, color: Colors.textMuted, marginBottom: 8 },
  weekCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weekItem: { flex: 1, alignItems: 'center' },
  weekSep: { width: 1, height: 36, backgroundColor: Colors.border },
  weekLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  weekValue: { ...Typography.mono, color: Colors.textPrimary },
  weekValueGreen: { color: Colors.primary, fontSize: 15 },

  recentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shiftRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  shiftLeft: { flex: 1 },
  shiftDate: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  shiftEmployer: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  shiftTime: { fontSize: 12, color: Colors.textSecondary },
  shiftRight: { alignItems: 'flex-end', marginLeft: 12 },
  shiftNet: { ...Typography.monoSmall, color: Colors.primary },
  shiftJpy: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  rowSep: { height: 1, backgroundColor: Colors.borderSubtle, marginHorizontal: 14 },
  emptyText: { color: Colors.textMuted, textAlign: 'center', padding: 24 },
});
