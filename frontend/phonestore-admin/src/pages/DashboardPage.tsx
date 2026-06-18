import { useEffect, useState } from "react";
import { apiRequest, normalizeArray } from "../api/apiClient";
import { DataTable } from "../components/DataTable";
import { ErrorBox } from "../components/ErrorBox";
import { MetricCard } from "../components/MetricCard";
import type { ApiObject } from "../types/api";
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
    return <div className="panel">Cargando datos reales...</div>;
  }

  if (error) {
    return <ErrorBox message={error} />;
  }

  return (
    <section className="page">
      <div className="pageHeader">
        <div>
          <h2>Dashboard</h2>
          <p>Resumen calculado solamente con respuestas reales del backend.</p>
        </div>
      </div>

      <div className="metricGrid">
        <MetricCard title="Productos" value={products.length} />
        <MetricCard title="Clientes" value={customers.length} />
        <MetricCard title="Ventas" value={sales.length} />
        <MetricCard title="Registros de stock" value={stocks.length} />
      </div>

      <div className="gridTwo">
        <div className="panel">
          <h3>Últimos productos recibidos</h3>
          <DataTable columns={tableColumnsByModule.products} rows={products.slice(0, 5)} />
        </div>

        <div className="panel">
          <h3>Últimas ventas recibidas</h3>
          <DataTable columns={tableColumnsByModule.sales} rows={sales.slice(0, 5)} />
        </div>
      </div>
    </section>
  );
}
