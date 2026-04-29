// Shared XpressBees token helpers — Franchise B2C API.
// Host: https://ship.xpressbees.com
// Login: POST /api/users/franchise_login
//   body: { username, password }  -> { status: true, data: "<token>" }
//
// Per user instruction (2026-04-29): use the franchise host + franchise_login
// endpoint with username/password (not email). All shipment endpoints sit
// under ship.xpressbees.com and authenticate with a Bearer token.
import { getXpressbeesConfig, type Environment } from "./environment.ts";

const BASE_URL = "https://ship.xpressbees.com";
const LOGIN_PATH = "/api/users/franchise_login";

interface CachedToken {
  token: string;
  expiresAt: number; // epoch ms
}

const tokenCache = new Map<string, CachedToken>(); // key = env

function resolveCreds(env: Environment): { username: string; password: string } {
  // Prefer the dedicated shipment.* (franchise) credentials if set, else
  // fall back to the generic XPRESSBEES_PROD_* credentials.
  const username =
    Deno.env.get("XPRESSBEES_SHIPMENT_EMAIL") ||
    Deno.env.get("XPRESSBEES_USERNAME") ||
    getXpressbeesConfig(env).email ||
    "";
  const password =
    Deno.env.get("XPRESSBEES_SHIPMENT_PASSWORD") ||
    Deno.env.get("XPRESSBEES_PASSWORD") ||
    getXpressbeesConfig(env).password ||
    "";
  return { username: username.trim(), password: password.trim() };
}

async function login(env: Environment): Promise<string> {
  const { username, password } = resolveCreds(env);
  if (!username || !password) {
    throw new Error(
      "XpressBees credentials not configured (XPRESSBEES_SHIPMENT_EMAIL/USERNAME and XPRESSBEES_SHIPMENT_PASSWORD)",
    );
  }
  const url = `${BASE_URL}${LOGIN_PATH}`;
  console.log("[xpressbees-auth] franchise_login", { url, user_suffix: username.slice(-6) });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!res.ok || data?.status === false) {
    console.error("[xpressbees-auth] login failed", res.status, text.slice(0, 500));
    throw new Error(`XpressBees auth failed: ${data?.message || data?.error || res.status}`);
  }

  const token: string | undefined =
    (typeof data?.data === "string" ? data.data : undefined) ||
    data?.token || data?.access_token ||
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

// All XpressBees franchise API calls go through ship.xpressbees.com.
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
