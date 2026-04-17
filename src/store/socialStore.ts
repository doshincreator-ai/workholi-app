import { create } from 'zustand';
import type { ActivityItem, RankingEntry } from '../lib/socialService';
import {
  subscribeToFriendFeed,
  getFriendRankings,
  refreshMyWeeklyStats,
} from '../lib/socialService';
import type { Unsubscribe } from 'firebase/firestore';
import type { Friend } from '../lib/friendService';

interface SocialStore {
  feed: ActivityItem[];
  rankings: RankingEntry[];
  rankingsLoading: boolean;
  feedLoading: boolean;
  _unsubscribe: Unsubscribe | null;

  subscribeFeed: (friendUids: string[]) => void;
  unsubscribeFeed: () => void;
  loadRankings: (
    myUid: string,
    myDisplayName: string,
    myWeeklyNetPay: number,
    friends: Friend[],
  ) => Promise<void>;
  syncWeeklyStats: (uid: string, weeklyNetPay: number) => Promise<void>;
}

export const useSocialStore = create<SocialStore>((set, get) => ({
  feed: [],
  rankings: [],
  rankingsLoading: false,
  feedLoading: false,
  _unsubscribe: null,

  subscribeFeed(friendUids) {
    get().unsubscribeFeed();
    set({ feedLoading: true });
    const unsub = subscribeToFriendFeed(friendUids, (items) => {
      set({ feed: items, feedLoading: false });
    });
    set({ _unsubscribe: unsub });
  },

  unsubscribeFeed() {
    const unsub = get()._unsubscribe;
    if (unsub) {
      unsub();
      set({ _unsubscribe: null });
    }
  },

  async loadRankings(myUid, myDisplayName, myWeeklyNetPay, friends) {
    set({ rankingsLoading: true });
    try {
      const rankings = await getFriendRankings(myUid, myDisplayName, myWeeklyNetPay, friends);
      set({ rankings });
    } catch (e) {
      console.error('[SocialStore] loadRankings failed:', e);
    } finally {
      set({ rankingsLoading: false });
    }
  },

  async syncWeeklyStats(uid, weeklyNetPay) {
    try {
      await refreshMyWeeklyStats(uid, weeklyNetPay);
    } catch (e) {
      console.error('[SocialStore] syncWeeklyStats failed:', e);
    }
  },
}));
