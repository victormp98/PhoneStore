import { useEffect, useMemo, useState } from "react";
import { apiRequest, normalizeArray } from "../api/apiClient";
import type { ApiObject } from "../types/api";
import { formatMoney, formatShortId } from "../utils/formatters";

type ProductRow = ApiObject & {
  id?: string;
  sku?: string;
  name?: string;
  description?: string | null;
  salePrice?: number;
  isActive?: boolean;
  _demo?: boolean;
};

type BranchRow = ApiObject & { id?: string; name?: string; isActive?: boolean };
type WarehouseRow = ApiObject & { id?: string; branchId?: string; name?: string; isActive?: boolean };
type CartItem = { productId: string; sku: string; name: string; quantity: number; unitPrice: number };
type CreateSaleResponse = { id?: string };

function getStock(id: string) { 
  if (!id) return 0;
  return (17 + id.charCodeAt(id.length - 1) % 30); 
}

/* Product visual config */
function getVisual(id: string) {
  if (!id) return { bg: "linear-gradient(135deg,#374151,#1f2937)", emoji: "📦" };
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    ["#1e293b", "#0f172a"], ["#4f46e5", "#7c3aed"], ["#0d9488", "#0f766e"],
    ["#d97706", "#b45309"], ["#be185d", "#9d174d"], ["#b91c1c", "#991b1b"],
    ["#059669", "#047857"], ["#2563eb", "#1d4ed8"]
  ];
  const emojis = ["📱", "🎧", "⚡", "🔴", "🔲", "🎵", "🔌", "📦"];
  const [c1, c2] = colors[hash % colors.length];
  const emoji = emojis[hash % emojis.length];
  return { bg: `linear-gradient(135deg,${c1},${c2})`, emoji };
}

const CATEGORIES = [
  { key: "all",  label: "Todos",       icon: "⊞" }
];

const PAYMENT_METHODS = [
  { key: "CASH",     label: "Efectivo",  icon: "💵" },
  { key: "CARD",     label: "Tarjeta",   icon: "💳" },
  { key: "TRANSFER", label: "Transf.",   icon: "🏦" },
];

export function SalesPosPage() {
  const [apiProducts, setApiProducts] = useState<ProductRow[]>([]);
  const [branches, setBranches]       = useState<BranchRow[]>([]);
  const [warehouses, setWarehouses]   = useState<WarehouseRow[]>([]);
  const [selectedBranchId, setSelectedBranchId]     = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [search, setSearch]           = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart]               = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [isLoading, setIsLoading]     = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]             = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const allProducts = useMemo(() => {
    return apiProducts.filter((p) => p.isActive !== false);
  }, [apiProducts]);

  const activeBranches    = useMemo(() => branches.filter((b) => b.isActive !== false && b.id), [branches]);
  const availableWarehouses = useMemo(() => warehouses.filter((w) => w.id && w.isActive !== false && (selectedBranchId ? w.branchId === selectedBranchId : true)), [warehouses, selectedBranchId]);

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allProducts.filter((p) => {
      if (!q) return true;
      return [p.sku, p.name].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });
  }, [allProducts, search, activeCategory]);

  const subtotal = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const discountAmt = subtotal > 0 ? subtotal * 0.10 : 0; // 10% promo demo
  const total = subtotal - discountAmt;
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [pp, bp, wp] = await Promise.all([
        apiRequest<unknown>("/api/products/"),
        apiRequest<unknown>("/api/branches/"),
        apiRequest<unknown>("/api/warehouses/"),
      ]);
      setApiProducts(normalizeArray(pp) as ProductRow[]);
      setBranches(normalizeArray(bp) as BranchRow[]);
      setWarehouses(normalizeArray(wp) as WarehouseRow[]);
    } catch {
      /* API unavailable — demo products remain visible */
    } finally {
      setIsLoading(false);
    }
  }

  function addToCart(product: ProductRow) {
    if (!product.id) return;
    const id = product.id;
    const unitPrice = Number(product.salePrice ?? 0);
    setCart((cur) => {
      const ex = cur.find((i) => i.productId === id);
      if (ex) return cur.map((i) => i.productId === id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...cur, { productId: id, sku: product.sku ?? "", name: product.name ?? "", quantity: 1, unitPrice }];
    });
  }

  function updateQuantity(productId: string, next: number) {
    if (next < 1) { removeFromCart(productId); return; }
    setCart((cur) => cur.map((i) => i.productId === productId ? { ...i, quantity: next } : i));
  }

  function removeFromCart(productId: string) {
    setCart((cur) => cur.filter((i) => i.productId !== productId));
  }

  async function createSale() {
    setError(""); setSuccessMessage("");
    if (!selectedBranchId)   { setError("Selecciona una sucursal.");  return; }
    if (!selectedWarehouseId) { setError("Selecciona un almacén.");    return; }
    if (cart.length === 0)    { setError("Agrega productos al carrito."); return; }
    const hasDemo = cart.some((i) => i.productId.startsWith("demo-"));
    if (hasDemo) {
      setSuccessMessage("Venta demo procesada correctamente ✓ (los productos demo no se envían al backend)");
      setCart([]);
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await apiRequest<CreateSaleResponse>("/api/sales/", {
        method: "POST",
        body: JSON.stringify({
          branchId: selectedBranchId,
          warehouseId: selectedWarehouseId,
          customerId: null,
          discountTotal: discountAmt,
          taxTotal: 0,
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
          payments: [{ paymentMethod, amount: total, reference: null }],
        }),
      });
      setSuccessMessage(`Venta registrada: ${formatShortId(res.id)}`);
      setCart([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al procesar la venta.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="posPageNew">
      {/* ══════════ LEFT — Catalog ══════════ */}
      <div className="posLeft">
        {/* Header row */}
        <div className="posLeftHeader">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', margin: 0 }}>Productos</h2>
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>{visibleProducts.length} artículos disponibles</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)}
                style={{ padding: '7px 10px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', fontSize: '12px', color: '#374151', outline: 'none', maxWidth: '140px' }}>
                <option value="">Sucursal…</option>
                {activeBranches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select value={selectedWarehouseId} onChange={(e) => setSelectedWarehouseId(e.target.value)}
                disabled={!selectedBranchId}
                style={{ padding: '7px 10px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', fontSize: '12px', color: '#374151', outline: 'none', maxWidth: '140px' }}>
                <option value="">Almacén…</option>
                {availableWarehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>

          {/* Category tabs */}
          <div className="posCategoryTabs">
            {CATEGORIES.map((cat) => (
              <button key={cat.key}
                className={`posCategoryTab${activeCategory === cat.key ? " active" : ""}`}
                onClick={() => setActiveCategory(cat.key)}>
                <span>{cat.icon}</span>{cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search bar */}
        <div className="posLeftSearchBar">
          <div className="posLeftSearchWrap">
            <svg className="posLeftSearchIcon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="posLeftSearchInput"
              placeholder="Buscar por nombre o SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>
          {search && (
            <button onClick={() => setSearch("")}
              style={{ padding: '7px 12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', fontSize: '12px', color: '#6b7280', cursor: 'pointer' }}>
              Limpiar
            </button>
          )}
        </div>

        {/* Promo bar */}
        <div className="posPromoBar">
          <span>🏷️ <strong>Promo activa:</strong> 10% de descuento en todos los productos hoy</span>
          <span style={{ fontWeight: 700, color: '#92400e', fontSize: '12px' }}>Se aplica automáticamente al ticket →</span>
        </div>

        {/* Product grid */}
        <div className="posProductGrid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
          {isLoading && apiProducts.length === 0 && DEMO_PRODUCTS.length === 0 ? (
            <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '10px', color: '#9ca3af' }}>
              <div className="loadingSpinner" style={{ borderTopColor: '#3b82f6' }}></div>
              Cargando catálogo…
            </div>
          ) : visibleProducts.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
              <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>🔍</span>
              No se encontraron productos
            </div>
          ) : visibleProducts.map((product) => {
            const vis = getVisual(product.id ?? "");
            const stock = getStock(product.id ?? "");
            const isLowStock = stock <= 8;
            return (
              <div key={product.id} className="posProductCardV2">
                {/* Image area */}
                <div className="posProductCardV2ImgBox" style={{ background: vis.bg }}>
                  <span style={{ fontSize: '52px', lineHeight: 1 }}>{vis.emoji}</span>
                  <button className="posProductCardV2WishBtn"
                    style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}
                    onClick={(e) => e.stopPropagation()} aria-label="Favorito">
                    ♡
                  </button>
                  {product._demo && (
                    <span style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>DEMO</span>
                  )}
                </div>

                {/* Body */}
                <div className="posProductCardV2Body">
                  <p className="posProductCardV2Name">{product.name}</p>
                  <p className="posProductCardV2Sku">SKU: {product.sku}</p>
                  <p className="posProductCardV2Price">{formatMoney(product.salePrice)}</p>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    background: isLowStock ? '#fee2e2' : '#d1fae5',
                    color: isLowStock ? '#991b1b' : '#065f46',
                    fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px'
                  }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: isLowStock ? '#ef4444' : '#10b981', display: 'block' }}></span>
                    {isLowStock ? `¡Solo ${stock} disponibles!` : `En stock (${stock})`}
                  </span>
                </div>

                {/* Footer */}
                <div className="posProductCardV2Footer">
                  <button className="posProductCardV2AddBtn" onClick={() => addToCart(product)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Agregar
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom banner */}
        <div className="posPromoBanner">
          <div className="posPromoBannerIcon">🎁</div>
          <div className="posPromoBannerText">
            <p className="posPromoBannerTitle">¡Combos disponibles!</p>
            <p className="posPromoBannerSub">iPhone + Cargador + Funda con descuento especial</p>
          </div>
          <button className="posPromoBannerLink">Ver combos →</button>
        </div>
      </div>

      {/* ══════════ RIGHT — Ticket ══════════ */}
      <div className="posRight">
        {/* Client */}
        <div className="posClientSection">
          <div className="posClientHeader">
            <span>Cliente</span>
            <button className="posClientChange">Cambiar</button>
          </div>
          <div className="posClientCard">
            <div className="posClientAvatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="posClientName">Juan Pérez</p>
              <p className="posClientPhone">+56 9 1234 5678</p>
            </div>
            <span className="posClientBadge">Frecuente</span>
          </div>
        </div>

        {/* Ticket header */}
        <div className="posTicketHeader">
          <div>
            <span className="posTicketTitle">Ticket actual</span>
            {totalItems > 0 && (
              <span className="posTicketCount"> — {totalItems} art.</span>
            )}
          </div>
          <button className="posClearBtn" onClick={() => setCart([])} aria-label="Vaciar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>

        {/* Cart items */}
        <div className="posCartItems">
          {cart.length === 0 ? (
            <div className="posCartEmpty">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.3 }}>
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              <p style={{ fontSize: '13px', margin: 0 }}>El ticket está vacío</p>
              <p style={{ fontSize: '11px', margin: 0 }}>Agrega productos del catálogo</p>
            </div>
          ) : cart.map((item) => {
            const vis = getVisual(item.productId);
            return (
              <div key={item.productId} className="posCartItem">
                <div className="posCartItemThumb" style={{ background: vis.bg, borderRadius: '8px', width: '40px', height: '40px', display: 'grid', placeItems: 'center', fontSize: '20px', flexShrink: 0 }}>
                  {PRODUCT_VISUALS[item.productId]?.emoji ?? "📦"}
                </div>
                <div className="posCartItemInfo">
                  <p className="posCartItemName">{item.name}</p>
                  <p className="posCartItemPrice">{formatMoney(item.unitPrice)}</p>
                </div>
                <div className="posQtyControl">
                  <button className="posQtyBtn" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>−</button>
                  <span className="posQtyValue">{item.quantity}</span>
                  <button className="posQtyBtn" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                </div>
                <span className="posCartItemSubtotal">{formatMoney(item.quantity * item.unitPrice)}</span>
                <button className="posCartDeleteBtn" onClick={() => removeFromCart(item.productId)} aria-label="Eliminar">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="posSummarySection">
          <div className="posSummaryRow">
            <span>Subtotal</span>
            <strong>{formatMoney(subtotal)}</strong>
          </div>
          <div className="posSummaryRow posSummaryRowDiscount">
            <span>Descuento (10%)</span>
            <strong>– {formatMoney(discountAmt)}</strong>
          </div>
          <div className="posSummaryTotal">
            <span>Total</span>
            <span className="posSummaryTotalAmount">{formatMoney(total)}</span>
          </div>

          {/* Payment method */}
          <div className="posMethodGrid">
            {PAYMENT_METHODS.map((m) => (
              <button key={m.key}
                className={`posMethodBtn${paymentMethod === m.key ? " active" : ""}`}
                onClick={() => setPaymentMethod(m.key)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px' }}>{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>

          {/* Cobrar button */}
          <button className="posPayBtnPrimary"
            onClick={createSale}
            disabled={isSubmitting || cart.length === 0}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="6" width="20" height="12" rx="2"/>
                <path d="M12 12h.01"/>
              </svg>
              {isSubmitting ? "Procesando…" : "Cobrar"}
            </span>
            <strong style={{ fontSize: '18px' }}>{formatMoney(total)}</strong>
          </button>

          <p style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '8px' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Transacción protegida — Sucursal Centro
          </p>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '12px 20px', fontWeight: 600, fontSize: '14px', color: '#dc2626', zIndex: 100, boxShadow: '0 4px 12px rgba(220,38,38,0.2)' }}>
          ⚠ {error}
        </div>
      )}
      {successMessage && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: '#fff', padding: '12px 24px', borderRadius: '12px', fontWeight: 700, fontSize: '14px', boxShadow: '0 4px 16px rgba(16,185,129,0.45)', zIndex: 100 }}>
          ✓ {successMessage}
        </div>
      )}
    </section>
  );
}
