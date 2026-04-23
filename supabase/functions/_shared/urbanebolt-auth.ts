// Shared Urbanebolt token helper. Caches JWT in-memory per function instance.
import { getUrbaneboltConfig, type Environment } from "./environment.ts";

interface CachedToken {
  token: string;
  expiresAt: number; // epoch ms
}

const tokenCache = new Map<Environment, CachedToken>();

export async function getUrbaneboltToken(env: Environment, forceRefresh = false): Promise<string> {
  const cached = tokenCache.get(env);
  const now = Date.now();
  // Refresh 60s before expiry
  if (!forceRefresh && cached && cached.expiresAt - 60_000 > now) {
    return cached.token;
  }

  const { apiBaseUrl, username, password } = getUrbaneboltConfig(env);
  if (!username || !password) {
    throw new Error("Urbanebolt credentials not configured (URBANEBOLT_PROD_USERNAME / URBANEBOLT_PROD_PASSWORD)");
  }

  const url = `${apiBaseUrl}/api/v1/auth/getToken/`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!res.ok) {
    console.error("[urbanebolt-auth] token fetch failed", res.status, text.slice(0, 500));
    throw new Error(`Urbanebolt auth failed: ${data?.message || data?.detail || res.status}`);
  }

  // Tokens commonly returned under "access" / "token" / "data.token"
  const token: string | undefined =
    data?.access || data?.token || data?.data?.token || data?.data?.access;
  if (!token) {
    console.error("[urbanebolt-auth] no token in response", text.slice(0, 500));
    throw new Error("Urbanebolt auth response missing token");
  }

  // Default to 50 minute lifetime if API does not specify
  const expiresInSec = Number(data?.expires_in || data?.data?.expires_in || 3000);
  tokenCache.set(env, {
    token,
    expiresAt: now + expiresInSec * 1000,
  });
  return token;
}

export function invalidateUrbaneboltToken(env: Environment) {
  tokenCache.delete(env);
}

// Helper: call Urbanebolt API, auto-retry once on 401 with a fresh token.
export async function urbaneboltFetch(
  env: Environment,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const { apiBaseUrl } = getUrbaneboltConfig(env);
  const url = path.startsWith("http") ? path : `${apiBaseUrl}${path}`;
  let token = await getUrbaneboltToken(env);
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
    invalidateUrbaneboltToken(env);
    token = await getUrbaneboltToken(env, true);
    res = await doFetch(token);
  }
  return res;
}
