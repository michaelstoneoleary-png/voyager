import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

// Switch between prod and local dev
export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL ?? "https://bonvoyager.ai";

const SESSION_KEY = "bonvoyager_session";

export async function getSessionCookie(): Promise<string | null> {
  return SecureStore.getItemAsync(SESSION_KEY);
}

export async function setSessionCookie(cookie: string): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, cookie);
}

export async function clearSessionCookie(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

async function buildHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };
  const cookie = await getSessionCookie();
  if (cookie) headers["Cookie"] = cookie;
  return headers;
}

async function handleResponse(res: Response): Promise<Response> {
  // Capture Set-Cookie on login
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const match = setCookie.match(/connect\.sid=[^;]+/);
    if (match) await setSessionCookie(match[0]);
  }
  return res;
}

export async function apiGet<T>(path: string): Promise<T> {
  const headers = await buildHeaders();
  const res = await handleResponse(
    await fetch(`${API_BASE}${path}`, { headers })
  );
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const headers = await buildHeaders();
  const res = await handleResponse(
    await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message ?? `POST ${path} failed`);
  }
  return res.json();
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const headers = await buildHeaders();
  const res = await handleResponse(
    await fetch(`${API_BASE}${path}`, {
      method: "PUT",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  );
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
  return res.json();
}

// Auth
export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const match = setCookie.match(/connect\.sid=[^;]+/);
    if (match) await setSessionCookie(match[0]);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Login failed" }));
    throw new Error(err.message ?? "Login failed");
  }
  return res.json();
}

export async function logout() {
  const headers = await buildHeaders();
  await fetch(`${API_BASE}/api/auth/logout`, { method: "POST", headers });
  await clearSessionCookie();
}

export async function checkAuth() {
  const headers = await buildHeaders();
  const res = await fetch(`${API_BASE}/api/user-settings`, { headers });
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}

export async function signInWithGoogleMobile(): Promise<unknown> {
  // Open the server's mobile Google OAuth route in an in-app browser.
  // The server will redirect back to bonvoyager://auth-callback?code=XXX,
  // which closes the browser and returns the URL here.
  const result = await WebBrowser.openAuthSessionAsync(
    `${API_BASE}/api/auth/google/mobile`,
    "bonvoyager://auth-callback",
  );

  if (result.type !== "success") {
    throw new Error("Google sign-in was cancelled");
  }

  // Parse the one-time code from the redirect URL
  const parsed = Linking.parse(result.url);
  const code = parsed.queryParams?.code;
  if (!code || typeof code !== "string") {
    throw new Error("Missing code in redirect URL");
  }

  // Exchange the code for a signed session cookie
  const exchangeRes = await fetch(
    `${API_BASE}/api/auth/mobile/exchange?code=${encodeURIComponent(code)}`,
  );
  if (!exchangeRes.ok) {
    const err = await exchangeRes.json().catch(() => ({ message: "Exchange failed" }));
    throw new Error(err.message ?? "Failed to exchange code");
  }
  const { cookie } = await exchangeRes.json();
  await setSessionCookie(cookie);

  // Fetch the authenticated user
  const headers = await buildHeaders();
  const userRes = await fetch(`${API_BASE}/api/auth/user`, { headers });
  if (!userRes.ok) throw new Error("Failed to fetch user after Google sign-in");
  return userRes.json();
}
