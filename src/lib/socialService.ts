import {
  collection,
  doc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  getDoc,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile } from './userService';
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
  createdAt: any;
}

export interface RankingEntry {
  uid: string;
  displayName: string;
  weeklyNetPay: number;
  isMe: boolean;
}

export function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().slice(0, 10);
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
  return onSnapshot(q, (snap) => {
    const items: ActivityItem[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<ActivityItem, 'id'>),
    }));
    onUpdate(items);
  });
}

export async function refreshMyWeeklyStats(
  uid: string,
  weeklyNetPay: number,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    currentWeekNetPay: weeklyNetPay,
    currentWeekStart: getWeekStart(),
  });
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

  const profileSnaps = await Promise.all(
    friends.map((f) => getDoc(doc(db, 'users', f.uid))),
  );

  for (let i = 0; i < friends.length; i++) {
    const snap = profileSnaps[i];
    if (!snap.exists()) continue;
    const p = snap.data() as UserProfile;
    if (p.incomeRankingOptOut) continue;
    const pay = p.currentWeekStart === weekStart ? (p.currentWeekNetPay ?? 0) : 0;
    entries.push({
      uid: friends[i].uid,
      displayName: friends[i].displayName,
      weeklyNetPay: pay,
      isMe: false,
    });
  }

  return entries.sort((a, b) => b.weeklyNetPay - a.weeklyNetPay);
}
