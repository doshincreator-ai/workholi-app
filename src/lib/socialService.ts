import {
  collection,
  doc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  setDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { BadgeId } from '../db/badges';

export type ActivityType = 'shift' | 'badge_earned' | 'badge_shared';

export interface ActivityItem {
  id: string;
  uid: string;
  displayName: string;
  type: ActivityType;
  badgeId?: BadgeId;
  badgeEmoji?: string;
  badgeName?: string;
  createdAt: Timestamp | null;
}

export interface RankingEntry {
  uid: string;
  displayName: string;
  weeklyNetPay: number;
  isMe: boolean;
}

interface WeeklyStats {
  currentWeekNetPay: number;
  currentWeekStart: string;
  incomeRankingOptOut: boolean;
}

function weeklyStatsDoc(uid: string) {
  return doc(db, 'users', uid, 'social', 'weeklyStats');
}

export function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export async function postActivity(
  uid: string,
  displayName: string,
  type: ActivityType,
  badge?: { id: BadgeId; emoji: string; name: string },
): Promise<void> {
  await addDoc(collection(db, 'activities'), {
    uid,
    displayName,
    type,
    badgeId: badge?.id ?? null,
    badgeEmoji: badge?.emoji ?? null,
    badgeName: badge?.name ?? null,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToFriendFeed(
  friendUids: string[],
  onUpdate: (items: ActivityItem[]) => void,
): Unsubscribe {
  if (friendUids.length === 0) {
    onUpdate([]);
    return () => {};
  }
  const uids = friendUids.slice(0, 30);
  const q = query(
    collection(db, 'activities'),
    where('uid', 'in', uids),
    orderBy('createdAt', 'desc'),
    limit(30),
  );
  return onSnapshot(
    q,
    (snap) => {
      const items: ActivityItem[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ActivityItem, 'id'>),
      }));
      onUpdate(items);
    },
    (error) => {
      console.error('[Feed] onSnapshot error:', error);
      onUpdate([]);
    },
  );
}

export async function refreshMyWeeklyStats(
  uid: string,
  weeklyNetPay: number,
): Promise<void> {
  await setDoc(
    weeklyStatsDoc(uid),
    { currentWeekNetPay: weeklyNetPay, currentWeekStart: getWeekStart() },
    { merge: true },
  );
}

export async function updateRankingOptOut(uid: string, optOut: boolean): Promise<void> {
  await setDoc(weeklyStatsDoc(uid), { incomeRankingOptOut: optOut }, { merge: true });
}

export async function getMyWeeklyStats(uid: string): Promise<WeeklyStats | null> {
  const snap = await getDoc(weeklyStatsDoc(uid));
  return snap.exists() ? (snap.data() as WeeklyStats) : null;
}

export async function getFriendRankings(
  myUid: string,
  myDisplayName: string,
  myWeeklyNetPay: number,
  friends: { uid: string; displayName: string }[],
): Promise<RankingEntry[]> {
  const weekStart = getWeekStart();
  const entries: RankingEntry[] = [
    { uid: myUid, displayName: myDisplayName, weeklyNetPay: myWeeklyNetPay, isMe: true },
  ];

  const statsSnaps = await Promise.all(
    friends.map((f) => getDoc(weeklyStatsDoc(f.uid))),
  );

  for (let i = 0; i < friends.length; i++) {
    const snap = statsSnaps[i];
    if (!snap.exists()) {
      entries.push({ uid: friends[i].uid, displayName: friends[i].displayName, weeklyNetPay: 0, isMe: false });
      continue;
    }
    const stats = snap.data() as WeeklyStats;
    if (stats.incomeRankingOptOut) continue;
    const pay = stats.currentWeekStart === weekStart ? (stats.currentWeekNetPay ?? 0) : 0;
    entries.push({
      uid: friends[i].uid,
      displayName: friends[i].displayName,
      weeklyNetPay: pay,
      isMe: false,
    });
  }

  return entries.sort((a, b) => b.weeklyNetPay - a.weeklyNetPay);
}
