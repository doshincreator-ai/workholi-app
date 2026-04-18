import { useLocalSearchParams, router } from 'expo-router';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useShiftStore } from '../../../src/store/shiftStore';
import { ShiftForm } from '../../../src/components/ShiftForm';
import { Colors } from '../../../src/constants/colors';
import { FontSize } from '../../../src/constants/typography';
import { Spacing } from '../../../src/constants/spacing';

export default function EditShiftScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shift = useShiftStore((s) => s.shifts.find((sh) => sh.id === Number(id)));
  const removeShift = useShiftStore((s) => s.remove);

  if (!shift) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>シフトが見つかりません</Text>
      </View>
    );
  }

  function handleDelete() {
    const numericId = Number(id);
    if (!id || isNaN(numericId) || !shift || numericId !== shift.id) return;
    Alert.alert('シフトを削除', 'このシフトを削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除', style: 'destructive', onPress: () => {
          removeShift(numericId);
          router.back();
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <ShiftForm existing={shift} />
      <Pressable style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>このシフトを削除する</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: Colors.textSecondary, fontSize: FontSize.lg },
  deleteBtn: {
    marginHorizontal: 16,
    marginBottom: 32,
    padding: Spacing.padding.sm,
    alignItems: 'center',
    borderRadius: Spacing.radius.md,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
    backgroundColor: Colors.primarySubtle,
  },
  deleteBtnText: { color: Colors.negative, fontWeight: '600', fontSize: FontSize.md },
});
