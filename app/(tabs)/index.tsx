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
import { Spacing } from '../../src/constants/spacing';
import { useGoalStore } from '../../src/store/goalStore';
import type { Shift } from '../../src/types';

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

// ── Date helpers ──────────────────────────────────────────────

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return localDateStr(d);
}

function getWeekBounds(dateStr: string): { monday: string; sunday: string } {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = d.getDay();
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday: localDateStr(monday), sunday: localDateStr(sunday) };
}

function calcShiftHours(s: Shift): number {
  return calcHours(s.startTime, s.endTime, s.breakMinutes);
}

// ── StatCard ──────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={statStyles.card}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={statStyles.value}>{value}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radius.md,
    paddingVertical: Spacing.padding.sm,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: { fontSize: 11, color: Colors.textMuted, marginBottom: 6, textAlign: 'center' },
  value: { ...Typography.mono, color: Colors.textPrimary, textAlign: 'center' },
});

// ── TodayShiftCard / OffCard ──────────────────────────────────

function TodayShiftCard({
  shift, rate, currency, dayLabel,
}: { shift: Shift; rate: number; currency: string; dayLabel: string }) {
  const hours = calcShiftHours(shift);
  return (
    <Pressable style={shiftCardStyles.card} onPress={() => router.push(`/shifts/${shift.id}`)}>
      <View style={shiftCardStyles.header}>
        <Text style={shiftCardStyles.dayTag}>{dayLabel}</Text>
        <Text style={shiftCardStyles.employer} numberOfLines={1}>{shift.employerName}</Text>
        {shift.isPublicHoliday && <Text style={shiftCardStyles.phBadge}>公休日</Text>}
      </View>
      <View style={shiftCardStyles.row}>
        <View style={shiftCardStyles.timeBlock}>
          <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
          <Text style={shiftCardStyles.timeText}>
            {shift.startTime}–{shift.endTime}　{hours.toFixed(1)}h
          </Text>
        </View>
        <Text style={shiftCardStyles.net}>{currency} {shift.netPay.toFixed(2)}</Text>
      </View>
      <Text style={shiftCardStyles.jpy}>¥{Math.round(shift.netPay * rate).toLocaleString()}</Text>
    </Pressable>
  );
}

function OffCard({ dayLabel, message }: { dayLabel: string; message: string }) {
  return (
    <View style={shiftCardStyles.offCard}>
      <Text style={shiftCardStyles.dayTag}>{dayLabel}</Text>
      <Text style={shiftCardStyles.offText}>{message}</Text>
    </View>
  );
}

const shiftCardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radius.md,
    padding: Spacing.padding.sm,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dayTag: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    minWidth: 24,
  },
  employer: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  phBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    backgroundColor: Colors.primarySubtle,
    borderRadius: Spacing.radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeBlock: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 13, color: Colors.textSecondary },
  net: { ...Typography.monoSmall, color: Colors.primary },
  jpy: { fontSize: 11, color: Colors.textMuted, marginTop: 4, textAlign: 'right' },
  offCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radius.md,
    padding: Spacing.padding.sm,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  offText: { fontSize: 14, color: Colors.textMuted },
});

// ── WeeklyBarChart ────────────────────────────────────────────

interface DayBar {
  dateStr: string;
  dowLabel: string;
  net: number;
}

function WeeklyBarChart({ data, currency }: { data: DayBar[]; currency: string }) {
  const maxNet = Math.max(...data.map((d) => d.net), 0.01);
  const CHART_HEIGHT = 72;

  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.barsRow}>
        {data.map((d) => {
          const barH = d.net > 0
            ? Math.max((d.net / maxNet) * CHART_HEIGHT, 4)
            : 2;
          const isToday = d.dowLabel === DOW_LABELS[new Date().getDay()]
            && data.indexOf(d) === data.length - 1;
          return (
            <View key={d.dateStr} style={chartStyles.barCol}>
              <View style={[chartStyles.barTrack, { height: CHART_HEIGHT }]}>
                <View
                  style={[
                    chartStyles.bar,
                    { height: barH },
                    isToday && chartStyles.barToday,
                    d.net === 0 && chartStyles.barEmpty,
                  ]}
                />
              </View>
              <Text style={[chartStyles.dowLabel, isToday && chartStyles.dowLabelToday]}>
                {d.dowLabel}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={chartStyles.hint}>過去7日間の日別手取り ({currency})</Text>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.padding.md,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  barCol: { flex: 1, alignItems: 'center' },
  barTrack: { width: '60%', justifyContent: 'flex-end' },
  bar: {
    width: '100%',
    backgroundColor: Colors.primaryMuted,
    borderRadius: Spacing.radius.sm,
  },
  barToday: { backgroundColor: Colors.primary },
  barEmpty: { backgroundColor: Colors.border, height: 2 },
  dowLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 4 },
  dowLabelToday: { color: Colors.primary, fontWeight: '700' },
  hint: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 4 },
});

// ── HomeScreen ────────────────────────────────────────────────

export default function HomeScreen() {
  const { currentYear, currentMonth, loadMonth, shifts } = useShiftStore();
  const { currentCountry, jpyRate } = useSettingsStore();
  const employers = useEmployerStore((s) => s.employers);
  const [quickVisible, setQuickVisible] = useState(false);

  const countryConfig = COUNTRIES[currentCountry as keyof typeof COUNTRIES] ?? COUNTRIES.NZ;
  const currency = countryConfig.currency;
  const rate = jpyRate();

  const countryShifts = shifts.filter((s) => s.country === currentCountry);
  const countryEmployers = employers.filter((e) => e.country === currentCountry);
  const hasQuickEmployers = countryEmployers.some((e) => e.defaultStartTime && e.defaultEndTime);

  const { goals } = useGoalStore();
  const allTimeNet = shifts
    .filter((s) => s.country === currentCountry)
    .reduce((sum, s) => sum + s.netPay, 0);
  const countryGoals = goals.filter((g) => g.country === currentCountry);
  const topGoal = countryGoals.length > 0
    ? countryGoals.reduce((best, g) =>
        allTimeNet / g.targetAmount > allTimeNet / best.targetAmount ? g : best
      )
    : null;

  const todayStr = localDateStr(new Date());
  const tomorrowStr = addDays(todayStr, 1);
  const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const now = new Date();
  const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth() + 1;

  // ── This month completed stats ──
  const completedSummary = useMemo(() => {
    const completed = countryShifts.filter((s) => {
      if (!s.date.startsWith(monthPrefix)) return false;
      return new Date(`${s.date}T${s.endTime}`) <= now;
    });
    const totalHours = completed.reduce((sum, s) => sum + calcShiftHours(s), 0);
    const netPay = completed.reduce((sum, s) => sum + s.netPay, 0);
    return {
      netPay,
      totalHours,
      shiftCount: completed.length,
      avgRate: totalHours > 0 ? netPay / totalHours : 0,
    };
  }, [countryShifts, monthPrefix]);

  // ── Week-over-week delta ──
  const weekDelta = useMemo(() => {
    const { monday, sunday } = getWeekBounds(todayStr);
    const lastMon = addDays(monday, -7);
    const lastSun = addDays(sunday, -7);
    const cur = countryShifts
      .filter((s) => s.date >= monday && s.date <= sunday)
      .reduce((sum, s) => sum + s.netPay, 0);
    const prev = countryShifts
      .filter((s) => s.date >= lastMon && s.date <= lastSun)
      .reduce((sum, s) => sum + s.netPay, 0);
    return cur - prev;
  }, [countryShifts, todayStr]);

  // ── Past 7 days chart data ──
  const chartData = useMemo((): DayBar[] =>
    Array.from({ length: 7 }, (_, i) => {
      const dateStr = addDays(todayStr, i - 6);
      const d = new Date(dateStr + 'T00:00:00');
      const net = countryShifts
        .filter((s) => s.date === dateStr)
        .reduce((sum, s) => sum + s.netPay, 0);
      return { dateStr, dowLabel: DOW_LABELS[d.getDay()], net };
    }),
  [countryShifts, todayStr]);

  // ── Today / tomorrow ──
  const todayShifts = countryShifts.filter((s) => s.date === todayStr);
  const tomorrowShifts = countryShifts.filter((s) => s.date === tomorrowStr);

  function prevMonth() {
    if (currentMonth === 1) loadMonth(currentYear - 1, 12);
    else loadMonth(currentYear, currentMonth - 1);
  }
  function nextMonth() {
    if (isCurrentMonth) return;
    if (currentMonth === 12) loadMonth(currentYear + 1, 1);
    else loadMonth(currentYear, currentMonth + 1);
  }
  function goToCurrentMonth() {
    if (!isCurrentMonth) loadMonth(now.getFullYear(), now.getMonth() + 1);
  }

  return (
    <SafeAreaView style={styles.container}>
      <QuickClockIn visible={quickVisible} onClose={() => setQuickVisible(false)} />

      <View style={styles.topBar}>
        <Text style={styles.appName}>WorkHoli</Text>
        <CountrySwitcher />
      </View>

      <HintBanner
        hintKey="home"
        message="まず「雇用主」タブで職場を登録すると、シフト記録がかんたんになります。"
      />

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Hero: 今月の手取り ── */}
        <View style={styles.heroCard}>
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
            <Pressable
              style={[styles.navBtn, isCurrentMonth && styles.navBtnDisabled]}
              onPress={nextMonth}
            >
              <Text style={[styles.navBtnText, isCurrentMonth && styles.navBtnTextDisabled]}>›</Text>
            </Pressable>
          </View>

          <Text style={styles.heroLabel}>今月の手取り（勤務終了分）</Text>
          <Text style={styles.heroNet}>{currency} {completedSummary.netPay.toFixed(2)}</Text>
          <Text style={styles.heroJpy}>¥{Math.round(completedSummary.netPay * rate).toLocaleString()}</Text>

          {isCurrentMonth && (
            <View style={styles.deltaRow}>
              <Ionicons
                name={weekDelta >= 0 ? 'trending-up' : 'trending-down'}
                size={14}
                color={weekDelta >= 0 ? Colors.positive : Colors.negative}
              />
              <Text style={[styles.deltaText, weekDelta >= 0 ? styles.deltaPos : styles.deltaNeg]}>
                {weekDelta >= 0 ? '+' : ''}{currency} {Math.abs(weekDelta).toFixed(2)} 先週比
              </Text>
            </View>
          )}
        </View>

        {/* ── Quick Stats ── */}
        <View style={styles.statsRow}>
          <StatCard label="総労働時間" value={`${completedSummary.totalHours.toFixed(1)}h`} />
          <View style={styles.statGap} />
          <StatCard label="平均時給" value={`${completedSummary.avgRate.toFixed(2)}`} />
          <View style={styles.statGap} />
          <StatCard label="シフト数" value={`${completedSummary.shiftCount}回`} />
        </View>

        {/* ── Weekly Bar Chart ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>過去7日間</Text>
        </View>
        <WeeklyBarChart data={chartData} currency={currency} />

        {/* ── Today / Tomorrow ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>今日・明日のシフト</Text>
          <Pressable onPress={() => router.push('/shifts')}>
            <Text style={styles.sectionLink}>すべて見る</Text>
          </Pressable>
        </View>

        {todayShifts.length === 0
          ? <OffCard dayLabel="今日" message="今日はオフ 🌴" />
          : todayShifts.map((s) => (
            <TodayShiftCard key={s.id} shift={s} rate={rate} currency={currency} dayLabel="今日" />
          ))
        }

        {tomorrowShifts.length === 0
          ? <OffCard dayLabel="明日" message="明日はオフ" />
          : tomorrowShifts.map((s) => (
            <TodayShiftCard key={s.id} shift={s} rate={rate} currency={currency} dayLabel="明日" />
          ))
        }

        {/* ── Top Goal Card ── */}
        {topGoal !== null && (() => {
          const progress = Math.min(allTimeNet / topGoal.targetAmount, 1);
          const achieved = allTimeNet >= topGoal.targetAmount;
          return (
            <Pressable style={goalCardStyles.card} onPress={() => router.push('/goals')}>
              <View style={goalCardStyles.row}>
                <Text style={goalCardStyles.emoji}>{topGoal.emoji}</Text>
                <View style={goalCardStyles.info}>
                  <Text style={goalCardStyles.name} numberOfLines={1}>{topGoal.name}</Text>
                  <Text style={goalCardStyles.sub}>
                    {achieved ? '🎉 達成！' : `${currency} ${Math.max(topGoal.targetAmount - allTimeNet, 0).toFixed(0)} 残り`}
                  </Text>
                </View>
                <Text style={goalCardStyles.pct}>{Math.round(progress * 100)}%</Text>
              </View>
              <View style={goalCardStyles.barBg}>
                <View style={[goalCardStyles.barFill, { width: `${Math.round(progress * 100)}%` as `${number}%` }]} />
              </View>
            </Pressable>
          );
        })()}

        {/* ── Quick Clock-in ── */}
        <Pressable
          style={[styles.quickBtn, !hasQuickEmployers && styles.quickBtnDisabled]}
          onPress={() => setQuickVisible(true)}
        >
          <Ionicons name="time-outline" size={22} color={Colors.textInverse} />
          <Text style={styles.quickBtnText}>ワンタップ出勤</Text>
        </Pressable>

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
    paddingHorizontal: Spacing.padding.md,
    paddingVertical: Spacing.padding.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  appName: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  scroll: { padding: Spacing.padding.md, paddingBottom: 40 },

  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.padding.lg,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: Spacing.radius.lg,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navBtnDisabled: { borderColor: Colors.borderSubtle },
  navBtnText: { fontSize: 20, color: Colors.primary, lineHeight: 24 },
  navBtnTextDisabled: { color: Colors.textMuted },
  monthLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  monthLabelPast: { color: Colors.primary },

  heroLabel: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: 4 },
  heroNet: { ...Typography.monoXL, color: Colors.primary },
  heroJpy: { ...Typography.monoSmall, color: Colors.textSecondary, marginTop: 2, marginBottom: 10 },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deltaText: { fontSize: 13, fontWeight: '600' },
  deltaPos: { color: Colors.positive },
  deltaNeg: { color: Colors.negative },

  statsRow: { flexDirection: 'row', marginBottom: 20 },
  statGap: { width: 8 },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  sectionLink: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: Spacing.radius.md,
    paddingVertical: Spacing.padding.sm,
    marginTop: 8,
  },
  quickBtnDisabled: { backgroundColor: Colors.primaryMuted },
  quickBtnText: { color: Colors.textInverse, fontSize: 16, fontWeight: '700' },
});

const goalCardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radius.md,
    padding: Spacing.padding.sm,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  emoji: { fontSize: 24 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  sub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  pct: { ...Typography.monoSmall, color: Colors.primary },
  barBg: {
    height: 6,
    backgroundColor: Colors.background,
    borderRadius: Spacing.radius.sm,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: Spacing.radius.sm },
});
