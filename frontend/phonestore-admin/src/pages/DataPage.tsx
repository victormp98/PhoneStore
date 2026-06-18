import { useEffect, useState } from "react";
import { apiRequest, normalizeArray } from "../api/apiClient";
import { DataTable } from "../components/DataTable";
import { ErrorBox } from "../components/ErrorBox";
import type { ApiObject, ModuleConfig } from "../types/api";
import { tableColumnsByModule } from "../utils/tableConfigs";

export function DataPage(props: { moduleConfig: ModuleConfig }) {
  const [rows, setRows] = useState<ApiObject[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRows() {
      setIsLoading(true);
      setError("");

      try {
        const payload = await apiRequest<unknown>(props.moduleConfig.endpoint);
        setRows(normalizeArray(payload));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Error al cargar.");
      } finally {
        setIsLoading(false);
      }
    }

    loadRows();
  }, [props.moduleConfig.endpoint]);

  return (
    <section className="page">
      <div className="pageHeader">
        <div>
          <h2>{props.moduleConfig.label}</h2>
          <p>{props.moduleConfig.description}</p>
        </div>
      </div>

      <div className="panel">
        {isLoading && <p>Cargando datos reales...</p>}
        {error && <ErrorBox message={error} />}
        {!isLoading && !error && (
          <DataTable columns={tableColumnsByModule[props.moduleConfig.key] ?? []} rows={rows} />
        )}
      </div>
    </section>
  );
}
