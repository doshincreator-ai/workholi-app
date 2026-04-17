import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useShiftStore } from '../../src/store/shiftStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { calcHours, calculateAnnualPAYE } from '../../src/utils/payCalculator';
import { COUNTRIES } from '../../src/config/countries';
import { AdBanner } from '../../src/components/AdBanner';
import { HintBanner } from '../../src/components/HintBanner';
import { Colors } from '../../src/constants/colors';
import { Typography } from '../../src/constants/typography';

const MONTHS_JP = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

function getNZTaxYear(): { start: string; end: string; label: string } {
  const now = new Date();
  // NZ tax year: 1 April – 31 March
  const baseYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return {
    start: `${baseYear}-04-01`,
    end: `${baseYear + 1}-03-31`,
    label: `${baseYear}年4月〜${baseYear + 1}年3月`,
  };
}

function getLast6Months(): { year: number; month: number; label: string }[] {
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: `${d.getMonth() + 1}月`,
    });
  }
  return result;
}

export default function ReportScreen() {
  const { shifts } = useShiftStore();
  const { currentCountry, jpyRate } = useSettingsStore();
  const countryConfig = COUNTRIES[currentCountry as keyof typeof COUNTRIES] ?? COUNTRIES.NZ;
  const currency = countryConfig.currency;
  const isNZ = currentCountry === 'NZ';
  const rate = jpyRate();

  // 現在の国 & 勤務終了済みシフトのみを対象にする
  const completedShifts = useMemo(() => {
    const now = new Date();
    return shifts.filter(
      (s) => s.country === currentCountry && new Date(`${s.date}T${s.endTime}`) <= now,
    );
  }, [shifts, currentCountry]);

  const months = useMemo(() => getLast6Months(), []);

  const monthlyData = useMemo(() => {
    return months.map((m) => {
      const prefix = `${m.year}-${String(m.month).padStart(2, '0')}`;
      const ms = completedShifts.filter((s) => s.date.startsWith(prefix));
      return {
        ...m,
        grossPay: ms.reduce((sum, s) => sum + s.grossPay, 0),
        taxAmount: ms.reduce((sum, s) => sum + s.taxAmount, 0),
        accLevy: ms.reduce((sum, s) => sum + s.accLevy, 0),
        studentLoanDeduction: ms.reduce((sum, s) => sum + s.studentLoanDeduction, 0),
        netPay: ms.reduce((sum, s) => sum + s.netPay, 0),
        totalHours: Math.round(ms.reduce((sum, s) => sum + calcHours(s.startTime, s.endTime, s.breakMinutes), 0) * 10) / 10,
        shiftCount: ms.length,
      };
    });
  }, [months, completedShifts]);

  const maxNet = Math.max(...monthlyData.map((m) => m.netPay), 1);

  const allTime = useMemo(() => {
    const hpIncludedShifts = completedShifts.filter((s) => s.holidayPayIncluded);
    const hpSeparateShifts = completedShifts.filter((s) => s.holidayPaySeparate);
    return {
      grossPay: completedShifts.reduce((s, sh) => s + sh.grossPay, 0),
      taxAmount: completedShifts.reduce((s, sh) => s + sh.taxAmount, 0),
      accLevy: completedShifts.reduce((s, sh) => s + sh.accLevy, 0),
      studentLoan: completedShifts.reduce((s, sh) => s + sh.studentLoanDeduction, 0),
      netPay: completedShifts.reduce((s, sh) => s + sh.netPay, 0),
      totalHours: completedShifts.reduce((s, sh) => s + calcHours(sh.startTime, sh.endTime, sh.breakMinutes), 0),
      shiftCount: completedShifts.length,
      hpIncludedCount: hpIncludedShifts.length,
      hpIncludedAmount: hpIncludedShifts.reduce((s, sh) => s + sh.grossPay * 8 / 108, 0),
      hpSeparateCount: hpSeparateShifts.length,
      hpSeparateAmount: hpSeparateShifts.reduce((s, sh) => s + (sh.holidayPayAmount ?? 0), 0),
    };
  }, [completedShifts]);

  const taxYearRefund = useMemo(() => {
    const ty = getNZTaxYear();
    const tyShifts = completedShifts.filter((s) => s.date >= ty.start && s.date <= ty.end);
    const totalGross = tyShifts.reduce((sum, s) => sum + s.grossPay, 0);
    const totalPaidTax = tyShifts.reduce((sum, s) => sum + s.taxAmount, 0);
    const correctTax = calculateAnnualPAYE(totalGross);
    const refund = totalPaidTax - correctTax;
    return { ...ty, totalGross, totalPaidTax, correctTax, refund, shiftCount: tyShifts.length };
  }, [completedShifts]);

  async function handleExportCSV() {
    const header = `日付,職場,開始,終了,休憩(分),総支給(${currency}),税(${currency}),手取り(${currency}),メモ\n`;
    const rows = completedShifts.map((s) =>
      [
        s.date,
        `"${s.employerName ?? ''}"`,
        s.startTime,
        s.endTime,
        s.breakMinutes,
        s.grossPay.toFixed(2),
        s.taxAmount.toFixed(2),
        s.netPay.toFixed(2),
        `"${s.memo.replace(/"/g, '""')}"`,
      ].join(',')
    ).join('\n');

    const csv = '\uFEFF' + header + rows; // BOM付きでExcel対応
    const path = FileSystem.documentDirectory + 'workholiday_export.csv';
    await FileSystem.writeAsStringAsync(path!, csv, { encoding: FileSystem.EncodingType.UTF8 });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
    } else {
      Alert.alert('エクスポート完了', `保存先: ${path}`);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <HintBanner hintKey="report" message="NZのシフトがあると、年末還付金シミュレーターで推定還付額を確認できます。" />
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* 累計サマリー */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>累計手取り合計（勤務終了分）</Text>
          <Text style={styles.totalNet}>{currency} {allTime.netPay.toFixed(2)}</Text>
          <View style={styles.totalRow}>
            <View style={styles.totalItem}>
              <Text style={styles.totalItemLabel}>シフト数</Text>
              <Text style={styles.totalItemValue}>{allTime.shiftCount}回</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalItemLabel}>総時間</Text>
              <Text style={styles.totalItemValue}>{allTime.totalHours.toFixed(1)}h</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalItemLabel}>総支給</Text>
              <Text style={styles.totalItemValue}>{currency} {allTime.grossPay.toFixed(0)}</Text>
            </View>
          </View>
        </View>

        {/* 税金内訳 */}
        <Text style={styles.sectionTitle}>累計控除内訳</Text>
        <View style={styles.taxCard}>
          {[
            { label: 'PAYE 税', value: allTime.taxAmount },
            ...(isNZ ? [{ label: 'ACC Levy', value: allTime.accLevy }] : []),
            { label: 'Student Loan', value: allTime.studentLoan },
          ].filter((r) => r.value > 0).map((row) => (
            <View key={row.label} style={styles.taxRow}>
              <Text style={styles.taxLabel}>{row.label}</Text>
              <Text style={styles.taxValue}>− {currency} {row.value.toFixed(2)}</Text>
            </View>
          ))}
          <View style={[styles.taxRow, styles.taxTotal]}>
            <Text style={styles.taxTotalLabel}>控除合計</Text>
            <Text style={styles.taxTotalValue}>
              − {currency} {(allTime.taxAmount + allTime.accLevy + allTime.studentLoan).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Holiday Pay サマリー（NZのみ） */}
        {isNZ && (allTime.hpIncludedCount > 0 || allTime.hpSeparateCount > 0) && (
          <>
            <Text style={styles.sectionTitle}>Holiday Pay 状況</Text>
            <View style={styles.taxCard}>
              {allTime.hpIncludedCount > 0 && (
                <View style={styles.taxRow}>
                  <Text style={styles.taxLabel}>時給込み（{allTime.hpIncludedCount}件）</Text>
                  <Text style={styles.taxValue}>{currency} {allTime.hpIncludedAmount.toFixed(2)}</Text>
                </View>
              )}
              {allTime.hpSeparateCount > 0 && (
                <View style={styles.taxRow}>
                  <Text style={styles.taxLabel}>別途支給（{allTime.hpSeparateCount}件）</Text>
                  <Text style={styles.taxValue}>
                    {allTime.hpSeparateAmount > 0
                      ? `${currency} ${allTime.hpSeparateAmount.toFixed(2)}`
                      : '未入力あり'}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* 月別バーチャート */}
        <Text style={styles.sectionTitle}>月別手取り（直近6ヶ月）</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartBars}>
            {monthlyData.map((m) => {
              const ratio = m.netPay / maxNet;
              return (
                <View key={`${m.year}-${m.month}`} style={styles.barCol}>
                  <Text style={styles.barValue}>
                    {m.netPay > 0 ? `${m.netPay.toFixed(0)}` : ''}
                  </Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: `${Math.max(ratio * 100, m.netPay > 0 ? 4 : 0)}%` }]} />
                  </View>
                  <Text style={styles.barLabel}>{m.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 月別テーブル */}
        <Text style={styles.sectionTitle}>月別詳細</Text>
        <View style={styles.tableCard}>
          {monthlyData.filter((m) => m.shiftCount > 0).length === 0 ? (
            <Text style={styles.emptyText}>記録がありません</Text>
          ) : (
            monthlyData.filter((m) => m.shiftCount > 0).map((m, i, arr) => (
              <View key={`${m.year}-${m.month}`}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableMonth}>{m.year}年{m.label}</Text>
                  <View style={styles.tableRight}>
                    <Text style={styles.tableNet}>{currency} {m.netPay.toFixed(2)}</Text>
                    <Text style={styles.tableSub}>{m.shiftCount}回 / {m.totalHours}h</Text>
                  </View>
                </View>
                {i < arr.length - 1 && <View style={styles.rowSep} />}
              </View>
            ))
          )}
        </View>

        {/* 年末還付金シミュレーター（NZのみ） */}
        {isNZ && (
          <>
            <Text style={styles.sectionTitle}>年末還付金シミュレーター</Text>
            <View style={styles.refundCard}>
              <Text style={styles.refundYear}>{taxYearRefund.label}</Text>
              {taxYearRefund.shiftCount === 0 ? (
                <Text style={styles.refundEmpty}>この年度のシフト記録がありません</Text>
              ) : (
                <>
                  <View style={styles.refundRow}>
                    <Text style={styles.refundLabel}>総支給額</Text>
                    <Text style={styles.refundValue}>NZD {taxYearRefund.totalGross.toFixed(2)}</Text>
                  </View>
                  <View style={styles.refundRow}>
                    <Text style={styles.refundLabel}>納付済み PAYE 税</Text>
                    <Text style={styles.refundValue}>NZD {taxYearRefund.totalPaidTax.toFixed(2)}</Text>
                  </View>
                  <View style={styles.refundRow}>
                    <Text style={styles.refundLabel}>正確な税額（年収ベース）</Text>
                    <Text style={styles.refundValue}>NZD {taxYearRefund.correctTax.toFixed(2)}</Text>
                  </View>
                  <View style={styles.refundResultRow}>
                    <Text style={styles.refundResultLabel}>
                      {taxYearRefund.refund >= 0 ? '推定還付金額' : '推定追加納付'}
                    </Text>
                    <Text style={[
                      styles.refundResultValue,
                      taxYearRefund.refund >= 0 ? styles.refundPositive : styles.refundNegative,
                    ]}>
                      {taxYearRefund.refund >= 0 ? '+' : ''}NZD {Math.abs(taxYearRefund.refund).toFixed(2)}
                    </Text>
                  </View>
                  <Text style={styles.refundNote}>
                    {taxYearRefund.refund > 0
                      ? 'IRD（ird.govt.nz）から確定申告（IR3）を提出すると還付を受け取れる可能性があります。'
                      : taxYearRefund.refund < 0
                      ? '追加納付が必要になる可能性があります。IRD（ird.govt.nz）で確認してください。'
                      : '納付済み税額は正確な税額と一致しています。'}
                  </Text>
                  <Text style={styles.refundDisclaimer}>
                    ※ 税コード M のシフトのみ年換算計算済み。二次収入・その他控除は含みません。参考値としてご利用ください。
                  </Text>
                </>
              )}
            </View>
          </>
        )}

        {/* CSV エクスポート */}
        <Pressable style={styles.exportBtn} onPress={handleExportCSV}>
          <Text style={styles.exportBtnText}>📄 CSV エクスポート</Text>
        </Pressable>

        <AdBanner />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 40 },

  totalCard: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 20, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  totalLabel: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  totalNet: { ...Typography.monoLarge, color: Colors.primary, marginBottom: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalItem: { alignItems: 'center' },
  totalItemLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 2 },
  totalItemValue: { ...Typography.monoSmall, color: Colors.textPrimary },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },

  taxCard: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  taxRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  taxLabel: { fontSize: 14, color: Colors.textSecondary },
  taxValue: { fontSize: 14, color: Colors.textPrimary },
  taxTotal: { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 4, paddingTop: 10 },
  taxTotalLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  taxTotalValue: { ...Typography.monoSmall, color: Colors.negative },

  chartCard: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 140, gap: 6 },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barValue: { fontSize: 9, color: Colors.textMuted, marginBottom: 2, textAlign: 'center' },
  barTrack: { flex: 1, width: '70%', justifyContent: 'flex-end', maxHeight: 100 },
  barFill: { backgroundColor: Colors.primary, borderRadius: 4, width: '100%' },
  barLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },

  tableCard: {
    backgroundColor: Colors.surface, borderRadius: 14, overflow: 'hidden', marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  tableRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 14,
  },
  tableMonth: { fontSize: 15, color: Colors.textSecondary, fontWeight: '500' },
  tableRight: { alignItems: 'flex-end' },
  tableNet: { ...Typography.monoSmall, color: Colors.primary },
  tableSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  rowSep: { height: 1, backgroundColor: Colors.borderSubtle, marginHorizontal: 14 },
  emptyText: { color: Colors.textMuted, textAlign: 'center', padding: 24 },

  refundCard: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  refundYear: { fontSize: 13, color: Colors.textMuted, marginBottom: 12 },
  refundEmpty: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', paddingVertical: 8 },
  refundRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  refundLabel: { fontSize: 13, color: Colors.textSecondary },
  refundValue: { fontSize: 13, color: Colors.textPrimary },
  refundResultRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 6, paddingTop: 10, marginBottom: 10,
  },
  refundResultLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  refundResultValue: { fontSize: 20, fontWeight: '800' },
  refundPositive: { color: Colors.positive },
  refundNegative: { color: Colors.negative },
  refundNote: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17, marginBottom: 6 },
  refundDisclaimer: { fontSize: 11, color: Colors.textMuted, lineHeight: 15 },

  exportBtn: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  exportBtnText: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
});
