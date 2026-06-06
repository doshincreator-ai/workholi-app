import { Stack } from 'expo-router';
import { Colors } from '../../../src/constants/colors';

export default function ShiftsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="add"
        options={{ title: 'シフト追加', presentation: 'modal', headerTintColor: Colors.primary }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: 'シフト編集', presentation: 'modal', headerTintColor: Colors.primary }}
      />
    </Stack>
  );
}
