import { create } from 'zustand';
import { useToastStore } from './toastStore';
import {
  getAllShifts,
  insertShift,
  updateShift,
  deleteShift,
  getMonthlySummary,
  type InsertShiftData,
  type MonthlySummary,
} from '../db/shifts';
import {
  scheduleShiftReminder,
  cancelShiftReminder,
  requestNotificationPermission,
} from '../lib/notifications';
import { useAuthStore } from './authStore';
import { recordWorker, toCompanyId } from '../lib/firestoreService';
import { backupShiftToFirestore, deleteShiftBackup } from '../lib/shiftSyncService';
import { postActivity } from '../lib/socialService';
import { getRandomEncouragement, getCrossedMilestone, MILESTONE_MESSAGES } from '../constants/messages';
import { useBadgeStore } from './badgeStore';
import type { Shift } from '../types';

interface ShiftStore {
  shifts: Shift[];
  monthlySummary: MonthlySummary;
  currentYear: number;
  currentMonth: number;
  load: () => void;
  loadMonth: (year: number, month: number) => void;
  add: (data: InsertShiftData, silent?: boolean) => Shift;
  update: (id: number, data: InsertShiftData) => void;
  remove: (id: number) => void;
  reset: () => void;
}

const now = new Date();

const EMPTY_SUMMARY: MonthlySummary = {
  grossPay: 0,
  taxAmount: 0,
  accLevy: 0,
  studentLoanDeduction: 0,
  netPay: 0,
  totalHours: 0,
  shiftCount: 0,
};

export const useShiftStore = create<ShiftStore>((set, get) => ({
  shifts: [],
  monthlySummary: EMPTY_SUMMARY,
  currentYear: now.getFullYear(),
  currentMonth: now.getMonth() + 1,

  load() {
    const { currentYear, currentMonth } = get();
    set({
      shifts: getAllShifts(),
      monthlySummary: getMonthlySummary(currentYear, currentMonth),
    });
  },

  loadMonth(year, month) {
    set({
      currentYear: year,
      currentMonth: month,
      monthlySummary: getMonthlySummary(year, month),
    });
  },

  add(data, silent = false) {
    const prevTotal = get().shifts.reduce((sum, s) => sum + s.grossPay, 0);
    const shift = insertShift(data);
    const { currentYear, currentMonth } = get();
    set((s) => ({
      shifts: [shift, ...s.shifts],
      monthlySummary: getMonthlySummary(currentYear, currentMonth),
    }));

    // 演出：シフト後メッセージ（コピー時はスキップ）
    if (!silent) {
      const currency = data.country === 'AU' ? 'AUD' : 'NZD';
      const newTotal = prevTotal + shift.grossPay;
      const milestone = getCrossedMilestone(prevTotal, newTotal);
      const encouragement = getRandomEncouragement();
      const earning = `${currency} ${shift.grossPay.toFixed(2)}`;

      if (milestone) {
        const m = MILESTONE_MESSAGES[milestone];
        useToastStore.getState().show(earning, `${m.body}　${encouragement}`, true, m.title);
      } else {
        useToastStore.getState().show(earning, encouragement);
      }
    }
    // 雇用主が公開中なら勤務実績をカウント
    const userId = useAuthStore.getState().user?.uid;
    if (userId) {
      const { useEmployerStore } = require('./employerStore');
      const employer = useEmployerStore.getState().getById(data.employerId);
      if (employer?.isShared) {
        const fId = employer.firestoreId ?? toCompanyId(employer.name);
        recordWorker(fId, userId, employer.country).catch((e) => console.error('[Worker] record failed:', e));
      }
    }

    // バッジ判定（非同期で実行し UI を妨げない）
    const allShifts = get().shifts;
    useBadgeStore.getState().checkAndEarn(allShifts);

    // Firestoreバックアップ & アクティビティ投稿
    if (userId) {
      const displayName = useAuthStore.getState().user?.displayName ?? '';
      backupShiftToFirestore(userId, shift).catch((e) => console.error('[Shift] backup failed:', e));
      postActivity(userId, displayName, 'shift').catch((e) => console.error('[Social] postActivity failed:', e));
    }

    // 通知スケジュール
    if ((data.reminderMinutes ?? -1) !== -1) {
      requestNotificationPermission().then((granted) => {
        if (!granted) return;
        return scheduleShiftReminder(shift);
      }).then((notifId) => {
        if (notifId) {
          updateShift(shift.id, { ...data, notificationId: notifId });
          set((s) => ({
            shifts: s.shifts.map((sh) => sh.id === shift.id ? { ...sh, notificationId: notifId } : sh),
          }));
        }
      }).catch((e) => console.error('[Notification] schedule failed on add:', e));
    }
    return shift;
  },

  update(id, data) {
    const previousShift = get().shifts.find((sh) => sh.id === id);
    // 既存通知をキャンセル
    cancelShiftReminder(previousShift?.notificationId).catch(() => {});
    updateShift(id, { ...data, notificationId: undefined });
    const { currentYear, currentMonth } = get();
    const updated = { ...data, id, notificationId: undefined } as Shift;
    set((s) => ({
      shifts: s.shifts.map((sh) => (sh.id === id ? { ...sh, ...updated } : sh)),
      monthlySummary: getMonthlySummary(currentYear, currentMonth),
    }));
    // Firestoreバックアップ
    const updatedForBackup = get().shifts.find((sh) => sh.id === id);
    const userId = useAuthStore.getState().user?.uid;
    if (userId && updatedForBackup) {
      backupShiftToFirestore(userId, updatedForBackup).catch(() => {});
    }

    // 新しい通知をスケジュール
    if ((data.reminderMinutes ?? -1) !== -1) {
      const updatedShift = get().shifts.find((sh) => sh.id === id);
      if (updatedShift) {
        requestNotificationPermission().then((granted) => {
          if (!granted) return;
          return scheduleShiftReminder(updatedShift);
        }).then((notifId) => {
          if (notifId) {
            updateShift(id, { ...data, notificationId: notifId });
            set((s) => ({
              shifts: s.shifts.map((sh) => sh.id === id ? { ...sh, notificationId: notifId } : sh),
            }));
          }
        }).catch((e) => console.error('[Notification] schedule failed on update:', e));
      }
    }
  },

  reset() {
    set({ shifts: [], monthlySummary: EMPTY_SUMMARY });
  },

  remove(id) {
    const shiftToDelete = get().shifts.find((sh) => sh.id === id);
    cancelShiftReminder(shiftToDelete?.notificationId).catch(() => {});
    const userId = useAuthStore.getState().user?.uid;
    if (userId && shiftToDelete?.firestoreId) {
      deleteShiftBackup(userId, shiftToDelete.firestoreId).catch((e) => console.error('[Shift] delete backup failed:', e));
    }
    deleteShift(id);
    const { currentYear, currentMonth } = get();
    set((s) => ({
      shifts: s.shifts.filter((sh) => sh.id !== id),
      monthlySummary: getMonthlySummary(currentYear, currentMonth),
    }));
  },
}));
