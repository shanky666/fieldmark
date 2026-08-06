/**
 * Firebase Authentication – Web Implementation
 * Used on: Web (via Metro web bundler)
 *
 * Android uses firebase.android.ts (Metro picks it automatically)
 */
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';

const env = process.env as any;

export const firebaseConfig = {
  apiKey:            env.EXPO_PUBLIC_FIREBASE_API_KEY            || 'AIzaSyCf_heThSYHIUDQVu85RbSqAvOqDtzLtIA',
  authDomain:        env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN        || 'atia-fpo.firebaseapp.com',
  projectId:         env.EXPO_PUBLIC_FIREBASE_PROJECT_ID         || 'atia-fpo',
  storageBucket:     env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET     || 'atia-fpo.firebasestorage.app',
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID|| '709305379833',
  appId:             env.EXPO_PUBLIC_FIREBASE_APP_ID             || '1:709305379833:web:cc550f8f2833507e7a6b28',
  measurementId:     env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID     || 'G-VBYL2F1RR9',
};

export interface FirebaseUser {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  role: 'WORKER' | 'SUPERVISOR' | 'ADMIN';
}

const getFirebaseApp = () =>
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ── Phone OTP service (Web) ────────────────────────────────────────────────────

class FirebasePhoneAuthService {
  private confirmation: ConfirmationResult | null = null;
  private recaptchaVerifier: RecaptchaVerifier | null = null;

  async sendPhoneOTP(phone: string): Promise<void> {
    const auth = getFirebaseApp() && getAuth(getFirebaseApp());
    auth.languageCode = 'en';

    if (this.recaptchaVerifier) {
      try { this.recaptchaVerifier.clear(); } catch (_) {}
      this.recaptchaVerifier = null;
    }

    const existing = document.getElementById('firebase-recaptcha-container');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'firebase-recaptcha-container';
    container.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%',
      'transform:translate(-50%,-50%)', 'z-index:999999',
      'background:white', 'padding:24px', 'border-radius:16px',
      'box-shadow:0 8px 40px rgba(0,0,0,0.25)',
      'display:flex', 'flex-direction:column', 'align-items:center', 'gap:12px',
    ].join(';');

    const label = document.createElement('p');
    label.textContent = "Please verify you're human to receive your OTP";
    label.style.cssText = 'margin:0;font-size:14px;color:#374151;font-weight:600;text-align:center;font-family:sans-serif;';
    container.appendChild(label);

    const widgetHolder = document.createElement('div');
    widgetHolder.id = 'firebase-recaptcha-widget';
    container.appendChild(widgetHolder);
    document.body.appendChild(container);

    this.recaptchaVerifier = new RecaptchaVerifier(auth, 'firebase-recaptcha-widget', {
      size: 'normal',
      'expired-callback': () => { this.reset(); },
    });

    try {
      await this.recaptchaVerifier.render();
      this.confirmation = await signInWithPhoneNumber(auth, phone, this.recaptchaVerifier);
    } finally {
      const c = document.getElementById('firebase-recaptcha-container');
      if (c) c.remove();
    }
  }

  async confirmPhoneOTP(code: string): Promise<string> {
    if (!this.confirmation) throw new Error('No pending OTP. Call sendPhoneOTP() first.');
    const result = await this.confirmation.confirm(code);
    return result.user.getIdToken();
  }

  reset(): void {
    this.confirmation = null;
    if (this.recaptchaVerifier) {
      try { this.recaptchaVerifier.clear(); } catch (_) {}
      this.recaptchaVerifier = null;
    }
    const c = document.getElementById('firebase-recaptcha-container');
    if (c) c.remove();
  }
}

export const firebasePhoneAuth = new FirebasePhoneAuthService();

// ── Sign-out helper ────────────────────────────────────────────────────────────

class FirebaseAuthService {
  async signOut(): Promise<void> {
    try {
      const auth = getAuth(getFirebaseApp());
      await auth.signOut();
    } catch (_) {}
  }
}

export const firebaseAuth = new FirebaseAuthService();
