import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  hintKey: string;
  message: string;
}

const DURATION = 5000;

export function HintBanner({ hintKey, message }: Props) {
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(`hint_${hintKey}`).then((val) => {
      if (!val) setVisible(true);
    });
  }, [hintKey]);

  useEffect(() => {
    if (!visible) return;
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    timerRef.current = setTimeout(() => dismiss(), DURATION);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [visible]);

  function dismiss() {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(translateY, { toValue: -80, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      AsyncStorage.setItem(`hint_${hintKey}`, '1');
    });
  }

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
      <Ionicons name="bulb-outline" size={16} color="#16a34a" style={styles.icon} />
      <Text style={styles.message}>{message}</Text>
      <Pressable onPress={dismiss} hitSlop={8}>
        <Ionicons name="close" size={16} color="#6b7280" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderBottomWidth: 1,
    borderBottomColor: '#bbf7d0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  icon: { flexShrink: 0 },
  message: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
  },
});
