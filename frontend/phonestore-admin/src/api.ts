export type ApiObject = Record<string, unknown>;

const TOKEN_KEY = "phonestore_access_token";

export function getStoredToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

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

export function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "Sí" : "No";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toLocaleString();
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export function formatShortId(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);

  return text.length > 8 ? text.slice(0, 8) : text;
}

export function formatDate(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function formatMoney(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
  }).format(amount);
}

export function formatActive(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "Activo" : "Inactivo";
  }

  return String(value);
}
