import {
  Modal,
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useState } from 'react';
import { useEmployerStore } from '../store/employerStore';
import { useSettingsStore } from '../store/settingsStore';
import { COUNTRIES } from '../config/countries';
import type { Employer } from '../types';
import { Colors } from '../constants/colors';

interface Props {
  selectedId: number | null;
  onSelect: (employer: Employer) => void;
}

export function EmployerPicker({ selectedId, onSelect }: Props) {
  const employers = useEmployerStore((s) => s.employers);
  const { currentCountry } = useSettingsStore();
  const countryConfig = COUNTRIES[currentCountry as keyof typeof COUNTRIES] ?? COUNTRIES.NZ;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const countryEmployers = employers.filter((e) => e.country === currentCountry);
  const selected = countryEmployers.find((e) => e.id === selectedId);
  const filtered = countryEmployers.filter((e) =>
    e.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={selected ? styles.triggerText : styles.placeholder}>
          {selected ? selected.name : '雇用主を選択'}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>雇用主を選択</Text>
            <Pressable onPress={() => setOpen(false)}>
              <Text style={styles.cancel}>キャンセル</Text>
            </Pressable>
          </View>

          <TextInput
            style={styles.search}
            placeholder="検索..."
            value={query}
            onChangeText={setQuery}
            clearButtonMode="while-editing"
          />

          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>雇用主が見つかりません</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(e) => String(e.id)}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.item, item.id === selectedId && styles.itemSelected]}
                  onPress={() => {
                    onSelect(item);
                    setOpen(false);
                    setQuery('');
                  }}
                >
                  <View>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSub}>
                      {countryConfig.currency} {item.hourlyRate.toFixed(2)}/h
                      {currentCountry === 'NZ' ? ` · ${item.taxCode}` : ''}
                    </Text>
                  </View>
                  {item.id === selectedId && (
                    <Text style={styles.check}>✓</Text>
                  )}
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  triggerText: { fontSize: 16, color: Colors.textPrimary },
  placeholder: { fontSize: 16, color: Colors.textMuted },
  chevron: { fontSize: 20, color: Colors.textMuted },
  modal: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.textPrimary },
  cancel: { fontSize: 16, color: Colors.primary },
  search: {
    margin: 12,
    padding: 12,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: 15 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.surface,
  },
  itemSelected: { backgroundColor: Colors.primarySubtle },
  itemName: { fontSize: 16, color: Colors.textPrimary, marginBottom: 2 },
  itemSub: { fontSize: 13, color: Colors.textSecondary },
  check: { fontSize: 18, color: Colors.positive, fontWeight: '600' },
  separator: { height: 1, backgroundColor: Colors.borderSubtle, marginLeft: 16 },
});
