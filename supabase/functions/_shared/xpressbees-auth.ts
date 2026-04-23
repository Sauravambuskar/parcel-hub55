// Shared XpressBees franchise B2C token helper. Caches JWT in-memory per function instance.
import { getXpressbeesConfig, type Environment } from "./environment.ts";

interface CachedToken {
  token: string;
  expiresAt: number; // epoch ms
}

const tokenCache = new Map<Environment, CachedToken>();

export async function getXpressbeesToken(env: Environment, forceRefresh = false): Promise<string> {
  const cached = tokenCache.get(env);
  const now = Date.now();
  // Refresh 60s before expiry
  if (!forceRefresh && cached && cached.expiresAt - 60_000 > now) {
    return cached.token;
  }

  const { apiBaseUrl, email, password } = getXpressbeesConfig(env);
  if (!email || !password) {
    throw new Error("XpressBees credentials not configured (XPRESSBEES_PROD_EMAIL / XPRESSBEES_PROD_PASSWORD)");
  }

  const normalizedEmail = email.trim();
  const normalizedPassword = password.trim();

  console.log("[xpressbees-auth] cred check", {
    email_len: email.length,
    email_trimmed_len: normalizedEmail.length,
    email_prefix: normalizedEmail.slice(0, 2),
    email_suffix: normalizedEmail.slice(-6),
    email_trimmed_diff: email.length - normalizedEmail.length,
    pwd_len: password.length,
    pwd_trimmed_len: normalizedPassword.length,
    pwd_trimmed_diff: password.length - normalizedPassword.length,
    base: apiBaseUrl,
  });

  const url = `${apiBaseUrl}/api/users/franchise_login`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: normalizedEmail, password: normalizedPassword }),
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!res.ok || data?.status === false) {
    console.error("[xpressbees-auth] login failed", res.status, text.slice(0, 500));
    throw new Error(`XpressBees auth failed: ${data?.message || data?.error || res.status}`);
  }

  // XpressBees returns { status: true, data: "<JWT>" } per franchise docs.
  const token: string | undefined =
    data?.data || data?.token || data?.access_token ||
    data?.data?.token || data?.data?.access_token;
  if (!token || typeof token !== "string") {
    console.error("[xpressbees-auth] no token in response", text.slice(0, 500));
    throw new Error("XpressBees auth response missing token");
  }

  // XpressBees JWTs are typically valid ~6 hours. Default to 5 hours if not specified.
  tokenCache.set(env, {
    token,
    expiresAt: now + 5 * 60 * 60 * 1000,
  });
  return token;
}

export function invalidateXpressbeesToken(env: Environment) {
  tokenCache.delete(env);
}

// Helper: call XpressBees API, auto-retry once on 401 with a fresh token.
// NOTE: Auth/login lives on ship.xpressbees.com, but shipment/track/cancel
// endpoints are served by shipment.xpressbees.com. We rewrite the host here.
const SHIPMENT_HOST = "https://shipment.xpressbees.com";

export async function xpressbeesFetch(
  env: Environment,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${SHIPMENT_HOST}${path}`;
  let token = await getXpressbeesToken(env);
  const doFetch = (t: string) =>
    fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${t}`,
        ...(init.headers || {}),
      },
    });
  let res = await doFetch(token);
  if (res.status === 401) {
    invalidateXpressbeesToken(env);
    token = await getXpressbeesToken(env, true);
    res = await doFetch(token);
  }
  return res;
}
