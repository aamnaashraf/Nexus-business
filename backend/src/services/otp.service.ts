import crypto from 'crypto';

interface OtpRecord {
  otp: string;
  expiresAt: number;
  attempts: number;
}

// In-memory store — sufficient for a mock flow; no persistence needed
const store = new Map<string, OtpRecord>();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 3;

export class OtpService {
  /** Generate and store a 6-digit OTP keyed by (lowercase) email. */
  generate(email: string): string {
    const key = email.toLowerCase();
    // Cryptographically random 6-digit code
    const otp = (crypto.randomInt(0, 1_000_000)).toString().padStart(6, '0');
    store.set(key, { otp, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
    return otp;
  }

  /** Verify the OTP. Returns { valid, message }. Deletes the record on success. */
  verify(email: string, otp: string): { valid: boolean; message: string } {
    const key = email.toLowerCase();
    const record = store.get(key);

    if (!record) {
      return { valid: false, message: 'No OTP found for this email. Please request a new one.' };
    }

    if (Date.now() > record.expiresAt) {
      store.delete(key);
      return { valid: false, message: 'OTP has expired. Please request a new one.' };
    }

    record.attempts += 1;

    if (record.attempts > MAX_ATTEMPTS) {
      store.delete(key);
      return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
    }

    if (record.otp !== otp.trim()) {
      return {
        valid: false,
        message: `Invalid OTP. ${MAX_ATTEMPTS - record.attempts} attempt(s) remaining.`,
      };
    }

    store.delete(key); // One-time use
    return { valid: true, message: 'OTP verified successfully.' };
  }

  /** Check if a pending (non-expired) OTP exists for this email. */
  hasPending(email: string): boolean {
    const record = store.get(email.toLowerCase());
    if (!record) return false;
    if (Date.now() > record.expiresAt) {
      store.delete(email.toLowerCase());
      return false;
    }
    return true;
  }
}
