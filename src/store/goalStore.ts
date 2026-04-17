import { create } from 'zustand';
import { getAllGoals, insertGoal, deleteGoal, type Goal } from '../db/goals';

interface GoalStore {
  goals: Goal[];
  load: () => void;
  add: (data: { name: string; emoji: string; targetAmount: number; country: string }) => Goal;
  remove: (id: number) => void;
}

export const useGoalStore = create<GoalStore>((set) => ({
  goals: [],

  load() {
    set({ goals: getAllGoals() });
  },

  add(data) {
    const goal = insertGoal(data);
    set((s) => ({ goals: [...s.goals, goal] }));
    return goal;
  },

  remove(id) {
    deleteGoal(id);
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
  },
}));
