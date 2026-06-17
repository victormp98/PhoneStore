import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ApiObject,
  apiRequest,
  clearStoredToken,
  formatActive,
  formatDate,
  formatMoney,
  formatShortId,
  formatValue,
  getStoredToken,
  normalizeArray,
  setStoredToken
} from "./api";

type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  id?: string;
  name?: string;
  email?: string;
  roleNames?: string[];
};

type CurrentUser = {
  id?: string;
  name?: string;
  email?: string;
  roles?: string[];
};

type ModuleConfig = {
  key: string;
  label: string;
  endpoint: string;
  description: string;
};

type TableColumn = {
  label: string;
  keys: string[];
  format?: "text" | "id" | "date" | "money" | "active" | "status";
};

const modules: ModuleConfig[] = [
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
    key: "addresses",
    label: "Direcciones",
    endpoint: "/api/customer-addresses/",
    description: "Direcciones reales de clientes"
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

const tableColumnsByModule: Record<string, TableColumn[]> = {
  products: [
    { label: "SKU", keys: ["sku"] },
    { label: "Nombre", keys: ["name"] },
    { label: "Descripción", keys: ["description"] },
    { label: "Precio venta", keys: ["salePrice"], format: "money" },
    { label: "Activo", keys: ["isActive"], format: "active" },
    { label: "Creado", keys: ["createdAt"], format: "date" }
  ],
  inventory: [
    { label: "ProductoId", keys: ["productId"], format: "id" },
    { label: "AlmacénId", keys: ["warehouseId"], format: "id" },
    { label: "Cantidad", keys: ["quantity"] },
    { label: "Reservado", keys: ["reservedQuantity"] },
    { label: "Disponible", keys: ["availableQuantity"] },
    { label: "Actualizado", keys: ["updatedAt"], format: "date" }
  ],
  movements: [
    { label: "Tipo", keys: ["movementType"], format: "status" },
    { label: "ProductoId", keys: ["productId"], format: "id" },
    { label: "AlmacénId", keys: ["warehouseId"], format: "id" },
    { label: "Cantidad", keys: ["quantity", "qty"] },
    { label: "Referencia", keys: ["referenceId"], format: "id" },
    { label: "Creado", keys: ["createdAt"], format: "date" }
  ],
  customers: [
    { label: "Nombre", keys: ["name"] },
    { label: "Email", keys: ["email"] },
    { label: "Teléfono", keys: ["phone"] },
    { label: "Status", keys: ["status"], format: "status" },
    { label: "Creado", keys: ["createdAt"], format: "date" }
  ],
  addresses: [
    { label: "ClienteId", keys: ["customerId"], format: "id" },
    { label: "Calle", keys: ["street"] },
    { label: "Ciudad", keys: ["city"] },
    { label: "Estado", keys: ["state"] },
    { label: "Código postal", keys: ["zipCode"] },
    { label: "Principal", keys: ["isDefault"], format: "active" },
    { label: "Creado", keys: ["createdAt"], format: "date" }
  ],
  sales: [
    { label: "ID", keys: ["id"], format: "id" },
    { label: "ClienteId", keys: ["customerId"], format: "id" },
    { label: "SucursalId", keys: ["branchId"], format: "id" },
    { label: "AlmacénId", keys: ["warehouseId"], format: "id" },
    { label: "Status", keys: ["status"], format: "status" },
    { label: "Subtotal", keys: ["subtotal"], format: "money" },
    { label: "Descuento", keys: ["discountTotal"], format: "money" },
    { label: "Impuesto", keys: ["taxTotal"], format: "money" },
    { label: "Total", keys: ["total"], format: "money" },
    { label: "Creado", keys: ["createdAt"], format: "date" }
  ],
  branches: [
    { label: "Nombre", keys: ["name"] },
    { label: "Código", keys: ["code"] },
    { label: "Teléfono", keys: ["phone"] },
    { label: "Activa", keys: ["isActive"], format: "active" },
    { label: "Creado", keys: ["createdAt"], format: "date" }
  ],
  warehouses: [
    { label: "Nombre", keys: ["name"] },
    { label: "Código", keys: ["code"] },
    { label: "SucursalId", keys: ["branchId"], format: "id" },
    { label: "Activo", keys: ["isActive"], format: "active" },
    { label: "Creado", keys: ["createdAt"], format: "date" }
  ],
  users: [
    { label: "Nombre", keys: ["name"] },
    { label: "Email", keys: ["email"] },
    { label: "Teléfono", keys: ["phone"] },
    { label: "Status", keys: ["status"], format: "status" },
    { label: "Creado", keys: ["createdAt"], format: "date" }
  ],
  roles: [
    { label: "Nombre", keys: ["name"] },
    { label: "Descripción", keys: ["description"] },
    { label: "Creado", keys: ["createdAt"], format: "date" }
  ]
};

function getInitials(name?: string): string {
  if (!name || !name.trim()) {
    return "U";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function App() {
  const [token, setToken] = useState(getStoredToken());
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [activeModuleKey, setActiveModuleKey] = useState("dashboard");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!token) {
      setCurrentUser(null);
      return;
    }

    apiRequest<CurrentUser>("/api/auth/me")
      .then(setCurrentUser)
      .catch(() => {
        clearStoredToken();
        setToken("");
        setCurrentUser(null);
      });
  }, [token]);

  function handleLoginSuccess(accessToken: string) {
    setStoredToken(accessToken);
    setToken(accessToken);
    setAuthError("");
  }

  function handleLogout() {
    clearStoredToken();
    setToken("");
    setCurrentUser(null);
  }

  if (!token) {
    return (
      <LoginScreen
        authError={authError}
        setAuthError={setAuthError}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  const activeModule =
    modules.find((moduleItem) => moduleItem.key === activeModuleKey) ?? modules[0];

  return (
    <Shell
      currentUser={currentUser}
      activeModuleKey={activeModuleKey}
      setActiveModuleKey={setActiveModuleKey}
      onLogout={handleLogout}
    >
      {activeModule.key === "dashboard" ? (
        <Dashboard />
      ) : (
        <DataPage moduleConfig={activeModule} />
      )}
    </Shell>
  );
}

function LoginScreen(props: {
  authError: string;
  setAuthError: (value: string) => void;
  onLoginSuccess: (accessToken: string) => void;
}) {
  const [email, setEmail] = useState("admin@phonestore.com");
  const [password, setPassword] = useState("Admin123!");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    props.setAuthError("");

    try {
      const response = await apiRequest<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password
        })
      });

      if (!response.accessToken) {
        throw new Error("La respuesta no contiene accessToken.");
      }

      props.onLoginSuccess(response.accessToken);
    } catch (error) {
      props.setAuthError(error instanceof Error ? error.message : "Error de login.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="loginPage">
      <section className="loginBrand">
        <div className="brandLogo">PS</div>
        <h1>PhoneStore</h1>
        <p>Sistema administrativo conectado al backend real.</p>
        <ul>
          <li>Inventario real</li>
          <li>Ventas reales</li>
          <li>Clientes reales</li>
          <li>Autenticación JWT</li>
        </ul>
      </section>

      <section className="loginCard">
        <h2>Iniciar sesión</h2>
        <p>Accede usando credenciales existentes del backend.</p>

        <form onSubmit={handleSubmit}>
          <label>
            Correo electrónico
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Contraseña
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          {props.authError && <div className="errorBox">{props.authError}</div>}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Shell(props: {
  currentUser: CurrentUser | null;
  activeModuleKey: string;
  setActiveModuleKey: (value: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="sidebarBrand">
          <div className="brandMark">PS</div>
          <div>
            <strong>PhoneStore</strong>
            <span>Administración</span>
          </div>
        </div>

        <nav>
          {modules.map((moduleItem) => (
            <button
              key={moduleItem.key}
              className={
                moduleItem.key === props.activeModuleKey ? "navItem active" : "navItem"
              }
              onClick={() => props.setActiveModuleKey(moduleItem.key)}
            >
              {moduleItem.label}
            </button>
          ))}
        </nav>

        <div className="sidebarUser">
          <div className="avatar">{getInitials(props.currentUser?.name)}</div>
          <div>
            <strong>{props.currentUser?.name ?? "Usuario"}</strong>
            <span>{props.currentUser?.email ?? ""}</span>
          </div>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <h1>Panel administrativo</h1>
            <p>Datos reales obtenidos desde la API PhoneStore.</p>
          </div>

          <div className="topbarActions">
            <span className="roleBadge">
              {props.currentUser?.roles?.join(", ") ?? "Sin rol"}
            </span>
            <button className="secondaryButton" onClick={props.onLogout}>
              Cerrar sesión
            </button>
          </div>
        </header>

        {props.children}
      </main>
    </div>
  );
}

function Dashboard() {
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
    return <div className="errorBox">{error}</div>;
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

function MetricCard(props: { title: string; value: number }) {
  return (
    <article className="metricCard">
      <span>{props.title}</span>
      <strong>{props.value}</strong>
    </article>
  );
}

function DataPage(props: { moduleConfig: ModuleConfig }) {
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
        {error && <div className="errorBox">{error}</div>}
        {!isLoading && !error && (
          <DataTable
            columns={tableColumnsByModule[props.moduleConfig.key] ?? []}
            rows={rows}
          />
        )}
      </div>
    </section>
  );
}

function DataTable(props: { columns: TableColumn[]; rows: ApiObject[] }) {
  if (props.rows.length === 0) {
    return <div className="emptyState">El backend no regresó registros para mostrar.</div>;
  }

  return (
    <div className="tableWrapper">
      <table>
        <thead>
          <tr>
            {props.columns.map((column) => (
              <th key={column.label}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.map((row, index) => (
            <tr key={String(row.id ?? index)}>
              {props.columns.map((column) => (
                <td key={column.label}>{renderCell(row, column)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderCell(row: ApiObject, column: TableColumn) {
  const value = getFirstExistingValue(row, column.keys);

  if (column.format === "status") {
    const text = formatValue(value);

    return text ? <span className={`statusBadge ${getStatusClass(text)}`}>{text}</span> : "";
  }

  if (column.format === "id") {
    const text = formatShortId(value);

    return text ? <span className="shortId">{text}</span> : "";
  }

  if (column.format === "date") {
    return formatDate(value);
  }

  if (column.format === "money") {
    return formatMoney(value);
  }

  if (column.format === "active") {
    const text = formatActive(value);

    return text ? <span className={`statusBadge ${getStatusClass(text)}`}>{text}</span> : "";
  }

  return formatValue(value);
}

function getFirstExistingValue(row: ApiObject, keys: string[]): unknown {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      return row[key];
    }
  }

  return undefined;
}

function getStatusClass(value: string): string {
  const normalized = value.trim().toUpperCase();

  if (["ACTIVE", "ACTIVO", "PAID", "CONFIRMED", "SALE"].includes(normalized)) {
    return "success";
  }

  if (["INACTIVE", "INACTIVO", "CANCELLED", "BLOCKED", "SALE_CANCELLED"].includes(normalized)) {
    return "muted";
  }

  return "info";
}

export default App;
