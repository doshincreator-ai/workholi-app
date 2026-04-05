import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useShiftStore } from '../../../src/store/shiftStore';
import { CopyShiftModal } from '../../../src/components/CopyShiftModal';
import { useSettingsStore } from '../../../src/store/settingsStore';
import { calcHours } from '../../../src/utils/payCalculator';
import { getNZPublicHolidays, getNZHolidayName } from '../../../src/utils/nzHolidays';
import { getAUPublicHolidays, getAUHolidayName } from '../../../src/utils/auHolidays';
import { useEmployerStore } from '../../../src/store/employerStore';
import { COUNTRIES } from '../../../src/config/countries';
import type { Shift } from '../../../src/types';
import { HintBanner } from '../../../src/components/HintBanner';

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'];
const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

// 雇用主IDに対応する色
const EMPLOYER_COLORS = [
  '#16a34a', '#2563eb', '#dc2626', '#d97706',
  '#7c3aed', '#db2777', '#0891b2', '#65a30d',
];
function employerColor(employerId: number): string {
  return EMPLOYER_COLORS[employerId % EMPLOYER_COLORS.length];
}

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** その月の日付グリッドを生成（月曜始まり） */
function buildCalendarDays(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  // 月曜=0, 火曜=1, ..., 日曜=6
  const startPad = (firstDay.getDay() + 6) % 7;
  const days: (string | null)[] = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function ShiftDetail({ shift, rate, currency, onEdit, onDelete, onCopy }: {
  shift: Shift;
  rate: number;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
}) {
  const hours = calcHours(shift.startTime, shift.endTime, shift.breakMinutes);
  const color = employerColor(shift.employerId);
  return (
    <Pressable style={styles.shiftCard} onPress={onEdit}>
      <View style={[styles.shiftAccent, { backgroundColor: color }]} />
      <View style={styles.shiftCardBody}>
        <View style={styles.shiftCardTop}>
          <Text style={styles.shiftCardEmployer}>{shift.employerName}</Text>
          <Text style={styles.shiftCardNet}>{currency} {shift.netPay.toFixed(2)}</Text>
        </View>
        <View style={styles.shiftCardBottom}>
          <Text style={styles.shiftCardTime}>
            {shift.startTime}–{shift.endTime}　{hours.toFixed(1)}h
            {shift.isPublicHoliday ? '　公休日' : ''}
          </Text>
          <Text style={styles.shiftCardJpy}>¥{Math.round(shift.netPay * rate).toLocaleString()}</Text>
        </View>
      </View>
      <Pressable style={styles.copyIconBtn} onPress={onCopy} hitSlop={8}>
        <Ionicons name="copy-outline" size={15} color="#6b7280" />
        <Text style={styles.copyIconLabel}>コピー</Text>
      </Pressable>
      <Pressable style={styles.deleteIconBtn} onPress={onDelete} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color="#ef4444" />
      </Pressable>
    </Pressable>
  );
}

export default function ShiftsScreen() {
  const { shifts, remove } = useShiftStore();
  const { currentCountry, jpyRate } = useSettingsStore();
  const countryConfig = COUNTRIES[currentCountry as keyof typeof COUNTRIES] ?? COUNTRIES.NZ;
  const currency = countryConfig.currency;
  const rate = jpyRate();
  const isNZ = currentCountry === 'NZ';
  const employers = useEmployerStore((s) => s.employers);
  const auRegion = !isNZ
    ? (employers.find((e) => e.country === 'AU' && e.region)?.region ?? undefined)
    : undefined;

  const today = localDateStr(new Date());
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [copyingShift, setCopyingShift] = useState<import('../../../src/types').Shift | null>(null);

  const calendarDays = useMemo(() => buildCalendarDays(year, month), [year, month]);
  const publicHolidays = useMemo(
    () => isNZ
      ? new Set(getNZPublicHolidays(year))
      : new Set(getAUPublicHolidays(year, auRegion)),
    [year, isNZ, auRegion],
  );

  // 現在の国のシフトのみ表示
  const countryShifts = useMemo(
    () => shifts.filter((s) => s.country === currentCountry),
    [shifts, currentCountry],
  );

  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const monthlyNet = useMemo(() => {
    return countryShifts
      .filter((s) => s.date.startsWith(monthPrefix))
      .reduce((sum, s) => sum + s.netPay, 0);
  }, [countryShifts, monthPrefix]);

  // 日付→シフト配列のマップ
  const shiftsByDate = useMemo(() => {
    const map: Record<string, Shift[]> = {};
    countryShifts.forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [countryShifts]);

  const selectedShifts = shiftsByDate[selectedDate] ?? [];

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  function handleDelete(id: number) {
    Alert.alert('シフトを削除', 'このシフトを削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => remove(id) },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <HintBanner hintKey="shifts" message="コピーボタンで同じシフトを複数の日に一括複製できます。シフト右端のアイコンをタップ！" />
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.monthNav}>
          <Pressable style={styles.navBtn} onPress={prevMonth}>
            <Ionicons name="chevron-back" size={20} color="#16a34a" />
          </Pressable>
          <View style={styles.monthCenter}>
            <Text style={styles.monthLabel}>{year}年 {MONTHS[month - 1]}</Text>
            {monthlyNet > 0 && (
              <Text style={styles.monthNetLabel}>{currency} {monthlyNet.toFixed(0)} 手取り</Text>
            )}
          </View>
          <Pressable style={styles.navBtn} onPress={nextMonth}>
            <Ionicons name="chevron-forward" size={20} color="#16a34a" />
          </Pressable>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push({ pathname: '/shifts/add', params: { date: selectedDate } })}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>追加</Text>
        </Pressable>
      </View>

      <CopyShiftModal shift={copyingShift} onClose={() => setCopyingShift(null)} />

      <ScrollView>
        {/* 曜日ヘッダー */}
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((d, i) => (
            <Text
              key={d}
              style={[styles.weekdayLabel, i === 5 && styles.sat, i === 6 && styles.sun]}
            >
              {d}
            </Text>
          ))}
        </View>

        {/* カレンダーグリッド */}
        <View style={styles.grid}>
          {calendarDays.map((date, i) => {
            if (!date) return <View key={`empty-${i}`} style={styles.dayCell} />;
            const dayShifts = shiftsByDate[date] ?? [];
            const isToday = date === today;
            const isSelected = date === selectedDate;
            const isHoliday = publicHolidays.has(date);
            const dayNum = parseInt(date.split('-')[2], 10);
            const col = i % 7; // 0=Mon,...,5=Sat,6=Sun
            return (
              <Pressable
                key={date}
                style={[styles.dayCell, isSelected && styles.dayCellSelected, isHoliday && styles.dayCellHoliday]}
                onPress={() => setSelectedDate(date)}
              >
                <View style={[styles.dayNumWrap, isToday && styles.todayCircle]}>
                  <Text style={[
                    styles.dayNum,
                    isToday && styles.todayNum,
                    isHoliday && !isToday && styles.holidayNum,
                    col === 5 && styles.satNum,
                    col === 6 && styles.sunNum,
                  ]}>
                    {dayNum}
                  </Text>
                </View>
                {isHoliday && <Text style={styles.holidayDot}>●</Text>}
                <View style={styles.dots}>
                  {dayShifts.slice(0, 3).map((s) => (
                    <View
                      key={s.id}
                      style={[styles.dot, { backgroundColor: employerColor(s.employerId) }]}
                    />
                  ))}
                  {dayShifts.length > 3 && (
                    <Text style={styles.dotMore}>+</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* 選択日のシフト */}
        <View style={styles.detailSection}>
          <View style={styles.detailHeader}>
            <View>
              <Text style={styles.detailDate}>
                {selectedDate.replace(/-/g, '/')}（{WEEKDAYS[((() => { const [y,m,d] = selectedDate.split('-').map(Number); return new Date(y, m - 1, d).getDay(); })() + 6) % 7]}）
              </Text>
              {(isNZ ? getNZHolidayName(selectedDate) : getAUHolidayName(selectedDate, auRegion)) && (
                <Text style={styles.holidayName}>
                  {isNZ ? getNZHolidayName(selectedDate) : getAUHolidayName(selectedDate, auRegion)}
                </Text>
              )}
            </View>
            {selectedShifts.length > 0 && (
              <Text style={styles.detailCount}>{selectedShifts.length}件</Text>
            )}
          </View>

          {selectedShifts.length > 0 && (
            <Text style={styles.copyHint}>「コピー」で同じシフトを他の日に複製できます</Text>
          )}

          {selectedShifts.length === 0 ? (
            <View style={styles.emptyDay}>
              <Text style={styles.emptyDayText}>シフトなし</Text>
              <Pressable
                style={styles.addDayBtn}
                onPress={() => router.push({ pathname: '/shifts/add', params: { date: selectedDate } })}
              >
                <Text style={styles.addDayBtnText}>+ この日にシフトを追加</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.shiftList}>
              {selectedShifts.map((s) => (
                <ShiftDetail
                  key={s.id}
                  shift={s}
                  rate={rate}
                  currency={currency}
                  onEdit={() => router.push(`/shifts/${s.id}`)}
                  onDelete={() => handleDelete(s.id)}
                  onCopy={() => setCopyingShift(s)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthCenter: { alignItems: 'center', minWidth: 110 },
  navBtn: { padding: 6 },
  monthLabel: { fontSize: 17, fontWeight: '700', color: '#111827', textAlign: 'center' },
  monthNetLabel: { fontSize: 11, color: '#16a34a', fontWeight: '600', marginTop: 1 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#16a34a', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  weekdayRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  weekdayLabel: {
    flex: 1, textAlign: 'center',
    fontSize: 12, fontWeight: '600', color: '#6b7280',
    paddingVertical: 8,
  },
  sat: { color: '#2563eb' },
  sun: { color: '#dc2626' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dayCell: {
    width: `${100 / 7}%`,
    minHeight: 60,
    alignItems: 'center',
    paddingVertical: 6,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#f3f4f6',
  },
  dayCellSelected: { backgroundColor: '#f0fdf4' },
  dayCellHoliday: { backgroundColor: '#fff7ed' },
  dayNumWrap: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  todayCircle: { backgroundColor: '#16a34a' },
  dayNum: { fontSize: 13, color: '#374151', fontWeight: '500' },
  todayNum: { color: '#fff', fontWeight: '700' },
  satNum: { color: '#2563eb' },
  sunNum: { color: '#dc2626' },

  holidayNum: { color: '#ea580c' },
  holidayDot: { fontSize: 7, color: '#ea580c', lineHeight: 9 },

  dots: { flexDirection: 'row', gap: 2, marginTop: 3, flexWrap: 'wrap', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotMore: { fontSize: 8, color: '#9ca3af', lineHeight: 8 },

  detailSection: { padding: 12 },
  detailHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  detailDate: { fontSize: 15, fontWeight: '700', color: '#111827' },
  holidayName: { fontSize: 11, color: '#ea580c', marginTop: 2 },
  detailCount: { fontSize: 13, color: '#6b7280' },

  shiftList: { gap: 8 },
  shiftCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  shiftAccent: { width: 5, alignSelf: 'stretch' },
  shiftCardBody: { flex: 1, padding: 12 },
  shiftCardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  shiftCardEmployer: { fontSize: 15, fontWeight: '600', color: '#111827' },
  shiftCardNet: { fontSize: 15, fontWeight: '700', color: '#16a34a' },
  shiftCardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  shiftCardTime: { fontSize: 12, color: '#6b7280' },
  shiftCardJpy: { fontSize: 12, color: '#9ca3af' },
  copyIconBtn: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 12 },
  copyIconLabel: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  copyHint: { fontSize: 11, color: '#9ca3af', marginBottom: 8, textAlign: 'center' },
  deleteIconBtn: { padding: 12 },

  emptyDay: { alignItems: 'center', paddingVertical: 20, gap: 10 },
  emptyDayText: { fontSize: 14, color: '#9ca3af' },
  addDayBtn: {
    borderWidth: 1, borderColor: '#16a34a', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  addDayBtnText: { color: '#16a34a', fontWeight: '600', fontSize: 14 },
});
