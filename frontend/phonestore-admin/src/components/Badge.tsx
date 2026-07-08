export function Badge(props: {
  children: string;
  variant?: "success" | "muted" | "info" | "danger" | "warning";
}) {
  return <span className={`statusBadge ${props.variant ?? "info"}`}>{props.children}</span>;
}

export function getStatusVariant(
  value: string
): "success" | "muted" | "info" | "danger" | "warning" {
  const normalized = value.trim().toUpperCase();

  if (["ACTIVE", "ACTIVO", "PAID", "CONFIRMED", "SALE", "TRUE"].includes(normalized)) {
    return "success";
  }

  if (
    ["INACTIVE", "INACTIVO", "CANCELLED", "BLOCKED", "SALE_CANCELLED", "DEACTIVATED", "FALSE"].includes(
      normalized
    )
  ) {
    return "danger";
  }

  if (["PENDING", "WAITING"].includes(normalized)) {
    return "warning";
  }

  return "info";
}
