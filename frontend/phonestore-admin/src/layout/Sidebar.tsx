import type { CurrentUser, ModuleConfig } from "../types/api";
import { getInitials } from "../utils/formatters";

export function Sidebar(props: {
  currentUser: CurrentUser | null;
  modules: ModuleConfig[];
  activeModuleKey: string;
  setActiveModuleKey: (value: string) => void;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebarBrand">
        <div className="brandMark">PS</div>
        <div>
          <strong>PhoneStore</strong>
          <span>Administración</span>
        </div>
      </div>

      <nav>
        {props.modules.map((moduleItem) => (
          <button
            key={moduleItem.key}
            className={moduleItem.key === props.activeModuleKey ? "navItem active" : "navItem"}
            onClick={() => props.setActiveModuleKey(moduleItem.key)}
          >
            {moduleItem.label}
          </button>
        ))}
      </nav>

      <div className="sidebarUser">
        <div className="avatar">{getInitials(props.currentUser?.name)}</div>
        <div>
          <strong>{props.currentUser?.name ?? "Usuario"}</strong>
          <span>{props.currentUser?.email ?? ""}</span>
        </div>
      </div>
    </aside>
  );
}
