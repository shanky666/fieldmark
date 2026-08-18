/**
 * Firebase Authentication – Android Native Implementation
 * Used on: Android (Metro automatically resolves .android.ts over .ts)
 *
 * Uses @react-native-firebase/auth which leverages Google Play Services
 * for SMS delivery and app attestation — no reCAPTCHA required.
 *
 * Requirements:
 *  - google-services.json must be in android/app/
 *  - App rebuilt with: npx expo run:android
 */
import auth from '@react-native-firebase/auth';

export const firebaseConfig = {
  // Config is read from google-services.json by the native Firebase SDK
  // These values are kept for reference only
  projectId: (process.env as any).EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'fieldmark-atia-c178d',
};

export interface FirebaseUser {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  role: 'WORKER' | 'SUPERVISOR' | 'ADMIN';
}

// ── Phone OTP service (Android Native) ────────────────────────────────────────

class FirebasePhoneAuthService {
  private confirmation: any = null;

  /**
   * Sends a real Firebase SMS OTP to the given phone number (E.164 format).
   * Firebase uses Play Integrity / SafetyNet for silent app attestation.
   * No reCAPTCHA widget required on Android.
   */
  async sendPhoneOTP(phone: string): Promise<void> {
    this.confirmation = await auth().signInWithPhoneNumber(phone);
  }

  /**
   * Verifies the OTP code and returns the Firebase ID token.
   */
  async confirmPhoneOTP(code: string): Promise<string> {
    if (!this.confirmation) {
      throw new Error('No pending OTP. Call sendPhoneOTP() first.');
    }
    const result = await this.confirmation.confirm(code);
    return result.user.getIdToken();
  }

  /**
   * Resets state (call when user changes number or on error).
   */
  reset(): void {
    this.confirmation = null;
  }
}

export const firebasePhoneAuth = new FirebasePhoneAuthService();

// ── Sign-out helper ────────────────────────────────────────────────────────────

class FirebaseAuthService {
  async signOut(): Promise<void> {
    try {
      await auth().signOut();
    } catch (_) {}
  }
}

export const firebaseAuth = new FirebaseAuthService();
