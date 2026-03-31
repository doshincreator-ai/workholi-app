import { create } from 'zustand';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { restoreFromFirestore } from '../lib/shiftSyncService';

interface AuthStore {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  init: () => () => void;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  init() {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({ user, initialized: true });
      if (user) {
        restoreFromFirestore(user.uid).then((restored) => {
          if (restored) {
            const { useShiftStore } = require('./shiftStore');
            const { useEmployerStore } = require('./employerStore');
            useEmployerStore.getState().load();
            useShiftStore.getState().load();
          }
        }).catch(() => {});
      }
    });
    return unsubscribe;
  },

  async register(email, password, displayName) {
    set({ loading: true });
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName });
      set({ user, loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  async login(email, password) {
    set({ loading: true });
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      set({ user, loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  async logout() {
    await signOut(auth);
    // ストアのリセットは循環importを避けるため遅延require
    const { useShiftStore } = require('./shiftStore');
    const { useEmployerStore } = require('./employerStore');
    useShiftStore.getState().reset();
    useEmployerStore.getState().reset();
    set({ user: null });
  },
}));
