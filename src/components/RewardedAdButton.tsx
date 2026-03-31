import { useState, useEffect } from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import { Ionicons } from '@expo/vector-icons';

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
        <ActivityIndicator size="small" color="#16a34a" />
      ) : (
        <Ionicons name="play-circle-outline" size={18} color={loaded ? '#16a34a' : '#9ca3af'} />
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
    borderWidth: 1, borderColor: '#16a34a', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#f0fdf4',
  },
  btnDisabled: { borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  text: { fontSize: 14, fontWeight: '600', color: '#16a34a' },
  textDisabled: { color: '#9ca3af' },
});
