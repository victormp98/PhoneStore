using Microsoft.EntityFrameworkCore;
using PhoneStore.Domain.Inventory;
using PhoneStore.Infrastructure.Persistence;

namespace PhoneStore.Api.Endpoints;

public static class InventoryStockEndpoints
{
    public static IEndpointRouteBuilder MapInventoryStockEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/inventory-stocks")
            .WithTags("Inventory Stocks");

        group.MapGet("/", async (PhoneStoreDbContext dbContext) =>
        {
            var stocks = await dbContext.InventoryStocks
                .OrderBy(stock => stock.ProductId)
                .Select(stock => new InventoryStockResponse(
                    stock.Id,
                    stock.ProductId,
                    stock.WarehouseId,
                    stock.Quantity,
                    stock.ReservedQuantity,
                    stock.Quantity - stock.ReservedQuantity,
                    stock.MinStock,
                    stock.CreatedAt,
                    stock.UpdatedAt
                ))
                .ToListAsync();

            return Results.Ok(stocks);
        })
        .WithName("GetInventoryStocks");

        group.MapGet("/{id:guid}", async (
            Guid id,
            PhoneStoreDbContext dbContext) =>
        {
            var stock = await dbContext.InventoryStocks
                .Where(stock => stock.Id == id)
                .Select(stock => new InventoryStockResponse(
                    stock.Id,
                    stock.ProductId,
                    stock.WarehouseId,
                    stock.Quantity,
                    stock.ReservedQuantity,
                    stock.Quantity - stock.ReservedQuantity,
                    stock.MinStock,
                    stock.CreatedAt,
                    stock.UpdatedAt
                ))
                .FirstOrDefaultAsync();

            if (stock is null)
            {
                return Results.NotFound(new
                {
                    message = "Stock de inventario no encontrado."
                });
            }

            return Results.Ok(stock);
        })
        .WithName("GetInventoryStockById");

        group.MapPost("/", async (
            CreateInventoryStockRequest request,
            PhoneStoreDbContext dbContext) =>
        {
            var productExists = await dbContext.Products
                .AnyAsync(product => product.Id == request.ProductId && product.IsActive);

            if (!productExists)
            {
                return Results.BadRequest(new
                {
                    message = "El producto no existe o está inactivo."
                });
            }

            var warehouseExists = await dbContext.Warehouses
                .AnyAsync(warehouse => warehouse.Id == request.WarehouseId && warehouse.IsActive);

            if (!warehouseExists)
            {
                return Results.BadRequest(new
                {
                    message = "El almacén no existe o está inactivo."
                });
            }

            var stockExists = await dbContext.InventoryStocks
                .AnyAsync(stock =>
                    stock.ProductId == request.ProductId &&
                    stock.WarehouseId == request.WarehouseId);

            if (stockExists)
            {
                return Results.BadRequest(new
                {
                    message = "Ya existe stock para este producto en este almacén."
                });
            }

            if (request.Quantity < 0 || request.ReservedQuantity < 0 || request.MinStock < 0)
            {
                return Results.BadRequest(new
                {
                    message = "Las cantidades no pueden ser negativas."
                });
            }

            if (request.ReservedQuantity > request.Quantity)
            {
                return Results.BadRequest(new
                {
                    message = "La cantidad reservada no puede ser mayor que la cantidad total."
                });
            }

            var stock = new InventoryStock
            {
                Id = Guid.NewGuid(),
                ProductId = request.ProductId,
                WarehouseId = request.WarehouseId,
                Quantity = request.Quantity,
                ReservedQuantity = request.ReservedQuantity,
                MinStock = request.MinStock,
                CreatedAt = DateTimeOffset.UtcNow
            };

            dbContext.InventoryStocks.Add(stock);
            await dbContext.SaveChangesAsync();

            var response = new InventoryStockResponse(
                stock.Id,
                stock.ProductId,
                stock.WarehouseId,
                stock.Quantity,
                stock.ReservedQuantity,
                stock.Quantity - stock.ReservedQuantity,
                stock.MinStock,
                stock.CreatedAt,
                stock.UpdatedAt
            );

            return Results.Created($"/api/inventory-stocks/{stock.Id}", response);
        })
        .WithName("CreateInventoryStock");

        group.MapPut("/{id:guid}", async (
            Guid id,
            UpdateInventoryStockRequest request,
            PhoneStoreDbContext dbContext) =>
        {
            var stock = await dbContext.InventoryStocks
                .FirstOrDefaultAsync(stock => stock.Id == id);

            if (stock is null)
            {
                return Results.NotFound(new
                {
                    message = "Stock de inventario no encontrado."
                });
            }

            if (request.Quantity < 0 || request.ReservedQuantity < 0 || request.MinStock < 0)
            {
                return Results.BadRequest(new
                {
                    message = "Las cantidades no pueden ser negativas."
                });
            }

            if (request.ReservedQuantity > request.Quantity)
            {
                return Results.BadRequest(new
                {
                    message = "La cantidad reservada no puede ser mayor que la cantidad total."
                });
            }

            stock.Quantity = request.Quantity;
            stock.ReservedQuantity = request.ReservedQuantity;
            stock.MinStock = request.MinStock;
            stock.UpdatedAt = DateTimeOffset.UtcNow;

            await dbContext.SaveChangesAsync();

            var response = new InventoryStockResponse(
                stock.Id,
                stock.ProductId,
                stock.WarehouseId,
                stock.Quantity,
                stock.ReservedQuantity,
                stock.Quantity - stock.ReservedQuantity,
                stock.MinStock,
                stock.CreatedAt,
                stock.UpdatedAt
            );

            return Results.Ok(response);
        })
        .WithName("UpdateInventoryStock");

        return app;
    }
}

public sealed record CreateInventoryStockRequest(
    Guid ProductId,
    Guid WarehouseId,
    int Quantity,
    int ReservedQuantity,
    int MinStock
);

public sealed record UpdateInventoryStockRequest(
    int Quantity,
    int ReservedQuantity,
    int MinStock
);

public sealed record InventoryStockResponse(
    Guid Id,
    Guid ProductId,
    Guid WarehouseId,
    int Quantity,
    int ReservedQuantity,
    int AvailableQuantity,
    int MinStock,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt
);