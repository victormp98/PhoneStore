# PhoneStore

Solución de comercio electrónico construida con ASP.NET Core y .NET 10. La API expone operaciones de usuarios, roles, sucursales, almacenes, catálogo, inventario, clientes y ventas mediante endpoints HTTP.

## Estructura

```text
src/
  PhoneStore.Api/             # Endpoints, JWT y políticas de autorización
  PhoneStore.Application/     # Contratos y servicios de aplicación
  PhoneStore.Domain/          # Entidades y reglas de dominio
  PhoneStore.Infrastructure/  # DbContext, persistencia e integración técnica
  PhoneStore.Shared/          # Tipos compartidos
  PhoneStore.Worker/          # Procesamiento en segundo plano
frontend/
  phonestore-admin/
```

## Requisitos

- .NET SDK 10
- Docker y Docker Compose
- PostgreSQL 16, disponible en el servicio `phonestore-postgres`

## Base de datos local

`docker-compose.yml` requiere `PHONESTORE_DB_PASSWORD` en el entorno. En PowerShell:

```powershell
$env:PHONESTORE_DB_PASSWORD = Read-Host "Contraseña de PostgreSQL"
docker compose up -d
```

PostgreSQL publica el puerto `5434` del equipo hacia el `5432` del contenedor. El volumen `phonestore_postgres_data` mantiene los datos entre reinicios. Modificar `POSTGRES_PASSWORD` no cambia automáticamente la contraseña de un rol PostgreSQL ya inicializado en ese volumen.

## Configuración de la API

ASP.NET Core lee `appsettings.json`, `appsettings.Development.json` y variables de entorno. En entornos compartidos define los secretos fuera de los archivos versionados:

- `ConnectionStrings__PhoneStoreDatabase`: cadena de conexión PostgreSQL.
- `Jwt__Issuer`, `Jwt__Audience`: emisor y audiencia del token.
- `Jwt__SecretKey`: clave privada para firma HMAC.
- `Jwt__AccessTokenMinutes`, `Jwt__RefreshTokenDays`: vigencia de tokens.

```powershell
dotnet restore PhoneStore.slnx
dotnet build PhoneStore.slnx
```

```powershell
dotnet run --project src/PhoneStore.Api/PhoneStore.Api.csproj
```

La documentación OpenAPI / Scalar se registra únicamente en el entorno Development.

## Autenticación

`/api/auth/login` emite tokens de acceso y refresh; `/api/auth/refresh` renueva la sesión; `/api/auth/logout` revoca el token presentado. Los endpoints de negocio utilizan políticas de autorización para controlar operaciones sobre catálogo, inventario, ventas y administración.

## Persistencia y credenciales

La configuración de desarrollo existente contiene valores locales para conexión y firma JWT. Sustitúyelos por credenciales privadas antes de utilizar otro entorno. No reutilices contraseñas de demostración ni claves de desarrollo en un despliegue real.
