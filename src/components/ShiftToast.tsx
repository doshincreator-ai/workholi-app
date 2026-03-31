import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore } from '../store/toastStore';

const DURATION = 3500;

export function ShiftToast() {
  const { visible, earning, message, isMilestone, milestoneTitle, hide } = useToastStore();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      if (timerRef.current) clearTimeout(timerRef.current);
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      timerRef.current = setTimeout(() => dismiss(), DURATION);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [visible, earning]);

  function dismiss() {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => hide());
  }

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 12, opacity, transform: [{ translateY }] },
        isMilestone && styles.containerMilestone,
      ]}
    >
      <Pressable onPress={dismiss} style={styles.inner}>
        {isMilestone && (
          <Text style={styles.milestoneTitle}>{milestoneTitle}</Text>
        )}
        <Text style={styles.earning}>{earning}</Text>
        <Text style={styles.message}>{message}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  containerMilestone: {
    borderLeftColor: '#f59e0b',
    backgroundColor: '#1c1a10',
  },
  inner: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  milestoneTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#f59e0b',
    marginBottom: 2,
  },
  earning: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  message: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
});
