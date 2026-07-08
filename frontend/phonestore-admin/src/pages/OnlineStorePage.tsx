import { useState } from "react";

const STORE_CATEGORIES = [
  { key: "all",       label: "Todos",        icon: "⊞" },
  { key: "celulares", label: "Celulares",    icon: "📱" },
  { key: "accesorios",label: "Accesorios",   icon: "🎧" },
  { key: "cargadores",label: "Cargadores",   icon: "⚡" },
  { key: "audio",     label: "Audio",        icon: "🎵" },
  { key: "smartwatch",label: "Smartwatch",   icon: "⌚" },
  { key: "servicios", label: "Servicios",    icon: "🔧" },
  { key: "ofertas",   label: "🏷️ Ofertas",   icon: "", special: true },
];

const SIDEBAR_CATEGORIES = [
  "Celulares y Smartphones",
  "Accesorios y Fundas",
  "Cargadores y Cables",
  "Audio y Parlantes",
  "Smartwatch y Wearables",
  "Repuestos y Pantallas",
  "Herramientas",
  "Servicios Técnicos",
];

const BRANDS = [
  { name: "Apple",    count: 128 },
  { name: "Samsung",  count: 96  },
  { name: "Xiaomi",   count: 72  },
  { name: "Motorola", count: 45  },
  { name: "Anker",    count: 32  },
];

type StoreProduct = {
  id: string;
  name: string;
  price: string;
  oldPrice?: string;
  installments?: string;
  rating: number;
  reviews: number;
  badge?: "stock" | "service" | "new";
  shipping?: boolean;
  discount?: string;
  emoji: string;
  bg: string;
  category: string;
};

const ALL_PRODUCTS: StoreProduct[] = [
  { id:"s1", name:"iPhone 14 Pro 128GB", price:"$829.990", oldPrice:"$949.990", installments:"12 cuotas de $69.166", rating:4.8, reviews:312, badge:"stock", shipping:true, discount:"-12%", emoji:"📱", bg:"linear-gradient(135deg,#1e293b,#0f172a)", category:"celulares" },
  { id:"s2", name:"Samsung Galaxy S23 Ultra", price:"$899.990", installments:"12 cuotas de $74.999", rating:4.7, reviews:214, badge:"stock", shipping:true, emoji:"📱", bg:"linear-gradient(135deg,#4f46e5,#7c3aed)", category:"celulares" },
  { id:"s3", name:"AirPods Pro 2da Gen", price:"$299.990", installments:"6 cuotas de $49.998", rating:4.9, reviews:528, badge:"stock", discount:"-8%", oldPrice:"$329.990", emoji:"🎧", bg:"linear-gradient(135deg,#0d9488,#0f766e)", category:"accesorios" },
  { id:"s4", name:"Cargador MagSafe 15W", price:"$39.990", installments:"3 cuotas de $13.330", rating:4.6, reviews:189, badge:"stock", emoji:"⚡", bg:"linear-gradient(135deg,#d97706,#b45309)", category:"cargadores" },
  { id:"s5", name:"Funda MagSafe Silicona iPhone 14", price:"$24.990", installments:"2 cuotas de $12.495", rating:4.4, reviews:97, badge:"stock", shipping:true, emoji:"🔴", bg:"linear-gradient(135deg,#be185d,#9d174d)", category:"accesorios" },
  { id:"s6", name:"Vidrio Templado 2.5D 9H", price:"$9.990", oldPrice:"$11.990", installments:undefined, rating:4.5, reviews:431, badge:"stock", discount:"-17%", emoji:"🔲", bg:"linear-gradient(135deg,#374151,#111827)", category:"accesorios" },
  { id:"s7", name:"Sony WH-1000XM5 Negro", price:"$499.990", installments:"12 cuotas de $41.666", rating:4.9, reviews:278, badge:"stock", shipping:true, emoji:"🎵", bg:"linear-gradient(135deg,#b91c1c,#991b1b)", category:"audio" },
  { id:"s8", name:"Apple Watch Series 9 GPS", price:"$399.990", installments:"12 cuotas de $33.332", rating:4.8, reviews:156, badge:"new", emoji:"⌚", bg:"linear-gradient(135deg,#0369a1,#0c4a6e)", category:"smartwatch" },
  { id:"s9", name:"Cambio de Pantalla iPhone 14", price:"$129.900", installments:undefined, rating:5.0, reviews:204, badge:"service", emoji:"🔧", bg:"linear-gradient(135deg,#059669,#047857)", category:"servicios" },
  { id:"s10", name:"Cable USB-C a Lightning 2m", price:"$12.990", installments:"2 cuotas de $6.495", rating:4.3, reviews:88, badge:"stock", emoji:"🔌", bg:"linear-gradient(135deg,#7c3aed,#6d28d9)", category:"cargadores" },
  { id:"s11", name:"Xiaomi Redmi Note 12 Pro", price:"$349.990", oldPrice:"$399.990", installments:"6 cuotas de $58.331", rating:4.5, reviews:143, badge:"stock", discount:"-13%", emoji:"📱", bg:"linear-gradient(135deg,#0891b2,#0e7490)", category:"celulares" },
  { id:"s12", name:"JBL Flip 6 Bluetooth", price:"$89.990", installments:"3 cuotas de $29.996", rating:4.7, reviews:321, badge:"stock", shipping:true, emoji:"🔊", bg:"linear-gradient(135deg,#dc2626,#b91c1c)", category:"audio" },
];

const BENEFITS = [
  { icon:"🚚", title:"Envío gratis", sub:"En compras sobre $39.990", bg:"#dbeafe" },
  { icon:"⚡", title:"Entrega hoy", sub:"Comprando antes de las 14:00", bg:"#fef3c7" },
  { icon:"🏪", title:"Retiro en tienda", sub:"Disponible en 2 horas", bg:"#fee2e2" },
  { icon:"🛡️", title:"Garantía 12 meses", sub:"En todos nuestros productos", bg:"#d1fae5" },
];

function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {[1,2,3,4,5].map((s) => (
        <span key={s} style={{ color: s <= Math.round(rating) ? "#f59e0b" : "#d1d5db", fontSize: '12px' }}>★</span>
      ))}
    </span>
  );
}

function BadgePill({ type }: { type?: "stock"|"service"|"new" }) {
  if (!type) return null;
  const map = {
    stock:   { label: "En stock",  bg: "#d1fae5", color: "#065f46" },
    service: { label: "Servicio",  bg: "#dbeafe", color: "#1e40af" },
    new:     { label: "Nuevo",     bg: "#fef3c7", color: "#92400e" },
  };
  const c = map[type];
  return (
    <span style={{ background: c.bg, color: c.color, fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '999px' }}>
      {c.label}
    </span>
  );
}

export function OnlineStorePage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [cartCount, setCartCount] = useState(2);
  const [priceMax, setPriceMax] = useState(500000);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  const visibleProducts = ALL_PRODUCTS.filter((p) =>
    activeCategory === "all" || p.category === activeCategory
  );

  function toggleBrand(b: string) {
    setSelectedBrands((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]);
  }

  return (
    <div className="storeLayout">
      {/* ── Category Nav (sticky, light) ── */}
      <nav className="storeCategoryBarLight" aria-label="Categorías">
        {STORE_CATEGORIES.map((cat) => (
          <button key={cat.key}
            className={`storeCategoryTabLight${activeCategory === cat.key ? " active" : ""}${cat.special ? " offers" : ""}`}
            onClick={() => setActiveCategory(cat.key)}>
            {cat.icon && <span>{cat.icon}</span>}
            {cat.label}
          </button>
        ))}
        {/* Cart indicator */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', padding: '0 4px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Buscar…
          </span>
          <button
            onClick={() => setCartCount((c) => c > 0 ? c - 1 : 0)}
            style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#0d1b2a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            Carrito
            {cartCount > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 800, width: '18px', height: '18px', borderRadius: '50%', display: 'grid', placeItems: 'center', border: '2px solid #fff' }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <div className="storeMain">
        {/* Sidebar */}
        <aside className="storeSidebar">
          <div className="storeSidebarSection">
            <p className="storeSidebarTitle">Categorías</p>
            {SIDEBAR_CATEGORIES.map((cat) => (
              <button key={cat} className="storeSidebarLink">
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#d1d5db', flexShrink: 0, display: 'block' }}></span>
                {cat}
              </button>
            ))}
          </div>

          <div className="storeSidebarSection">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <p className="storeSidebarTitle" style={{ margin: 0 }}>Filtros</p>
              <button style={{ fontSize: '12px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Limpiar</button>
            </div>

            {/* Price */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Precio máximo</p>
              <div className="storePriceRange">
                <input type="range" min={0} max={1000000} value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="storePriceRangeSlider" />
                <div className="storePriceRangeValues">
                  <span>$0</span>
                  <span>${priceMax.toLocaleString("es-CL")}</span>
                </div>
              </div>
            </div>

            {/* Brands */}
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Marca</p>
              {BRANDS.map((b) => (
                <label key={b.name} className="storeFilterCheckbox">
                  <input type="checkbox" checked={selectedBrands.includes(b.name)} onChange={() => toggleBrand(b.name)} />
                  {b.name}
                  <span className="storeFilterCheckboxCount">({b.count})</span>
                </label>
              ))}
            </div>

            {/* Availability */}
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Disponibilidad</p>
              {["En stock", "Envío gratis", "Retiro en tienda"].map((o) => (
                <label key={o} className="storeFilterCheckbox">
                  <input type="checkbox" />
                  {o}
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="storeContent">
          {/* Hero */}
          <div className="storeHeroV2">
            <div className="storeHeroV2Left">
              <div className="storeHeroV2Tag">PRODUCTO DESTACADO</div>
              <h1 className="storeHeroV2Title">iPhone 14 Pro<br/>128 GB — Nuevo</h1>
              <p className="storeHeroV2Sub">Cámara 48MP, chip A16 Bionic, Dynamic Island</p>
              <div className="storeHeroV2Specs">
                <span className="storeHeroV2Spec">📷 Cámara 48MP</span>
                <span className="storeHeroV2Spec">⚡ Chip A16</span>
                <span className="storeHeroV2Spec">🔋 Batería 24h</span>
                <span className="storeHeroV2Spec">🛡️ Garantía 12m</span>
              </div>
              <div className="storeHeroV2PriceWrap">
                <span className="storeHeroV2Price">$829.990</span>
                <span className="storeHeroV2Discount">-12% HOY</span>
              </div>
              <p className="storeHeroV2Installments">12 cuotas sin interés de $69.166</p>
              <div className="storeHeroV2Btns">
                <button className="storeHeroV2BtnPrimary">Ver detalle</button>
                <button className="storeHeroV2BtnSecondary" onClick={() => setCartCount((c) => c + 1)}>
                  Agregar al carrito
                </button>
              </div>
            </div>
            <div className="storeHeroV2Right">
              <div className="storeHeroV2DeviceWrap">📱</div>
            </div>
          </div>

          {/* Benefits */}
          <div className="storeBenefits">
            {BENEFITS.map((b) => (
              <div key={b.title} className="storeBenefitCard">
                <div className="storeBenefitIcon" style={{ background: b.bg, fontSize: '20px', width: '40px', height: '40px', borderRadius: '10px', display: 'grid', placeItems: 'center' }}>
                  {b.icon}
                </div>
                <div>
                  <p className="storeBenefitTitle">{b.title}</p>
                  <p className="storeBenefitSub">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Promo Strip */}
          <div className="storePromoStrip">
            <div className="storePromoStripLeft">
              <div className="storePromoStripIcon">🏷️</div>
              <div>
                <p className="storePromoStripText">Promoción del mes activa</p>
                <p className="storePromoStripSub">10% de descuento en accesorios seleccionados — válido hasta el 31 de julio</p>
              </div>
            </div>
            <button className="storePromoStripBtn">Ver productos →</button>
          </div>

          {/* Product grid */}
          <div>
            <div className="storeProductsHeader">
              <div>
                <p className="storeProductsTitle">
                  {activeCategory === "all" ? "Todos los productos" : STORE_CATEGORIES.find((c) => c.key === activeCategory)?.label}
                </p>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>{visibleProducts.length} resultados</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select style={{ padding: '6px 10px', borderRadius: '8px', border: '1.5px solid #e5e7eb', background: '#fff', fontSize: '12px', color: '#374151', outline: 'none' }}>
                  <option>Relevancia</option>
                  <option>Precio: menor a mayor</option>
                  <option>Precio: mayor a menor</option>
                  <option>Más vendidos</option>
                </select>
              </div>
            </div>

            <div className="storeProductGrid">
              {visibleProducts.map((product) => (
                <div key={product.id} className="storeProductCardV2">
                  {/* Image */}
                  <div className="storeProductImgWrapV2" style={{ background: product.bg }}>
                    <span className="storeProductImgV2">{product.emoji}</span>
                    <button
                      style={{ position: 'absolute', top: '10px', right: '10px', width: '30px', height: '30px', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}
                      aria-label="Favorito">♡</button>
                    <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <BadgePill type={product.badge} />
                      {product.discount && (
                        <span style={{ background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>{product.discount}</span>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="storeProductBodyV2">
                    <p className="storeProductNameV2">{product.name}</p>
                    <div className="storeProductRatingV2">
                      <Stars rating={product.rating} />
                      <span style={{ fontWeight: 700, color: '#111827', fontSize: '11px' }}>{product.rating}</span>
                      <span style={{ color: '#9ca3af', fontSize: '11px' }}>({product.reviews})</span>
                    </div>
                    <div>
                      <span className="storeProductPriceV2">{product.price}</span>
                      {product.oldPrice && <span className="storeProductOldPriceV2">{product.oldPrice}</span>}
                    </div>
                    {product.installments && <p className="storeProductInstallmentsV2">{product.installments}</p>}
                    {product.shipping && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eff6ff', color: '#1e40af', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/></svg>
                        Envío gratis
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="storeProductActionsV2">
                    <button className="storeAddCartBtnV2" onClick={() => setCartCount((c) => c + 1)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Agregar
                    </button>
                    <button className="storeWishBtnV2" aria-label="Favorito">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info grid */}
          <div className="storeInfoGrid" style={{ marginTop: '32px' }}>
            {[
              { icon:"💳", title:"Paga como prefieras", sub:"Efectivo, tarjeta, transferencia y más", bg:"#dbeafe" },
              { icon:"🔒", title:"Compra segura", sub:"Datos y pagos protegidos", bg:"#d1fae5" },
              { icon:"🎧", title:"Soporte experto", sub:"Asesoría personalizada en tu compra", bg:"#fef3c7" },
              { icon:"🔄", title:"Devolución fácil", sub:"30 días para cambios sin preguntas", bg:"#f3e8ff" },
            ].map((info) => (
              <div key={info.title} className="storeInfoCard">
                <div className="storeInfoIcon" style={{ background: info.bg, fontSize: '20px', width: '40px', height: '40px', borderRadius: '10px', display: 'grid', placeItems: 'center' }}>
                  {info.icon}
                </div>
                <div>
                  <p className="storeInfoTitle">{info.title}</p>
                  <p className="storeInfoSub">{info.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
