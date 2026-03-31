import { Alert } from 'react-native';
import { create } from 'zustand';
import {
  getAllEmployers,
  insertEmployer,
  updateEmployer,
  deleteEmployer,
} from '../db/employers';
import { syncEmployerToFirestore, recordWorker, removeWorker, toCompanyId } from '../lib/firestoreService';
import { backupEmployerToFirestore, deleteEmployerBackup } from '../lib/shiftSyncService';
import { addTicket, updateUserRegion, setFriendsEmployers } from '../lib/userService';
import { useAuthStore } from './authStore';
import type { Employer } from '../types';

interface EmployerStore {
  employers: Employer[];
  load: () => void;
  add: (data: Omit<Employer, 'id' | 'createdAt'>) => Employer;
  update: (id: number, data: Partial<Omit<Employer, 'id' | 'createdAt'>>) => void;
  remove: (id: number) => void;
  getById: (id: number) => Employer | undefined;
  reset: () => void;
}

export const useEmployerStore = create<EmployerStore>((set, get) => ({
  employers: [],

  load() {
    set({ employers: getAllEmployers() });
  },

  add(data) {
    const employer = insertEmployer(data);
    const newList = [...get().employers, employer].sort((a, b) => a.name.localeCompare(b.name));
    set({ employers: newList });
    const userId = useAuthStore.getState().user?.uid;
    if (userId) {
      backupEmployerToFirestore(userId, employer).catch((e) => console.error('[Employer] backup failed:', e));
    }
    if (userId && employer.friendsVisible) {
      const names = newList.filter((e) => e.friendsVisible).map((e) => e.name);
      setFriendsEmployers(userId, names).catch((e) => console.error('[Friends] update failed:', e));
    }
    if (userId && employer.isShared) {
      // 初回公開：チケット付与 + 日時記録
      const now = new Date().toISOString();
      updateEmployer(employer.id, { sharedAt: now });
      set((s) => ({
        employers: s.employers.map((e) => e.id === employer.id ? { ...e, sharedAt: now } : e),
      }));
      addTicket(userId).catch((e) => console.error('[Ticket] grant failed:', e));
      syncEmployerToFirestore(userId, { ...employer, sharedAt: now }).then((firestoreId) => {
        updateEmployer(employer.id, { firestoreId });
        set((s) => ({
          employers: s.employers.map((e) => e.id === employer.id ? { ...e, firestoreId } : e),
        }));
        if (employer.region) updateUserRegion(userId, employer.region).catch((e) => console.error('[Region] update failed:', e));
      }).catch((e) => {
        console.error('[Community] sync failed:', e);
        Alert.alert('公開に失敗しました', 'コミュニティへの公開に失敗しました。通信環境を確認してもう一度お試しください。');
      });
    }
    return employer;
  },

  update(id, data) {
    const previous = get().employers.find((e) => e.id === id);
    const wasShared = previous?.isShared ?? false;
    updateEmployer(id, data);
    const updatedList = get().employers.map((e) => e.id === id ? { ...e, ...data } : e);
    set({ employers: updatedList });
    const userId = useAuthStore.getState().user?.uid;
    const updatedEmployer = updatedList.find((e) => e.id === id);
    if (userId && updatedEmployer) {
      backupEmployerToFirestore(userId, updatedEmployer).catch((e) => console.error('[Employer] backup failed:', e));
    }
    if (userId && data.friendsVisible !== undefined) {
      const names = updatedList.filter((e) => e.friendsVisible).map((e) => e.name);
      setFriendsEmployers(userId, names).catch((e) => console.error('[Friends] update failed:', e));
    }
    if (userId && data.isShared) {
      const updated = get().employers.find((e) => e.id === id)!;
      if (!wasShared && !previous?.sharedAt) {
        // 初回公開：チケット付与 + 日時記録
        const now = new Date().toISOString();
        updateEmployer(id, { sharedAt: now });
        set((s) => ({
          employers: s.employers.map((e) => e.id === id ? { ...e, sharedAt: now } : e),
        }));
        addTicket(userId).catch((e) => console.error('[Ticket] grant failed:', e));
        syncEmployerToFirestore(userId, { ...updated, sharedAt: now }).then((firestoreId) => {
          updateEmployer(id, { firestoreId });
          set((s) => ({
            employers: s.employers.map((e) => e.id === id ? { ...e, firestoreId } : e),
          }));
          if (updated.region) updateUserRegion(userId, updated.region).catch((e) => console.error('[Region] update failed:', e));
          // 既存シフトがあれば勤務実績をカウント
          const { useShiftStore } = require('./shiftStore');
          const shifts = useShiftStore.getState().shifts;
          if (shifts.some((s: any) => s.employerId === id)) {
            recordWorker(firestoreId, userId, updated.country).catch((e) => console.error('[Worker] record failed:', e));
          }
        }).catch((e) => {
          console.error('[Community] sync failed:', e);
          Alert.alert('公開に失敗しました', 'コミュニティへの公開に失敗しました。通信環境を確認してもう一度お試しください。');
        });
      } else {
        // 詳細情報（住所・連絡先）初回追加：チケット+2
        const hasNewDetail = (data.address || data.contactInfo);
        if (hasNewDetail && !previous?.detailSharedAt) {
          const now = new Date().toISOString();
          updateEmployer(id, { detailSharedAt: now });
          set((s) => ({
            employers: s.employers.map((e) => e.id === id ? { ...e, detailSharedAt: now } : e),
          }));
          addTicket(userId).catch((e) => console.error('[Ticket] grant failed:', e));
          addTicket(userId).catch((e) => console.error('[Ticket] grant failed:', e));
        }
        // レビュー項目の初回更新チェック：チケット付与
        const hasNewReview = (data.jobDescription || data.englishLevel || data.publicMemo);
        if (hasNewReview && !previous?.reviewSharedAt) {
          const now = new Date().toISOString();
          updateEmployer(id, { reviewSharedAt: now });
          set((s) => ({
            employers: s.employers.map((e) => e.id === id ? { ...e, reviewSharedAt: now } : e),
          }));
          addTicket(userId).catch((e) => console.error('[Ticket] grant failed:', e));
        }
        syncEmployerToFirestore(userId, updated).catch((e) => console.error('[Community] update failed:', e));
        if (updated.region) updateUserRegion(userId, updated.region).catch((e) => console.error('[Region] update failed:', e));
      }
    } else if (userId && wasShared && !data.isShared && previous?.name) {
      // 非公開化：勤務実績を取り消し
      removeWorker(toCompanyId(previous.name), userId, previous.country).catch((e) => console.error('[Worker] remove failed:', e));
    }
  },

  remove(id) {
    const employer = get().employers.find((e) => e.id === id);
    const userId = useAuthStore.getState().user?.uid;
    if (employer && userId) {
      deleteEmployerBackup(userId, employer).catch((e) => console.error('[Employer] delete backup failed:', e));
    }
    if (employer?.isShared && userId) {
      const fId = employer.firestoreId ?? toCompanyId(employer.name);
      removeWorker(fId, userId, employer.country).catch((e) => console.error('[Worker] remove failed:', e));
    }
    deleteEmployer(id);
    // 循環importを避けるため遅延require
    const { useShiftStore } = require('./shiftStore');
    useShiftStore.getState().load();
    const newList = get().employers.filter((e) => e.id !== id);
    set({ employers: newList });
    if (userId && employer?.friendsVisible) {
      const names = newList.filter((e) => e.friendsVisible).map((e) => e.name);
      setFriendsEmployers(userId, names).catch((e) => console.error('[Friends] update failed:', e));
    }
  },

  getById(id) {
    return get().employers.find((e) => e.id === id);
  },

  reset() {
    set({ employers: [] });
  },
}));
