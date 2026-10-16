export type AuthSessionKey =
  | "access_token"
  | "userEmail"
  | "userName"
  | "userRole";

const AUTH_SESSION_KEYS: AuthSessionKey[] = [
  "access_token",
  "userEmail",
  "userName",
  "userRole",
];

export function getAuthSessionValue(key: AuthSessionKey): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(key);
}

export function setAuthSessionValue(
  key: AuthSessionKey,
  value: string,
): void {
  window.sessionStorage.setItem(key, value);
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;

  for (const key of AUTH_SESSION_KEYS) {
    window.sessionStorage.removeItem(key);
    window.localStorage.removeItem(key);
  }
  window.localStorage.removeItem("token");
  window.localStorage.removeItem("email");
}
