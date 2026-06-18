import { getStoredToken } from "../auth/authStorage";
import type { ApiObject } from "../types/api";

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers
  });

  const contentType = response.headers.get("content-type") ?? "";
  const hasJson = contentType.includes("application/json");
  const body = hasJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null && "message" in body
        ? String((body as { message?: unknown }).message)
        : `HTTP ${response.status}`;

    throw new Error(message);
  }

  return body as T;
}

export function normalizeArray(payload: unknown): ApiObject[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is ApiObject => {
      return typeof item === "object" && item !== null && !Array.isArray(item);
    });
  }

  if (typeof payload === "object" && payload !== null) {
    const candidateKeys = ["items", "data", "results", "value"];

    for (const key of candidateKeys) {
      const value = (payload as ApiObject)[key];

      if (Array.isArray(value)) {
        return value.filter((item): item is ApiObject => {
          return typeof item === "object" && item !== null && !Array.isArray(item);
        });
      }
    }
  }

  return [];
}
