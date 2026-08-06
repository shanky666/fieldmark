import { create } from 'zustand';
import { secureStorage } from '../utils/secureStorage';
import i18n from 'i18next';
import { firebaseAuth } from '../config/firebase';
import { apiClient } from '../api/client';

export type UserRole = 'WORKER' | 'SUPERVISOR' | 'ADMIN' | null;

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole;
  workerId: number | null;
  language: string;
  userProfile: any | null;
  firebaseUser: any | null;
  registerUser: (data: { name: string; employee_id: string; phone: string; role: string }) => Promise<void>;
  loginWorker: (identifier: string, otp: string, firebaseIdToken?: string) => Promise<void>;
  loginSupervisor: (identifier: string, otp: string, firebaseIdToken?: string) => Promise<void>;
  loginAdmin: (phone: string, pass: string) => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  logout: () => Promise<void>;
  setLanguage: (lang: string) => Promise<void>;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  role: null,
  workerId: null,
  language: 'en',
  userProfile: null,
  firebaseUser: null,

  registerUser: async (data) => {
    set({ isLoading: true });
    try {
      const res = await apiClient.post('/api/auth/register/', data);
      const { access, refresh, role, worker } = res.data;

      if (access) await secureStorage.setItem('access_token', access);
      if (refresh) await secureStorage.setItem('refresh_token', refresh);
      await secureStorage.setItem('user_role', role);
      await secureStorage.setItem('worker_id', String(worker.id));

      const userRole = (role === 'SUPERVISOR' ? 'SUPERVISOR' : 'WORKER') as UserRole;

      set({
        isAuthenticated: true,
        role: userRole,
        workerId: worker.id,
        userProfile: {
          id: worker.id,
          name: worker.name,
          first_name: worker.name.split(' ')[0],
          last_name: worker.name.split(' ').slice(1).join(' '),
          employee_id: worker.employee_id,
          phone: worker.phone,
          role: role === 'SUPERVISOR' ? 'Supervisor' : 'Employee',
        },
        isLoading: false,
      });

      // Hydrate full profile
      get().fetchUserProfile();
    } catch (e: any) {
      set({ isLoading: false });
      throw e;
    }
  },

  loginWorker: async (identifier: string, otp: string, firebaseIdToken?: string) => {
    set({ isLoading: true });
    try {
      const payload: Record<string, string> = firebaseIdToken
        ? { firebase_id_token: firebaseIdToken }
        : { phone: identifier, otp };

      const res = await apiClient.post('/api/auth/verify-otp/', payload);
      const { access, refresh, role, worker_id, user } = res.data;

      if (access) await secureStorage.setItem('access_token', access);
      if (refresh) await secureStorage.setItem('refresh_token', refresh);
      await secureStorage.setItem('user_role', role || 'WORKER');
      if (worker_id) await secureStorage.setItem('worker_id', String(worker_id));

      set({
        isAuthenticated: true,
        role: 'WORKER',
        workerId: worker_id,
        userProfile: user ? {
          ...user,
          first_name: user.name ? user.name.split(' ')[0] : '',
          last_name: user.name ? user.name.split(' ').slice(1).join(' ') : '',
        } : null,
        isLoading: false,
      });

      get().fetchUserProfile();
    } catch (e: any) {
      set({ isLoading: false });
      throw e;
    }
  },

  loginSupervisor: async (identifier: string, otp: string, firebaseIdToken?: string) => {
    set({ isLoading: true });
    try {
      const payload: Record<string, string> = firebaseIdToken
        ? { firebase_id_token: firebaseIdToken }
        : { phone: identifier, otp };

      const res = await apiClient.post('/api/auth/verify-otp/', payload);
      const { access, refresh, role, worker_id, user } = res.data;

      if (access) await secureStorage.setItem('access_token', access);
      if (refresh) await secureStorage.setItem('refresh_token', refresh);
      await secureStorage.setItem('user_role', role || 'SUPERVISOR');
      if (worker_id) await secureStorage.setItem('worker_id', String(worker_id));

      set({
        isAuthenticated: true,
        role: 'SUPERVISOR',
        workerId: worker_id,
        userProfile: user ? {
          ...user,
          first_name: user.name ? user.name.split(' ')[0] : '',
          last_name: user.name ? user.name.split(' ').slice(1).join(' ') : '',
        } : null,
        isLoading: false,
      });

      get().fetchUserProfile();
    } catch (e: any) {
      set({ isLoading: false });
      throw e;
    }
  },

  loginAdmin: async (phone: string, pass: string) => {
    set({ isLoading: true });
    try {
      const res = await apiClient.post('/api/auth/admin-login/', {
        phone,
        password: pass
      });

      const { access, refresh, role, worker_id } = res.data;

      if (access) await secureStorage.setItem('access_token', access);
      if (refresh) await secureStorage.setItem('refresh_token', refresh);
      await secureStorage.setItem('user_role', 'ADMIN');
      await secureStorage.setItem('worker_id', String(worker_id));

      set({
        isAuthenticated: true,
        role: 'ADMIN',
        workerId: worker_id,
        userProfile: {
          id: worker_id,
          name: 'System Admin',
          role: 'Administrator'
        },
        isLoading: false,
      });

      get().fetchUserProfile();
    } catch (e: any) {
      set({ isLoading: false });
      throw e;
    }
  },

  fetchUserProfile: async () => {
    try {
      const res = await apiClient.get('/api/workers/me/');
      if (res.data) {
        set({
          userProfile: {
            ...res.data,
            first_name: res.data.name ? res.data.name.split(' ')[0] : '',
            last_name: res.data.name ? res.data.name.split(' ').slice(1).join(' ') : '',
            role: res.data.is_staff ? 'Supervisor' : 'Employee',
            zone: res.data.zone_detail ? res.data.zone_detail.name : 'Unassigned Zone',
            shift: res.data.shift_detail ? res.data.shift_detail.name : 'Standard Shift'
          }
        });
      }
    } catch (e) {
      console.warn("Could not fetch workers/me profile", e);
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await firebaseAuth.signOut();
      await secureStorage.deleteItem('access_token');
      await secureStorage.deleteItem('refresh_token');
      await secureStorage.deleteItem('user_role');
      await secureStorage.deleteItem('user_uid');
      await secureStorage.deleteItem('worker_id');

      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }

      set({
        isAuthenticated: false,
        role: null,
        workerId: null,
        userProfile: null,
        firebaseUser: null,
        isLoading: false,
      });
    } catch (e) {
      set({
        isAuthenticated: false,
        role: null,
        workerId: null,
        userProfile: null,
        firebaseUser: null,
        isLoading: false,
      });
    }
  },

  setLanguage: async (lang: string) => {
    try {
      await secureStorage.setItem('preferred_language', lang);
      set({ language: lang });
      await i18n.changeLanguage(lang);
    } catch (e) {
      console.error("Language save failed", e);
    }
  },

  loadSession: async () => {
    try {
      const role = await secureStorage.getItem('user_role');
      const token = await secureStorage.getItem('access_token');
      const lang = await secureStorage.getItem('preferred_language') || 'en';

      set({ language: lang });
      await i18n.changeLanguage(lang);

      if (role && token) {
        set({
          isAuthenticated: true,
          role: role as UserRole,
          isLoading: false,
        });
        get().fetchUserProfile();
      } else {
        await secureStorage.deleteItem('user_role');
        await secureStorage.deleteItem('access_token');
        set({
          isAuthenticated: false,
          role: null,
          userProfile: null,
          isLoading: false,
        });
      }
    } catch (e) {
      set({
        isAuthenticated: false,
        role: null,
        userProfile: null,
        isLoading: false,
      });
    }
  }
}));
