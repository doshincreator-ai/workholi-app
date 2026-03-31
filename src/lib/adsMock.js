// react-native-google-mobile-ads のモック
// Expo Go（カスタムビルドなし）では native module が使えないため null を返す
const React = require('react');

module.exports = {
  BannerAd: () => null,
  BannerAdSize: {
    ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
    BANNER: 'BANNER',
    FULL_BANNER: 'FULL_BANNER',
    LARGE_BANNER: 'LARGE_BANNER',
    LEADERBOARD: 'LEADERBOARD',
    MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
  },
  TestIds: {
    BANNER: 'ca-app-pub-3940256099942544/6300978111',
    INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
    REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  },
  MobileAds: () => ({
    initialize: () => Promise.resolve([]),
    setRequestConfiguration: () => Promise.resolve(),
  }),
  InterstitialAd: { createForAdRequest: () => ({ load: () => {}, show: () => {} }) },
  RewardedAd: { createForAdRequest: () => ({ load: () => {}, show: () => {} }) },
  AdEventType: {},
  RewardedAdEventType: {},
};
