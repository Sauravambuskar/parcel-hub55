// Shared XpressBees token helpers.
// Single host: https://ship.xpressbees.com
// Single login endpoint: POST /api/users/franchise_login
import { getXpressbeesConfig, type Environment } from "./environment.ts";

const BASE_URL = "https://ship.xpressbees.com";
const LOGIN_PATH = "/api/users/franchise_login";

interface CachedToken {
  token: string;
  expiresAt: number; // epoch ms
}

const tokenCache = new Map<string, CachedToken>(); // key = env

async function login(env: Environment): Promise<string> {
  const { email, password } = getXpressbeesConfig(env);
  if (!email || !password) {
    throw new Error(
      "XpressBees credentials not configured (XPRESSBEES_PROD_EMAIL / XPRESSBEES_PROD_PASSWORD)",
    );
  }
  const normalizedEmail = email.trim();
  const normalizedPassword = password.trim();
  const url = `${BASE_URL}${LOGIN_PATH}`;

  console.log("[xpressbees-auth] login", { url, email_suffix: normalizedEmail.slice(-6) });

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

  const token: string | undefined =
    data?.data || data?.token || data?.access_token ||
    data?.data?.token || data?.data?.access_token;
  if (!token || typeof token !== "string") {
    console.error("[xpressbees-auth] no token in response", text.slice(0, 500));
    throw new Error("XpressBees auth response missing token");
  }
  return token;
}

export async function getXpressbeesToken(
  env: Environment,
  forceRefresh = false,
): Promise<string> {
  const cached = tokenCache.get(env);
  const now = Date.now();
  if (!forceRefresh && cached && cached.expiresAt - 60_000 > now) {
    return cached.token;
  }
  const token = await login(env);
  tokenCache.set(env, { token, expiresAt: now + 5 * 60 * 60 * 1000 });
  return token;
}

export function invalidateXpressbeesToken(env: Environment) {
  tokenCache.delete(env);
}

// All XpressBees API calls go through ship.xpressbees.com.
export async function xpressbeesFetch(
  env: Environment,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

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
