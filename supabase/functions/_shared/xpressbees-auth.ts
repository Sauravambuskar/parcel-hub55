// Shared XpressBees token helpers. XpressBees has TWO separate auth realms:
//   - ship.xpressbees.com   → franchise APIs (login: /api/users/franchise_login)
//   - shipment.xpressbees.com → standard B2C APIs (login: /api/users/login)
// Tokens from one host are NOT accepted by the other. We cache per host.
import { getXpressbeesConfig, type Environment } from "./environment.ts";

type Host = "ship" | "shipment";

const HOST_URL: Record<Host, string> = {
  ship: "https://ship.xpressbees.com",
  shipment: "https://shipment.xpressbees.com",
};

const LOGIN_PATH: Record<Host, string> = {
  ship: "/api/users/franchise_login",
  shipment: "/api/users/login",
};

interface CachedToken {
  token: string;
  expiresAt: number; // epoch ms
}

const tokenCache = new Map<string, CachedToken>(); // key = `${env}:${host}`

async function loginAt(host: Host, env: Environment): Promise<string> {
  const { email, password } = getXpressbeesConfig(env);
  if (!email || !password) {
    throw new Error("XpressBees credentials not configured (XPRESSBEES_PROD_EMAIL / XPRESSBEES_PROD_PASSWORD)");
  }
  const normalizedEmail = email.trim();
  const normalizedPassword = password.trim();
  const url = `${HOST_URL[host]}${LOGIN_PATH[host]}`;

  console.log("[xpressbees-auth] login", { host, url, email_suffix: normalizedEmail.slice(-6) });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email: normalizedEmail, password: normalizedPassword }),
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!res.ok || data?.status === false) {
    console.error("[xpressbees-auth] login failed", host, res.status, text.slice(0, 500));
    throw new Error(`XpressBees auth failed (${host}): ${data?.message || data?.error || res.status}`);
  }

  const token: string | undefined =
    data?.data || data?.token || data?.access_token ||
    data?.data?.token || data?.data?.access_token;
  if (!token || typeof token !== "string") {
    console.error("[xpressbees-auth] no token in response", host, text.slice(0, 500));
    throw new Error(`XpressBees auth response missing token (${host})`);
  }
  return token;
}

export async function getXpressbeesTokenFor(
  host: Host,
  env: Environment,
  forceRefresh = false,
): Promise<string> {
  const key = `${env}:${host}`;
  const cached = tokenCache.get(key);
  const now = Date.now();
  if (!forceRefresh && cached && cached.expiresAt - 60_000 > now) {
    return cached.token;
  }
  const token = await loginAt(host, env);
  tokenCache.set(key, { token, expiresAt: now + 5 * 60 * 60 * 1000 });
  return token;
}

// Back-compat: default to the franchise (ship) token.
export async function getXpressbeesToken(env: Environment, forceRefresh = false): Promise<string> {
  return getXpressbeesTokenFor("ship", env, forceRefresh);
}

export function invalidateXpressbeesToken(env: Environment, host: Host = "ship") {
  tokenCache.delete(`${env}:${host}`);
}

// Shipment/track/cancel APIs live on shipment.xpressbees.com and require the
// token issued by that host's /api/users/login endpoint.
export async function xpressbeesFetch(
  env: Environment,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const host: Host = "shipment";
  const url = path.startsWith("http") ? path : `${HOST_URL[host]}${path}`;

  let token = await getXpressbeesTokenFor(host, env);
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
    invalidateXpressbeesToken(env, host);
    token = await getXpressbeesTokenFor(host, env, true);
    res = await doFetch(token);
  }
  return res;
}
