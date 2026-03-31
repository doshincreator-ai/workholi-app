import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile } from './userService';


export interface FriendRequest {
  id: string;
  fromUid: string;
  fromName: string;
  toUid: string;
  status: 'pending' | 'accepted';
  createdAt: any;
}

export interface Friend {
  id: string; // friendship document ID
  uid: string;
  displayName: string;
  currentRegion?: string;
}

/** 招待コードでユーザーを検索 */
export async function findUserByInviteCode(code: string): Promise<UserProfile | null> {
  const q = query(collection(db, 'users'), where('inviteCode', '==', code.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as UserProfile;
}

export type SendRequestResult = 'ok' | 'already_friends' | 'already_requested';

/** 友達申請を送る */
export async function sendFriendRequest(
  fromUid: string,
  fromName: string,
  toUid: string,
): Promise<SendRequestResult> {
  const id = [fromUid, toUid].sort().join('_');

  const [friendshipSnap, requestSnap] = await Promise.all([
    getDoc(doc(db, 'friendships', id)),
    getDoc(doc(db, 'friendRequests', id)),
  ]);

  if (friendshipSnap.exists()) return 'already_friends';
  if (requestSnap.exists()) return 'already_requested';

  await setDoc(doc(db, 'friendRequests', id), {
    id,
    fromUid,
    fromName,
    toUid,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return 'ok';
}

/** 受信した友達申請一覧 */
export async function getPendingRequests(uid: string): Promise<FriendRequest[]> {
  const q = query(
    collection(db, 'friendRequests'),
    where('toUid', '==', uid),
    where('status', '==', 'pending'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as FriendRequest);
}

/** 友達申請を承認 */
export async function acceptFriendRequest(requestId: string, fromUid: string, toUid: string, fromName: string, toName: string): Promise<void> {
  await setDoc(doc(db, 'friendships', requestId), {
    uids: [fromUid, toUid],
    names: { [fromUid]: fromName, [toUid]: toName },
    createdAt: serverTimestamp(),
  });
  await deleteDoc(doc(db, 'friendRequests', requestId));
}

/** 友達一覧を取得 */
export async function getFriends(uid: string): Promise<Friend[]> {
  const q = query(collection(db, 'friendships'), where('uids', 'array-contains', uid));
  const snap = await getDocs(q);
  const base = snap.docs.map((d) => {
    const data = d.data();
    const otherUid = data.uids.find((u: string) => u !== uid);
    return { id: d.id, uid: otherUid, displayName: data.names[otherUid] } as Friend;
  });
  // 各友達の currentRegion を取得
  const profiles = await Promise.all(
    base.map((f) => getDoc(doc(db, 'users', f.uid))),
  );
  return base.map((f, i) => {
    const profileData = profiles[i].exists() ? (profiles[i].data() as UserProfile) : null;
    return { ...f, currentRegion: profileData?.currentRegion };
  });
}

/** 友達を削除 */
export async function removeFriend(requestId: string): Promise<void> {
  await deleteDoc(doc(db, 'friendships', requestId));
}

export interface FriendEmployer {
  employerName: string;
}

/** 友達の公開勤務先一覧を取得 */
export async function getFriendEmployers(uid: string): Promise<FriendEmployer[]> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return [];
  const names: string[] = (snap.data() as any).friendsEmployers ?? [];
  return names.sort().map((employerName) => ({ employerName }));
}
