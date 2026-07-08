import type { ModuleConfig, TableColumn } from "../types/api";

export const modules: ModuleConfig[] = [
  // ── Ventas ──────────────────────────────────────────────────────────────────
  {
    key: "sales",
    label: "Caja / Ventas",
    endpoint: "/api/sales/",
    description: "Punto de venta — cobros rápidos",
    group: "Ventas",
    actions: [
      { kind: "create", label: "Nueva venta", tone: "primary" },
      { kind: "refresh", label: "Refrescar", tone: "secondary" }
    ]
  },
  {
    key: "customers",
    label: "Clientes",
    endpoint: "/api/customers/",
    description: "Clientes registrados",
    group: "Ventas",
    actions: [
      { kind: "create", label: "Nuevo cliente", tone: "primary" },
      { kind: "edit", label: "Editar", tone: "secondary" },
      { kind: "delete", label: "Desactivar", tone: "danger" },
      { kind: "filter", label: "Activos", tone: "secondary" },
      { kind: "refresh", label: "Refrescar", tone: "secondary" }
    ]
  },
  // ── Operaciones ──────────────────────────────────────────────────────────────
  {
    key: "repairs",
    label: "Reparaciones",
    endpoint: "",
    description: "Taller técnico — seguimiento y registro",
    group: "Operaciones"
  },
  {
    key: "delivery",
    label: "Repartidor",
    endpoint: "",
    description: "Vista mobile del repartidor",
    group: "Operaciones"
  },
  {
    key: "store",
    label: "Tienda Online",
    endpoint: "",
    description: "Catálogo ecommerce para clientes",
    group: "Operaciones"
  },
  // ── Dashboard ────────────────────────────────────────────────────────────────
  {
    key: "dashboard",
    label: "Dashboard",
    endpoint: "",
    description: "Resumen y métricas en tiempo real",
    group: "Reportes"
  },
  // ── Catálogo ──────────────────────────────────────────────────────────────────
  {
    key: "products",
    label: "Catálogo",
    endpoint: "/api/products/",
    description: "Productos del catálogo",
    group: "Catálogo",
    actions: [
      { kind: "create", label: "Nuevo producto", tone: "primary" },
      { kind: "filter", label: "Solo activos", tone: "secondary" },
      { kind: "refresh", label: "Refrescar", tone: "secondary" }
    ]
  },
  {
    key: "product-categories",
    label: "Categorías",
    endpoint: "/api/product-categories/",
    description: "Categorías del catálogo",
    group: "Catálogo",
    actions: [
      { kind: "create", label: "Nueva categoría", tone: "primary" },
      { kind: "refresh", label: "Refrescar", tone: "secondary" }
    ]
  },
  {
    key: "brands",
    label: "Marcas",
    endpoint: "/api/brands/",
    description: "Marcas del catálogo",
    group: "Catálogo",
    actions: [
      { kind: "create", label: "Nueva marca", tone: "primary" },
      { kind: "refresh", label: "Refrescar", tone: "secondary" }
    ]
  },
  // ── Inventario ────────────────────────────────────────────────────────────────
  {
    key: "inventory",
    label: "Inventario",
    endpoint: "/api/inventory-stocks/",
    description: "Stock por producto y almacén",
    group: "Inventario",
    actions: [
      { kind: "filter", label: "Críticos", tone: "secondary" },
      { kind: "refresh", label: "Refrescar", tone: "secondary" }
    ]
  },
  {
    key: "movements",
    label: "Movimientos",
    endpoint: "/api/inventory-movements/",
    description: "Movimientos de inventario",
    group: "Inventario",
    actions: [
      { kind: "create", label: "Ajuste", tone: "primary" },
      { kind: "refresh", label: "Refrescar", tone: "secondary" }
    ]
  },
  // ── Configuración ─────────────────────────────────────────────────────────────
  {
    key: "branches",
    label: "Sucursales",
    endpoint: "/api/branches/",
    description: "Sucursales configuradas",
    group: "Configuración",
    actions: [
      { kind: "create", label: "Nueva sucursal", tone: "primary" },
      { kind: "edit", label: "Editar", tone: "secondary" },
      { kind: "delete", label: "Desactivar", tone: "danger" },
      { kind: "refresh", label: "Refrescar", tone: "secondary" }
    ]
  },
  {
    key: "warehouses",
    label: "Almacenes",
    endpoint: "/api/warehouses/",
    description: "Almacenes configurados",
    group: "Configuración",
    actions: [
      { kind: "create", label: "Nuevo almacén", tone: "primary" },
      { kind: "edit", label: "Editar", tone: "secondary" },
      { kind: "delete", label: "Desactivar", tone: "danger" },
      { kind: "refresh", label: "Refrescar", tone: "secondary" }
    ]
  },
  {
    key: "users",
    label: "Usuarios",
    endpoint: "/api/users/",
    description: "Usuarios del sistema",
    group: "Configuración",
    actions: [
      { kind: "create", label: "Nuevo usuario", tone: "primary" },
      { kind: "edit", label: "Editar", tone: "secondary" },
      { kind: "delete", label: "Desactivar", tone: "danger" },
      { kind: "filter", label: "Activos", tone: "secondary" },
      { kind: "refresh", label: "Refrescar", tone: "secondary" }
    ]
  },
  {
    key: "roles",
    label: "Roles y Permisos",
    endpoint: "/api/roles/",
    description: "Roles y permisos del sistema",
    group: "Configuración",
    actions: [
      { kind: "create", label: "Nuevo rol", tone: "primary" },
      { kind: "edit", label: "Editar", tone: "secondary" },
      { kind: "delete", label: "Eliminar", tone: "danger" },
      { kind: "refresh", label: "Refrescar", tone: "secondary" }
    ]
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// Column definitions (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
export const tableColumnsByModule: Record<string, TableColumn[]> = {
  brands: [
    { key: "name", label: "Nombre" },
    { key: "isActive", label: "Estado" },
    { key: "createdAt", label: "Creado" }
  ],
  "product-categories": [
    { key: "name", label: "Nombre" },
    { key: "description", label: "Descripción" },
    { key: "isActive", label: "Estado" }
  ],
  products: [
    { key: "sku", label: "SKU" },
    { key: "name", label: "Nombre" },
    { key: "salePrice", label: "Precio Venta", type: "money" },
    { key: "costPrice", label: "Costo", type: "money" },
    { key: "isActive", label: "Estado" }
  ],
  inventory: [
    { key: "product", label: "Producto" },
    { key: "warehouse", label: "Almacén" },
    { key: "quantity", label: "Cantidad", type: "number" },
    { key: "minStock", label: "Stock Mínimo", type: "number" },
    { key: "maxStock", label: "Stock Máximo", type: "number" }
  ],
  movements: [
    { key: "type", label: "Tipo" },
    { key: "product", label: "Producto" },
    { key: "quantity", label: "Cantidad", type: "number" },
    { key: "warehouse", label: "Almacén" },
    { key: "createdAt", label: "Fecha", type: "date" }
  ],
  customers: [
    { key: "name", label: "Nombre" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Teléfono" },
    { key: "isActive", label: "Estado" },
    { key: "createdAt", label: "Registrado", type: "date" }
  ],
  sales: [
    { key: "id", label: "# Venta", type: "shortId" },
    { key: "total", label: "Total", type: "money" },
    { key: "status", label: "Estado" },
    { key: "paymentMethod", label: "Pago" },
    { key: "createdAt", label: "Fecha", type: "date" }
  ],
  branches: [
    { key: "name", label: "Nombre" },
    { key: "code", label: "Código" },
    { key: "isActive", label: "Estado" },
    { key: "createdAt", label: "Creado", type: "date" }
  ],
  warehouses: [
    { key: "name", label: "Nombre" },
    { key: "code", label: "Código" },
    { key: "branchId", label: "Sucursal" },
    { key: "isActive", label: "Estado" }
  ],
  users: [
    { key: "name", label: "Nombre" },
    { key: "email", label: "Email" },
    { key: "roles", label: "Roles", type: "list" },
    { key: "isActive", label: "Estado" },
    { key: "createdAt", label: "Creado", type: "date" }
  ],
  roles: [
    { key: "name", label: "Nombre" },
    { key: "description", label: "Descripción" },
    { key: "permissions", label: "Permisos", type: "list" },
    { key: "createdAt", label: "Creado", type: "date" }
  ]
};
