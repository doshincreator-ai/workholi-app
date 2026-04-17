import { create } from 'zustand';
import {
  getAllEarnedBadges,
  earnBadge,
  getStreak,
  type BadgeId,
  type EarnedBadge,
} from '../db/badges';
import type { Shift } from '../types';

interface BadgeStore {
  earned: EarnedBadge[];
  newBadge: BadgeId | null;
  streak: number;
  load: () => void;
  checkAndEarn: (shifts: Shift[]) => void;
  clearNewBadge: () => void;
}

function calcHoursTotal(shifts: Shift[]): number {
  return shifts.reduce((sum, s) => {
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm) - s.breakMinutes;
    if (mins < 0) mins += 24 * 60;
    return sum + mins / 60;
  }, 0);
}

export const useBadgeStore = create<BadgeStore>((set, get) => ({
  earned: [],
  newBadge: null,
  streak: 0,

  load() {
    set({ earned: getAllEarnedBadges() });
  },

  checkAndEarn(shifts) {
    const streak = getStreak(shifts);
    const totalHours = calcHoursTotal(shifts);
    const totalIncome = shifts.reduce((sum, s) => sum + s.netPay, 0);

    const candidates: BadgeId[] = [];
    if (shifts.length >= 1) candidates.push('first_shift');
    if (totalHours >= 50) candidates.push('hours_50');
    if (totalHours >= 100) candidates.push('hours_100');
    if (totalHours >= 500) candidates.push('hours_500');
    if (totalIncome >= 1000) candidates.push('income_1000');
    if (totalIncome >= 5000) candidates.push('income_5000');
    if (totalIncome >= 10000) candidates.push('income_10000');
    if (streak >= 7) candidates.push('streak_7');
    if (streak >= 30) candidates.push('streak_30');

    let newlyEarned: BadgeId | null = null;
    for (const id of candidates) {
      const isNew = earnBadge(id);
      if (isNew && !newlyEarned) newlyEarned = id;
    }

    set({
      earned: getAllEarnedBadges(),
      streak,
      newBadge: newlyEarned ?? get().newBadge,
    });
  },

  clearNewBadge() {
    set({ newBadge: null });
  },
}));
