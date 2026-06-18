import type { CurrentUser } from "../types/api";

export function Topbar(props: { currentUser: CurrentUser | null; onLogout: () => void }) {
  return (
    <header className="topbar">
      <div>
        <h1>Panel administrativo</h1>
        <p>Datos reales obtenidos desde la API PhoneStore.</p>
      </div>

      <div className="topbarActions">
        <span className="roleBadge">{props.currentUser?.roles?.join(", ") ?? "Sin rol"}</span>
        <button className="secondaryButton" onClick={props.onLogout}>
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
