import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Employer } from '../types';

// Firestoreパス: countries/{country}/companies/{companyId}
function companyRef(country: string, companyId: string) {
  return doc(db, 'countries', country, 'companies', companyId);
}
function companiesCol(country: string) {
  return collection(db, 'countries', country, 'companies');
}

/** 雇用主の公開情報を Firestore に同期。companyId を返す */
export async function syncEmployerToFirestore(
  userId: string,
  employer: Employer,
): Promise<string> {
  const companyId = employer.firestoreId ?? toCompanyId(employer.name);
  const ref = companyRef(employer.country, companyId);
  const snap = await getDoc(ref);
  const publicData: Record<string, any> = {
    name: employer.name,
    companyId,
    country: employer.country,
    hourlyRate: employer.hourlyRate,
    updatedAt: serverTimestamp(),
  };
  if (employer.region) publicData.region = employer.region;
  if (employer.paymentMethod) publicData.paymentMethod = employer.paymentMethod;
  if (employer.jobCategory) publicData.jobCategory = employer.jobCategory;
  if (employer.jobDescription) publicData.jobDescription = employer.jobDescription;
  if (employer.englishLevel) publicData.englishLevel = employer.englishLevel;
  if (employer.visaTypes) publicData.visaTypes = employer.visaTypes;
  if (employer.publicMemo) publicData.publicMemo = employer.publicMemo;
  if (employer.hasInterview != null) publicData.hasInterview = employer.hasInterview;
  if (employer.difficulty) publicData.difficulty = employer.difficulty;
  if (employer.isHiring != null) publicData.isHiring = employer.isHiring;
  if (employer.address) publicData.address = employer.address;
  if (employer.contactInfo) publicData.contactInfo = employer.contactInfo;
  if (employer.defaultStartTime) publicData.typicalStartTime = employer.defaultStartTime;
  if (employer.defaultEndTime) publicData.typicalEndTime = employer.defaultEndTime;

  if (snap.exists()) {
    const workerUids: string[] = snap.data().workerUids ?? [];
    await setDoc(ref, { ...publicData, workerCount: workerUids.length }, { merge: true });
  } else {
    await setDoc(ref, { ...publicData, sharedByUid: userId, reviewCount: 0, workerCount: 0, workerUids: [], createdAt: serverTimestamp() });
  }
  return companyId;
}

/** 企業ドキュメントを Firestore から削除 */
export async function removeCompanyFromFirestore(country: string, name: string): Promise<void> {
  await deleteDoc(companyRef(country, toCompanyId(name)));
}

export interface CompanyDoc {
  companyId: string;
  name: string;
  country: string;
  reviewCount: number;
  workerCount?: number;
  workerUids?: string[];
  region?: string;
  jobCategory?: string;
  jobDescription?: string;
  hourlyRate?: number;
  paymentMethod?: string;
  englishLevel?: string;
  visaTypes?: string;
  publicMemo?: string;
  typicalStartTime?: string;
  typicalEndTime?: string;
  hasInterview?: boolean;
  difficulty?: 'easy' | 'normal' | 'hard';
  isHiring?: boolean;
  address?: string;
  contactInfo?: string;
  sharedByUid?: string;
  createdAt: any;
  updatedAt?: any;
}

/** 公開されている企業一覧を取得（国別コレクションから） */
export async function fetchCompanies(country: string): Promise<CompanyDoc[]> {
  const snap = await getDocs(companiesCol(country));
  const docs = snap.docs.map((d) => ({ companyId: d.id, ...d.data() } as CompanyDoc));
  return docs.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
}

export function toCompanyId(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** ユーザーを勤務実績者として記録（1ユーザー1カウント） */
export async function recordWorker(companyId: string, userId: string, country: string): Promise<void> {
  const ref = companyRef(country, companyId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const workerUids: string[] = snap.data().workerUids ?? [];
  if (workerUids.includes(userId)) return;
  await setDoc(ref, {
    workerUids: [...workerUids, userId],
    workerCount: workerUids.length + 1,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/** ユーザーの勤務実績記録を削除 */
export async function removeWorker(companyId: string, userId: string, country: string): Promise<void> {
  const ref = companyRef(country, companyId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const workerUids: string[] = snap.data().workerUids ?? [];
  if (!workerUids.includes(userId)) return;
  const newUids = workerUids.filter((u) => u !== userId);
  await setDoc(ref, {
    workerUids: newUids,
    workerCount: newUids.length,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
