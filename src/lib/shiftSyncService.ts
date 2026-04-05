import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Shift, Employer } from '../types';
import type { InsertShiftData } from '../db/shifts';
import { getAllEmployers, insertEmployer } from '../db/employers';
import { getAllShifts, insertShift } from '../db/shifts';

function privateEmployersCol(userId: string) {
  return collection(db, 'users', userId, 'private_employers');
}

function privateShiftsCol(userId: string) {
  return collection(db, 'users', userId, 'private_shifts');
}

function employerDocId(employer: Employer): string {
  return `${employer.country}_${employer.name.toLowerCase().replace(/\s+/g, '_')}`;
}

export async function backupEmployerToFirestore(userId: string, employer: Employer): Promise<void> {
  const docId = employerDocId(employer);
  await setDoc(doc(privateEmployersCol(userId), docId), {
    name: employer.name,
    country: employer.country,
    hourlyRate: employer.hourlyRate,
    taxCode: employer.taxCode,
    irdNumber: employer.irdNumber ?? null,
    defaultStartTime: employer.defaultStartTime ?? null,
    defaultEndTime: employer.defaultEndTime ?? null,
    defaultBreakMinutes: employer.defaultBreakMinutes ?? null,
    region: employer.region ?? null,
    friendsVisible: employer.friendsVisible,
    holidayPayIncluded: employer.holidayPayIncluded,
    holidayPaySeparate: employer.holidayPaySeparate,
    nightShiftStart: employer.nightShiftStart ?? null,
    nightShiftBonus: employer.nightShiftBonus ?? null,
    overtimeThreshold: employer.overtimeThreshold ?? null,
    overtimeMultiplier: employer.overtimeMultiplier ?? null,
    isShared: employer.isShared,
    paymentMethod: employer.paymentMethod ?? null,
    jobCategory: employer.jobCategory ?? null,
    jobDescription: employer.jobDescription ?? null,
    englishLevel: employer.englishLevel ?? null,
    visaTypes: employer.visaTypes ?? null,
    publicMemo: employer.publicMemo ?? null,
    sharedAt: employer.sharedAt ?? null,
    firestoreId: employer.firestoreId ?? null,
    reviewSharedAt: employer.reviewSharedAt ?? null,
    createdAt: employer.createdAt,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEmployerBackup(userId: string, employer: Employer): Promise<void> {
  await deleteDoc(doc(privateEmployersCol(userId), employerDocId(employer)));
}

export async function backupShiftToFirestore(userId: string, shift: Shift): Promise<void> {
  if (!shift.firestoreId) return;
  await setDoc(doc(privateShiftsCol(userId), shift.firestoreId), {
    employerName: shift.employerName ?? '',
    country: shift.country,
    date: shift.date,
    startTime: shift.startTime,
    endTime: shift.endTime,
    breakMinutes: shift.breakMinutes,
    isPublicHoliday: shift.isPublicHoliday,
    isHolidayRest: shift.isHolidayRest,
    isShared: shift.isShared,
    memo: shift.memo,
    hourlyRate: shift.hourlyRate,
    grossPay: shift.grossPay,
    taxAmount: shift.taxAmount,
    accLevy: shift.accLevy,
    studentLoanDeduction: shift.studentLoanDeduction,
    netPay: shift.netPay,
    holidayPayAmount: shift.holidayPayAmount ?? null,
    nightShiftAllowance: shift.nightShiftAllowance ?? null,
    overtimeAllowance: shift.overtimeAllowance ?? null,
    reminderMinutes: shift.reminderMinutes ?? -1,
    createdAt: shift.createdAt,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteShiftBackup(userId: string, firestoreId: string): Promise<void> {
  await deleteDoc(doc(privateShiftsCol(userId), firestoreId));
}

/** ログイン時にFirestoreからSQLiteへデータを復元する。ローカルにデータがある場合はスキップ。 */
export async function restoreFromFirestore(userId: string): Promise<boolean> {
  const localEmployers = getAllEmployers();
  const localShifts = getAllShifts();
  if (localEmployers.length > 0 || localShifts.length > 0) return false;

  const [employersSnap, shiftsSnap] = await Promise.all([
    getDocs(privateEmployersCol(userId)),
    getDocs(privateShiftsCol(userId)),
  ]);

  if (employersSnap.empty && shiftsSnap.empty) return false;

  // 雇用主を復元し、名前→ローカルIDのマップを作成
  const nameToId = new Map<string, number>();
  for (const docSnap of employersSnap.docs) {
    const d = docSnap.data();
    try {
      const employer = insertEmployer({
        name: d.name,
        country: d.country ?? 'NZ',
        hourlyRate: d.hourlyRate,
        taxCode: d.taxCode,
        irdNumber: d.irdNumber ?? undefined,
        defaultStartTime: d.defaultStartTime ?? undefined,
        defaultEndTime: d.defaultEndTime ?? undefined,
        defaultBreakMinutes: d.defaultBreakMinutes ?? undefined,
        region: d.region ?? undefined,
        friendsVisible: d.friendsVisible ?? false,
        holidayPayIncluded: d.holidayPayIncluded ?? false,
        holidayPaySeparate: d.holidayPaySeparate ?? false,
        nightShiftStart: d.nightShiftStart ?? undefined,
        nightShiftBonus: d.nightShiftBonus ?? undefined,
        overtimeThreshold: d.overtimeThreshold ?? undefined,
        overtimeMultiplier: d.overtimeMultiplier ?? undefined,
        isShared: d.isShared ?? false,
        paymentMethod: d.paymentMethod ?? undefined,
        jobCategory: d.jobCategory ?? undefined,
        jobDescription: d.jobDescription ?? undefined,
        englishLevel: d.englishLevel ?? undefined,
        visaTypes: d.visaTypes ?? undefined,
        publicMemo: d.publicMemo ?? undefined,
        sharedAt: d.sharedAt ?? undefined,
        firestoreId: d.firestoreId ?? undefined,
        reviewSharedAt: d.reviewSharedAt ?? undefined,
      });
      nameToId.set(`${employer.country}_${employer.name}`, employer.id);
    } catch (e) {
      console.error('[Restore] employer insert failed:', e);
    }
  }

  // シフトを復元
  for (const docSnap of shiftsSnap.docs) {
    const d = docSnap.data();
    const key = `${d.country ?? 'NZ'}_${d.employerName}`;
    const employerId = nameToId.get(key);
    if (!employerId) {
      console.warn('[Restore] employer not found for shift:', docSnap.id, key);
      continue;
    }
    try {
      const shiftData: InsertShiftData = {
        employerId,
        country: d.country ?? 'NZ',
        date: d.date,
        startTime: d.startTime,
        endTime: d.endTime,
        breakMinutes: d.breakMinutes ?? 0,
        isPublicHoliday: d.isPublicHoliday ?? false,
        isHolidayRest: d.isHolidayRest ?? false,
        isShared: d.isShared ?? false,
        memo: d.memo ?? '',
        hourlyRate: d.hourlyRate,
        grossPay: d.grossPay,
        taxAmount: d.taxAmount,
        accLevy: d.accLevy,
        studentLoanDeduction: d.studentLoanDeduction ?? 0,
        netPay: d.netPay,
        holidayPayAmount: d.holidayPayAmount ?? undefined,
        nightShiftAllowance: d.nightShiftAllowance ?? undefined,
        overtimeAllowance: d.overtimeAllowance ?? undefined,
        reminderMinutes: d.reminderMinutes ?? -1,
        firestoreId: docSnap.id,
      };
      insertShift(shiftData);
    } catch (e) {
      console.error('[Restore] shift insert failed:', docSnap.id, e);
    }
  }

  return true;
}
