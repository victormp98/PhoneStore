import type { CurrentUser, ModuleConfig } from "../types/api";
import { getInitials } from "../utils/formatters";

export function Topbar(props: {
  currentUser: CurrentUser | null;
  activeModule: ModuleConfig;
}) {
  return (
    <header className="topbarNew">
      {/* Logo */}
      <div className="topbarLogo">
        <div className="topbarLogoMark">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span>TechNova</span>
      </div>

      {/* Search */}
      <div className="topbarSearchWrap">
        <svg className="topbarSearchIcon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Buscar productos, servicios o clientes..."
          className="topbarSearchInput"
        />
        <div className="topbarSearchShortcut">⌘ K</div>
      </div>

      {/* Right Section */}
      <div className="topbarRightSection">
        {/* Notifications */}
        <button className="topbarNotifBtn" aria-label="Notificaciones">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span className="notifBadge">3</span>
        </button>

        {/* Profile */}
        <div className="topbarProfile">
          <div className="topbarAvatar">
            {getInitials(props.currentUser?.name)}
          </div>
          <div>
            <span className="topbarUserName">{props.currentUser?.name || "Usuario"}</span>
            <span className="topbarUserRole">
              {props.currentUser?.roles?.[0] || "Cajero"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
