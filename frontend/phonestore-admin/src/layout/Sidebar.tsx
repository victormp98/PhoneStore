import { useMemo, useState } from "react";
import type { SVGProps } from "react";
import type { CurrentUser, ModuleConfig } from "../types/api";
import { getInitials } from "../utils/formatters";

function renderModuleIcon(key: string) {
  const commonProps: SVGProps<SVGSVGElement> = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: "moduleIcon"
  };

  switch (key) {
    case "dashboard":
      return (
        <svg {...commonProps}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      );
    case "products":
      return (
        <svg {...commonProps}>
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      );
    case "inventory":
      return (
        <svg {...commonProps}>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    case "movements":
      return (
        <svg {...commonProps}>
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      );
    case "customers":
      return (
        <svg {...commonProps}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "sales":
      return (
        <svg {...commonProps}>
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      );
    case "branches":
      return (
        <svg {...commonProps}>
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case "warehouses":
      return (
        <svg {...commonProps}>
          <path d="M3 21h18" />
          <path d="M9 21V9a3 3 0 0 1 6 0v12" />
          <rect x="2" y="2" width="20" height="4" rx="1" />
        </svg>
      );
    case "users":
      return (
        <svg {...commonProps}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "roles":
      return (
        <svg {...commonProps}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    case "delivery":
      return (
        <svg {...commonProps}>
          <rect x="1" y="3" width="15" height="13" rx="1"/>
          <path d="M16 8h4l3 3v5h-7V8z"/>
          <circle cx="5.5" cy="18.5" r="1.5"/>
          <circle cx="18.5" cy="18.5" r="1.5"/>
        </svg>
      );
    case "repairs":
      return (
        <svg {...commonProps}>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      );
    case "store":
      return (
        <svg {...commonProps}>
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      );
    case "promotions":
      return (
        <svg {...commonProps}>
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
          <line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
      );
    default:
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
  }
}

export function Sidebar(props: {
  currentUser: CurrentUser | null;
  modules: ModuleConfig[];
  activeModuleKey: string;
  setActiveModuleKey: (value: string) => void;
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  onLogout: () => void;
}) {
  const GROUP_DEFS = [
    { key: "Ventas",       label: "Ventas",        icon: renderModuleIcon("sales") },
    { key: "Operaciones",  label: "Operaciones",   icon: renderModuleIcon("repairs") },
    { key: "Reportes",     label: "Reportes",      icon: renderModuleIcon("dashboard") },
    { key: "Catálogo",     label: "Catálogo",      icon: renderModuleIcon("products") },
    { key: "Inventario",   label: "Inventario",    icon: renderModuleIcon("inventory") },
    { key: "Configuración",label: "Configuración", icon: renderModuleIcon("users") },
  ];

  const groupedModules = useMemo(() => {
    return GROUP_DEFS.map((group) => ({
      ...group,
      modules: props.modules.filter((m) => (m.group ?? "Configuración") === group.key)
    }));
  }, [props.modules]);

  return (
    <aside className={props.collapsed ? "sidebar sidebarCollapsedPanel" : "sidebar"}>
      <button
        type="button"
        className="sidebarBrand"
        onClick={() => props.setCollapsed(!props.collapsed)}
        aria-label={props.collapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
      >
        <div className="brandMark">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        </div>
        {!props.collapsed && (
          <div className="sidebarBrandText">
            <strong style={{fontSize: '18px'}}>TechNova</strong>
          </div>
        )}
        <span className="sidebarCollapseHint">{props.collapsed ? "›" : "‹"}</span>
      </button>

      <div className="sidebarNav" style={{ paddingTop: '10px' }}>
        {groupedModules.map((group) =>
          group.modules.length > 0 ? (
            <section className="sidebarGroup" key={group.key}>
              {!props.collapsed ? (
                <div className="sidebarGroupLabel">
                  {group.label}
                </div>
              ) : null}

              <nav className="sidebarGroupNav">
                {group.modules.map((moduleItem) => (
                  <button
                    key={moduleItem.key}
                    className={moduleItem.key === props.activeModuleKey ? "navItem active" : "navItem"}
                    onClick={() => props.setActiveModuleKey(moduleItem.key)}
                    title={props.collapsed ? moduleItem.label : undefined}
                  >
                    {renderModuleIcon(moduleItem.key)}
                    <span className="navItemLabel">{moduleItem.label}</span>
                  </button>
                ))}
              </nav>
            </section>
          ) : null
        )}
      </div>

      <div className="sidebarFooter">
        <div className="sidebarUser">
          <div className="avatar" style={{ position: 'relative' }}>
            {getInitials(props.currentUser?.name)}
            {!props.collapsed && (
              <span style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', border: '2px solid var(--navy)' }}></span>
            )}
          </div>
          <div className="sidebarUserText">
            <strong>{props.currentUser?.name ?? "Usuario"}</strong>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>Sucursal Centro</span>
          </div>
        </div>

        <button className="sidebarLogoutButton" onClick={props.onLogout}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Salir</span>
        </button>
      </div>
    </aside>
  );
}
