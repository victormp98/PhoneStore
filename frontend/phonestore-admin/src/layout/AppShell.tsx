import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { CurrentUser, ModuleConfig } from "../types/api";

export function AppShell(props: {
  currentUser: CurrentUser | null;
  modules: ModuleConfig[];
  activeModuleKey: string;
  setActiveModuleKey: (value: string) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  return (
    <div className="appShell">
      <Sidebar
        currentUser={props.currentUser}
        modules={props.modules}
        activeModuleKey={props.activeModuleKey}
        setActiveModuleKey={props.setActiveModuleKey}
      />

      <main className="content">
        <Topbar currentUser={props.currentUser} onLogout={props.onLogout} />
        {props.children}
      </main>
    </div>
  );
}
