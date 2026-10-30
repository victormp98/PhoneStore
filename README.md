# PhoneStore

API ASP.NET Core .NET 10 con proyectos para dominio, aplicación, infraestructura y tareas de fondo.

## Desarrollo local

La rama de revisión cambia Docker Compose para requerir la variable privada `PHONESTORE_DB_PASSWORD` antes de iniciar PostgreSQL. Debe configurarse en el entorno local, nunca publicarse en Git.

El archivo de configuración de desarrollo de la API contiene valores antiguos y **aún requiere migración** a .NET User Secrets o variables de entorno. No fusionar esta rama hasta completar esa migración, revisar contraseñas reutilizadas y verificar que la API arranca correctamente.

En una base persistida, cambiar `POSTGRES_PASSWORD` no rota automáticamente la contraseña del rol PostgreSQL existente. Hacer esa migración por separado para evitar interrupciones.
