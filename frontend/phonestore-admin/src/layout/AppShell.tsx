import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { CurrentUser, ModuleConfig } from "../types/api";

export function AppShell(props: {
  currentUser: CurrentUser | null;
  modules: ModuleConfig[];
  activeModule: ModuleConfig;
  setActiveModuleKey: (value: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  return (
    <div className={props.sidebarCollapsed ? "appShell sidebarCollapsed" : "appShell"}>
      <Sidebar
        currentUser={props.currentUser}
        modules={props.modules}
        activeModuleKey={props.activeModule.key}
        setActiveModuleKey={props.setActiveModuleKey}
        collapsed={props.sidebarCollapsed}
        setCollapsed={props.setSidebarCollapsed}
        onLogout={props.onLogout}
      />

      <main
        className="content"
        style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
      >
        <Topbar currentUser={props.currentUser} activeModule={props.activeModule} />
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0 }}>
          {props.children}
        </div>
      </main>
    </div>
  );
}
