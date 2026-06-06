import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useEmployerStore } from '../../../src/store/employerStore';
import { EmployerForm } from '../../../src/components/EmployerForm';
import { Colors } from '../../../src/constants/colors';
import { FontSize } from '../../../src/constants/typography';

export default function EditEmployerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const employer = useEmployerStore((s) => s.getById(Number(id)));

  if (!employer) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>雇用主が見つかりません</Text>
      </View>
    );
  }

  return <EmployerForm existing={employer} />;
}

const styles = StyleSheet.create({
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: Colors.textSecondary, fontSize: FontSize.bodyLarge },
});
