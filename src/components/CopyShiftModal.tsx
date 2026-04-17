import { View, Text, Modal, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import { useShiftStore } from '../store/shiftStore';
import { Colors } from '../constants/colors';
import type { Shift } from '../types';

const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'];

function buildCalendarDays(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startPad = (firstDay.getDay() + 6) % 7;
  const days: (string | null)[] = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface Props {
  shift: Shift | null;
  onClose: () => void;
}

export function CopyShiftModal({ shift, onClose }: Props) {
  const add = useShiftStore((s) => s.add);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const calendarDays = useMemo(() => buildCalendarDays(year, month), [year, month]);
  const today = localDateStr(now);

  function toggle(date: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  function handleConfirm() {
    if (!shift) return;
    selected.forEach((date) => {
      add({
        employerId: shift.employerId,
        date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        breakMinutes: shift.breakMinutes,
        country: shift.country,
        isPublicHoliday: shift.isPublicHoliday,
        isShared: shift.isShared,
        isHolidayRest: shift.isHolidayRest,
        memo: shift.memo,
        hourlyRate: shift.hourlyRate,
        grossPay: shift.grossPay,
        taxAmount: shift.taxAmount,
        accLevy: shift.accLevy,
        studentLoanDeduction: shift.studentLoanDeduction,
        netPay: shift.netPay,
        holidayPayIncluded: shift.holidayPayIncluded,
        holidayPaySeparate: shift.holidayPaySeparate,
        holidayPayAmount: shift.holidayPayAmount,
        reminderMinutes: shift.reminderMinutes,
      }, true);
    });
    setSelected(new Set());
    onClose();
  }

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  if (!shift) return null;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </Pressable>
          <Text style={styles.title}>コピー先を選択</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* コピー元の情報 */}
        <View style={styles.sourceCard}>
          <Ionicons name="copy-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.sourceText}>
            {shift.employerName}　{shift.startTime}–{shift.endTime}
          </Text>
        </View>

        <ScrollView>
          {/* 月ナビ */}
          <View style={styles.monthNav}>
            <Pressable style={styles.navBtn} onPress={prevMonth}>
              <Ionicons name="chevron-back" size={20} color={Colors.primary} />
            </Pressable>
            <Text style={styles.monthLabel}>{year}年 {month}月</Text>
            <Pressable style={styles.navBtn} onPress={nextMonth}>
              <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
            </Pressable>
          </View>

          {/* 曜日ヘッダー */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((d, i) => (
              <Text key={d} style={[styles.weekdayLabel, i === 5 && styles.sat, i === 6 && styles.sun]}>
                {d}
              </Text>
            ))}
          </View>

          {/* カレンダーグリッド */}
          <View style={styles.grid}>
            {calendarDays.map((date, i) => {
              if (!date) return <View key={`e-${i}`} style={styles.cell} />;
              const isSelected = selected.has(date);
              const isToday = date === today;
              const dayNum = parseInt(date.split('-')[2], 10);
              const col = i % 7;
              return (
                <Pressable
                  key={date}
                  style={[styles.cell, isSelected && styles.cellSelected]}
                  onPress={() => toggle(date)}
                >
                  <View style={[styles.dayNumWrap, isToday && styles.todayCircle]}>
                    <Text style={[
                      styles.dayNum,
                      isToday && styles.todayNum,
                      col === 5 && styles.satNum,
                      col === 6 && styles.sunNum,
                      isSelected && styles.selectedNum,
                    ]}>
                      {dayNum}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={14} color={Colors.primary} style={styles.checkIcon} />
                  )}
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.hint}>複数の日付をタップして選択できます</Text>
        </ScrollView>

        {/* 確定ボタン */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.confirmBtn, selected.size === 0 && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={selected.size === 0}
          >
            <Ionicons name="copy-outline" size={18} color={Colors.textInverse} />
            <Text style={styles.confirmBtnText}>
              {selected.size > 0 ? `${selected.size}日にコピーする` : '日付を選んでください'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  closeBtn: { padding: 4 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },

  sourceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surfaceElevated, paddingHorizontal: 16, paddingVertical: 10,
  },
  sourceText: { fontSize: 13, color: Colors.textSecondary },

  monthNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  navBtn: { padding: 6 },
  monthLabel: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },

  weekdayRow: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  weekdayLabel: {
    flex: 1, textAlign: 'center', fontSize: 12,
    fontWeight: '600', color: Colors.textSecondary, paddingVertical: 8,
  },
  sat: { color: Colors.saturdayText },
  sun: { color: Colors.sundayText },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  cell: {
    width: `${100 / 7}%`, minHeight: 56,
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8,
    borderRightWidth: 0.5, borderBottomWidth: 0.5, borderColor: Colors.border,
  },
  cellSelected: { backgroundColor: Colors.primarySubtle },
  dayNumWrap: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  todayCircle: { backgroundColor: Colors.primary },
  dayNum: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  todayNum: { color: Colors.textInverse, fontWeight: '700' },
  satNum: { color: Colors.saturdayText },
  sunNum: { color: Colors.sundayText },
  selectedNum: { fontWeight: '700' },
  checkIcon: { marginTop: 2 },

  hint: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, padding: 16 },

  footer: {
    padding: 16, backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  confirmBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  confirmBtnDisabled: { backgroundColor: Colors.textMuted },
  confirmBtnText: { color: Colors.textInverse, fontSize: 16, fontWeight: '700' },
});
