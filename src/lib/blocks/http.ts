"use client";

import { BLOCKS_API_URL, BLOCKS_PROJECT_KEY, BLOCKS_STORAGE_API_URL, BLOCKS_STORAGE_BASE_PATH } from "./config";
import { getAccessToken, setAccessToken } from "./token-store";
import { toast } from "@/lib/toast-store";

export class BlocksApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`Blocks API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

function extractErrorMessage(errors: unknown): string {
  if (Array.isArray(errors)) {
    return errors.filter((e) => typeof e === "string").join("; ");
  }
  if (errors && typeof errors === "object") {
    return Object.entries(errors as Record<string, unknown>)
      .filter(([, value]) => typeof value === "string" && value.length > 0)
      .map(([key, value]) => `${key}: ${value as string}`)
      .join("; ");
  }
  return "";
}

/**
 * Many Blocks responses are HTTP 200 but carry a business-level failure —
 * `{isSuccess:false, errors:{...}}` (e.g. `/Files/GetFile` returning `{"access":
 * "forbidden"}` with every data field null). `!res.ok` never catches this since the
 * HTTP status is fine. Surface it as a toast and throw so callers see it as a failure
 * too, instead of quietly getting a body full of nulls.
 */
function assertBusinessSuccess(body: unknown): void {
  if (!body || typeof body !== "object") return;
  const { isSuccess, errors } = body as { isSuccess?: boolean; errors?: unknown };
  if (isSuccess !== false) return;
  const message = extractErrorMessage(errors) || "Something went wrong.";
  toast.error(message);
  throw new BlocksApiError(200, errors);
}

let refreshInFlight: Promise<string | null> | null = null;

/** Asks this app's Next.js backend to mint a fresh Blocks bearer token (see /api/auth/refresh). */
async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = fetch("/api/auth/refresh", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) {
          setAccessToken(null);
          return null;
        }
        const data = (await res.json()) as { accessToken: string };
        setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

/**
 * Calls a Blocks service directly from the browser with `Authorization: Bearer` + the
 * project key, retrying once via this app's own token refresh on a 401. `path` is
 * relative to the Blocks API host, e.g. `/iam/v4/iam/me` or `/data/v4/Files/GetFile?...`.
 */
export async function blocksFetch<T>(path: string, init: RequestInit = {}, _retried = false): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${BLOCKS_API_URL}${path}`, {
    ...init,
    headers: {
      "x-blocks-key": BLOCKS_PROJECT_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401 && !_retried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return blocksFetch<T>(path, init, true);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new BlocksApiError(res.status, body);
  }
  const body = await res.json();
  assertBusinessSuccess(body);
  return body as T;
}

/**
 * Same as blocksFetch, but for the DMS `/Files/*`, `/Directory/*`, and `/Content/*`
 * routes, which return flat bodies. Host and base path switch together via
 * `NEXT_PUBLIC_BLOCKS_STORAGE_MODE` (see config.ts): "local" hits a standalone instance
 * at `BLOCKS_STORAGE_API_URL` under `/api`; "live" hits the main Blocks gateway under
 * `/data/v4`, same host as IAM.
 */
export async function blocksFilesFetch<T>(path: string, init: RequestInit = {}, _retried = false): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${BLOCKS_STORAGE_API_URL}${BLOCKS_STORAGE_BASE_PATH}${path}`, {
    ...init,
    headers: {
      "x-blocks-key": BLOCKS_PROJECT_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401 && !_retried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return blocksFilesFetch<T>(path, init, true);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new BlocksApiError(res.status, body);
  }
  const body = await res.json();
  assertBusinessSuccess(body);
  return body as T;
}

/**
 * The Data Gateway (`/data/v4/gateway`) — one endpoint, standard GraphQL body
 * `{ query, variables }`. Same host as the rest of the Blocks API (`BLOCKS_API_URL`),
 * not the local storage service. Used for the BlxDrive schema (blocks-data-gateway-crud).
 */
export async function blocksGatewayFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  _retried = false
): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(`${BLOCKS_API_URL}/data/v4/gateway`, {
    method: "POST",
    headers: {
      "x-blocks-key": BLOCKS_PROJECT_KEY,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  if (res.status === 401 && !_retried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return blocksGatewayFetch<T>(query, variables, true);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new BlocksApiError(res.status, body);
  }
  const body = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (body.errors?.length) {
    throw new BlocksApiError(200, body.errors);
  }
  return body.data as T;
}

export { refreshAccessToken };
