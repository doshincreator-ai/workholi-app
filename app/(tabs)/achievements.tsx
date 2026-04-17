import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo } from 'react';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useEmployerStore } from '../../src/store/employerStore';
import type { Settings } from '../../src/types';
import { Colors } from '../../src/constants/colors';
import { Typography } from '../../src/constants/typography';

const DOW_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
const DOW_OPTIONS = [1, 2, 3, 4, 5] as const; // Mon–Fri

type PaydayType = 'none' | 'weekly' | 'biweekly' | 'monthly';

// ── Payday calculation ────────────────────────────────────────

function calcNextPayday(type: PaydayType, day: number): Date | null {
  if (type === 'none') return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (type === 'weekly' || type === 'biweekly') {
    const todayDow = today.getDay();
    let daysUntil = day - todayDow;
    if (daysUntil <= 0) daysUntil += 7;
    const next = new Date(today);
    next.setDate(today.getDate() + daysUntil);
    return next;
  }

  if (type === 'monthly') {
    const next = new Date(today.getFullYear(), today.getMonth(), day);
    if (next.getTime() <= today.getTime()) {
      next.setMonth(next.getMonth() + 1);
    }
    return next;
  }

  return null;
}

function calcCountdown(target: Date): { days: number; hours: number; minutes: number } {
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return { days: 0, hours: 0, minutes: 0 };
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return { days, hours, minutes };
}

// ── PaydayCard ────────────────────────────────────────────────

function PaydayCard() {
  const { update, paydayType: storedType, paydayDay: storedDay } = useSettingsStore();
  const employers = useEmployerStore((s) => s.employers);

  const [paydayType, setPaydayType] = useState<PaydayType>(storedType as PaydayType);
  const [paydayDay, setPaydayDay] = useState(storedDay);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const nextPayday = useMemo(
    () => calcNextPayday(paydayType, paydayDay),
    [paydayType, paydayDay, now],
  );

  const countdown = useMemo(
    () => (nextPayday ? calcCountdown(nextPayday) : null),
    [nextPayday, now],
  );

  const employerNames = employers.map((e) => e.name).join('、');

  function selectType(t: PaydayType) {
    setPaydayType(t);
    update({ paydayType: t } satisfies Partial<Settings>);
  }

  function selectDay(d: number) {
    setPaydayDay(d);
    update({ paydayDay: d } satisfies Partial<Settings>);
  }

  return (
    <View style={paydayStyles.card}>
      <Text style={paydayStyles.cardTitle}>💰 給料日カウントダウン</Text>

      {employerNames.length > 0 && (
        <Text style={paydayStyles.employers}>{employerNames}</Text>
      )}

      {/* Type selector */}
      <View style={paydayStyles.typeRow}>
        {(['none', 'weekly', 'biweekly', 'monthly'] as PaydayType[]).map((t) => (
          <Pressable
            key={t}
            style={[paydayStyles.typeBtn, paydayType === t && paydayStyles.typeBtnActive]}
            onPress={() => selectType(t)}
          >
            <Text style={[paydayStyles.typeBtnText, paydayType === t && paydayStyles.typeBtnTextActive]}>
              {t === 'none' ? '未設定' : t === 'weekly' ? '毎週' : t === 'biweekly' ? '隔週' : '月次'}
            </Text>
          </Pressable>
        ))}
      </View>

      {(paydayType === 'weekly' || paydayType === 'biweekly') && (
        <>
          <Text style={paydayStyles.label}>曜日</Text>
          <View style={paydayStyles.dowRow}>
            {DOW_OPTIONS.map((d) => (
              <Pressable
                key={d}
                style={[paydayStyles.dowBtn, paydayDay === d && paydayStyles.dowBtnActive]}
                onPress={() => selectDay(d)}
              >
                <Text style={[paydayStyles.dowText, paydayDay === d && paydayStyles.dowTextActive]}>
                  {DOW_LABELS[d]}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {paydayType === 'monthly' && (
        <>
          <Text style={paydayStyles.label}>日</Text>
          <View style={paydayStyles.dayGrid}>
            {[1, 5, 10, 15, 20, 25, 28].map((d) => (
              <Pressable
                key={d}
                style={[paydayStyles.dayBtn, paydayDay === d && paydayStyles.dayBtnActive]}
                onPress={() => selectDay(d)}
              >
                <Text style={[paydayStyles.dayText, paydayDay === d && paydayStyles.dayTextActive]}>
                  {d}日
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {paydayType !== 'none' && countdown !== null && nextPayday !== null && (
        <View style={paydayStyles.countdownBox}>
          <Text style={paydayStyles.nextLabel}>
            次の給料日: {nextPayday.getMonth() + 1}/{nextPayday.getDate()}（{DOW_LABELS[nextPayday.getDay()]}）
          </Text>
          <View style={paydayStyles.countdownRow}>
            <View style={paydayStyles.countUnit}>
              <Text style={paydayStyles.countNum}>{countdown.days}</Text>
              <Text style={paydayStyles.countUnitLabel}>日</Text>
            </View>
            <Text style={paydayStyles.countSep}>:</Text>
            <View style={paydayStyles.countUnit}>
              <Text style={paydayStyles.countNum}>{String(countdown.hours).padStart(2, '0')}</Text>
              <Text style={paydayStyles.countUnitLabel}>時間</Text>
            </View>
            <Text style={paydayStyles.countSep}>:</Text>
            <View style={paydayStyles.countUnit}>
              <Text style={paydayStyles.countNum}>{String(countdown.minutes).padStart(2, '0')}</Text>
              <Text style={paydayStyles.countUnitLabel}>分</Text>
            </View>
          </View>
        </View>
      )}

      {paydayType === 'none' && (
        <Text style={paydayStyles.hint}>給料サイクルを選択するとカウントダウンが表示されます</Text>
      )}
    </View>
  );
}

const paydayStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  employers: { fontSize: 12, color: Colors.textMuted, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8, marginTop: 4 },
  typeRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeBtnActive: { backgroundColor: Colors.primarySubtle, borderColor: Colors.primary },
  typeBtnText: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  typeBtnTextActive: { color: Colors.primary },
  dowRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  dowBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dowBtnActive: { backgroundColor: Colors.primarySubtle, borderColor: Colors.primary },
  dowText: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  dowTextActive: { color: Colors.primary },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  dayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayBtnActive: { backgroundColor: Colors.primarySubtle, borderColor: Colors.primary },
  dayText: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
  dayTextActive: { color: Colors.primary },
  countdownBox: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    alignItems: 'center',
  },
  nextLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 10 },
  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countUnit: { alignItems: 'center' },
  countNum: { ...Typography.h2, color: Colors.primary },
  countUnitLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  countSep: { ...Typography.h3, color: Colors.textMuted, marginBottom: 14 },
  hint: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 8 },
});

// ── AchievementsScreen ────────────────────────────────────────

export default function AchievementsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>実績</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <PaydayCard />

        {/* Badge placeholder – populated in Sprint 5 */}
        <View style={styles.badgePlaceholder}>
          <Text style={styles.badgePlaceholderText}>🏅</Text>
          <Text style={styles.badgePlaceholderTitle}>バッジ機能は近日公開</Text>
          <Text style={styles.badgePlaceholderDesc}>
            シフトを積み重ねるとバッジが解除されます
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  scroll: { padding: 16, paddingBottom: 32 },
  badgePlaceholder: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgePlaceholderText: { fontSize: 48, marginBottom: 12 },
  badgePlaceholderTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  badgePlaceholderDesc: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
});
