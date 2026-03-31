import { Stack } from 'expo-router';

export default function ShiftsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="add"
        options={{ title: 'シフト追加', presentation: 'modal', headerTintColor: '#16a34a' }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: 'シフト編集', presentation: 'modal', headerTintColor: '#16a34a' }}
      />
    </Stack>
  );
}
