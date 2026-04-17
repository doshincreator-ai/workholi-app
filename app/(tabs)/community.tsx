import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchCompanies, type CompanyDoc } from '../../src/lib/firestoreService';
import { useAuthStore } from '../../src/store/authStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { getOrCreateUserProfile } from '../../src/lib/userService';
import { AdBanner } from '../../src/components/AdBanner';
import { HintBanner } from '../../src/components/HintBanner';
import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: '#16a34a', normal: '#f59e0b', hard: '#ef4444',
};
const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'ラク', normal: '普通', hard: 'きつい',
};

function timeAgo(timestamp: any): string | null {
  if (!timestamp) return null;
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'たった今';
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}日前`;
  if (diff < 86400 * 365) return `${Math.floor(diff / (86400 * 30))}ヶ月前`;
  return `${Math.floor(diff / (86400 * 365))}年前`;
}

function CompanyCard({ company, onPress }: { company: CompanyDoc; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardLeft}>
        <View style={styles.cardNameRow}>
          <Text style={styles.cardName}>{company.name}</Text>
          {company.isHiring && (
            <View style={styles.hiringBadge}>
              <Text style={styles.hiringText}>募集中</Text>
            </View>
          )}
        </View>
        <View style={styles.cardMeta}>
          {company.region && (
            <>
              <Ionicons name="location-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.cardRegion}> {company.region}　</Text>
            </>
          )}
          {company.jobCategory && (
            <Text style={styles.cardRegion}>{company.jobCategory}　</Text>
          )}
          <Ionicons name="people-outline" size={13} color={Colors.textSecondary} />
          <Text style={styles.cardCount}> {company.workerCount ?? 0}人</Text>
          {company.difficulty && (
            <Text style={[styles.difficultyText, { color: DIFFICULTY_COLOR[company.difficulty] }]}>
              　{DIFFICULTY_LABEL[company.difficulty]}
            </Text>
          )}
        </View>
        {(company.updatedAt || company.createdAt) && (
          <Text style={styles.cardUpdated}>
            {timeAgo(company.updatedAt ?? company.createdAt)}に更新
          </Text>
        )}
      </View>
      <View style={styles.lockBadge}>
        <Ionicons name="lock-closed-outline" size={12} color={Colors.textMuted} />
        <Text style={styles.lockText}> 詳細</Text>
      </View>
    </Pressable>
  );
}

export default function CommunityScreen() {
  const [companies, setCompanies] = useState<CompanyDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { currentCountry } = useSettingsStore();

  const regions = useMemo(() => {
    const set = new Set(companies.map((c) => c.region).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [companies]);

  const categories = useMemo(() => {
    const set = new Set(companies.map((c) => c.jobCategory).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [companies]);

  const filtered = useMemo(() => {
    let result = companies;
    if (selectedRegion) result = result.filter((c) => c.region === selectedRegion);
    if (selectedCategory) result = result.filter((c) => c.jobCategory === selectedCategory);
    // 募集中を先頭に
    return [...result].sort((a, b) => (b.isHiring ? 1 : 0) - (a.isHiring ? 1 : 0));
  }, [companies, selectedRegion, selectedCategory]);

  useEffect(() => {
    if (user) {
      getOrCreateUserProfile(user.uid, user.displayName ?? '').catch(() => {});
    }
  }, [user]);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchCompanies(currentCountry);
      setCompanies(data);
    } catch (e) {
      // オフライン時など
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, currentCountry]);

  useEffect(() => {
    setSelectedRegion(null);
    setSelectedCategory(null);
    load();
  }, [load]);

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  return (
    <SafeAreaView style={styles.container}>
      <HintBanner hintKey="community" message="職場を公開するとチケットがもらえます。チケットは企業の詳細情報（時給など）を閲覧する時に使います。" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>みんなの企業情報</Text>
        <Text style={styles.headerSub}>公開された職場の一覧</Text>
      </View>

      {!loading && regions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterBar}
          contentContainerStyle={styles.filterBarContent}
        >
          <Pressable
            style={[styles.filterChip, selectedRegion === null && styles.filterChipActive]}
            onPress={() => setSelectedRegion(null)}
          >
            <Text style={[styles.filterChipText, selectedRegion === null && styles.filterChipTextActive]}>
              すべて
            </Text>
          </Pressable>
          {regions.map((r) => (
            <Pressable
              key={r}
              style={[styles.filterChip, selectedRegion === r && styles.filterChipActive]}
              onPress={() => setSelectedRegion(selectedRegion === r ? null : r)}
            >
              <Text style={[styles.filterChipText, selectedRegion === r && styles.filterChipTextActive]}>
                {r}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      {!loading && categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterBarCategory}
          contentContainerStyle={styles.filterBarContent}
        >
          <Pressable
            style={[styles.filterChipSm, selectedCategory === null && styles.filterChipSmActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.filterChipSmText, selectedCategory === null && styles.filterChipSmTextActive]}>
              全業種
            </Text>
          </Pressable>
          {categories.map((cat) => (
            <Pressable
              key={cat}
              style={[styles.filterChipSm, selectedCategory === cat && styles.filterChipSmActive]}
              onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            >
              <Text style={[styles.filterChipSmText, selectedCategory === cat && styles.filterChipSmTextActive]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.companyId}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          renderItem={({ item }) => (
            <CompanyCard company={item} onPress={() => router.push({ pathname: `/company/${item.companyId}`, params: { country: item.country } })} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListHeaderComponent={<AdBanner />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="business-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>まだ情報がありません</Text>
              <Text style={styles.emptyHint}>雇用主を「コミュニティに公開する」にすると掲載されます</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.padding.md,
    paddingVertical: Spacing.padding.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterBar: { backgroundColor: Colors.surface, borderBottomWidth: 0 },
  filterBarCategory: { backgroundColor: Colors.surfaceElevated, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filterBarContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, flexDirection: 'row' },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: Spacing.radius.lg, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 13, color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.textInverse, fontWeight: '600' },
  filterChipSm: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Spacing.radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  filterChipSmActive: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  filterChipSmText: { fontSize: 12, color: Colors.textMuted },
  filterChipSmTextActive: { color: Colors.textInverse, fontWeight: '600' },
  list: { padding: 12, paddingBottom: 24 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radius.md,
    padding: Spacing.padding.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLeft: { flex: 1 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  hiringBadge: { backgroundColor: Colors.primaryMuted, borderRadius: Spacing.radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  hiringText: { fontSize: 11, color: Colors.primary, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  cardCount: { fontSize: 12, color: Colors.textSecondary },
  cardRegion: { fontSize: 12, color: Colors.textSecondary },
  difficultyText: { fontSize: 12, fontWeight: '600' },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Spacing.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 12,
  },
  lockText: { fontSize: 11, color: Colors.textMuted },
  cardUpdated: { fontSize: 10, color: Colors.textMuted, marginTop: 4 },
  empty: { alignItems: 'center', marginTop: 80, gap: 8 },
  emptyText: { fontSize: 16, color: Colors.textSecondary },
  emptyHint: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});
