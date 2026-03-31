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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  triggerText: { fontSize: 16, color: '#111827' },
  placeholder: { fontSize: 16, color: '#9ca3af' },
  chevron: { fontSize: 20, color: '#9ca3af' },
  modal: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#111827' },
  cancel: { fontSize: 16, color: '#16a34a' },
  search: {
    margin: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 16,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#9ca3af', fontSize: 15 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
  itemSelected: { backgroundColor: '#f0fdf4' },
  itemName: { fontSize: 16, color: '#111827', marginBottom: 2 },
  itemSub: { fontSize: 13, color: '#6b7280' },
  check: { fontSize: 18, color: '#16a34a', fontWeight: '600' },
  separator: { height: 1, backgroundColor: '#f3f4f6', marginLeft: 16 },
});
