import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEmployerStore } from '../../../src/store/employerStore';
import { useShiftStore } from '../../../src/store/shiftStore';
import { useSettingsStore } from '../../../src/store/settingsStore';
import { getShiftsByEmployer } from '../../../src/db/shifts';
import { COUNTRIES } from '../../../src/config/countries';
import type { Employer } from '../../../src/types';
import { Colors } from '../../../src/constants/colors';

function EmployerCard({ employer, onPress, onDelete }: {
  employer: Employer;
  onPress: () => void;
  onDelete: () => void;
}) {
  const shiftCount = getShiftsByEmployer(employer.id).length;
  const canReview = employer.isShared && shiftCount >= 3 && !employer.jobDescription && !employer.englishLevel && !employer.publicMemo;
  const countryConfig = COUNTRIES[employer.country as keyof typeof COUNTRIES] ?? COUNTRIES.NZ;
  const isNZ = employer.country === 'NZ';

  return (
    <Pressable style={styles.card} onPress={onPress} onLongPress={onDelete}>
      <View style={styles.cardIcon}>
        <Text style={styles.cardIconText}>
          {employer.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{employer.name}</Text>
        <View style={styles.cardMeta}>
          {isNZ && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{employer.taxCode}</Text>
            </View>
          )}
          <Text style={styles.cardRate}>{countryConfig.currency} {employer.hourlyRate.toFixed(2)}/h</Text>
          {employer.irdNumber ? (
            <Text style={styles.cardIrd}>{countryConfig.taxNumberLabel} {employer.irdNumber}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardShiftCount}>{shiftCount}</Text>
        <Text style={styles.cardShiftLabel}>シフト</Text>
      </View>
      {canReview && (
        <View style={styles.reviewBanner}>
          <Ionicons name="pencil-outline" size={12} color={Colors.primary} />
          <Text style={styles.reviewBannerText}>レビューを更新できます</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function EmployersScreen() {
  const employers = useEmployerStore((s) => s.employers);
  const removeEmployer = useEmployerStore((s) => s.remove);
  const shifts = useShiftStore((s) => s.shifts);
  const { currentCountry } = useSettingsStore();

  const countryEmployers = employers.filter((e) => e.country === currentCountry);

  function handleDelete(employer: Employer) {
    const hasShifts = shifts.some((s) => s.employerId === employer.id);
    const message = hasShifts
      ? `「${employer.name}」を削除すると、関連するシフト記録もすべて削除されます。よろしいですか？`
      : `「${employer.name}」を削除しますか？`;
    Alert.alert('雇用主を削除', message, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => removeEmployer(employer.id) },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>雇用主</Text>
        <Pressable style={styles.addBtn} onPress={() => router.push('/employers/add')}>
          <Text style={styles.addBtnText}>+ 追加</Text>
        </Pressable>
      </View>

      <FlatList
        data={countryEmployers}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <EmployerCard
            employer={item}
            onPress={() => router.push(`/employers/${item.id}`)}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏢</Text>
            <Text style={styles.emptyText}>雇用主がいません</Text>
            <Text style={styles.emptyHint}>「+ 追加」で職場を登録しましょう</Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push('/employers/add')}>
              <Text style={styles.emptyBtnText}>雇用主を追加する</Text>
            </Pressable>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addBtnText: { color: Colors.textInverse, fontWeight: '600', fontSize: 15 },
  list: { padding: 12, paddingBottom: 24 },

  // カード
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconText: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  cardBody: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  badge: {
    backgroundColor: Colors.primarySubtle,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  cardRate: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  cardIrd: { fontSize: 12, color: Colors.textSecondary },
  cardRight: { alignItems: 'center', minWidth: 40 },
  cardShiftCount: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  cardShiftLabel: { fontSize: 11, color: Colors.textSecondary },
  reviewBanner: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: Colors.primarySubtle, paddingVertical: 5,
    borderTopWidth: 1, borderTopColor: Colors.primaryMuted,
  },
  reviewBannerText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },

  // 空状態
  empty: { alignItems: 'center', marginTop: 80, gap: 8 },
  emptyIcon: { fontSize: 48, marginBottom: 4 },
  emptyText: { fontSize: 17, color: Colors.textMuted, fontWeight: '600' },
  emptyHint: { fontSize: 14, color: Colors.textMuted, marginBottom: 8 },
  emptyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 4,
  },
  emptyBtnText: { color: Colors.textInverse, fontWeight: '600', fontSize: 15 },
});
