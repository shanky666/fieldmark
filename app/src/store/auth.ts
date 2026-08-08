import { create } from 'zustand';
import { secureStorage } from '../utils/secureStorage';
import i18n from 'i18next';
import { firebaseAuth } from '../config/firebase';
import { apiClient } from '../api/client';

export type UserRole = 'WORKER' | 'SUPERVISOR' | 'ADMIN' | null;

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingIn: boolean;

  role: UserRole;
  workerId: number | null;
  language: string;
  userProfile: any | null;
  firebaseUser: any | null;
  registerUser: (data: { name: string; employee_id: string; phone: string; role: string; password?: string; assigned_zone_id?: number }) => Promise<void>;
  loginWorker: (identifier: string, password: string, firebaseIdToken?: string) => Promise<void>;
  loginSupervisor: (identifier: string, password: string, firebaseIdToken?: string) => Promise<void>;
  loginAdmin: (phone: string, pass: string) => Promise<void>;
  fetchUserProfile: () => Promise<void>;

  logout: () => Promise<void>;

  setLanguage: (lang: string) => Promise<void>;

  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // --------------------------------------------------------------------------
  // INITIAL STATE
  // --------------------------------------------------------------------------

  isAuthenticated: false,
  isLoading: true,
  isLoggingIn: false,

  role: null,
  workerId: null,
  language: 'en',
  userProfile: null,
  firebaseUser: null,

  // --------------------------------------------------------------------------
  // REGISTER USER
  // --------------------------------------------------------------------------

  registerUser: async (data) => {
    set({
      isLoading: true,
      isLoggingIn: true,
    });

    try {
      console.log('[REGISTER] Starting registration');

      const res = await apiClient.post(
        '/api/auth/register/',
        data
      );

      const {
        access,
        refresh,
        role,
        worker,
      } = res.data;

      // Save tokens
      if (access) {
        await secureStorage.setItem(
          'access_token',
          access
        );
      }

      if (refresh) {
        await secureStorage.setItem(
          'refresh_token',
          refresh
        );
      }

      await secureStorage.setItem(
        'user_role',
        role
      );

      await secureStorage.setItem(
        'worker_id',
        String(worker.id)
      );

      const userRole =
        role === 'SUPERVISOR'
          ? 'SUPERVISOR'
          : 'WORKER';

      set({
        isAuthenticated: true,
        isLoggingIn: false,
        role: userRole,
        workerId: worker.id,

        userProfile: {
          id: worker.id,
          name: worker.name,
          first_name: worker.name.split(' ')[0],
          last_name: worker.name
            .split(' ')
            .slice(1)
            .join(' '),
          employee_id: worker.employee_id,
          phone: worker.phone,
          role:
            role === 'SUPERVISOR'
              ? 'Supervisor'
              : 'Employee',
        },

        isLoading: false,
      });

      console.log(
        '[REGISTER] Authentication state set successfully'
      );

      await get().fetchUserProfile();

    } catch (e: any) {
      console.error(
        '[REGISTER] Failed:',
        e
      );

      set({
        isLoading: false,
        isLoggingIn: false,
      });

      throw e;
    }
  },

  // --------------------------------------------------------------------------
  // WORKER LOGIN
  // --------------------------------------------------------------------------

  loginWorker: async (
    identifier: string,
    password: string
  ) => {
    set({
      isLoading: true,
      isLoggingIn: true,
    });

    console.log(
      '[LOGIN] START:',
      identifier
    );

    try {
      // ----------------------------------------------------
      // API LOGIN
      // ----------------------------------------------------

      const res = await apiClient.post(
        '/api/auth/login/',
        {
          identifier,
          password,
        }
      );

      console.log(
        '[LOGIN] API STATUS:',
        res.status
      );

      const {
        access,
        refresh,
        role,
        worker_id,
        user,
      } = res.data;

      console.log(
        '[LOGIN] ACCESS TOKEN:',
        !!access
      );

      console.log(
        '[LOGIN] REFRESH TOKEN:',
        !!refresh
      );

      console.log(
        '[LOGIN] WORKER ID:',
        worker_id
      );

      // ----------------------------------------------------
      // SAVE ACCESS TOKEN
      // ----------------------------------------------------

      if (access) {
        await secureStorage.setItem(
          'access_token',
          access
        );

        console.log(
          '[LOGIN] access_token saved'
        );
      }

      // ----------------------------------------------------
      // SAVE REFRESH TOKEN
      // ----------------------------------------------------

      if (refresh) {
        await secureStorage.setItem(
          'refresh_token',
          refresh
        );

        console.log(
          '[LOGIN] refresh_token saved'
        );
      }

      // ----------------------------------------------------
      // SAVE ROLE
      // ----------------------------------------------------

      await secureStorage.setItem(
        'user_role',
        role || 'WORKER'
      );

      console.log(
        '[LOGIN] user_role saved:',
        role || 'WORKER'
      );

      // ----------------------------------------------------
      // SAVE WORKER ID
      // ----------------------------------------------------

      if (worker_id) {
        await secureStorage.setItem(
          'worker_id',
          String(worker_id)
        );

        console.log(
          '[LOGIN] worker_id saved:',
          worker_id
        );
      }

      // ----------------------------------------------------
      // VERIFY TOKEN WAS REALLY SAVED
      // ----------------------------------------------------

      const savedToken =
        await secureStorage.getItem(
          'access_token'
        );

      const savedRole =
        await secureStorage.getItem(
          'user_role'
        );

      const savedWorkerId =
        await secureStorage.getItem(
          'worker_id'
        );

      console.log(
        '[LOGIN] TOKEN READ BACK:',
        !!savedToken
      );

      console.log(
        '[LOGIN] ROLE READ BACK:',
        savedRole
      );

      console.log(
        '[LOGIN] WORKER ID READ BACK:',
        savedWorkerId
      );

      // ----------------------------------------------------
      // IMPORTANT:
      // UPDATE AUTH STATE ONLY AFTER STORAGE IS COMPLETE
      // ----------------------------------------------------

      set({
        isAuthenticated: true,
        isLoggingIn: false,

        role: 'WORKER',

        workerId: worker_id
          ? Number(worker_id)
          : null,

        userProfile: user
          ? {
              ...user,

              first_name:
                user.name
                  ? user.name.split(' ')[0]
                  : '',

              last_name:
                user.name
                  ? user.name
                      .split(' ')
                      .slice(1)
                      .join(' ')
                  : '',
            }
          : null,

        isLoading: false,
      });

      console.log(
        '[LOGIN] AUTH STATE = TRUE'
      );

      console.log(
        '[LOGIN] ROLE = WORKER'
      );

      // ----------------------------------------------------
      // FETCH FULL PROFILE
      // ----------------------------------------------------

      await get().fetchUserProfile();

      console.log(
        '[LOGIN] PROFILE FETCH COMPLETE'
      );

    } catch (e: any) {
      console.error(
        '[LOGIN] FAILED:',
        e?.response?.data || e?.message || e
      );

      set({
        isAuthenticated: false,
        isLoading: false,
        isLoggingIn: false,
      });

      throw e;
    }
  },

  // --------------------------------------------------------------------------
  // SUPERVISOR LOGIN
  // --------------------------------------------------------------------------

  loginSupervisor: async (
    identifier: string,
    password: string
  ) => {
    set({
      isLoading: true,
      isLoggingIn: true,
    });

    try {
      console.log(
        '[SUPERVISOR LOGIN] START:',
        identifier
      );

      const res = await apiClient.post(
        '/api/auth/login/',
        {
          identifier,
          password,
        }
      );

      const {
        access,
        refresh,
        role,
        worker_id,
        user,
      } = res.data;

      if (access) {
        await secureStorage.setItem(
          'access_token',
          access
        );
      }

      if (refresh) {
        await secureStorage.setItem(
          'refresh_token',
          refresh
        );
      }

      await secureStorage.setItem(
        'user_role',
        role || 'SUPERVISOR'
      );

      if (worker_id) {
        await secureStorage.setItem(
          'worker_id',
          String(worker_id)
        );
      }

      // Verify storage
      const savedToken =
        await secureStorage.getItem(
          'access_token'
        );

      console.log(
        '[SUPERVISOR LOGIN] TOKEN SAVED:',
        !!savedToken
      );

      set({
        isAuthenticated: true,
        isLoggingIn: false,

        role: 'SUPERVISOR',

        workerId: worker_id
          ? Number(worker_id)
          : null,

        userProfile: user
          ? {
              ...user,

              first_name:
                user.name
                  ? user.name.split(' ')[0]
                  : '',

              last_name:
                user.name
                  ? user.name
                      .split(' ')
                      .slice(1)
                      .join(' ')
                  : '',
            }
          : null,

        isLoading: false,
      });

      console.log(
        '[SUPERVISOR LOGIN] AUTH STATE = TRUE'
      );

      await get().fetchUserProfile();

    } catch (e: any) {
      console.error(
        '[SUPERVISOR LOGIN] FAILED:',
        e?.response?.data || e?.message || e
      );

      set({
        isLoading: false,
        isLoggingIn: false,
        isAuthenticated: false,
      });

      throw e;
    }
  },

  // --------------------------------------------------------------------------
  // ADMIN LOGIN
  // --------------------------------------------------------------------------

  loginAdmin: async (
    phone: string,
    pass: string
  ) => {
    set({
      isLoading: true,
      isLoggingIn: true,
    });

    try {
      console.log(
        '[ADMIN LOGIN] START'
      );

      const res = await apiClient.post(
        '/api/auth/admin-login/',
        {
          phone,
          password: pass,
        }
      );

      const {
        access,
        refresh,
        worker_id,
      } = res.data;

      if (access) {
        await secureStorage.setItem(
          'access_token',
          access
        );
      }

      if (refresh) {
        await secureStorage.setItem(
          'refresh_token',
          refresh
        );
      }

      await secureStorage.setItem(
        'user_role',
        'ADMIN'
      );

      if (worker_id) {
        await secureStorage.setItem(
          'worker_id',
          String(worker_id)
        );
      }

      const savedToken =
        await secureStorage.getItem(
          'access_token'
        );

      console.log(
        '[ADMIN LOGIN] TOKEN SAVED:',
        !!savedToken
      );

      set({
        isAuthenticated: true,
        isLoggingIn: false,

        role: 'ADMIN',

        workerId: worker_id
          ? Number(worker_id)
          : null,

        userProfile: {
          id: worker_id,
          name: 'System Admin',
          role: 'Administrator',
        },

        isLoading: false,
      });

      console.log(
        '[ADMIN LOGIN] AUTH STATE = TRUE'
      );

      await get().fetchUserProfile();

    } catch (e: any) {
      console.error(
        '[ADMIN LOGIN] FAILED:',
        e?.response?.data || e?.message || e
      );

      set({
        isLoading: false,
        isLoggingIn: false,
        isAuthenticated: false,
      });

      throw e;
    }
  },

  // --------------------------------------------------------------------------
  // FETCH USER PROFILE
  // --------------------------------------------------------------------------

  fetchUserProfile: async () => {
    try {
      console.log(
        '[PROFILE] Fetching /api/workers/me/'
      );

      const res = await apiClient.get(
        '/api/workers/me/'
      );

      if (res.data) {
        set({
          userProfile: {
            ...res.data,

            first_name:
              res.data.name
                ? res.data.name.split(' ')[0]
                : '',

            last_name:
              res.data.name
                ? res.data.name
                    .split(' ')
                    .slice(1)
                    .join(' ')
                : '',

            role:
              res.data.is_staff
                ? 'Supervisor'
                : 'Employee',

            zone:
              res.data.zone_detail
                ? res.data.zone_detail.name
                : 'Unassigned Zone',

            shift:
              res.data.shift_detail
                ? res.data.shift_detail.name
                : 'Standard Shift',
          },
        });

        console.log(
          '[PROFILE] Profile loaded'
        );
      }

    } catch (e: any) {
      console.warn(
        '[PROFILE] Could not fetch workers/me profile:',
        e?.response?.data || e?.message || e
      );
    }
  },

  // --------------------------------------------------------------------------
  // LOGOUT
  // --------------------------------------------------------------------------

  logout: async () => {
    set({
      isLoading: true,
    });

    try {
      await firebaseAuth.signOut();

      await secureStorage.deleteItem(
        'access_token'
      );

      await secureStorage.deleteItem(
        'refresh_token'
      );

      await secureStorage.deleteItem(
        'user_role'
      );

      await secureStorage.deleteItem(
        'user_uid'
      );

      await secureStorage.deleteItem(
        'worker_id'
      );

      if (
        typeof window !== 'undefined' &&
        window.localStorage
      ) {
        window.localStorage.clear();
      }

      set({
        isAuthenticated: false,
        isLoggingIn: false,
        role: null,
        workerId: null,
        userProfile: null,
        firebaseUser: null,
        isLoading: false,
      });

    } catch (e) {
      set({
        isAuthenticated: false,
        isLoggingIn: false,
        role: null,
        workerId: null,
        userProfile: null,
        firebaseUser: null,
        isLoading: false,
      });
    }
  },

  // --------------------------------------------------------------------------
  // LANGUAGE
  // --------------------------------------------------------------------------

  setLanguage: async (
    lang: string
  ) => {
    try {
      await secureStorage.setItem(
        'preferred_language',
        lang
      );

      set({
        language: lang,
      });

      await i18n.changeLanguage(
        lang
      );

    } catch (e) {
      console.error(
        'Language save failed',
        e
      );
    }
  },

  // --------------------------------------------------------------------------
  // LOAD SESSION
  // --------------------------------------------------------------------------

  loadSession: async () => {
    // ==========================================================
    // IMPORTANT FIX
    // Do NOT let loadSession interfere with an active login.
    // ==========================================================

    if (get().isLoggingIn) {
      console.log(
        '[SESSION] Skipping loadSession - login in progress'
      );

      return;
    }

    // If already authenticated, don't reset the state.
    if (
      get().isAuthenticated &&
      get().role
    ) {
      console.log(
        '[SESSION] Already authenticated - skipping'
      );

      return;
    }

    console.log(
      '[SESSION] Loading stored session...'
    );

    try {
      const [
        role,
        token,
        workerId,
        lang,
      ] = await Promise.all([
        secureStorage.getItem(
          'user_role'
        ),

        secureStorage.getItem(
          'access_token'
        ),

        secureStorage.getItem(
          'worker_id'
        ),

        secureStorage.getItem(
          'preferred_language'
        ),
      ]);

      const selectedLanguage =
        lang || 'en';

      console.log(
        '[SESSION] token:',
        !!token
      );

      console.log(
        '[SESSION] role:',
        role
      );

      console.log(
        '[SESSION] workerId:',
        workerId
      );

      set({
        language: selectedLanguage,
      });

      await i18n.changeLanguage(
        selectedLanguage
      );

      // --------------------------------------------------------
      // VALID SESSION
      // --------------------------------------------------------

      if (role && token) {

        set({
          isAuthenticated: true,

          role:
            role as UserRole,

          workerId:
            workerId
              ? Number(workerId)
              : null,

          isLoading: false,
        });

        console.log(
          '[SESSION] Existing session restored'
        );

        await get().fetchUserProfile();

        return;
      }

      // --------------------------------------------------------
      // NO VALID SESSION
      // --------------------------------------------------------

      console.log(
        '[SESSION] No stored session'
      );

      await secureStorage.deleteItem(
        'user_role'
      );

      await secureStorage.deleteItem(
        'access_token'
      );

      await secureStorage.deleteItem(
        'refresh_token'
      );

      await secureStorage.deleteItem(
        'worker_id'
      );

      set({
        isAuthenticated: false,
        role: null,
        workerId: null,
        userProfile: null,
        isLoading: false,
      });

    } catch (e: any) {
      console.error(
        '[SESSION] loadSession failed:',
        e?.message || e
      );

      // Do not incorrectly authenticate.
      set({
        isAuthenticated: false,
        role: null,
        workerId: null,
        userProfile: null,
        isLoading: false,
      });
    }
  },
}));