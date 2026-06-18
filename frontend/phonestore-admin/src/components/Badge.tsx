export function Badge(props: { children: string; variant?: "success" | "muted" | "info" }) {
  return <span className={`statusBadge ${props.variant ?? "info"}`}>{props.children}</span>;
}

export function getStatusVariant(value: string): "success" | "muted" | "info" {
  const normalized = value.trim().toUpperCase();

  if (["ACTIVE", "ACTIVO", "PAID", "CONFIRMED", "SALE"].includes(normalized)) {
    return "success";
  }

  if (["INACTIVE", "INACTIVO", "CANCELLED", "BLOCKED", "SALE_CANCELLED"].includes(normalized)) {
    return "muted";
  }

  return "info";
}
