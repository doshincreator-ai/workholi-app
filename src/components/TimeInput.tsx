import {
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

// 15分刻みで 00:00〜23:45 を生成
const TIMES: string[] = [];
for (let h = 0; h < 24; h++) {
  for (const m of [0, 15, 30, 45]) {
    TIMES.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

interface Props {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

export function TimeInput({ label, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const flatRef = useRef<FlatList>(null);

  function handleOpen() {
    setOpen(true);
    // 現在値の近くにスクロール
    const idx = TIMES.indexOf(value);
    if (idx >= 0) {
      setTimeout(() => {
        flatRef.current?.scrollToIndex({ index: idx, animated: false, viewPosition: 0.5 });
      }, 50);
    }
  }

  function handleSelect(time: string) {
    onChange(time);
    setOpen(false);
  }

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <Pressable style={styles.btn} onPress={handleOpen}>
          <Text style={styles.btnText}>{value || '--:--'}</Text>
          <Text style={styles.chevron}>▾</Text>
        </Pressable>
      </View>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label}の時間</Text>
            <Pressable onPress={() => setOpen(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>キャンセル</Text>
            </Pressable>
          </View>
          <FlatList
            ref={flatRef}
            data={TIMES}
            keyExtractor={(t) => t}
            getItemLayout={(_, index) => ({ length: 56, offset: 56 * index, index })}
            renderItem={({ item }) => {
              const selected = item === value;
              return (
                <Pressable
                  style={[styles.item, selected && styles.itemSelected]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={[styles.itemText, selected && styles.itemTextSelected]}>
                    {item}
                  </Text>
                  {selected && <Text style={styles.check}>✓</Text>}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  label: { fontSize: 13, color: '#6b7280', marginBottom: 6 },
  btn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btnText: { fontSize: 20, fontWeight: '600', color: '#111827' },
  chevron: { fontSize: 14, color: '#9ca3af' },

  modal: { flex: 1, backgroundColor: '#f9fafb' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  cancelBtn: { padding: 4 },
  cancelText: { fontSize: 15, color: '#6b7280' },

  item: {
    height: 56,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#fff',
  },
  itemSelected: { backgroundColor: '#f0fdf4' },
  itemText: { fontSize: 20, color: '#374151' },
  itemTextSelected: { color: '#16a34a', fontWeight: '700' },
  check: { fontSize: 18, color: '#16a34a' },
});
