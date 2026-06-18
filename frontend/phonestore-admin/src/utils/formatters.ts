export function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "Activo" : "Inactivo";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? String(value.length) : "";
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

export function getInitials(name?: string): string {
  if (!name || !name.trim()) {
    return "U";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
