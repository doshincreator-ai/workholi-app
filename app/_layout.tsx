import '../global.css';
import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { ShiftToast } from '../src/components/ShiftToast';
import { initDatabase } from '../src/db/database';
import { useSettingsStore } from '../src/store/settingsStore';
import { useEmployerStore } from '../src/store/employerStore';
import { useShiftStore } from '../src/store/shiftStore';
import { useAuthStore } from '../src/store/authStore';
import { useGoalStore } from '../src/store/goalStore';
import { recordWorker, toCompanyId } from '../src/lib/firestoreService';

export default function RootLayout() {
  const loadSettings = useSettingsStore((s) => s.load);
  const loadEmployers = useEmployerStore((s) => s.load);
  const loadShifts = useShiftStore((s) => s.load);
  const loadGoals = useGoalStore((s) => s.load);
  const { user, initialized, init } = useAuthStore();
  const segments = useSegments();

  useEffect(() => {
    initDatabase();
    const unsubscribe = init();
    loadSettings();
    loadEmployers();
    loadShifts();
    loadGoals();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const inAuthScreen = segments[0] === 'login' || segments[0] === 'register';
    if (!user && !inAuthScreen) {
      router.replace('/login');
    } else if (user && inAuthScreen) {
      router.replace('/');
    }
  }, [user, initialized, segments]);

  // オフライン時に失敗した workerCount の再同期
  useEffect(() => {
    if (!user) return;
    const employers = useEmployerStore.getState().employers;
    const shifts = useShiftStore.getState().shifts;
    const uid = user.uid;
    employers
      .filter((e) => e.isShared)
      .forEach((e) => {
        if (shifts.some((s) => s.employerId === e.id)) {
          const fId = e.firestoreId ?? toCompanyId(e.name);
          recordWorker(fId, uid, e.country).catch(() => {});
        }
      });
  }, [user]);

  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0e1117' }}>
        <ActivityIndicator size="large" color="#39d98a" />
      </View>
    );
  }

  return (
    <>
    <ShiftToast />
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen
        name="company/[id]"
        options={{
          headerShown: true,
          title: '企業詳細',
          headerStyle: { backgroundColor: '#12151f' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
    </Stack>
    </>
  );
}
