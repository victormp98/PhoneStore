using Microsoft.EntityFrameworkCore;
using PhoneStore.Api.Security;
using PhoneStore.Domain.Auth;
using PhoneStore.Infrastructure.Persistence;

namespace PhoneStore.Api.Endpoints;

public static class PermissionSeedEndpoints
{
    public static IEndpointRouteBuilder MapPermissionSeedEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/system/permissions")
            .WithTags("System - Permissions");

        group.MapPost("/seed", async (PhoneStoreDbContext dbContext) =>
        {
            var now = DateTimeOffset.UtcNow;

            var permissions = new List<PermissionSeedItem>
            {
                new(PermissionConstants.UsersRead, "Ver usuarios", "Users"),
                new(PermissionConstants.UsersCreate, "Crear usuarios", "Users"),
                new(PermissionConstants.UsersUpdate, "Actualizar usuarios", "Users"),
                new(PermissionConstants.UsersDelete, "Eliminar usuarios", "Users"),

                new(PermissionConstants.RolesRead, "Ver roles", "Roles"),
                new(PermissionConstants.RolesCreate, "Crear roles", "Roles"),
                new(PermissionConstants.RolesUpdate, "Actualizar roles", "Roles"),
                new(PermissionConstants.RolesDelete, "Eliminar roles", "Roles"),

                new(PermissionConstants.PermissionsRead, "Ver permisos", "Permissions"),
                new(PermissionConstants.PermissionsAssign, "Asignar permisos", "Permissions"),

                new(PermissionConstants.BranchesRead, "Ver sucursales", "Branches"),
                new(PermissionConstants.BranchesCreate, "Crear sucursales", "Branches"),
                new(PermissionConstants.BranchesUpdate, "Actualizar sucursales", "Branches"),
                new(PermissionConstants.BranchesDelete, "Eliminar sucursales", "Branches"),

                new(PermissionConstants.WarehousesRead, "Ver almacenes", "Warehouses"),
                new(PermissionConstants.WarehousesCreate, "Crear almacenes", "Warehouses"),
                new(PermissionConstants.WarehousesUpdate, "Actualizar almacenes", "Warehouses"),
                new(PermissionConstants.WarehousesDelete, "Eliminar almacenes", "Warehouses"),

                new(PermissionConstants.CatalogRead, "Ver catálogo", "Catalog"),
                new(PermissionConstants.CatalogCreate, "Crear catálogo", "Catalog"),
                new(PermissionConstants.CatalogUpdate, "Actualizar catálogo", "Catalog"),
                new(PermissionConstants.CatalogDelete, "Eliminar catálogo", "Catalog"),

                new(PermissionConstants.InventoryRead, "Ver inventario", "Inventory"),
                new(PermissionConstants.InventoryAdjust, "Ajustar inventario", "Inventory"),
                new(PermissionConstants.InventoryMove, "Mover inventario", "Inventory"),

                new(PermissionConstants.CustomersRead, "Ver clientes", "Customers"),
                new(PermissionConstants.CustomersCreate, "Crear clientes", "Customers"),
                new(PermissionConstants.CustomersUpdate, "Actualizar clientes", "Customers"),
                new(PermissionConstants.CustomersDelete, "Eliminar clientes", "Customers"),

                new(PermissionConstants.SalesRead, "Ver ventas", "Sales"),
                new(PermissionConstants.SalesCreate, "Crear ventas", "Sales"),
                new(PermissionConstants.SalesCancel, "Cancelar ventas", "Sales")
            };

            foreach (var permissionSeed in permissions)
            {
                var exists = await dbContext.Permissions
                    .AnyAsync(permission => permission.Code == permissionSeed.Code);

                if (exists)
                {
                    continue;
                }

                dbContext.Permissions.Add(new Permission
                {
                    Id = Guid.NewGuid(),
                    Code = permissionSeed.Code,
                    Description = permissionSeed.Description,
                    Module = permissionSeed.Module,
                    CreatedAt = now,
                    UpdatedAt = null
                });
            }

            await dbContext.SaveChangesAsync();

            var adminRole = await dbContext.Roles
                .FirstOrDefaultAsync(role => role.Name == "ADMIN");

            if (adminRole is null)
            {
                return Results.BadRequest(new
                {
                    message = "No existe el rol ADMIN."
                });
            }

            var allPermissions = await dbContext.Permissions
                .ToListAsync();

            foreach (var permission in allPermissions)
            {
                var alreadyAssigned = await dbContext.RolePermissions
                    .AnyAsync(rolePermission =>
                        rolePermission.RoleId == adminRole.Id &&
                        rolePermission.PermissionId == permission.Id
                    );

                if (alreadyAssigned)
                {
                    continue;
                }

                dbContext.RolePermissions.Add(new RolePermission
                {
                    RoleId = adminRole.Id,
                    PermissionId = permission.Id,
                    CreatedAt = now
                });
            }

            await dbContext.SaveChangesAsync();

            return Results.Ok(new
            {
                message = "Permisos sembrados y asignados a ADMIN.",
                permissions = permissions.Count
            });
        })
        .WithName("SeedPermissions");

        return app;
    }

    private sealed record PermissionSeedItem(
        string Code,
        string Description,
        string Module
    );
}
