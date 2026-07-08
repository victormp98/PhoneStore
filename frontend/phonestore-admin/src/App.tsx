import { useEffect, useState } from "react";
import { apiRequest } from "./api/apiClient";
import { clearStoredToken, getStoredToken, setStoredToken } from "./auth/authStorage";
import { AppShell } from "./layout/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { DataPage } from "./pages/DataPage";
import { LoginPage } from "./pages/LoginPage";
import { OnlineStorePage } from "./pages/OnlineStorePage";
import { SalesPosPage } from "./pages/SalesPosPage";
import type { CurrentUser } from "./types/api";
import { modules } from "./utils/tableConfigs";

/* ══════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════ */
type DeliveryCard = {
  id: string;
  tracking: string;
  customer: string;
  phone: string;
  address: string;
  references: string;
  city: string;
  status: string;
  statusKey: "asignado" | "enCamino" | "pendiente" | "entregado";
  total: string;
  paymentMethod: string;
  products: number;
  etaMin: number;
  etaKm: number;
  etaRoute: string;
  createdAt: string;
  stepperIndex: number;
  history: ReadonlyArray<{ label: string; value: string }>;
};

type RepairCard = {
  id: string;
  ticket: string;
  customer: string;
  phone: string;
  issue: string;
  device: string;
  deviceModel: string;
  deviceStorage: string;
  deviceColor: string;
  imei: string;
  repairPrice: string;
  laborCost: string;
  partsCost: string;
  status: string;
  priority: "Alta" | "Media" | "Baja" | "Lista";
  observations: string;
  date: string;
  timeline: ReadonlyArray<{ label: string; value: string }>;
  emoji: string;
};

/* ══════════════════════════════════════════════════════════════════
   APP ROOT
══════════════════════════════════════════════════════════════════ */
function App() {
  const [token, setToken]           = useState(getStoredToken());
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [activeModuleKey, setActiveModuleKey] = useState("sales");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authError, setAuthError]   = useState("");

  useEffect(() => {
    if (!token) { setCurrentUser(null); return; }
    apiRequest<CurrentUser>("/api/auth/me")
      .then(setCurrentUser)
      .catch(() => { clearStoredToken(); setToken(""); setCurrentUser(null); });
  }, [token]);

  function handleLoginSuccess(accessToken: string) {
    setStoredToken(accessToken);
    setToken(accessToken);
    setAuthError("");
  }
  function handleLogout() {
    clearStoredToken(); setToken(""); setCurrentUser(null);
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

  const visibleModules = filterModulesByRole(modules, currentUser?.roles ?? []);
  const activeModule   = visibleModules.find((m) => m.key === activeModuleKey) ?? visibleModules[0];

  return (
    <AppShell
      currentUser={currentUser}
      modules={visibleModules}
      activeModule={activeModule}
      setActiveModuleKey={setActiveModuleKey}
      sidebarCollapsed={sidebarCollapsed}
      setSidebarCollapsed={setSidebarCollapsed}
      onLogout={handleLogout}
    >
      {activeModule.key === "dashboard" ? <DashboardPage />
        : activeModule.key === "sales"    ? <SalesPosPage />
        : activeModule.key === "delivery" ? <DeliveryPage />
        : activeModule.key === "repairs"  ? <RepairsPage />
        : activeModule.key === "store"    ? <OnlineStorePage />
        : <DataPage moduleConfig={activeModule} />}
    </AppShell>
  );
}

/* ══════════════════════════════════════════════════════════════════
   DELIVERY PAGE — Mobile-first
══════════════════════════════════════════════════════════════════ */
const STEPPER_STEPS = [
  { label: "Aceptado", icon: "📦" },
  { label: "En camino", icon: "🚗" },
  { label: "Llegué",    icon: "📍" },
  { label: "Entregado", icon: "📫" },
  { label: "Completado",icon: "✅" },
];

function DeliveryPage() {
  const [sel, setSel] = useState<DeliveryCard>(deliveryCards[1] as DeliveryCard);

  return (
    <div className="deliveryPageWrap">
      <div className="deliveryPhone">
        {/* Header */}
        <div className="deliveryPhoneHeader">
          <div className="deliveryPhoneHeaderLeft">
            <button className="deliveryPhoneMenuBtn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <span className="deliveryPhoneTitle">Mis Entregas</span>
          </div>
          <div className="deliveryOnlineBadge">
            <span className="deliveryOnlineDot"></span>En línea
          </div>
        </div>

        <div className="deliveryBody">
          {/* Order list */}
          <div className="deliveryOrdersList">
            <div className="deliveryOrdersListHeader">
              <span className="deliveryOrdersListTitle">Pedidos activos ({deliveryCards.length})</span>
              <button className="deliveryFilterBtn">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
                Filtrar
              </button>
            </div>

            {deliveryCards.map((d) => (
              <div key={d.id}
                className={`deliveryOrderCard${sel.id === d.id ? " selected" : ""}`}
                onClick={() => setSel(d as DeliveryCard)}>
                <div className="deliveryOrderIcon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="3" width="15" height="13" rx="1"/>
                    <path d="M16 8h4l3 3v5h-7V8z"/>
                    <circle cx="5.5" cy="18.5" r="1.5"/>
                    <circle cx="18.5" cy="18.5" r="1.5"/>
                  </svg>
                </div>
                <div className="deliveryOrderInfo">
                  <p className="deliveryOrderFolio">{d.tracking}</p>
                  <p className="deliveryOrderCustomer">{d.customer}</p>
                  <p className="deliveryOrderAddress">{d.address}</p>
                </div>
                <div className="deliveryOrderRight">
                  <p className="deliveryOrderTotal">{d.total}</p>
                  <span className={`deliveryStatusBadge ${d.statusKey}`}>
                    <span className="deliveryStatusDot"></span>{d.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Detail */}
          <div className="deliveryDetail">
            <div className="deliveryDetailHeader">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <p className="deliveryDetailFolio">{sel.tracking}</p>
                  <span className={`deliveryStatusBadge ${sel.statusKey}`}>
                    <span className="deliveryStatusDot"></span>{sel.status}
                  </span>
                </div>
                <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>{sel.createdAt}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '11px', color: '#9ca3af' }}>Total</p>
                <p className="deliveryDetailTotalAmount">{sel.total}</p>
                <span style={{ background: '#eff6ff', color: '#1e40af', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>{sel.paymentMethod}</span>
              </div>
            </div>

            <div className="deliveryDetailSection">
              {/* Client */}
              <div className="deliveryDetailRow">
                <div className="deliveryDetailIcon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                  <p className="deliveryDetailLabel">Cliente</p>
                  <p className="deliveryDetailValue">{sel.customer}</p>
                  <p className="deliveryDetailSub">{sel.phone}</p>
                </div>
              </div>
              {/* Address */}
              <div className="deliveryDetailRow">
                <div className="deliveryDetailIcon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div>
                  <p className="deliveryDetailLabel">Dirección</p>
                  <p className="deliveryDetailValue">{sel.address}</p>
                  <p className="deliveryDetailSub">{sel.city}</p>
                </div>
              </div>
              {/* ETA */}
              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🚗</span>
                  <div>
                    <p style={{ fontSize: '11px', color: '#0369a1', margin: 0, fontWeight: 600 }}>Tiempo estimado</p>
                    <p style={{ fontSize: '14px', fontWeight: 800, color: '#0c4a6e', margin: 0 }}>{sel.etaMin} min ({sel.etaKm} km)</p>
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: '#0369a1', fontWeight: 600 }}>por {sel.etaRoute}</p>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="deliveryDetailSection" style={{ paddingTop: 0 }}>
              <div className="deliveryMapPlaceholder">
                <div className="deliveryMapGrid"></div>
                <div className="deliveryMapRoute"></div>
                <div className="deliveryMapOriginDot"></div>
                <div className="deliveryMapDestPin"></div>
                <span style={{ position: 'absolute', bottom: '6px', right: '8px', fontSize: '11px', color: '#374151', background: 'rgba(255,255,255,0.9)', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                  {sel.etaMin} min aprox.
                </span>
              </div>
            </div>

            {/* Stepper */}
            <div className="deliveryStepper">
              <p className="deliveryStepperTitle">Progreso de entrega</p>
              <div className="deliveryStepperTrack">
                {STEPPER_STEPS.map((step, idx) => {
                  const done = idx < sel.stepperIndex;
                  const active = idx === sel.stepperIndex;
                  return (
                    <div key={step.label} className={`deliveryStep ${done ? "done" : active ? "active" : ""}`}>
                      <div className="deliveryStepCircle">
                        {done ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          : <span style={{ fontSize: '11px' }}>{step.icon}</span>}
                      </div>
                      <span className="deliveryStepLabel">{step.label}</span>
                      {sel.history[idx]?.value && (
                        <span className="deliveryStepTime">{sel.history[idx].value}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="deliveryActions">
              <div className="deliveryActionsRow">
                <button className="deliveryActionBtn green">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Llegué
                </button>
                <button className="deliveryActionBtn blue">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                  Entregado
                </button>
              </div>
              <button className="deliveryActionBtn red" style={{ width: '100%' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                No se pudo entregar
              </button>
              <button className="deliveryActionBtn white" style={{ width: '100%' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.18A16 16 0 0 0 16 16.18l1.27-.94a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Llamar cliente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   REPAIRS PAGE — Kanban + Drawer
══════════════════════════════════════════════════════════════════ */
const repairKpiData = [
  { label: "Pendientes", value: 18, delta: "+4 vs ayer",    bg: "#dbeafe", iconColor: "#1d4ed8", emoji: "📋" },
  { label: "En reparación", value: 24, delta: "+6 hoy",    bg: "#fef3c7", iconColor: "#d97706", emoji: "🔧" },
  { label: "Urgentes",   value: 5,  delta: "Ver ahora →",  bg: "#fee2e2", iconColor: "#dc2626", emoji: "🚨" },
  { label: "Entregadas", value: 12, delta: "+20% vs ayer", bg: "#d1fae5", iconColor: "#059669", emoji: "✅" },
];

function getPriorityClass(p: string) {
  if (p === "Alta")  return "priorityBadgeAlta";
  if (p === "Media") return "priorityBadgeMedia";
  if (p === "Baja")  return "priorityBadgeBaja";
  return "priorityBadgeLista";
}

function RepairKanbanCard({ repair, selected, onClick }: { repair: RepairCard; selected: boolean; onClick: () => void }) {
  return (
    <div className={`kanbanCardDense${selected ? " selected" : ""}`} onClick={onClick}>
      <div className="kanbanCardHeader">
        <span className="kanbanCardFolioV2">{repair.ticket}</span>
        <span className={getPriorityClass(repair.priority)}>{repair.priority}</span>
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <div className="kanbanCardDeviceThumb">{repair.emoji}</div>
        <div className="kanbanCardMain">
          <p className="kanbanCardCustomerV2">{repair.customer}</p>
          <p className="kanbanCardDeviceV2">{repair.device}</p>
          <p className="kanbanCardIssueV2">{repair.issue}</p>
        </div>
      </div>
      <div className="kanbanCardMeta">
        <span className="kanbanCardDateV2">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          {repair.date}
        </span>
        <span className="kanbanCardPrice">{repair.repairPrice}</span>
      </div>
    </div>
  );
}

function RepairsPage() {
  const [selectedRepair, setSelectedRepair] = useState<RepairCard | null>(null);

  function toggle(r: RepairCard) {
    setSelectedRepair((cur) => cur?.id === r.id ? null : r);
  }

  return (
    <section className="repairsPageNew">
      {/* Topbar */}
      <div className="repairsTopbar">
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: '0 0 2px' }}>Panel de Reparaciones</h2>
          <p style={{ color: '#6b7280', margin: 0, fontSize: '13px' }}>Seguimiento y gestión del taller técnico</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button style={{ padding: '8px 14px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Todos los técnicos ▾
          </button>
          <button style={{ padding: '9px 16px', background: '#0d1b2a', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 800, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nueva reparación
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="repairsKpiGrid">
        {repairKpiData.map((kpi) => (
          <div key={kpi.label} className="kpiCardNew">
            <div className="kpiCardIcon" style={{ background: kpi.bg, fontSize: '22px', display: 'grid', placeItems: 'center', width: '48px', height: '48px', borderRadius: '12px' }}>
              {kpi.emoji}
            </div>
            <div className="kpiCardBody">
              <p className="kpiCardLabel">{kpi.label}</p>
              <p className="kpiCardValue">{kpi.value}</p>
              <p className={`kpiCardDelta${kpi.delta.includes("+") || kpi.delta.includes("→") ? " positive" : ""}`}>{kpi.delta}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Kanban + Drawer */}
      <div className="repairsKanbanWrap">
        <div className="repairsKanbanMain">
          {repairColumns.map((col) => (
            <div key={col.title} className="kanbanColNew">
              <div className="kanbanColHeader">
                <span className="kanbanColTitle">{col.title}</span>
                <span className="kanbanColCount">{col.items.length}</span>
              </div>
              <div className="kanbanColBody">
                {col.items.map((r) => (
                  <RepairKanbanCard key={r.id} repair={r as RepairCard}
                    selected={selectedRepair?.id === r.id}
                    onClick={() => toggle(r as RepairCard)} />
                ))}
                <button className="kanbanAddBtn">+ Agregar reparación</button>
              </div>
            </div>
          ))}
        </div>

        {/* Inline Drawer */}
        <div className={`repairDrawer${selectedRepair ? " open" : ""}`}>
          {selectedRepair && <RepairDrawerContent repair={selectedRepair} onClose={() => setSelectedRepair(null)} />}
        </div>
      </div>
    </section>
  );
}

function RepairDrawerContent({ repair, onClose }: { repair: RepairCard; onClose: () => void }) {
  return (
    <div className="repairDrawerInner">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', fontWeight: 600 }}>FOLIO</p>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111827', margin: 0 }}>{repair.ticket}</h3>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className={getPriorityClass(repair.priority)}>{repair.priority} prioridad</span>
          <button className="repairDrawerClose" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
      </div>

      {/* Status + Date row */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Estado</p>
          <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: '12px', fontWeight: 700, padding: '4px 12px', borderRadius: '999px' }}>
            {repair.status}
          </span>
        </div>
        <div>
          <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>Ingresado</p>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{repair.timeline[0]?.value ?? repair.date}</p>
        </div>
      </div>

      {/* Client */}
      <div className="repairDrawerSection">
        <p style={{ fontSize: '13px', fontWeight: 800, color: '#111827', marginBottom: '10px' }}>Cliente</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: '16px', flexShrink: 0 }}>
            {repair.customer.charAt(0)}
          </div>
          <div>
            <p className="repairDrawerFieldValue">{repair.customer}</p>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>{repair.phone}</p>
            <span style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>Cliente frecuente</span>
          </div>
        </div>
      </div>

      {/* Device */}
      <div className="repairDrawerSection">
        <p style={{ fontSize: '13px', fontWeight: 800, color: '#111827', marginBottom: '10px' }}>Equipo</p>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ width: '48px', height: '64px', background: 'linear-gradient(135deg,#f1f5f9,#e2e8f0)', borderRadius: '8px', display: 'grid', placeItems: 'center', fontSize: '28px', flexShrink: 0 }}>
            {repair.emoji}
          </div>
          <div>
            <p className="repairDrawerFieldValue">{repair.device}</p>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>{repair.deviceModel} · {repair.deviceStorage} · {repair.deviceColor}</p>
            <p style={{ fontSize: '11px', color: '#9ca3af' }}>IMEI: {repair.imei}</p>
          </div>
        </div>
      </div>

      {/* Falla */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '13px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>Falla reportada</p>
        <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.6, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '12px 14px', margin: 0 }}>{repair.issue}</p>
      </div>

      {/* Observations */}
      {repair.observations && (
        <div style={{ background: '#fffbeb', border: '1px dashed #fcd34d', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>⚠ Observaciones internas</p>
          <p style={{ fontSize: '13px', color: '#78350f', margin: 0 }}>{repair.observations}</p>
        </div>
      )}

      {/* Costs */}
      <div className="repairCostGrid">
        <div className="repairCostItem">
          <p className="repairCostLabel">Total reparación</p>
          <p className="repairCostValue">{repair.repairPrice}</p>
        </div>
        <div className="repairCostItem">
          <p className="repairCostLabel">Mano de obra</p>
          <p className="repairCostValue">{repair.laborCost}</p>
        </div>
        <div className="repairCostItem">
          <p className="repairCostLabel">Refacciones</p>
          <p className="repairCostValue">{repair.partsCost}</p>
        </div>
      </div>

      {/* Checklist */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: 0 }}>Diagnóstico</p>
          <span style={{ fontSize: '11px', color: '#9ca3af' }}>1/5 completado</span>
        </div>
        <div className="repairChecklist">
          {["Revisión física del equipo", "Pruebas de funcionamiento", "Diagnóstico técnico", "Cotización aprobada", "Autorización del cliente"].map((item, i) => (
            <label key={item} className="repairCheckItem">
              <input type="checkbox" defaultChecked={i === 0} readOnly />
              {item}
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="repairDrawerActions">
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acciones</p>
        <div className="repairActionsRow">
          <button className="repairBtnSecondary">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Agregar nota
          </button>
          <button className="repairBtnSecondary">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Imprimir orden
          </button>
        </div>
        <div className="repairActionsRow">
          <button className="repairBtnPrimaryBlue">
            Actualizar estado ▾
          </button>
          <button className="repairBtnPrimaryGreen">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Marcar como listo
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════════════════════ */
const deliveryCards: DeliveryCard[] = [
  {
    id: "1", tracking: "#ORD-001234", customer: "Juan Pérez", phone: "+56 9 1234 5678",
    address: "Av. Providencia 1208, Of. 1402", references: "Entrada por portería, piso 14.",
    city: "Providencia, Santiago", status: "Asignado", statusKey: "asignado",
    total: "$12.500", paymentMethod: "Efectivo", products: 2,
    etaMin: 18, etaKm: 4.2, etaRoute: "Av. Providencia",
    createdAt: "Hoy 09:00", stepperIndex: 0,
    history: [{ label:"Aceptado", value:"09:00" },{ label:"En camino", value:"" },{ label:"Llegué", value:"" },{ label:"Entregado", value:"" },{ label:"Completado", value:"" }],
  },
  {
    id: "2", tracking: "#ORD-001235", customer: "María González", phone: "+56 9 8765 4321",
    address: "Los Leones 1520, Depto. 702", references: "Timbre 702, conserje presente.",
    city: "Providencia, Santiago", status: "En camino", statusKey: "enCamino",
    total: "$18.900", paymentMethod: "Tarjeta", products: 3,
    etaMin: 12, etaKm: 2.8, etaRoute: "Av. Providencia",
    createdAt: "Hoy 09:15", stepperIndex: 1,
    history: [{ label:"Aceptado", value:"09:20" },{ label:"En camino", value:"09:25" },{ label:"Llegué", value:"" },{ label:"Entregado", value:"" },{ label:"Completado", value:"" }],
  },
  {
    id: "3", tracking: "#ORD-001236", customer: "Carlos Ramírez", phone: "+56 9 5555 1122",
    address: "Av. Las Condes 9870, Torre A, 503", references: "Acceso por calle lateral.",
    city: "Las Condes, Santiago", status: "Pendiente", statusKey: "pendiente",
    total: "$9.900", paymentMethod: "Efectivo", products: 1,
    etaMin: 28, etaKm: 7.1, etaRoute: "Av. Las Condes",
    createdAt: "Hoy 09:30", stepperIndex: 0,
    history: [{ label:"Aceptado", value:"" },{ label:"En camino", value:"" },{ label:"Llegué", value:"" },{ label:"Entregado", value:"" },{ label:"Completado", value:"" }],
  },
  {
    id: "4", tracking: "#ORD-001233", customer: "Sofía Torres", phone: "+56 9 4444 9999",
    address: "Manuel Montt 1500, Depto 301", references: "Ring 301, 3er piso.",
    city: "Providencia, Santiago", status: "Entregado", statusKey: "entregado",
    total: "$34.900", paymentMethod: "Transferencia", products: 2,
    etaMin: 0, etaKm: 0, etaRoute: "—",
    createdAt: "Hoy 08:30", stepperIndex: 4,
    history: [{ label:"Aceptado", value:"08:30" },{ label:"En camino", value:"08:35" },{ label:"Llegué", value:"08:55" },{ label:"Entregado", value:"09:00" },{ label:"Completado", value:"09:01" }],
  },
];

const repairColumns: ReadonlyArray<{ title: string; items: ReadonlyArray<Omit<RepairCard, never>> }> = [
  {
    title: "📋 Recibido",
    items: [
      { id:"r1", ticket:"REP-2024-0457", customer:"Juan Pérez", phone:"+56 9 1234 5678",
        issue:"Pantalla rota — táctil falla en zonas", device:"iPhone 14", deviceModel:"128 GB", deviceStorage:"128 GB", deviceColor:"Azul", imei:"356789012345678",
        repairPrice:"$129.900", laborCost:"$29.900", partsCost:"$100.000",
        status:"Recibido", priority:"Alta", date:"16 may",
        observations:"El cliente indica que el táctil responde en algunas zonas.",
        timeline:[{ label:"Ingreso", value:"14 may 2024, 10:32" }], emoji:"📱" },
      { id:"r2", ticket:"REP-2024-0458", customer:"María López", phone:"+56 9 2222 1111",
        issue:"No carga — puerto USB-C dañado", device:"Samsung Galaxy S23", deviceModel:"256 GB", deviceStorage:"256 GB", deviceColor:"Negro", imei:"123456789012345",
        repairPrice:"$89.900", laborCost:"$20.000", partsCost:"$69.900",
        status:"Recibido", priority:"Media", date:"17 may",
        observations:"", timeline:[{ label:"Ingreso", value:"17 may 2024" }], emoji:"📱" },
      { id:"r3", ticket:"REP-2024-0459", customer:"Roberto Soto", phone:"+56 9 7777 2222",
        issue:"Micrófono no funciona en llamadas", device:"iPhone 13 mini", deviceModel:"64 GB", deviceStorage:"64 GB", deviceColor:"Medianoche", imei:"222333444555666",
        repairPrice:"$49.900", laborCost:"$15.000", partsCost:"$34.900",
        status:"Recibido", priority:"Baja", date:"18 may",
        observations:"", timeline:[{ label:"Ingreso", value:"18 may 2024" }], emoji:"📱" },
      { id:"r4", ticket:"REP-2024-0460", customer:"Carmen Díaz", phone:"+56 9 8888 3333",
        issue:"Batería se agota muy rápido", device:"Samsung Galaxy A53", deviceModel:"128 GB", deviceStorage:"128 GB", deviceColor:"Blanco", imei:"333444555666777",
        repairPrice:"$59.900", laborCost:"$20.000", partsCost:"$39.900",
        status:"Recibido", priority:"Media", date:"18 may",
        observations:"", timeline:[{ label:"Ingreso", value:"18 may 2024" }], emoji:"📱" },
    ],
  },
  {
    title: "🔍 Diagnóstico",
    items: [
      { id:"r5", ticket:"REP-2024-0448", customer:"Luis Sánchez", phone:"+56 9 3333 4444",
        issue:"No enciende — posible daño por agua", device:"iPhone 13", deviceModel:"64 GB", deviceStorage:"64 GB", deviceColor:"Negro", imei:"987654321098765",
        repairPrice:"$99.900", laborCost:"$30.000", partsCost:"$69.900",
        status:"Diagnóstico", priority:"Alta", date:"15 may",
        observations:"Verificar si hay corrosión interna.", timeline:[{ label:"Ingreso", value:"15 may 2024" }], emoji:"📱" },
      { id:"r6", ticket:"REP-2024-0449", customer:"Fernanda Ruiz", phone:"+56 9 4444 8888",
        issue:"Botón de encendido no responde", device:"iPad 9na Gen", deviceModel:"64 GB", deviceStorage:"64 GB", deviceColor:"Gris", imei:"741852963014785",
        repairPrice:"$79.900", laborCost:"$25.000", partsCost:"$54.900",
        status:"Diagnóstico", priority:"Media", date:"16 may",
        observations:"", timeline:[{ label:"Ingreso", value:"16 may 2024" }], emoji:"📟" },
      { id:"r7", ticket:"REP-2024-0450", customer:"Pedro Morales", phone:"+56 9 5555 0000",
        issue:"Pantalla parpadeante — backlight falla", device:"MacBook Air M1", deviceModel:"8 GB RAM", deviceStorage:"256 GB SSD", deviceColor:"Plata", imei:"MAC-AIR-M1-001",
        repairPrice:"$189.900", laborCost:"$50.000", partsCost:"$139.900",
        status:"Diagnóstico", priority:"Alta", date:"15 may",
        observations:"", timeline:[{ label:"Ingreso", value:"15 may 2024" }], emoji:"💻" },
    ],
  },
  {
    title: "🔧 En Reparación",
    items: [
      { id:"r8", ticket:"REP-2024-0439", customer:"Patricia Mendoza", phone:"+56 9 5555 6666",
        issue:"Cambio de batería — capacidad 78%", device:"MacBook Pro 13\"", deviceModel:"16 GB RAM", deviceStorage:"512 GB", deviceColor:"Plata", imei:"MAC-PRO-2021-123",
        repairPrice:"$249.900", laborCost:"$49.900", partsCost:"$200.000",
        status:"En reparación", priority:"Media", date:"15 may",
        observations:"Cliente autorizó refacción original.", timeline:[{ label:"Ingreso", value:"15 may 2024" },{ label:"Trabajo", value:"En curso" }], emoji:"💻" },
      { id:"r9", ticket:"REP-2024-0440", customer:"Diego Flores", phone:"+56 9 6666 1111",
        issue:"Reemplazo pantalla OLED completa", device:"Samsung Galaxy S22 Ultra", deviceModel:"256 GB", deviceStorage:"256 GB", deviceColor:"Burdeos", imei:"555666777888999",
        repairPrice:"$219.900", laborCost:"$40.000", partsCost:"$179.900",
        status:"En reparación", priority:"Alta", date:"14 may",
        observations:"", timeline:[{ label:"Ingreso", value:"14 may" },{ label:"Trabajo", value:"En curso" }], emoji:"📱" },
      { id:"r10", ticket:"REP-2024-0441", customer:"Valentina Ortiz", phone:"+56 9 7777 5555",
        issue:"No conecta a WiFi ni Bluetooth", device:"iPhone 12 Pro", deviceModel:"128 GB", deviceStorage:"128 GB", deviceColor:"Grafito", imei:"444555666777888",
        repairPrice:"$69.900", laborCost:"$30.000", partsCost:"$39.900",
        status:"En reparación", priority:"Media", date:"14 may",
        observations:"Posible daño en antena.", timeline:[{ label:"Ingreso", value:"14 may" }], emoji:"📱" },
      { id:"r11", ticket:"REP-2024-0442", customer:"Andrés Castro", phone:"+56 9 8888 7777",
        issue:"Altavoz con ruido estático", device:"AirPods Pro 2da Gen", deviceModel:"MagSafe", deviceStorage:"—", deviceColor:"Blanco", imei:"APD-PRO2-123",
        repairPrice:"$39.900", laborCost:"$20.000", partsCost:"$19.900",
        status:"En reparación", priority:"Baja", date:"13 may",
        observations:"", timeline:[{ label:"Ingreso", value:"13 may" }], emoji:"🎧" },
    ],
  },
  {
    title: "✅ Lista para Entrega",
    items: [
      { id:"r12", ticket:"REP-2024-0432", customer:"Miguel Vázquez", phone:"+56 9 6666 7777",
        issue:"Pantalla y batería reemplazadas", device:"iPhone 11", deviceModel:"128 GB", deviceStorage:"128 GB", deviceColor:"Blanco", imei:"111222333444555",
        repairPrice:"$149.900", laborCost:"$30.000", partsCost:"$119.900",
        status:"Lista para entregar", priority:"Lista", date:"Hoy",
        observations:"Reparación completada. Cliente notificado vía WhatsApp.",
        timeline:[{ label:"Cierre", value:"Listo" }], emoji:"📱" },
      { id:"r13", ticket:"REP-2024-0433", customer:"Isabel Herrera", phone:"+56 9 1111 8888",
        issue:"Puerto de carga y conector flex", device:"Huawei P30 Pro", deviceModel:"128 GB", deviceStorage:"128 GB", deviceColor:"Azul", imei:"999888777666555",
        repairPrice:"$69.900", laborCost:"$25.000", partsCost:"$44.900",
        status:"Lista para entregar", priority:"Lista", date:"Hoy",
        observations:"", timeline:[{ label:"Cierre", value:"Listo" }], emoji:"📱" },
      { id:"r14", ticket:"REP-2024-0434", customer:"Santiago Muñoz", phone:"+56 9 3333 6666",
        issue:"Teclado reemplazado y limpieza", device:"MacBook Air 2020", deviceModel:"8 GB RAM", deviceStorage:"512 GB SSD", deviceColor:"Oro", imei:"MAC-AIR-2020-XYZ",
        repairPrice:"$89.900", laborCost:"$35.000", partsCost:"$54.900",
        status:"Lista para entregar", priority:"Lista", date:"Hoy",
        observations:"Incluye limpieza interna.", timeline:[{ label:"Cierre", value:"Listo" }], emoji:"💻" },
    ],
  },
];

/* ── Role filter ── */
function filterModulesByRole(modulesList: typeof modules, roles: string[]) {
  const r = roles.map((x) => x.toUpperCase());
  if (r.includes("ADMIN") || r.length === 0) return modulesList;
  if (r.some((x) => ["SELLER","VENTAS","CAJERO"].includes(x)))
    return modulesList.filter((m) => ["sales","customers","store","dashboard"].includes(m.key));
  if (r.some((x) => ["REPAIR","REPARACIONES","TECNICO"].includes(x)))
    return modulesList.filter((m) => ["repairs"].includes(m.key));
  if (r.some((x) => ["DELIVERY","REPARTO","REPARTIDOR"].includes(x)))
    return modulesList.filter((m) => ["delivery"].includes(m.key));
  return modulesList;
}

export default App;
