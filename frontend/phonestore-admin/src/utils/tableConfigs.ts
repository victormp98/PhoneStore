import type { ModuleConfig, TableColumn } from "../types/api";

export const modules: ModuleConfig[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    endpoint: "",
    description: "Resumen calculado con datos reales del backend"
  },
  {
    key: "products",
    label: "Catálogo",
    endpoint: "/api/products/",
    description: "Productos reales registrados en el backend"
  },
  {
    key: "inventory",
    label: "Inventario",
    endpoint: "/api/inventory-stocks/",
    description: "Stock real por producto y almacén"
  },
  {
    key: "movements",
    label: "Movimientos",
    endpoint: "/api/inventory-movements/",
    description: "Movimientos reales de inventario"
  },
  {
    key: "customers",
    label: "Clientes",
    endpoint: "/api/customers/",
    description: "Clientes reales registrados"
  },
  {
    key: "sales",
    label: "Ventas",
    endpoint: "/api/sales/",
    description: "Ventas reales del sistema"
  },
  {
    key: "branches",
    label: "Sucursales",
    endpoint: "/api/branches/",
    description: "Sucursales reales configuradas"
  },
  {
    key: "warehouses",
    label: "Almacenes",
    endpoint: "/api/warehouses/",
    description: "Almacenes reales configurados"
  },
  {
    key: "users",
    label: "Usuarios",
    endpoint: "/api/users/",
    description: "Usuarios reales del sistema"
  },
  {
    key: "roles",
    label: "Roles",
    endpoint: "/api/roles/",
    description: "Roles reales del sistema"
  }
];

export const tableColumnsByModule: Record<string, TableColumn[]> = {
  products: [
    { key: "sku", label: "SKU", type: "text" },
    { key: "name", label: "Nombre", type: "text" },
    { key: "description", label: "Descripción", type: "text" },
    { key: "salePrice", label: "Precio venta", type: "money" },
    { key: "isActive", label: "Activo", type: "boolean" },
    { key: "createdAt", label: "Creado", type: "date" }
  ],
  inventory: [
    { key: "productId", label: "ProductoId", type: "shortId" },
    { key: "warehouseId", label: "AlmacénId", type: "shortId" },
    { key: "quantity", label: "Cantidad", type: "text" },
    { key: "reservedQuantity", label: "Reservado", type: "text" },
    { key: "availableQuantity", label: "Disponible", type: "text" },
    { key: "updatedAt", label: "Actualizado", type: "date" }
  ],
  movements: [
    { key: "movementType", label: "Tipo", type: "status" },
    { key: "productId", label: "ProductoId", type: "shortId" },
    { key: "warehouseId", label: "AlmacénId", type: "shortId" },
    { key: "qty", label: "Cantidad", type: "text" },
    { key: "referenceId", label: "Referencia", type: "shortId" },
    { key: "createdAt", label: "Creado", type: "date" }
  ],
  customers: [
    { key: "name", label: "Nombre", type: "text" },
    { key: "email", label: "Email", type: "text" },
    { key: "phone", label: "Teléfono", type: "text" },
    { key: "status", label: "Status", type: "status" },
    { key: "createdAt", label: "Creado", type: "date" }
  ],
  sales: [
    { key: "id", label: "ID", type: "shortId" },
    { key: "customerId", label: "ClienteId", type: "shortId" },
    { key: "branchId", label: "SucursalId", type: "shortId" },
    { key: "warehouseId", label: "AlmacénId", type: "shortId" },
    { key: "status", label: "Status", type: "status" },
    { key: "subtotal", label: "Subtotal", type: "money" },
    { key: "discountTotal", label: "Descuento", type: "money" },
    { key: "taxTotal", label: "Impuesto", type: "money" },
    { key: "total", label: "Total", type: "money" },
    { key: "createdAt", label: "Creado", type: "date" }
  ],
  branches: [
    { key: "name", label: "Nombre", type: "text" },
    { key: "code", label: "Código", type: "text" },
    { key: "phone", label: "Teléfono", type: "text" },
    { key: "isActive", label: "Activa", type: "boolean" },
    { key: "createdAt", label: "Creado", type: "date" }
  ],
  warehouses: [
    { key: "name", label: "Nombre", type: "text" },
    { key: "code", label: "Código", type: "text" },
    { key: "branchId", label: "SucursalId", type: "shortId" },
    { key: "isActive", label: "Activo", type: "boolean" },
    { key: "createdAt", label: "Creado", type: "date" }
  ],
  users: [
    { key: "name", label: "Nombre", type: "text" },
    { key: "email", label: "Email", type: "text" },
    { key: "phone", label: "Teléfono", type: "text" },
    { key: "status", label: "Status", type: "status" },
    { key: "createdAt", label: "Creado", type: "date" }
  ],
  roles: [
    { key: "name", label: "Nombre", type: "text" },
    { key: "description", label: "Descripción", type: "text" },
    { key: "createdAt", label: "Creado", type: "date" }
  ]
};
