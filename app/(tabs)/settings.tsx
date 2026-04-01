import {
  View,
  Text,
  TextInput,
  Switch,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../../src/store/settingsStore';
import { useAuthStore } from '../../src/store/authStore';
import { getUserProfile } from '../../src/lib/userService';
import { COUNTRIES } from '../../src/config/countries';

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SettingRow({ label, hint, children }: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const { currentCountry, nzdJpyRate, audJpyRate, useStudentLoan, studentLoanRate, update } = useSettingsStore();
  const countryConfig = COUNTRIES[currentCountry as keyof typeof COUNTRIES] ?? COUNTRIES.NZ;
  const isNZ = currentCountry === 'NZ';
  const isAU = currentCountry === 'AU';
  const currentRate = isAU ? audJpyRate : nzdJpyRate;
  const currency = countryConfig.currency;
  const { user, logout } = useAuthStore();
  const [tickets, setTickets] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      getUserProfile(user.uid).then((p) => setTickets(p?.tickets ?? 0)).catch(() => {});
    }
  }, [user]);

  async function handleLogout() {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト', style: 'destructive', onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  }

  const [rateInput, setRateInput] = useState(String(currentRate));
  const [slRateInput, setSlRateInput] = useState(String(Math.round(studentLoanRate * 100)));

  useEffect(() => {
    setRateInput(String(isAU ? audJpyRate : nzdJpyRate));
  }, [currentCountry, nzdJpyRate, audJpyRate]);

  function commitRate() {
    const val = parseFloat(rateInput);
    if (isNaN(val) || val <= 0) {
      Alert.alert('入力エラー', '正しい為替レートを入力してください');
      setRateInput(String(currentRate));
      return;
    }
    if (isAU) {
      update({ audJpyRate: val });
    } else {
      update({ nzdJpyRate: val });
    }
  }

  function commitSlRate() {
    const pct = parseFloat(slRateInput);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      Alert.alert('入力エラー', '0〜100の値を入力してください');
      setSlRateInput(String(Math.round(studentLoanRate * 100)));
      return;
    }
    update({ studentLoanRate: pct / 100 });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>設定</Text>

        {/* 為替レート */}
        <SectionHeader title="為替レート" />
        <View style={styles.card}>
          <SettingRow
            label={`${currency} / JPY`}
            hint="手取りの円換算に使用します"
          >
            <View style={styles.rateInputWrap}>
              <TextInput
                style={styles.rateInput}
                value={rateInput}
                onChangeText={setRateInput}
                onBlur={commitRate}
                onSubmitEditing={commitRate}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
              <Text style={styles.rateUnit}>¥</Text>
            </View>
          </SettingRow>

          <View style={styles.rowSep} />

          <View style={styles.ratePreview}>
            <Text style={styles.ratePreviewText}>
              {currency} 100 = ¥{Math.round(100 * currentRate).toLocaleString()}
            </Text>
            <Pressable
              onPress={() => Linking.openURL(
                isAU
                  ? 'https://www.google.com/search?q=AUD+JPY'
                  : 'https://www.google.com/search?q=NZD+JPY'
              )}
            >
              <Text style={styles.rateLink}>現在レートを確認 ›</Text>
            </Pressable>
          </View>
        </View>

        {/* 税・控除（NZ のみ） */}
        {isNZ && (
          <>
            <SectionHeader title="税・控除" />
            <View style={styles.card}>
              <SettingRow
                label="Student Loan 控除"
                hint="学生ローン返済中の場合にON"
              >
                <Switch
                  value={useStudentLoan}
                  onValueChange={(v) => update({ useStudentLoan: v })}
                  trackColor={{ true: '#16a34a' }}
                />
              </SettingRow>

              {useStudentLoan && (
                <>
                  <View style={styles.rowSep} />
                  <SettingRow
                    label="控除率"
                    hint="通常は 12%（IRD指定の場合は変更）"
                  >
                    <View style={styles.rateInputWrap}>
                      <TextInput
                        style={styles.rateInput}
                        value={slRateInput}
                        onChangeText={setSlRateInput}
                        onBlur={commitSlRate}
                        onSubmitEditing={commitSlRate}
                        keyboardType="number-pad"
                        returnKeyType="done"
                      />
                      <Text style={styles.rateUnit}>%</Text>
                    </View>
                  </SettingRow>
                </>
              )}
            </View>
          </>
        )}

        {/* 税率表 */}
        {isNZ && (
          <>
            <SectionHeader title="NZ 所得税率（2025年4月〜）" />
            <View style={styles.card}>
              {[
                { range: '$0 〜 $15,600', rate: '10.5%' },
                { range: '$15,601 〜 $53,500', rate: '17.5%' },
                { range: '$53,501 〜 $78,100', rate: '30%' },
                { range: '$78,101 〜 $180,000', rate: '33%' },
                { range: '$180,001 以上', rate: '39%' },
              ].map((row, i, arr) => (
                <View key={row.range}>
                  <View style={styles.taxTableRow}>
                    <Text style={styles.taxRange}>{row.range}</Text>
                    <Text style={styles.taxRate}>{row.rate}</Text>
                  </View>
                  {i < arr.length - 1 && <View style={styles.rowSep} />}
                </View>
              ))}
              <View style={styles.rowSep} />
              <View style={styles.taxTableRow}>
                <Text style={[styles.taxRange, { color: '#6b7280' }]}>ACC Levy</Text>
                <Text style={[styles.taxRate, { color: '#6b7280' }]}>1.67%</Text>
              </View>
            </View>
          </>
        )}

        {isAU && (
          <>
            <SectionHeader title="AU ワーホリ税率" />
            <View style={styles.card}>
              {[
                { range: '$0 〜 $45,000', rate: '15%（WHV）' },
                { range: '$45,001 〜 $135,000', rate: '32.5%' },
                { range: '$135,001 〜 $190,000', rate: '37%' },
                { range: '$190,001 以上', rate: '45%' },
              ].map((row, i, arr) => (
                <View key={row.range}>
                  <View style={styles.taxTableRow}>
                    <Text style={styles.taxRange}>{row.range}</Text>
                    <Text style={styles.taxRate}>{row.rate}</Text>
                  </View>
                  {i < arr.length - 1 && <View style={styles.rowSep} />}
                </View>
              ))}
              <View style={styles.rowSep} />
              <View style={styles.taxTableRow}>
                <Text style={[styles.taxRange, { color: '#6b7280' }]}>Superannuation（雇用主負担）</Text>
                <Text style={[styles.taxRate, { color: '#6b7280' }]}>11.5%</Text>
              </View>
            </View>
          </>
        )}

        {/* アプリ情報 */}
        <SectionHeader title="アプリ情報" />
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>バージョン</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.rowSep} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>対応年度</Text>
            <Text style={styles.infoValue}>2025 / 2026</Text>
          </View>
          <View style={styles.rowSep} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>最低賃金</Text>
            <Text style={styles.infoValue}>NZD 23.95/h</Text>
          </View>
          <View style={styles.rowSep} />
          <Pressable style={styles.infoRow} onPress={() => router.push('/privacy')}>
            <Text style={styles.infoLabel}>プライバシーポリシー</Text>
            <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
          </Pressable>
          <View style={styles.rowSep} />
          <Pressable style={styles.infoRow} onPress={() => router.push('/terms')}>
            <Text style={styles.infoLabel}>利用規約</Text>
            <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
          </Pressable>
        </View>

        {/* アカウント */}
        <SectionHeader title="アカウント" />
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ログイン中</Text>
            <Text style={styles.infoValue}>{user?.displayName ?? user?.email}</Text>
          </View>
          <View style={styles.rowSep} />
          <View style={styles.infoRow}>
            <View>
              <Text style={styles.infoLabel}>チケット残数</Text>
              <Text style={styles.rowHint}>シフト共有で+1枚獲得</Text>
            </View>
            <View style={styles.ticketBadge}>
              <Text style={styles.ticketBadgeText}>
                {tickets === null ? '...' : `${tickets}枚`}
              </Text>
            </View>
          </View>
          <View style={styles.rowSep} />
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>ログアウト</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>
          ※ 給与計算はあくまで参考値です。正確な税額は IRD またはお勤め先の給与担当にご確認ください。
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 20 },

  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    gap: 12,
  },
  rowLeft: { flex: 1 },
  rowLabel: { fontSize: 15, color: '#111827', fontWeight: '500' },
  rowHint: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  rowSep: { height: 1, backgroundColor: '#f3f4f6' },

  rateInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#f9fafb',
  },
  rateInput: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    paddingVertical: 8,
    minWidth: 60,
    textAlign: 'right',
  },
  rateUnit: { fontSize: 15, color: '#6b7280', marginLeft: 4 },

  ratePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f0fdf4',
  },
  ratePreviewText: { fontSize: 14, color: '#15803d', fontWeight: '600' },
  rateLink: { fontSize: 13, color: '#16a34a' },

  taxTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  taxRange: { fontSize: 14, color: '#374151' },
  taxRate: { fontSize: 14, fontWeight: '700', color: '#111827' },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoLabel: { fontSize: 14, color: '#6b7280' },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '500' },

  footer: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 24,
    lineHeight: 18,
    textAlign: 'center',
  },
  logoutBtn: {
    padding: 14,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 15,
    color: '#ef4444',
    fontWeight: '600',
  },
  ticketBadge: {
    backgroundColor: '#f0fdf4', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  ticketBadgeText: { fontSize: 16, fontWeight: '700', color: '#16a34a' },
});
