import { useState, useEffect } from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const AD_UNIT_ID = __DEV__
  ? TestIds.REWARDED
  : Platform.select({
      android: 'ca-app-pub-8389237149068331/REWARDED_AD_UNIT_ID', // TODO: 本番IDに差し替え
      ios: TestIds.REWARDED,
      default: TestIds.REWARDED,
    });

interface Props {
  onRewarded: () => void;
}

export function RewardedAdButton({ onRewarded }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ad, setAd] = useState<RewardedAd | null>(null);

  useEffect(() => {
    loadAd();
  }, []);

  function loadAd() {
    const rewarded = RewardedAd.createForAdRequest(AD_UNIT_ID!, {
      requestNonPersonalizedAdsOnly: true,
    });
    const unsubLoad = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setLoaded(true);
      setLoading(false);
    });
    const unsubEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      onRewarded();
    });
    rewarded.load();
    setAd(rewarded);
    return () => { unsubLoad(); unsubEarned(); };
  }

  function handlePress() {
    if (!loaded || !ad) return;
    setLoaded(false);
    ad.show();
  }

  return (
    <Pressable
      style={[styles.btn, (!loaded) && styles.btnDisabled]}
      onPress={handlePress}
      disabled={!loaded}
    >
      {loading ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <Ionicons name="play-circle-outline" size={18} color={loaded ? Colors.primary : Colors.textSecondary} />
      )}
      <Text style={[styles.text, !loaded && styles.textDisabled]}>
        {loaded ? '広告を見てチケット+1' : '広告を読み込み中...'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: Colors.primary, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.primarySubtle,
  },
  btnDisabled: { borderColor: Colors.border, backgroundColor: Colors.surface },
  text: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  textDisabled: { color: Colors.textSecondary },
});
