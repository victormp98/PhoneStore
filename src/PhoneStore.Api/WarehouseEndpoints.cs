using Microsoft.EntityFrameworkCore;
using PhoneStore.Domain.Warehouses;
using PhoneStore.Infrastructure.Persistence;

namespace PhoneStore.Api.Endpoints;

public static class WarehouseEndpoints
{
    public static IEndpointRouteBuilder MapWarehouseEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/warehouses")
            .WithTags("Warehouses");

        group.MapGet("/", async (PhoneStoreDbContext dbContext) =>
        {
            var warehouses = await dbContext.Warehouses
                .OrderBy(warehouse => warehouse.Name)
                .Select(warehouse => new WarehouseResponse(
                    warehouse.Id,
                    warehouse.BranchId,
                    warehouse.Code,
                    warehouse.Name,
                    warehouse.IsActive,
                    warehouse.CreatedAt,
                    warehouse.UpdatedAt
                ))
                .ToListAsync();

            return Results.Ok(warehouses);
        })
        .WithName("GetWarehouses");

        group.MapGet("/{id:guid}", async (
            Guid id,
            PhoneStoreDbContext dbContext) =>
        {
            var warehouse = await dbContext.Warehouses
                .Where(warehouse => warehouse.Id == id)
                .Select(warehouse => new WarehouseResponse(
                    warehouse.Id,
                    warehouse.BranchId,
                    warehouse.Code,
                    warehouse.Name,
                    warehouse.IsActive,
                    warehouse.CreatedAt,
                    warehouse.UpdatedAt
                ))
                .FirstOrDefaultAsync();

            if (warehouse is null)
            {
                return Results.NotFound(new
                {
                    message = "Almacén no encontrado."
                });
            }

            return Results.Ok(warehouse);
        })
        .WithName("GetWarehouseById");

        group.MapPost("/", async (
            CreateWarehouseRequest request,
            PhoneStoreDbContext dbContext) =>
        {
            var branchExists = await dbContext.Branches
                .AnyAsync(branch => branch.Id == request.BranchId && branch.IsActive);

            if (!branchExists)
            {
                return Results.BadRequest(new
                {
                    message = "La sucursal no existe o está inactiva."
                });
            }

            var normalizedCode = request.Code.Trim().ToUpperInvariant();

            var codeExists = await dbContext.Warehouses
                .AnyAsync(warehouse =>
                    warehouse.BranchId == request.BranchId &&
                    warehouse.Code == normalizedCode);

            if (codeExists)
            {
                return Results.BadRequest(new
                {
                    message = "Ya existe un almacén con ese código en esta sucursal."
                });
            }

            var warehouse = new Warehouse
            {
                Id = Guid.NewGuid(),
                BranchId = request.BranchId,
                Code = normalizedCode,
                Name = request.Name.Trim(),
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow
            };

            dbContext.Warehouses.Add(warehouse);
            await dbContext.SaveChangesAsync();

            var response = new WarehouseResponse(
                warehouse.Id,
                warehouse.BranchId,
                warehouse.Code,
                warehouse.Name,
                warehouse.IsActive,
                warehouse.CreatedAt,
                warehouse.UpdatedAt
            );

            return Results.Created($"/api/warehouses/{warehouse.Id}", response);
        })
        .WithName("CreateWarehouse");

        group.MapPut("/{id:guid}", async (
            Guid id,
            UpdateWarehouseRequest request,
            PhoneStoreDbContext dbContext) =>
        {
            var warehouse = await dbContext.Warehouses
                .FirstOrDefaultAsync(warehouse => warehouse.Id == id);

            if (warehouse is null)
            {
                return Results.NotFound(new
                {
                    message = "Almacén no encontrado."
                });
            }

            var branchExists = await dbContext.Branches
                .AnyAsync(branch => branch.Id == request.BranchId && branch.IsActive);

            if (!branchExists)
            {
                return Results.BadRequest(new
                {
                    message = "La sucursal no existe o está inactiva."
                });
            }

            var normalizedCode = request.Code.Trim().ToUpperInvariant();

            var codeExists = await dbContext.Warehouses
                .AnyAsync(existingWarehouse =>
                    existingWarehouse.Id != id &&
                    existingWarehouse.BranchId == request.BranchId &&
                    existingWarehouse.Code == normalizedCode);

            if (codeExists)
            {
                return Results.BadRequest(new
                {
                    message = "Ya existe otro almacén con ese código en esta sucursal."
                });
            }

            warehouse.BranchId = request.BranchId;
            warehouse.Code = normalizedCode;
            warehouse.Name = request.Name.Trim();
            warehouse.IsActive = request.IsActive;
            warehouse.UpdatedAt = DateTimeOffset.UtcNow;

            await dbContext.SaveChangesAsync();

            var response = new WarehouseResponse(
                warehouse.Id,
                warehouse.BranchId,
                warehouse.Code,
                warehouse.Name,
                warehouse.IsActive,
                warehouse.CreatedAt,
                warehouse.UpdatedAt
            );

            return Results.Ok(response);
        })
        .WithName("UpdateWarehouse");

        group.MapDelete("/{id:guid}", async (
            Guid id,
            PhoneStoreDbContext dbContext) =>
        {
            var warehouse = await dbContext.Warehouses
                .FirstOrDefaultAsync(warehouse => warehouse.Id == id);

            if (warehouse is null)
            {
                return Results.NotFound(new
                {
                    message = "Almacén no encontrado."
                });
            }

            warehouse.IsActive = false;
            warehouse.UpdatedAt = DateTimeOffset.UtcNow;

            await dbContext.SaveChangesAsync();

            return Results.Ok(new
            {
                message = "Almacén desactivado correctamente.",
                warehouse.Id,
                warehouse.BranchId,
                warehouse.Code,
                warehouse.Name,
                warehouse.IsActive,
                warehouse.UpdatedAt
            });
        })
        .WithName("DeactivateWarehouse");

        return app;
    }
}

public sealed record CreateWarehouseRequest(
    Guid BranchId,
    string Code,
    string Name
);

public sealed record UpdateWarehouseRequest(
    Guid BranchId,
    string Code,
    string Name,
    bool IsActive
);

public sealed record WarehouseResponse(
    Guid Id,
    Guid BranchId,
    string Code,
    string Name,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt
);
