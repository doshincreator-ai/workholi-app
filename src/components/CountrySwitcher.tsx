import { View, Text, Pressable, Modal, FlatList, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../store/settingsStore';
import { COUNTRY_LIST } from '../config/countries';
import { Colors } from '../constants/colors';

export function CountrySwitcher() {
  const { currentCountry, update } = useSettingsStore();
  const [open, setOpen] = useState(false);

  const current = COUNTRY_LIST.find((c) => c.code === currentCountry) ?? COUNTRY_LIST[0];

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={styles.flag}>{current.flag}</Text>
        <Text style={styles.name}>{current.name}</Text>
        <Ionicons name="chevron-down" size={14} color={Colors.primary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>国を選択</Text>
            <FlatList
              data={COUNTRY_LIST}
              keyExtractor={(c) => c.code}
              renderItem={({ item }) => {
                const active = item.code === currentCountry;
                return (
                  <Pressable
                    style={[styles.item, active && styles.itemActive]}
                    onPress={() => {
                      update({ currentCountry: item.code });
                      setOpen(false);
                    }}
                  >
                    <Text style={styles.itemFlag}>{item.flag}</Text>
                    <View style={styles.itemContent}>
                      <Text style={[styles.itemName, active && styles.itemNameActive]}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemCurrency}>{item.currency}</Text>
                    </View>
                    {active && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                  </Pressable>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primaryMuted,
    backgroundColor: Colors.primarySubtle,
  },
  flag: { fontSize: 16 },
  name: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    width: 280,
    paddingTop: 20,
    paddingBottom: 8,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  itemActive: { backgroundColor: Colors.primarySubtle },
  itemContent: { flex: 1 },
  itemFlag: { fontSize: 26 },
  itemName: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  itemNameActive: { color: Colors.primary },
  itemCurrency: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  sep: { height: 1, backgroundColor: Colors.border, marginHorizontal: 20 },
});
