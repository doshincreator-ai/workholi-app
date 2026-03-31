import { Stack } from 'expo-router';

export default function EmployersLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="add"
        options={{ title: '雇用主を追加', presentation: 'modal', headerTintColor: '#16a34a' }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: '雇用主を編集', presentation: 'modal', headerTintColor: '#16a34a' }}
      />
    </Stack>
  );
}
