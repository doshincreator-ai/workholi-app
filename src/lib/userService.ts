import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  tickets: number;
  inviteCode: string;
  currentRegion?: string;
  friendsEmployers?: string[];
  createdAt: any;
}

function generateCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function getOrCreateUserProfile(
  uid: string,
  displayName: string,
  email: string,
): Promise<UserProfile> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }
  const profile: UserProfile = {
    uid,
    displayName,
    email,
    tickets: 3, // 新規ユーザーは3枚
    inviteCode: generateCode(),
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, profile);
  return profile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function useTicket(uid: string): Promise<boolean> {
  const profile = await getUserProfile(uid);
  if (!profile || profile.tickets <= 0) return false;
  await updateDoc(doc(db, 'users', uid), { tickets: increment(-1) });
  return true;
}

export async function addTicket(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { tickets: increment(1) });
}

export async function getUnlockedCompanies(uid: string): Promise<string[]> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return [];
  return (snap.data() as any).unlockedCompanies ?? [];
}

export async function updateUserRegion(uid: string, region: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { currentRegion: region });
}

export async function setFriendsEmployers(uid: string, employerNames: string[]): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { friendsEmployers: employerNames });
}

export async function unlockCompany(uid: string, companyId: string): Promise<boolean> {
  const success = await useTicket(uid);
  if (!success) return false;
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  const current: string[] = snap.exists() ? ((snap.data() as any).unlockedCompanies ?? []) : [];
  if (!current.includes(companyId)) {
    await updateDoc(ref, { unlockedCompanies: [...current, companyId] });
  }
  return true;
}
