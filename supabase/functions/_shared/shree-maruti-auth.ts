// Shared Shree Maruti (Innofulfill / Delcaper) auth helper.
// Caches the JWT access token in-memory per function instance and refreshes
// 5 minutes before expiry. Auto-retries one time on 401 with a forced refresh.
import { getShreeMarutiConfig, type Environment } from "./environment.ts";

interface CachedToken {
  token: string;
  expiresAt: number; // epoch ms
}

const tokenCache = new Map<Environment, CachedToken>();

export async function getShreeMarutiToken(
  env: Environment,
  forceRefresh = false,
): Promise<string> {
  const cached = tokenCache.get(env);
  const now = Date.now();
  // Refresh 5 min before expiry
  if (!forceRefresh && cached && cached.expiresAt - 300_000 > now) {
    return cached.token;
  }

  const { apiBaseUrl, email, password, vendorType } = getShreeMarutiConfig(env);
  if (!email || !password) {
    throw new Error(
      "Shree Maruti credentials not configured (SHREE_MARUTI_PROD_EMAIL / SHREE_MARUTI_PROD_PASSWORD)",
    );
  }

  const url = `${apiBaseUrl}/auth/login`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password, vendorType }),
  });
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    console.error(
      "[shree-maruti-auth] login failed",
      res.status,
      text.slice(0, 500),
    );
    throw new Error(
      `Shree Maruti auth failed: ${data?.message || data?.error || res.status}`,
    );
  }

  // Docs return: { data: { accessToken, expiresIn: "1d", refreshToken, ... }, status: 200 }
  const token: string | undefined =
    data?.data?.accessToken ||
    data?.accessToken ||
    data?.data?.access_token ||
    data?.access_token;
  if (!token) {
    console.error(
      "[shree-maruti-auth] no token in response",
      text.slice(0, 500),
    );
    throw new Error("Shree Maruti auth response missing accessToken");
  }

  const expiresInRaw =
    data?.data?.expiresIn || data?.expiresIn || "1d";
  const expiresInMs = parseDuration(expiresInRaw);
  tokenCache.set(env, { token, expiresAt: now + expiresInMs });
  return token;
}

export function invalidateShreeMarutiToken(env: Environment) {
  tokenCache.delete(env);
}

// Convenience fetch: prefixes base URL, attaches Bearer token, retries once on 401.
export async function shreeMarutiFetch(
  env: Environment,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const { apiBaseUrl } = getShreeMarutiConfig(env);
  const url = path.startsWith("http") ? path : `${apiBaseUrl}${path}`;
  let token = await getShreeMarutiToken(env);
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
    invalidateShreeMarutiToken(env);
    token = await getShreeMarutiToken(env, true);
    res = await doFetch(token);
  }
  return res;
}

// Parses Shree Maruti's "1d" / "30d" / "60m" / "3600s" / numeric-seconds expiry.
function parseDuration(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value * 1000; // assume seconds
  }
  if (typeof value !== "string") return 24 * 60 * 60 * 1000;
  const m = value.trim().match(/^(\d+(?:\.\d+)?)\s*([smhd])?$/i);
  if (!m) return 24 * 60 * 60 * 1000;
  const n = Number(m[1]);
  const unit = (m[2] || "s").toLowerCase();
  const mult =
    unit === "d" ? 86_400_000 :
    unit === "h" ? 3_600_000 :
    unit === "m" ? 60_000 :
    1000;
  return n * mult;
}
