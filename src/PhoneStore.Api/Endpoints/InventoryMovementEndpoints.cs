using Microsoft.EntityFrameworkCore;
using PhoneStore.Api.Security;
using PhoneStore.Domain.Inventory;
using PhoneStore.Infrastructure.Persistence;

namespace PhoneStore.Api.Endpoints;

public static class InventoryMovementEndpoints
{
    public static IEndpointRouteBuilder MapInventoryMovementEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/inventory-movements")
            .WithTags("Inventory Movements");

        group.MapGet("/", async (PhoneStoreDbContext dbContext) =>
        {
            var movements = await dbContext.InventoryMovements
                .OrderByDescending(movement => movement.CreatedAt)
                .Select(movement => new InventoryMovementResponse(
                    movement.Id,
                    movement.ProductId,
                    movement.WarehouseId,
                    movement.MovementType,
                    movement.Qty,
                    movement.PreviousQuantity,
                    movement.NewQuantity,
                    movement.PreviousReservedQuantity,
                    movement.NewReservedQuantity,
                    movement.Reason,
                    movement.ReferenceId,
                    movement.CreatedAt,
                    movement.UpdatedAt
                ))
                .ToListAsync();

            return Results.Ok(movements);
        })
        .WithName("GetInventoryMovements")
        .RequireAuthorization(PermissionConstants.InventoryRead);

        group.MapGet("/{id:guid}", async (
            Guid id,
            PhoneStoreDbContext dbContext) =>
        {
            var movement = await dbContext.InventoryMovements
                .Where(movement => movement.Id == id)
                .Select(movement => new InventoryMovementResponse(
                    movement.Id,
                    movement.ProductId,
                    movement.WarehouseId,
                    movement.MovementType,
                    movement.Qty,
                    movement.PreviousQuantity,
                    movement.NewQuantity,
                    movement.PreviousReservedQuantity,
                    movement.NewReservedQuantity,
                    movement.Reason,
                    movement.ReferenceId,
                    movement.CreatedAt,
                    movement.UpdatedAt
                ))
                .FirstOrDefaultAsync();

            if (movement is null)
            {
                return Results.NotFound(new
                {
                    message = "Movimiento de inventario no encontrado."
                });
            }

            return Results.Ok(movement);
        })
        .WithName("GetInventoryMovementById")
        .RequireAuthorization(PermissionConstants.InventoryRead);

        group.MapPost("/adjust", async (
            AdjustInventoryRequest request,
            PhoneStoreDbContext dbContext) =>
        {
            if (request.Qty == 0)
            {
                return Results.BadRequest(new
                {
                    message = "La cantidad del ajuste no puede ser 0."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Reason))
            {
                return Results.BadRequest(new
                {
                    message = "El motivo del ajuste es obligatorio."
                });
            }

            var stock = await dbContext.InventoryStocks
                .FirstOrDefaultAsync(stock =>
                    stock.ProductId == request.ProductId &&
                    stock.WarehouseId == request.WarehouseId);

            if (stock is null)
            {
                return Results.NotFound(new
                {
                    message = "No existe stock para este producto en este almacén."
                });
            }

            var previousQuantity = stock.Quantity;
            var previousReservedQuantity = stock.ReservedQuantity;

            var newQuantity = previousQuantity + request.Qty;
            var newReservedQuantity = previousReservedQuantity;

            if (newQuantity < 0)
            {
                return Results.BadRequest(new
                {
                    message = "El ajuste no puede dejar el stock total en negativo."
                });
            }

            if (newReservedQuantity > newQuantity)
            {
                return Results.BadRequest(new
                {
                    message = "El stock reservado no puede ser mayor que el stock total."
                });
            }

            stock.Quantity = newQuantity;
            stock.UpdatedAt = DateTimeOffset.UtcNow;

            var movement = new InventoryMovement
            {
                Id = Guid.NewGuid(),
                ProductId = request.ProductId,
                WarehouseId = request.WarehouseId,
                MovementType = "ADJUSTMENT",
                Qty = request.Qty,
                PreviousQuantity = previousQuantity,
                NewQuantity = newQuantity,
                PreviousReservedQuantity = previousReservedQuantity,
                NewReservedQuantity = newReservedQuantity,
                Reason = request.Reason.Trim(),
                ReferenceId = request.ReferenceId,
                CreatedAt = DateTimeOffset.UtcNow
            };

            dbContext.InventoryMovements.Add(movement);
            await dbContext.SaveChangesAsync();

            var response = new InventoryMovementResponse(
                movement.Id,
                movement.ProductId,
                movement.WarehouseId,
                movement.MovementType,
                movement.Qty,
                movement.PreviousQuantity,
                movement.NewQuantity,
                movement.PreviousReservedQuantity,
                movement.NewReservedQuantity,
                movement.Reason,
                movement.ReferenceId,
                movement.CreatedAt,
                movement.UpdatedAt
            );

            return Results.Created($"/api/inventory-movements/{movement.Id}", response);
        })
        .WithName("AdjustInventory")
        .RequireAuthorization(PermissionConstants.InventoryMove);

        return app;
    }
}

public sealed record AdjustInventoryRequest(
    Guid ProductId,
    Guid WarehouseId,
    int Qty,
    string Reason,
    Guid? ReferenceId
);

public sealed record InventoryMovementResponse(
    Guid Id,
    Guid ProductId,
    Guid WarehouseId,
    string MovementType,
    int Qty,
    int PreviousQuantity,
    int NewQuantity,
    int PreviousReservedQuantity,
    int NewReservedQuantity,
    string Reason,
    Guid? ReferenceId,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt
);
