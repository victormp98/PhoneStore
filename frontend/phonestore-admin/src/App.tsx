import { useEffect, useState } from "react";
import { apiRequest } from "./api/apiClient";
import { clearStoredToken, getStoredToken, setStoredToken } from "./auth/authStorage";
import { AppShell } from "./layout/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { DataPage } from "./pages/DataPage";
import { LoginPage } from "./pages/LoginPage";
import { SalesPosPage } from "./pages/SalesPosPage";
import type { CurrentUser } from "./types/api";
import { modules } from "./utils/tableConfigs";

function App() {
  const [token, setToken] = useState(getStoredToken());
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [activeModuleKey, setActiveModuleKey] = useState("dashboard");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!token) {
      setCurrentUser(null);
      return;
    }

    apiRequest<CurrentUser>("/api/auth/me")
      .then(setCurrentUser)
      .catch(() => {
        clearStoredToken();
        setToken("");
        setCurrentUser(null);
      });
  }, [token]);

  function handleLoginSuccess(accessToken: string) {
    setStoredToken(accessToken);
    setToken(accessToken);
    setAuthError("");
  }

  function handleLogout() {
    clearStoredToken();
    setToken("");
    setCurrentUser(null);
  }

  if (!token) {
    return (
      <LoginPage
        authError={authError}
        setAuthError={setAuthError}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  const activeModule =
    modules.find((moduleItem) => moduleItem.key === activeModuleKey) ?? modules[0];

  return (
    <AppShell
      currentUser={currentUser}
      modules={modules}
      activeModuleKey={activeModuleKey}
      setActiveModuleKey={setActiveModuleKey}
      onLogout={handleLogout}
    >
      {activeModule.key === "dashboard" ? (
        <DashboardPage />
      ) : activeModule.key === "sales" ? (
        <SalesPosPage />
      ) : (
        <DataPage moduleConfig={activeModule} />
      )}
    </AppShell>
  );
}

export default App;
