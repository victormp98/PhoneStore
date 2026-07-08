import type { ReactNode } from "react";

type MetricCardProps = {
  title: string;
  value: number | string;
  icon?: ReactNode;
  accent?: "indigo" | "emerald" | "amber" | "sky";
  subtitle?: string;
  trend?: string;
  kind?: "catalog" | "customers" | "sales" | "stock";
  changeLabel?: string;
  changeValue?: string;
  callout?: string;
};

const accentMap: Record<string, { icon: string; bar: string; badge: string; glow: string }> = {
  indigo:  { icon: "#8b5cf6", bar: "linear-gradient(90deg,#8b5cf6,#22d3ee)", badge: "rgba(139,92,246,0.16)", glow: "rgba(139,92,246,0.42)" },
  emerald: { icon: "#2dd4bf", bar: "linear-gradient(90deg,#2dd4bf,#34d399)", badge: "rgba(45,212,191,0.15)", glow: "rgba(45,212,191,0.38)" },
  amber:   { icon: "#f59e0b", bar: "linear-gradient(90deg,#f59e0b,#fb7185)", badge: "rgba(245,158,11,0.16)", glow: "rgba(245,158,11,0.36)" },
  sky:     { icon: "#38bdf8", bar: "linear-gradient(90deg,#38bdf8,#60a5fa)", badge: "rgba(56,189,248,0.16)", glow: "rgba(56,189,248,0.38)" },
};

export function MetricCard({
  title,
  value,
  icon,
  accent = "indigo",
  subtitle,
  trend,
  kind = "catalog",
  changeLabel,
  changeValue,
  callout
}: MetricCardProps) {
  const colors = accentMap[accent] ?? accentMap.indigo;

  return (
    <article className="metricCard" style={{ ["--metric-glow" as string]: colors.glow }}>
      <div className="metricTopline">
        <div className="metricGlyph" style={{ background: colors.badge, color: colors.icon, borderColor: colors.glow }}>
          {icon}
        </div>

        <div className="metricCardInfo">
          <span>{title}</span>
          <strong>{value}</strong>
        </div>
      </div>

      {subtitle ? <p className="metricSubtitle">{subtitle}</p> : null}

      <div className={`metricVisual metricVisual${kind.charAt(0).toUpperCase() + kind.slice(1)}`} aria-hidden="true">
        <span className="metricVisualHalo"></span>
        <span className="metricVisualShape"></span>
        <span className="metricVisualMark"></span>
      </div>

      <div className="metricKPIRow">
        <div>
          <span>{changeLabel ?? "Lectura actual"}</span>
          <strong>{changeValue ?? (kind === "stock" ? "Operando" : "Estable")}</strong>
        </div>
        <div>
          <span>Estado</span>
          <strong>{trend ?? "Sin alertas"}</strong>
        </div>
      </div>

      {callout ? <div className="metricCallout">{callout}</div> : null}

      {trend ? <div className="metricTrend">{trend}</div> : null}
    </article>
  );
}
