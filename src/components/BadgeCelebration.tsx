import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { BADGE_DEFS, type BadgeId } from '../db/badges';

interface Props {
  badgeId: BadgeId;
  onDone: () => void;
}

export function BadgeCelebration({ badgeId, onDone }: Props) {
  const def = BADGE_DEFS.find((b) => b.id === badgeId);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(2000, withTiming(0, { duration: 400 }, (finished) => {
        if (finished) runOnJS(onDone)();
      })),
    );
    scale.value = withSequence(
      withTiming(1.1, { duration: 300 }),
      withTiming(1, { duration: 150 }),
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!def) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={[styles.card, animStyle]}>
        <Text style={styles.emoji}>{def.emoji}</Text>
        <Text style={styles.title}>バッジ解除！</Text>
        <Text style={styles.name}>{def.name}</Text>
        <Text style={styles.desc}>{def.description}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radius.lg,
    padding: Spacing.padding.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    minWidth: 220,
  },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 6 },
  name: { ...Typography.h4, color: Colors.textPrimary, marginBottom: 4, textAlign: 'center' },
  desc: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
});
