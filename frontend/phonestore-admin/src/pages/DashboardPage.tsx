import { useEffect, useState } from "react";
import { apiRequest, normalizeArray } from "../api/apiClient";
import { DataTable } from "../components/DataTable";
import { ErrorBox } from "../components/ErrorBox";
import type { ApiObject } from "../types/api";
import { formatMoney } from "../utils/formatters";
import { tableColumnsByModule } from "../utils/tableConfigs";

export function DashboardPage() {
  const [products, setProducts] = useState<ApiObject[]>([]);
  const [customers, setCustomers] = useState<ApiObject[]>([]);
  const [sales, setSales] = useState<ApiObject[]>([]);
  const [stocks, setStocks] = useState<ApiObject[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      setError("");

      try {
        const [productsPayload, customersPayload, salesPayload, stocksPayload] =
          await Promise.all([
            apiRequest<unknown>("/api/products/"),
            apiRequest<unknown>("/api/customers/"),
            apiRequest<unknown>("/api/sales/"),
            apiRequest<unknown>("/api/inventory-stocks/")
          ]);

        setProducts(normalizeArray(productsPayload));
        setCustomers(normalizeArray(customersPayload));
        setSales(normalizeArray(salesPayload));
        setStocks(normalizeArray(stocksPayload));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Error al cargar.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="loadingScreen">
        <div className="loadingSpinner"></div>
        <p>Cargando datos reales del backend...</p>
      </div>
    );
  }

  if (error) {
    return <ErrorBox message={error} />;
  }

  const paidSales = sales.filter((sale) => String(sale.status ?? "").toUpperCase() === "PAID");
  const cancelledSales = sales.filter((sale) => String(sale.status ?? "").toUpperCase() === "CANCELLED");
  const paidRevenue = paidSales.reduce((sum, sale) => sum + Number(sale.total ?? 0), 0);
  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total ?? 0), 0);
  const activeProducts = products.filter((product) => product.isActive !== false).length;
  const activeCustomers = customers.filter((customer) => String(customer.status ?? "").toUpperCase() !== "INACTIVE").length;
  const availableUnits = stocks.reduce((sum, stock) => sum + Number(stock.availableQuantity ?? 0), 0);
  const reservedUnits = stocks.reduce((sum, stock) => sum + Number(stock.reservedQuantity ?? 0), 0);
  const lowStockCount = stocks.filter((stock) => {
    return Number(stock.availableQuantity ?? 0) <= Number(stock.minStock ?? 0);
  }).length;
  const salesBars = sales.slice(0, 8).map((sale) => Number(sale.total ?? 0));
  const stockBars = stocks.slice(0, 8).map((stock) => Number(stock.availableQuantity ?? 0));
  const catalogBars = products.slice(0, 8).map((product) => Number(product.salePrice ?? 0));
  const customerBars = customers.slice(0, 8).map((_, index) => index + 1);
  const salesSeries = sales.slice(-7);
  const salesLabels = salesSeries.map((sale, index) => {
    const date = sale.createdAt ? new Date(String(sale.createdAt)) : null;
    if (date && !Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("es-MX", { weekday: "short" }).format(date);
    }
    return `D${index + 1}`;
  });
  const stockHealthPercent = stocks.length > 0 ? Math.max(0, 100 - Math.round((lowStockCount / stocks.length) * 100)) : 100;
  const paidPercent = sales.length > 0 ? Math.round((paidSales.length / sales.length) * 100) : 0;
  const cancelledPercent = sales.length > 0 ? Math.round((cancelledSales.length / sales.length) * 100) : 0;
  const stockPeak = Math.max(availableUnits + reservedUnits, 1);
  const catalogValue = products.reduce((sum, product) => sum + Number(product.salePrice ?? 0), 0);
  const avgTicket = sales.length > 0 ? totalRevenue / sales.length : 0;
  const stockTrend = buildTrendPoints(stockBars, 280, 100);
  const catalogTrend = buildTrendPoints(catalogBars, 280, 100);
  const customerTrend = buildTrendPoints(customerBars, 280, 100);
  const salesAxisMax = Math.max(...salesBars, 1);
  const stockAxisMax = Math.max(...stockBars, 1);
  const catalogAxisMax = Math.max(...catalogBars, 1);
  const customerAxisMax = Math.max(...customerBars, 1);
  const salesTicks = [0.25, 0.5, 0.75, 1].map((ratio) => Math.round(salesAxisMax * ratio));
  const stockTicks = [0.25, 0.5, 0.75, 1].map((ratio) => Math.round(stockAxisMax * ratio));
  const catalogTicks = [0.25, 0.5, 0.75, 1].map((ratio) => Math.round(catalogAxisMax * ratio));
  const customerTicks = [0.25, 0.5, 0.75, 1].map((ratio) => Math.round(customerAxisMax * ratio));

  return (
    <section className="page">
      <section className="dashboardHeader">
        <div className="dashboardHeaderCopy">
          <span className="eyebrow">Resumen ejecutivo</span>
          <h2>Lectura rápida del negocio</h2>
          <p>KPIs compactos, gráficas con escala y registros reales del backend.</p>
        </div>
      </section>

      <section className="kpiGrid">
        <article className="kpiCard">
          <span>Ingresos</span>
          <strong>{formatMoney(paidRevenue)}</strong>
          <small>{sales.length} ventas cargadas</small>
        </article>
        <article className="kpiCard">
          <span>Stock</span>
          <strong>{availableUnits}</strong>
          <small>{reservedUnits} reservados</small>
        </article>
        <article className="kpiCard">
          <span>Ventas</span>
          <strong>{sales.length}</strong>
          <small>{paidSales.length} pagadas</small>
        </article>
        <article className="kpiCard">
          <span>Clientes</span>
          <strong>{customers.length}</strong>
          <small>{activeCustomers} activos</small>
        </article>
      </section>

      <div className="insightGrid">
        <section className="analyticsPanel revenuePanel">
          <div className="panelHeader">
            <div>
              <h3>Ventas de la semana</h3>
              <p>Tendencia de ingresos por día reciente.</p>
            </div>
            <div className="chartStat">
              <span>Total</span>
              <strong>{formatMoney(paidRevenue)}</strong>
            </div>
          </div>
          <div className="chartPlaceholder chartBars">
            <div className="chartFrame chartFrameWithAxes">
              <div className="chartYLabels">
                {salesTicks.slice().reverse().map((tick) => (
                  <span key={tick}>{formatMoney(tick)}</span>
                ))}
              </div>
              <svg viewBox="0 0 280 100" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#1d4ed8" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
                {[20, 40, 60, 80].map((y) => (
                  <line key={y} x1="0" y1={y} x2="280" y2={y} stroke="rgba(148,163,184,0.10)" strokeWidth="1" />
                ))}
                {salesBars.map((value, index) => {
                  const barWidth = salesBars.length > 0 ? 220 / salesBars.length : 220;
                  const height = Math.max(10, (value / salesAxisMax) * 72);
                  const x = 36 + index * barWidth + 4;
                  const y = 88 - height;
                  return (
                    <g key={`${index}-${value}`}>
                      <rect x={x} y={y} width={Math.max(barWidth - 8, 12)} height={height} rx="6" fill="url(#salesGradient)" />
                      <text x={x + Math.max(barWidth - 8, 12) / 2} y={y - 4} textAnchor="middle" className="chartValueLabel">
                        {formatMoney(value)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
          <div className="chartCallout">
            <strong>Lectura comercial</strong>
            <span>El valor alto indica el total cobrado en ventas pagadas durante la ventana reciente.</span>
          </div>
          <div className="chartMetrics">
            <div>
              <span>Ventas</span>
              <strong>{sales.length}</strong>
            </div>
            <div>
              <span>Pagadas</span>
              <strong>{paidPercent}%</strong>
            </div>
            <div>
              <span>Promedio</span>
              <strong>{formatMoney(avgTicket)}</strong>
            </div>
          </div>
          <div className="chartLegend">
            <span><i className="legendPaid"></i>Ingresos reales</span>
            <span><i className="legendCancelled"></i>Canceladas</span>
          </div>
          <div className="chartAxisLabels">
            {salesLabels.map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>
        </section>

        <section className="analyticsPanel stockPanel">
          <div className="panelHeader">
            <div>
              <h3>Estado de inventario</h3>
              <p>Disponible vs reservado con alertas de mínimo.</p>
            </div>
            <div className="chartStat">
              <span>Salud</span>
              <strong>{stockHealthPercent}%</strong>
            </div>
          </div>
          <div className="chartPlaceholder chartTrend">
            <div className="chartFrame chartFrameWithAxes">
              <div className="chartYLabels">
                {stockTicks.slice().reverse().map((tick) => (
                  <span key={tick}>{tick}</span>
                ))}
              </div>
              {stocks.length > 0 ? (
                <svg viewBox="0 0 280 100" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="stockGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1d4ed8" />
                      <stop offset="100%" stopColor="#6b7280" />
                    </linearGradient>
                  </defs>
                  <polyline fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="1" points="0,80 280,80" />
                  <polyline fill="none" stroke="url(#stockGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={stockTrend} />
                </svg>
              ) : (
                <div className="chartEmptyState">Sin datos de inventario</div>
              )}
            </div>
          </div>
          <div className="chartCallout">
            <strong>Lectura operativa</strong>
            <span>La línea muestra disponibilidad real y el riesgo sube cuando el inventario entra en mínimo.</span>
          </div>
          <div className="chartMetrics">
            <div>
              <span>Disponible</span>
              <strong>{availableUnits}</strong>
            </div>
            <div>
              <span>Reservado</span>
              <strong>{reservedUnits}</strong>
            </div>
            <div>
              <span>En mínimo</span>
              <strong>{lowStockCount}</strong>
            </div>
          </div>
          <div className="chartLegend">
            <span><i className="legendPaid"></i>Disponible</span>
            <span><i className="legendCancelled"></i>Reservado</span>
          </div>
        </section>
      </div>

      <div className="insightGrid secondaryGrid">
        <section className="analyticsPanel compactChartPanel">
          <div className="panelHeader">
            <div>
              <h3>Catálogo</h3>
              <p>Precio de venta y valor acumulado del catálogo reciente.</p>
            </div>
            <div className="chartStat">
              <span>Valor</span>
              <strong>{formatMoney(catalogValue)}</strong>
            </div>
          </div>
          <div className="chartPlaceholder chartTrend">
            <div className="chartFrame chartFrameWithAxes">
              <div className="chartYLabels">
                {catalogTicks.slice().reverse().map((tick) => (
                  <span key={tick}>{formatMoney(tick)}</span>
                ))}
              </div>
              <svg viewBox="0 0 280 100" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="catalogGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#1d4ed8" />
                    <stop offset="100%" stopColor="#93c5fd" />
                  </linearGradient>
                </defs>
                <polyline fill="none" stroke="url(#catalogGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={catalogTrend} />
              </svg>
            </div>
          </div>
          <div className="chartCallout">
            <strong>Lectura de catálogo</strong>
            <span>Resume el valor de venta del inventario listado y ayuda a dimensionar el peso comercial.</span>
          </div>
        </section>

        <section className="analyticsPanel compactChartPanel">
          <div className="panelHeader">
            <div>
              <h3>Clientes</h3>
              <p>Base activa y relación con la operación.</p>
            </div>
            <div className="chartStat">
              <span>Activos</span>
              <strong>{activeCustomers}</strong>
            </div>
          </div>
          <div className="chartPlaceholder chartTrend">
            <div className="chartFrame chartFrameWithAxes">
              <div className="chartYLabels">
                {customerTicks.slice().reverse().map((tick) => (
                  <span key={tick}>{tick}</span>
                ))}
              </div>
              <svg viewBox="0 0 280 100" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="customerGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#1d4ed8" />
                    <stop offset="100%" stopColor="#94a3b8" />
                  </linearGradient>
                </defs>
                <polyline fill="none" stroke="url(#customerGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={customerTrend} />
              </svg>
            </div>
          </div>
          <div className="chartCallout">
            <strong>Base activa</strong>
            <span>El crecimiento o estabilidad de clientes impacta ventas futuras y frecuencia de recompra.</span>
          </div>
        </section>
      </div>

      <div className="gridTwo">
        <div className="panel">
          <div className="panelHeader">
            <div>
              <h3>Últimos productos recibidos</h3>
              <p>Últimos registros en la base de datos.</p>
            </div>
          </div>
          <DataTable columns={tableColumnsByModule.products.slice(0, 5)} rows={products.slice(0, 5)} />
        </div>

        <div className="panel">
          <div className="panelHeader">
            <div>
              <h3>Últimas ventas recibidas</h3>
              <p>Últimas transacciones registradas.</p>
            </div>
          </div>
          <DataTable columns={tableColumnsByModule.sales.slice(0, 5)} rows={sales.slice(0, 5)} />
        </div>
      </div>
    </section>
  );
}

function buildTrendPoints(values: number[], width: number, height: number) {
  const normalized = values.length > 0 ? values : [0];
  const maxValue = Math.max(...normalized, 1);

  return normalized
    .map((value, index) => {
      const x = normalized.length === 1 ? width / 2 : (index / (normalized.length - 1)) * width;
      const y = height - (value / maxValue) * (height - 12) - 6;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
