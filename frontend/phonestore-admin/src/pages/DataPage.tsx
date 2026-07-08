import { useEffect, useState } from "react";
import { apiRequest, normalizeArray } from "../api/apiClient";
import { DataTable } from "../components/DataTable";
import { ErrorBox } from "../components/ErrorBox";
import type { ApiObject, ModuleActionKind, ModuleConfig } from "../types/api";
import { tableColumnsByModule } from "../utils/tableConfigs";

type ModuleFormMode = "create" | "edit" | null;
type DetailEntry = { label: string; value: string; key: string };
type DetailSection = { title: string; items: DetailEntry[] };

export function DataPage(props: { moduleConfig: ModuleConfig }) {
  const [rows, setRows] = useState<ApiObject[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRow, setSelectedRow] = useState<ApiObject | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formMode, setFormMode] = useState<ModuleFormMode>(null);
  const [formDraft, setFormDraft] = useState<Record<string, string>>({});

  async function loadRows() {
    setIsLoading(true);
    setError("");

    try {
      const url = new URL(props.moduleConfig.endpoint, window.location.origin);

      if (search && props.moduleConfig.key === "customers") {
        url.searchParams.set("search", search);
      }

      if (props.moduleConfig.key === "customer-addresses") {
        if (!search) {
          setRows([]);
          setIsLoading(false);
          return;
        }
        const payload = await apiRequest<unknown>(`/api/customers/${search}/addresses`);
        const normalized = normalizeArray(payload);
        setRows(normalized);
        setSelectedRow((current) =>
          current ? normalized.find((item) => String(item.id) === String(current.id)) ?? normalized[0] ?? null : null
        );
        return;
      }

      const payload = await apiRequest<unknown>(url.pathname + url.search);
      const normalized = normalizeArray(payload);
      setRows(normalized);
      setSelectedRow((current) =>
        current ? normalized.find((item) => String(item.id) === String(current.id)) ?? normalized[0] ?? null : null
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Error al cargar.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadRows();
  }, [props.moduleConfig.endpoint, search]);

  const actions = props.moduleConfig.actions ?? [];
  const selectedRowId = selectedRow ? String(selectedRow.id) : undefined;
  const supportsEdit = ["brands", "product-categories", "products", "customers", "branches", "warehouses", "users", "customer-addresses"].includes(props.moduleConfig.key);
  const supportsDelete = ["brands", "product-categories", "products", "customers", "branches", "warehouses", "users", "customer-addresses"].includes(props.moduleConfig.key);
  const supportsCancelSale = props.moduleConfig.key === "sales";
  const supportsModalCreate = ["brands", "product-categories", "products", "customers", "branches", "warehouses", "users", "movements", "customer-addresses"].includes(props.moduleConfig.key);
  async function runAction(kind: ModuleActionKind) {
    setError("");

    try {
      if (kind === "refresh") {
        await loadRows();
        return;
      }

      if (kind === "filter") {
        if (props.moduleConfig.key === "customers") {
          const next = search.toLowerCase().includes("active")
            ? ""
            : "ACTIVE";
          setSearch(next);
          return;
        }

        if (props.moduleConfig.key === "sales") {
          const next = search.toUpperCase() === "PAID" ? "" : "PAID";
          setSearch(next);
          return;
        }

        return;
      }

      if (kind === "create") {
        if (props.moduleConfig.key === "customer-addresses") {
          if (!search) {
            throw new Error("Primero escribe el ID del cliente.");
          }
          setFormMode("create");
          setFormDraft(getFormDefaults(props.moduleConfig.key));
          return;
        }
        if (supportsModalCreate) {
          setFormMode("create");
          setFormDraft(getFormDefaults(props.moduleConfig.key));
          return;
        }

        setFormMode("create");
        setFormDraft(getFormDefaults(props.moduleConfig.key));
        return;
      }

      if (kind === "edit") {
        if (!selectedRow) {
          throw new Error("Selecciona un registro primero.");
        }

        if (props.moduleConfig.key === "customer-addresses") {
          setFormMode("edit");
          setFormDraft(getFormDefaults(props.moduleConfig.key, selectedRow));
          return;
        }

        if (supportsEdit) {
          setFormMode("edit");
          setFormDraft(getFormDefaults(props.moduleConfig.key, selectedRow));
          return;
        }

        setFormMode("edit");
        setFormDraft(getFormDefaults(props.moduleConfig.key, selectedRow));
        return;
      }

      if (kind === "delete") {
        if (!selectedRow) {
          throw new Error("Selecciona un registro primero.");
        }

        if (!window.confirm(`Confirmas la desactivación de ${String(selectedRow.id)}?`)) {
          return;
        }

        setIsSaving(true);
        await apiRequest(`${props.moduleConfig.endpoint}${String(selectedRow.id)}`, {
          method: "DELETE"
        });
        await loadRows();
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "No se pudo completar la acción.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="page">
      <div className="pageHeader">
        <div>
          <h2>{props.moduleConfig.label}</h2>
          <p>{props.moduleConfig.description}</p>
        </div>
      </div>

      <div className="moduleToolbar">
        <div className="toolbarSearch">
          <label>
            {props.moduleConfig.key === "customer-addresses" ? "Cliente ID" : "Buscar"}
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={props.moduleConfig.key === "customer-addresses" ? "Pega el ID del cliente" : "Escribe para filtrar"}
            />
          </label>
        </div>

        <div className="pageToolbar">
          {actions
            .filter((action) => {
              if (props.moduleConfig.key === "roles") {
                return action.kind === "refresh";
              }

              if (props.moduleConfig.key === "customer-addresses") {
                return action.kind === "create" || action.kind === "edit" || action.kind === "delete" || action.kind === "refresh";
              }

              if (props.moduleConfig.key === "sales") {
                return action.kind === "create" || action.kind === "filter" || action.kind === "refresh";
              }

              return action.kind === "create" || action.kind === "edit" || action.kind === "delete" || action.kind === "refresh";
            })
            .map((action) => (
            <button
              key={action.kind}
              className={
                action.tone === "primary"
                  ? "primaryButton"
                  : action.tone === "danger"
                    ? "dangerButton"
                    : "secondaryButton"
              }
              onClick={() => void runAction(action.kind)}
              disabled={isLoading || isSaving}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        {isLoading && <p>Cargando datos reales...</p>}
        {error && <ErrorBox message={error} />}
        {!isLoading && !error && (
          <DataTable
            columns={tableColumnsByModule[props.moduleConfig.key] ?? []}
            rows={rows}
            selectedRowId={selectedRowId}
            onSelectRow={setSelectedRow}
            rowActions={props.moduleConfig.key === "products" ? [{ key: "delete", label: "Desactivar", tone: "danger" }] : undefined}
            onRowAction={async (row, actionKey) => {
              if (actionKey === "delete") {
                setSelectedRow(row);
                if (!window.confirm(`Desactivar ${String(row.sku ?? row.name ?? row.id)}?`)) {
                  return;
                }
                setIsSaving(true);
                try {
                  await apiRequest(`${props.moduleConfig.endpoint}${String(row.id)}`, { method: "DELETE" });
                  await loadRows();
                } finally {
                  setIsSaving(false);
                }
              }
            }}
          />
        )}
      </div>

      {selectedRow ? (
        <div className="modalBackdrop" onClick={() => setSelectedRow(null)}>
          <div className="modalCard modalWide" onClick={(event) => event.stopPropagation()}>
            <div className="modalHeader">
              <div>
                <h3>Detalle del registro</h3>
                <p>Vista completa del elemento seleccionado sin tocar la lógica del backend.</p>
              </div>
              <div className="modalHeaderActions">
                {props.moduleConfig.key === "customer-addresses" ? (
                  null
                ) : supportsEdit ? (
                  <button
                    className="primaryButton"
                    onClick={() => {
                      setFormMode("edit");
                      setFormDraft(getFormDefaults(props.moduleConfig.key, selectedRow));
                    }}
                  >
                    Editar
                  </button>
                ) : null}
                {supportsCancelSale ? (
                  <button
                    className="dangerButton"
                    onClick={async () => {
                      if (!selectedRow) return;
                      if (!window.confirm(`Cancelar venta ${String(selectedRow.id)}?`)) {
                        return;
                      }
                      setIsSaving(true);
                      try {
                        await apiRequest(`${props.moduleConfig.endpoint}${String(selectedRow.id)}/cancel`, { method: "POST" });
                        setSelectedRow(null);
                        await loadRows();
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                  >
                    Cancelar
                  </button>
                ) : null}
                {props.moduleConfig.key === "customer-addresses" ? (
                  null
                ) : supportsDelete ? (
                  <button
                    className="dangerButton"
                    onClick={async () => {
                      if (!selectedRow) return;
                      if (!window.confirm(`Confirmas la desactivación de ${String(selectedRow.id)}`)) {
                        return;
                      }
                      setIsSaving(true);
                      try {
                        await apiRequest(`${props.moduleConfig.endpoint}${String(selectedRow.id)}`, { method: "DELETE" });
                        setSelectedRow(null);
                        await loadRows();
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                  >
                    Desactivar
                  </button>
                ) : null}
                <button className="secondaryButton" onClick={() => setSelectedRow(null)}>
                  Cerrar
                </button>
              </div>
            </div>

            <div className="detailGrid">
              {props.moduleConfig.key === "customer-addresses" && selectedRow ? (
                <div className="detailSection">
                  <div className="detailSectionHeader">Contexto</div>
                  <div className="detailSectionGrid">
                    <div className="detailItem">
                      <span>Cliente</span>
                      <strong><span className="shortId">{String(selectedRow.customerId ?? search)}</span></strong>
                    </div>
                  </div>
                </div>
              ) : null}
              {buildDetailSections(selectedRow).map((section) => (
                <div className="detailSection" key={section.title}>
                  <div className="detailSectionHeader">{section.title}</div>
                  <div className="detailSectionGrid">
                    {section.items.map((item) => (
                      <div className="detailItem" key={item.label}>
                        <span>{item.label}</span>
                        <strong>{renderDetailValue(item.key, item.value)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {formMode && (supportsModalCreate || props.moduleConfig.key === "customer-addresses") ? (
        <div className="modalBackdrop" onClick={() => setFormMode(null)}>
          <div className="modalCard" onClick={(event) => event.stopPropagation()}>
            <div className="modalHeader">
              <div>
                <h3>
                  {formMode === "create"
                    ? `Nuevo ${getModuleEntryLabel(props.moduleConfig.key)}`
                    : `Editar ${getModuleEntryLabel(props.moduleConfig.key)}`}
                </h3>
                <p>Los datos se envían al backend real sin modificar contratos.</p>
              </div>
              <button className="secondaryButton" onClick={() => setFormMode(null)}>
                Cerrar
              </button>
            </div>

            <form
              className="modalForm"
              onSubmit={async (event) => {
                event.preventDefault();
                setIsSaving(true);
                setError("");

                try {
                  const endpoint =
                    props.moduleConfig.key === "customer-addresses"
                      ? formMode === "create"
                        ? `/api/customers/${search}/addresses`
                        : `/api/customer-addresses/${String(selectedRow?.id ?? "")}`
                      : formMode === "create"
                        ? props.moduleConfig.endpoint
                        : `${props.moduleConfig.endpoint}${String(selectedRow?.id ?? "")}`;
                  const payload = buildModulePayload(props.moduleConfig.key, formDraft);

                  await apiRequest(endpoint, {
                    method: formMode === "create" ? "POST" : "PUT",
                    body: JSON.stringify(payload)
                  });

                  setFormMode(null);
                  await loadRows();
                } catch (saveError) {
                  setError(saveError instanceof Error ? saveError.message : "No se pudo guardar.");
                } finally {
                  setIsSaving(false);
                }
              }}
            >
              {props.moduleConfig.key === "customer-addresses" ? (
                <>
                  <label>
                    Etiqueta
                    <input value={formDraft.label ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, label: event.target.value }))} />
                  </label>
                  <label>
                    Dirección
                    <input value={formDraft.address ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, address: event.target.value }))} />
                  </label>
                  <div className="modalTwoCols">
                    <label>
                      Ciudad
                      <input value={formDraft.city ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, city: event.target.value }))} />
                    </label>
                    <label>
                      Principal
                      <select value={formDraft.isDefault ?? "false"} onChange={(event) => setFormDraft((current) => ({ ...current, isDefault: event.target.value }))}>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    </label>
                  </div>
                  <div className="modalTwoCols">
                    <label>
                      Latitud
                      <input value={formDraft.geoLat ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, geoLat: event.target.value }))} />
                    </label>
                    <label>
                      Longitud
                      <input value={formDraft.geoLng ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, geoLng: event.target.value }))} />
                    </label>
                  </div>
                </>
              ) : ["brands", "product-categories", "products"].includes(props.moduleConfig.key) ? (
                <>
                  {props.moduleConfig.key === "products" ? (
                    <label>
                      SKU
                      <input
                        value={formDraft.sku ?? ""}
                        onChange={(event) => setFormDraft((current) => ({ ...current, sku: event.target.value }))}
                      />
                    </label>
                  ) : null}
                  <label>
                    Nombre
                    <input value={formDraft.name ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, name: event.target.value }))} />
                  </label>
                  {props.moduleConfig.key === "products" ? (
                    <>
                      <label>
                        Descripción
                        <input value={formDraft.description ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, description: event.target.value }))} />
                      </label>
                      <div className="modalTwoCols">
                        <label>
                          Category ID
                          <input value={formDraft.categoryId ?? ""} readOnly />
                        </label>
                        <label>
                          Brand ID
                          <input value={formDraft.brandId ?? ""} readOnly />
                        </label>
                      </div>
                      <div className="modalTwoCols">
                        <label>
                          Costo
                          <input type="number" step="0.01" value={formDraft.costPrice ?? "0"} onChange={(event) => setFormDraft((current) => ({ ...current, costPrice: event.target.value }))} />
                        </label>
                        <label>
                          Venta
                          <input type="number" step="0.01" value={formDraft.salePrice ?? "0"} onChange={(event) => setFormDraft((current) => ({ ...current, salePrice: event.target.value }))} />
                        </label>
                      </div>
                    </>
                  ) : (
                    <label>
                      Descripción
                      <input value={formDraft.description ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, description: event.target.value }))} />
                    </label>
                  )}
                </>
              ) : props.moduleConfig.key === "branches" ? (
                <>
                  <div className="modalTwoCols">
                    <label>
                      Código
                      <input value={formDraft.code ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, code: event.target.value }))} />
                    </label>
                    <label>
                      Activa
                      <select value={formDraft.isActive ?? "true"} onChange={(event) => setFormDraft((current) => ({ ...current, isActive: event.target.value }))}>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    </label>
                  </div>
                  <label>
                    Nombre
                    <input value={formDraft.name ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, name: event.target.value }))} />
                  </label>
                  <div className="modalTwoCols">
                    <label>
                      Teléfono
                      <input value={formDraft.phone ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, phone: event.target.value }))} />
                    </label>
                    <label>
                      Dirección
                      <input value={formDraft.address ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, address: event.target.value }))} />
                    </label>
                  </div>
                </>
              ) : props.moduleConfig.key === "warehouses" ? (
                <>
                  <div className="modalTwoCols">
                    <label>
                      Sucursal ID
                      <input value={formDraft.branchId ?? ""} readOnly />
                    </label>
                    <label>
                      Activo
                      <select value={formDraft.isActive ?? "true"} onChange={(event) => setFormDraft((current) => ({ ...current, isActive: event.target.value }))}>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                      </select>
                    </label>
                  </div>
                  <div className="modalTwoCols">
                    <label>
                      Código
                      <input value={formDraft.code ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, code: event.target.value }))} />
                    </label>
                    <label>
                      Nombre
                      <input value={formDraft.name ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, name: event.target.value }))} />
                    </label>
                  </div>
                </>
              ) : props.moduleConfig.key === "users" ? (
                <>
                  <label>
                    Nombre
                    <input value={formDraft.name ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, name: event.target.value }))} />
                  </label>
                  <div className="modalTwoCols">
                    <label>
                      Email
                      <input value={formDraft.email ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, email: event.target.value }))} />
                    </label>
                    <label>
                      Teléfono
                      <input value={formDraft.phone ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, phone: event.target.value }))} />
                    </label>
                  </div>
                  <div className="modalTwoCols">
                    <label>
                      Contraseña
                      <input type="password" value={formDraft.password ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, password: event.target.value }))} />
                    </label>
                    <label>
                      Roles
                      <input value={formDraft.roleNames ?? ""} readOnly placeholder="Solo lectura" />
                    </label>
                  </div>
                  <label>
                    Estado
                    <select value={formDraft.status ?? "ACTIVE"} onChange={(event) => setFormDraft((current) => ({ ...current, status: event.target.value }))}>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="BLOCKED">BLOCKED</option>
                    </select>
                  </label>
                </>
              ) : props.moduleConfig.key === "roles" ? (
                <>
                  <label>
                    Nombre
                    <input value={formDraft.name ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, name: event.target.value }))} />
                  </label>
                  <label>
                    Descripción
                    <input value={formDraft.description ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, description: event.target.value }))} />
                  </label>
                </>
              ) : props.moduleConfig.key === "inventory" ? (
                <>
                  <div className="modalTwoCols">
                    <label>
                      Producto ID
                      <input value={formDraft.productId ?? ""} readOnly />
                    </label>
                    <label>
                      Almacén ID
                      <input value={formDraft.warehouseId ?? ""} readOnly />
                    </label>
                  </div>
                  <div className="modalTwoCols">
                    <label>
                      Cantidad
                      <input type="number" value={formDraft.quantity ?? "0"} onChange={(event) => setFormDraft((current) => ({ ...current, quantity: event.target.value }))} />
                    </label>
                    <label>
                      Reservado
                      <input type="number" value={formDraft.reservedQuantity ?? "0"} onChange={(event) => setFormDraft((current) => ({ ...current, reservedQuantity: event.target.value }))} />
                    </label>
                  </div>
                  <label>
                    Mínimo
                    <input type="number" value={formDraft.minStock ?? "0"} onChange={(event) => setFormDraft((current) => ({ ...current, minStock: event.target.value }))} />
                  </label>
                </>
              ) : props.moduleConfig.key === "movements" ? (
                <>
                  <div className="modalTwoCols">
                    <label>
                      Producto ID
                      <input value={formDraft.productId ?? ""} readOnly />
                    </label>
                    <label>
                      Almacén ID
                      <input value={formDraft.warehouseId ?? ""} readOnly />
                    </label>
                  </div>
                  <div className="modalTwoCols">
                    <label>
                      Cantidad ajuste
                      <input type="number" value={formDraft.qty ?? "1"} onChange={(event) => setFormDraft((current) => ({ ...current, qty: event.target.value }))} />
                    </label>
                    <label>
                      Referencia
                      <input value={formDraft.referenceId ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, referenceId: event.target.value }))} />
                    </label>
                  </div>
                  <label>
                    Motivo
                    <input value={formDraft.reason ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, reason: event.target.value }))} />
                  </label>
                </>
              ) : (
                <>
                  <label>
                    Nombre
                    <input value={formDraft.name ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, name: event.target.value }))} />
                  </label>
                  <div className="modalTwoCols">
                    <label>
                      Teléfono
                      <input value={formDraft.phone ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, phone: event.target.value }))} />
                    </label>
                    <label>
                      Email
                      <input value={formDraft.email ?? ""} onChange={(event) => setFormDraft((current) => ({ ...current, email: event.target.value }))} />
                    </label>
                  </div>
                </>
              )}

              <div className="modalActions">
                <button type="button" className="secondaryButton" onClick={() => setFormMode(null)}>
                  Cancelar
                </button>
                <button type="submit" className="primaryButton" disabled={isSaving}>
                  {isSaving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function formatDetailValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.map((item) => String(item)).join(", ") : "Sin dato";
  }

  if (value === null || value === undefined || value === "") {
    return "Sin dato";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function renderDetailValue(key: string, value: string) {
  const normalized = key.toLowerCase();

  if (normalized.includes("status") || normalized === "isactive" || normalized.endsWith("type")) {
    return <span className={`statusBadge ${statusClass(value)}`}>{value}</span>;
  }

  if (normalized.endsWith("id") || normalized === "sku") {
    return <span className="shortId">{value}</span>;
  }

  if (normalized.includes("role") || normalized.includes("permission")) {
    const parts = value.split(",").map((item) => item.trim()).filter(Boolean);
    return (
      <div className="chipList">
        {parts.length > 0 ? parts.map((part) => <span className="miniChip" key={part}>{part}</span>) : <span>{value}</span>}
      </div>
    );
  }

  return value;
}

function statusClass(value: string) {
  const normalized = value.toLowerCase();

  if (["active", "paid", "true", "success", "enabled"].includes(normalized)) return "success";
  if (["inactive", "cancelled", "canceled", "false", "blocked", "error"].includes(normalized)) return "danger";
  if (["pending", "draft", "warning"].includes(normalized)) return "warning";
  return "muted";
}

function buildDetailSections(row: ApiObject): DetailSection[] {
  const identityKeys = ["id", "sku", "name", "code", "status", "isActive", "movementType"];
  const numericKeys = [
    "total",
    "subtotal",
    "discountTotal",
    "taxTotal",
    "costPrice",
    "salePrice",
    "quantity",
    "reservedQuantity",
    "availableQuantity",
    "qty",
    "minStock"
  ];
  const relatedKeys = [
    "customerId",
    "branchId",
    "warehouseId",
    "productId",
    "categoryId",
    "brandId",
    "referenceId"
  ];
  const dates = ["createdAt", "updatedAt"];

  const entries: DetailEntry[] = Object.entries(row).map(([key, value]) => ({
    label: toLabel(key),
    value: formatDetailValue(value),
    key
  }));

  const used = new Set<string>();
  const take = (title: string, keys: string[]) => {
    const items = entries.filter((item) => keys.includes(item.key) && !used.has(item.key));
    items.forEach((item) => used.add(item.key));
    return items.length > 0 ? { title, items } : null;
  };

  const candidates: Array<DetailSection | null> = [
    take("Identidad", identityKeys),
    take("Valores", numericKeys),
    take("Relaciones", relatedKeys),
    take("Fechas", dates),
    {
      title: "Otros",
      items: entries.filter((item) => !used.has(item.key))
    }
  ];

  const sections = candidates.filter((section): section is DetailSection => {
    if (section === null) {
      return false;
    }

    return section.items.length > 0;
  });

  return sections;
}

function toLabel(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/Id$/, " ID")
    .replace(/At$/, " at")
    .replace(/^./, (char) => char.toUpperCase());
}

function getModuleEntryLabel(key: string) {
  switch (key) {
    case "brands":
      return "marca";
    case "product-categories":
      return "categoría";
    case "products":
      return "producto";
    case "customers":
      return "cliente";
    case "branches":
      return "sucursal";
    case "warehouses":
      return "almacén";
    case "users":
      return "usuario";
    case "roles":
      return "rol";
    case "inventory":
      return "stock";
    case "movements":
      return "ajuste";
    case "sales":
      return "venta";
    case "customer-addresses":
      return "dirección";
    default:
      return "registro";
  }
}

function getFormDefaults(key: string, row?: ApiObject): Record<string, string> {
  if (key === "products") {
    return {
      categoryId: String(row?.categoryId ?? ""),
      brandId: String(row?.brandId ?? ""),
      sku: String(row?.sku ?? ""),
      name: String(row?.name ?? ""),
      description: String(row?.description ?? ""),
      costPrice: String(row?.costPrice ?? 0),
      salePrice: String(row?.salePrice ?? 0),
      phone: "",
      email: "",
      code: "",
      address: "",
      isActive: "true",
      branchId: ""
    };
  }

  if (key === "brands" || key === "product-categories") {
    return {
      name: String(row?.name ?? ""),
      description: String(row?.description ?? ""),
      isActive: String(row?.isActive ?? true)
    };
  }

  if (key === "branches") {
    return {
      code: String(row?.code ?? ""),
      name: String(row?.name ?? ""),
      phone: String(row?.phone ?? ""),
      address: String(row?.address ?? ""),
      isActive: String(row?.isActive ?? true),
      categoryId: "",
      brandId: "",
      sku: "",
      costPrice: "",
      salePrice: "",
      description: "",
      email: "",
      branchId: ""
    };
  }

  if (key === "warehouses") {
    return {
      branchId: String(row?.branchId ?? ""),
      code: String(row?.code ?? ""),
      name: String(row?.name ?? ""),
      isActive: String(row?.isActive ?? true),
      categoryId: "",
      brandId: "",
      sku: "",
      phone: "",
      email: "",
      description: "",
      costPrice: "",
      salePrice: ""
    };
  }

  if (key === "users") {
    return {
      name: String(row?.name ?? ""),
      email: String(row?.email ?? ""),
      phone: String(row?.phone ?? ""),
      password: "",
      roleNames: Array.isArray(row?.roleNames) ? (row?.roleNames as string[]).join(",") : "",
      status: String(row?.status ?? "ACTIVE"),
      categoryId: "",
      brandId: "",
      sku: "",
      description: "",
      costPrice: "",
      salePrice: "",
      code: "",
      address: "",
      isActive: "true",
      branchId: "",
      productId: "",
      warehouseId: "",
      quantity: "",
      reservedQuantity: "",
      minStock: "",
      qty: "",
      reason: "",
      referenceId: ""
    };
  }

  if (key === "roles") {
    return {
      name: String(row?.name ?? ""),
      description: String(row?.description ?? ""),
      categoryId: "",
      brandId: "",
      sku: "",
      costPrice: "",
      salePrice: "",
      phone: "",
      email: "",
      code: "",
      address: "",
      isActive: "true",
      branchId: "",
      productId: "",
      warehouseId: "",
      quantity: "",
      reservedQuantity: "",
      minStock: "",
      qty: "",
      reason: "",
      referenceId: "",
      status: ""
    };
  }

  if (key === "inventory") {
    return {
      productId: String(row?.productId ?? ""),
      warehouseId: String(row?.warehouseId ?? ""),
      quantity: String(row?.quantity ?? 0),
      reservedQuantity: String(row?.reservedQuantity ?? 0),
      minStock: String(row?.minStock ?? 0),
      categoryId: "",
      brandId: "",
      sku: "",
      name: "",
      description: "",
      costPrice: "",
      salePrice: "",
      phone: "",
      email: "",
      code: "",
      address: "",
      isActive: "true",
      branchId: "",
      qty: "",
      reason: "",
      referenceId: "",
      status: ""
    };
  }

  if (key === "movements") {
    return {
      productId: String(row?.productId ?? ""),
      warehouseId: String(row?.warehouseId ?? ""),
      qty: String(row?.qty ?? 1),
      reason: String(row?.reason ?? ""),
      referenceId: String(row?.referenceId ?? ""),
      categoryId: "",
      brandId: "",
      sku: "",
      name: "",
      description: "",
      costPrice: "",
      salePrice: "",
      phone: "",
      email: "",
      code: "",
      address: "",
      isActive: "true",
      branchId: "",
      quantity: "",
      reservedQuantity: "",
      minStock: "",
      status: ""
    };
  }

  if (key === "customer-addresses") {
    return {
      label: String(row?.label ?? ""),
      address: String(row?.address ?? ""),
      city: String(row?.city ?? ""),
      geoLat: String(row?.geoLat ?? ""),
      geoLng: String(row?.geoLng ?? ""),
      isDefault: String(row?.isDefault ?? false)
    };
  }

  return {
    categoryId: "",
    brandId: "",
    sku: "",
    name: String(row?.name ?? ""),
    phone: String(row?.phone ?? ""),
    email: String(row?.email ?? ""),
    description: "",
    costPrice: "",
    salePrice: ""
  };
}

function buildProductPayload(draft: Record<string, string>) {
  return {
    categoryId: draft.categoryId || "",
    brandId: draft.brandId || "",
    sku: draft.sku || "",
    name: draft.name || "",
    description: draft.description || "",
    costPrice: Number(draft.costPrice || 0),
    salePrice: Number(draft.salePrice || 0)
  };
}

function buildCustomerPayload(draft: Record<string, string>) {
  return {
    name: draft.name || "",
    phone: draft.phone || "",
    email: draft.email || ""
  };
}

function buildModulePayload(key: string, draft: Record<string, string>) {
  switch (key) {
    case "brands":
    case "product-categories":
      return {
        name: draft.name || "",
        description: draft.description || ""
      };
    case "products":
      return buildProductPayload(draft);
    case "customers":
      return buildCustomerPayload(draft);
    case "branches":
      return {
        code: draft.code || "",
        name: draft.name || "",
        phone: draft.phone || "",
        address: draft.address || ""
      };
    case "warehouses":
      return {
        branchId: draft.branchId || "",
        code: draft.code || "",
        name: draft.name || ""
      };
    case "users":
      return {
        name: draft.name || "",
        email: draft.email || "",
        phone: draft.phone || "",
        password: draft.password || "",
        roleNames: (draft.roleNames || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      };
    case "roles":
      return {
        name: draft.name || "",
        description: draft.description || ""
      };
    case "inventory":
      return {
        productId: draft.productId || "",
        warehouseId: draft.warehouseId || "",
        quantity: Number(draft.quantity || 0),
        reservedQuantity: Number(draft.reservedQuantity || 0),
        minStock: Number(draft.minStock || 0)
      };
    case "movements":
      return {
        productId: draft.productId || "",
        warehouseId: draft.warehouseId || "",
        qty: Number(draft.qty || 0),
        reason: draft.reason || "",
        referenceId: draft.referenceId?.trim() ? draft.referenceId.trim() : null
      };
    case "customer-addresses":
      return {
        label: draft.label || "",
        address: draft.address || "",
        city: draft.city || "",
        geoLat: draft.geoLat ? Number(draft.geoLat) : null,
        geoLng: draft.geoLng ? Number(draft.geoLng) : null,
        isDefault: draft.isDefault === "true"
      };
    default:
      return {};
  }
}
