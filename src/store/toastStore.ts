import { create } from 'zustand';

interface ToastState {
  visible: boolean;
  earning: string;
  message: string;
  isMilestone: boolean;
  milestoneTitle: string;
  show: (earning: string, message: string, isMilestone?: boolean, milestoneTitle?: string) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  earning: '',
  message: '',
  isMilestone: false,
  milestoneTitle: '',

  show(earning, message, isMilestone = false, milestoneTitle = '') {
    set({ visible: true, earning, message, isMilestone, milestoneTitle });
  },

  hide() {
    set({ visible: false });
  },
}));
