import { useEffect, useMemo, useState } from "react";
import { apiRequest, normalizeArray } from "../api/apiClient";
import { Badge, getStatusVariant } from "../components/Badge";
import { EmptyState } from "../components/EmptyState";
import { ErrorBox } from "../components/ErrorBox";
import type { ApiObject } from "../types/api";
import { formatDate, formatMoney, formatShortId } from "../utils/formatters";

type ProductRow = ApiObject & {
  id?: string;
  sku?: string;
  name?: string;
  description?: string | null;
  salePrice?: number;
  isActive?: boolean;
};

type BranchRow = ApiObject & {
  id?: string;
  name?: string;
  code?: string;
  isActive?: boolean;
};

type WarehouseRow = ApiObject & {
  id?: string;
  branchId?: string;
  name?: string;
  code?: string;
  isActive?: boolean;
};

type SaleRow = ApiObject & {
  id?: string;
  status?: string;
  branchId?: string;
  warehouseId?: string;
  total?: number;
  createdAt?: string;
};

type CartItem = {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

type CreateSaleResponse = {
  id?: string;
};

export function SalesPosPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseRow[]>([]);
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const activeBranches = useMemo(
    () => branches.filter((branch) => branch.isActive !== false && branch.id),
    [branches]
  );

  const availableWarehouses = useMemo(() => {
    return warehouses.filter((warehouse) => {
      if (!warehouse.id || warehouse.isActive === false) {
        return false;
      }

      return selectedBranchId ? warehouse.branchId === selectedBranchId : true;
    });
  }, [selectedBranchId, warehouses]);

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const activeProducts = products.filter((product) => product.isActive !== false && product.id);

    if (!normalizedSearch) {
      return activeProducts;
    }

    return activeProducts.filter((product) => {
      return [product.sku, product.name, product.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });
  }, [products, search]);

  const total = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (
      selectedWarehouseId &&
      !availableWarehouses.some((warehouse) => warehouse.id === selectedWarehouseId)
    ) {
      setSelectedWarehouseId("");
    }
  }, [availableWarehouses, selectedWarehouseId]);

  async function loadData() {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const [productsPayload, branchesPayload, warehousesPayload, salesPayload] =
        await Promise.all([
          apiRequest<unknown>("/api/products/"),
          apiRequest<unknown>("/api/branches/"),
          apiRequest<unknown>("/api/warehouses/"),
          apiRequest<unknown>("/api/sales/")
        ]);

      setProducts(normalizeArray(productsPayload) as ProductRow[]);
      setBranches(normalizeArray(branchesPayload) as BranchRow[]);
      setWarehouses(normalizeArray(warehousesPayload) as WarehouseRow[]);
      setSales(normalizeArray(salesPayload) as SaleRow[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Error al cargar ventas.");
    } finally {
      setIsLoading(false);
    }
  }

  function addToCart(product: ProductRow) {
    if (!product.id) {
      return;
    }

    const productId = product.id;
    const unitPrice = Number(product.salePrice ?? 0);

    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.productId === productId);

      if (existingItem) {
        return currentCart.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...currentCart,
        {
          productId,
          sku: product.sku ?? "",
          name: product.name ?? "",
          quantity: 1,
          unitPrice
        }
      ];
    });
  }

  function updateQuantity(productId: string, nextQuantity: number) {
    if (nextQuantity < 1) {
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.productId === productId ? { ...item, quantity: nextQuantity } : item
      )
    );
  }

  function removeFromCart(productId: string) {
    setCart((currentCart) => currentCart.filter((item) => item.productId !== productId));
  }

  async function createSale() {
    setError("");
    setSuccessMessage("");

    if (!selectedBranchId) {
      setError("Selecciona una sucursal.");
      return;
    }

    if (!selectedWarehouseId) {
      setError("Selecciona un almacén.");
      return;
    }

    if (cart.length === 0) {
      setError("Agrega al menos un producto al carrito.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest<CreateSaleResponse>("/api/sales/", {
        method: "POST",
        body: JSON.stringify({
          customerId: null,
          branchId: selectedBranchId,
          warehouseId: selectedWarehouseId,
          discountTotal: 0,
          taxTotal: 0,
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          })),
          payments: [
            {
              paymentMethod: "CASH",
              amount: total,
              reference: null
            }
          ]
        })
      });

      setSuccessMessage(`Venta creada correctamente: ${formatShortId(response.id)}`);
      setCart([]);
      await loadData();
    } catch (saleError) {
      setError(saleError instanceof Error ? saleError.message : "Error al crear venta.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function cancelSale(saleId: string) {
    setError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      await apiRequest(`/api/sales/${saleId}/cancel`, {
        method: "POST",
        body: JSON.stringify({
          reason: "Cancelacion desde interfaz administrativa"
        })
      });

      setSuccessMessage(`Venta cancelada: ${formatShortId(saleId)}`);
      await loadData();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Error al cancelar venta.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="page">
      <div className="pageHeader pageHeaderActions">
        <div>
          <h2>Ventas / POS</h2>
          <p>Venta rápida con productos, sucursales y almacenes reales.</p>
        </div>
        <button className="secondaryButton" onClick={loadData} disabled={isLoading || isSubmitting}>
          Actualizar
        </button>
      </div>

      {error && <ErrorBox message={error} />}
      {successMessage && <div className="successBox">{successMessage}</div>}

      <div className="posControls panel">
        <label>
          Sucursal
          <select
            value={selectedBranchId}
            onChange={(event) => setSelectedBranchId(event.target.value)}
          >
            <option value="">Selecciona sucursal</option>
            {activeBranches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {[branch.code, branch.name].filter(Boolean).join(" - ")}
              </option>
            ))}
          </select>
        </label>

        <label>
          Almacén
          <select
            value={selectedWarehouseId}
            onChange={(event) => setSelectedWarehouseId(event.target.value)}
          >
            <option value="">Selecciona almacén</option>
            {availableWarehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {[warehouse.code, warehouse.name].filter(Boolean).join(" - ")}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className="panel">Cargando datos reales...</div>
      ) : (
        <div className="posGrid">
          <section className="panel posProducts">
            <div className="panelHeader">
              <div>
                <h3>Productos disponibles</h3>
                <p>Busca por SKU, nombre o descripción.</p>
              </div>
            </div>

            <label>
              Buscar producto
              <input value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>

            <div className="productList">
              {visibleProducts.length === 0 ? (
                <EmptyState />
              ) : (
                visibleProducts.map((product) => (
                  <article className="productItem" key={product.id}>
                    <div>
                      <strong>{product.name ?? ""}</strong>
                      <span>{product.sku ?? ""}</span>
                      {product.description ? <p>{product.description}</p> : null}
                    </div>
                    <div className="productActions">
                      <strong>{formatMoney(product.salePrice)}</strong>
                      <button onClick={() => addToCart(product)}>Agregar</button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="panel posCart">
            <h3>Carrito de venta</h3>
            {cart.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="cartList">
                {cart.map((item) => (
                  <article className="cartItem" key={item.productId}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.sku}</span>
                    </div>
                    <div className="quantityControls">
                      <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                        -
                      </button>
                      <strong>{item.quantity}</strong>
                      <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                        +
                      </button>
                    </div>
                    <div className="cartMoney">
                      <span>{formatMoney(item.unitPrice)}</span>
                      <strong>{formatMoney(item.quantity * item.unitPrice)}</strong>
                    </div>
                    <button className="secondaryButton" onClick={() => removeFromCart(item.productId)}>
                      Quitar
                    </button>
                  </article>
                ))}
              </div>
            )}

            <div className="posTotal">
              <span>Total</span>
              <strong>{formatMoney(total)}</strong>
            </div>

            <button className="primaryButton" onClick={createSale} disabled={isSubmitting}>
              {isSubmitting ? "Procesando..." : "Cobrar"}
            </button>
          </section>
        </div>
      )}

      <section className="panel">
        <div className="panelHeader">
          <div>
            <h3>Ventas recientes</h3>
            <p>Ventas reales registradas en el backend.</p>
          </div>
        </div>

        {sales.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="tableWrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Sucursal</th>
                  <th>Almacén</th>
                  <th>Total</th>
                  <th>Creado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => {
                  const status = sale.status ?? "";
                  const canCancel = status === "PAID" && sale.id;

                  return (
                    <tr key={sale.id}>
                      <td>
                        <span className="shortId">{formatShortId(sale.id)}</span>
                      </td>
                      <td>
                        {status ? (
                          <Badge variant={getStatusVariant(status)}>{status}</Badge>
                        ) : (
                          ""
                        )}
                      </td>
                      <td>
                        <span className="shortId">{formatShortId(sale.branchId)}</span>
                      </td>
                      <td>
                        <span className="shortId">{formatShortId(sale.warehouseId)}</span>
                      </td>
                      <td>{formatMoney(sale.total)}</td>
                      <td>{formatDate(sale.createdAt)}</td>
                      <td>
                        {canCancel ? (
                          <button
                            className="dangerButton"
                            onClick={() => cancelSale(String(sale.id))}
                            disabled={isSubmitting}
                          >
                            Cancelar
                          </button>
                        ) : (
                          ""
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
