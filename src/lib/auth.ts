// Centralized auth session helper.
// Reads the new `auth_session` key, with backward-compat fallback to legacy
// `prayog_auth` so existing logged-in users aren't kicked out after the
// Prayog removal migration.

export interface AuthSession {
  phone: string;          // Stored as +91XXXXXXXXXX
  user_id: string;        // Deterministic Base64 hash of phone
  customer_id: string;    // Same as user_id (kept for compat)
  userName?: string;
  full_name?: string;
  authenticated_at?: string;
}

const NEW_KEY = 'auth_session';
const LEGACY_KEY = 'prayog_auth';

export const getAuthSession = (): AuthSession | null => {
  try {
    const raw = localStorage.getItem(NEW_KEY) || localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.user_id) return null;
    return parsed as AuthSession;
  } catch {
    return null;
  }
};

export const setAuthSession = (session: AuthSession) => {
  localStorage.setItem(NEW_KEY, JSON.stringify(session));
  // Mirror to legacy key so any not-yet-migrated reader still works during
  // the transition window. Safe to remove later.
  localStorage.setItem(LEGACY_KEY, JSON.stringify(session));
};

export const clearAuthSession = () => {
  localStorage.removeItem(NEW_KEY);
  localStorage.removeItem(LEGACY_KEY);
};

export const isAuthenticated = (): boolean => Boolean(getAuthSession());

// Generate the deterministic user_id used since the Prayog era so existing
// accounts (and their bookings/profiles) are preserved.
export const deriveUserId = (phoneDigits: string): string => {
  const phoneWithCountryCode = `+91${phoneDigits}`;
  return btoa(phoneWithCountryCode).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);
};
