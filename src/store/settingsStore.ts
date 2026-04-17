import { create } from 'zustand';
import { getDb } from '../db/database';
import type { Settings } from '../types';

interface SettingsStore extends Settings {
  load: () => void;
  update: (patch: Partial<Settings>) => void;
  jpyRate: () => number; // 現在の国の為替レートを返す
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  currentCountry: 'NZ',
  nzdJpyRate: 90,
  audJpyRate: 95,
  useStudentLoan: false,
  studentLoanRate: 0.12,
  paydayType: 'none',
  paydayDay: 5,

  jpyRate() {
    const s = get();
    return s.currentCountry === 'AU' ? s.audJpyRate : s.nzdJpyRate;
  },

  load() {
    const db = getDb();
    const rows = db.getAllSync<{ key: string; value: string }>(
      'SELECT key, value FROM settings',
    );
    const map: Record<string, string> = {};
    rows.forEach((r) => (map[r.key] = r.value));

    set({
      currentCountry: map['current_country'] ?? 'NZ',
      nzdJpyRate: parseFloat(map['nzd_jpy_rate'] ?? '90'),
      audJpyRate: parseFloat(map['aud_jpy_rate'] ?? '95'),
      useStudentLoan: map['use_student_loan'] === 'true',
      studentLoanRate: parseFloat(map['student_loan_rate'] ?? '0.12'),
      paydayType: map['payday_type'] ?? 'none',
      paydayDay: parseInt(map['payday_day'] ?? '5', 10),
    });
  },

  update(patch) {
    const db = getDb();
    const current = get();
    const next = { ...current, ...patch };

    if (patch.currentCountry !== undefined) {
      db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
        'current_country', patch.currentCountry,
      ]);
    }
    if (patch.nzdJpyRate !== undefined) {
      db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
        'nzd_jpy_rate', String(patch.nzdJpyRate),
      ]);
    }
    if (patch.audJpyRate !== undefined) {
      db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
        'aud_jpy_rate', String(patch.audJpyRate),
      ]);
    }
    if (patch.useStudentLoan !== undefined) {
      db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
        'use_student_loan', String(patch.useStudentLoan),
      ]);
    }
    if (patch.studentLoanRate !== undefined) {
      db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
        'student_loan_rate', String(patch.studentLoanRate),
      ]);
    }
    if (patch.paydayType !== undefined) {
      db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
        'payday_type', patch.paydayType,
      ]);
    }
    if (patch.paydayDay !== undefined) {
      db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
        'payday_day', String(patch.paydayDay),
      ]);
    }

    set(next);
  },
}));
