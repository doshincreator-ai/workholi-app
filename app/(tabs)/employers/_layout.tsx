import { Stack } from 'expo-router';
import { Colors } from '../../../src/constants/colors';

export default function EmployersLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="add"
        options={{ title: '雇用主を追加', presentation: 'modal', headerTintColor: Colors.primary }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: '雇用主を編集', presentation: 'modal', headerTintColor: Colors.primary }}
      />
    </Stack>
  );
}
