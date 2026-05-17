"use client";

export const GOOGLE_SCOPES = {
  gmail:    "https://www.googleapis.com/auth/gmail.readonly",
  calendar: "https://www.googleapis.com/auth/calendar.readonly",
  drive:    "https://www.googleapis.com/auth/drive.readonly",
} as const;

export type GoogleSource = keyof typeof GOOGLE_SCOPES;

const TOKEN_KEY = "Omnis:google-tokens:v1";

type TokenStore = Partial<Record<GoogleSource, string>>;

function readTokens(): TokenStore {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(TOKEN_KEY) ?? "{}") as TokenStore;
  } catch {
    return {};
  }
}

export function getToken(source: GoogleSource): string | null {
  return readTokens()[source] ?? null;
}

export function clearToken(source: GoogleSource): void {
  const tokens = readTokens();
  delete tokens[source];
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

function storeToken(source: GoogleSource, token: string): void {
  const tokens = readTokens();
  tokens[source] = token;
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(opts: {
            client_id: string;
            scope: string;
            callback: (r: { access_token?: string; error?: string }) => void;
          }): { requestAccessToken(): void };
        };
      };
    };
  }
}

function ensureGIS(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts) { resolve(); return; }
    const existing = document.querySelector('script[src*="accounts.google.com/gsi"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Google Identity Services failed to load"));
    document.head.appendChild(s);
  });
}

export async function requestGoogleToken(source: GoogleSource): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set. Add it to .env.local and restart the dev server.",
    );
  }

  await ensureGIS();

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_SCOPES[source],
      callback: (r) => {
        if (r.error || !r.access_token) {
          reject(new Error(r.error ?? "OAuth cancelled or failed"));
          return;
        }
        storeToken(source, r.access_token);
        resolve(r.access_token);
      },
    });
    client.requestAccessToken();
  });
}
