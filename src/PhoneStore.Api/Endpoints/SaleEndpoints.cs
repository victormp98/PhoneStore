using Microsoft.EntityFrameworkCore;
using PhoneStore.Domain.Inventory;
using PhoneStore.Domain.Sales;
using PhoneStore.Infrastructure.Persistence;

namespace PhoneStore.Api.Endpoints;

public static class SaleEndpoints
{
    public static IEndpointRouteBuilder MapSaleEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/sales")
            .WithTags("Sales");

        group.MapPost("/", async (
            CreateSaleRequest request,
            PhoneStoreDbContext dbContext) =>
        {
            if (request.Items.Count == 0)
            {
                return Results.BadRequest(new
                {
                    message = "La venta debe tener al menos un producto."
                });
            }

            if (request.Payments.Count == 0)
            {
                return Results.BadRequest(new
                {
                    message = "La venta debe tener al menos un pago."
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

            var warehouseExists = await dbContext.Warehouses
                .AnyAsync(warehouse =>
                    warehouse.Id == request.WarehouseId &&
                    warehouse.BranchId == request.BranchId &&
                    warehouse.IsActive);

            if (!warehouseExists)
            {
                return Results.BadRequest(new
                {
                    message = "El almacén no existe, está inactivo o no pertenece a la sucursal."
                });
            }

            if (request.CustomerId is not null)
            {
                var customerExists = await dbContext.Customers
                    .AnyAsync(customer =>
                        customer.Id == request.CustomerId &&
                        customer.Status == "ACTIVE");

                if (!customerExists)
                {
                    return Results.BadRequest(new
                    {
                        message = "El cliente no existe o no está activo."
                    });
                }
            }

            await using var transaction = await dbContext.Database.BeginTransactionAsync();

            try
            {
                var saleId = Guid.NewGuid();
                var now = DateTimeOffset.UtcNow;

                var saleItems = new List<SaleItem>();
                var inventoryMovements = new List<InventoryMovement>();

                decimal subtotal = 0;

                foreach (var itemRequest in request.Items)
                {
                    if (itemRequest.Quantity <= 0)
                    {
                        return Results.BadRequest(new
                        {
                            message = "La cantidad vendida debe ser mayor a 0."
                        });
                    }

                    var product = await dbContext.Products
                        .FirstOrDefaultAsync(product =>
                            product.Id == itemRequest.ProductId &&
                            product.IsActive);

                    if (product is null)
                    {
                        return Results.BadRequest(new
                        {
                            message = $"El producto {itemRequest.ProductId} no existe o está inactivo."
                        });
                    }

                    var stock = await dbContext.InventoryStocks
                        .FirstOrDefaultAsync(stock =>
                            stock.ProductId == itemRequest.ProductId &&
                            stock.WarehouseId == request.WarehouseId);

                    if (stock is null)
                    {
                        return Results.BadRequest(new
                        {
                            message = $"No existe stock para el producto {product.Name} en este almacén."
                        });
                    }

                    var availableQuantity = stock.Quantity - stock.ReservedQuantity;

                    if (availableQuantity < itemRequest.Quantity)
                    {
                        return Results.BadRequest(new
                        {
                            message = $"Stock insuficiente para {product.Name}. Disponible: {availableQuantity}."
                        });
                    }

                    var unitPrice = itemRequest.UnitPrice ?? product.SalePrice;

                    if (unitPrice < 0)
                    {
                        return Results.BadRequest(new
                        {
                            message = "El precio unitario no puede ser negativo."
                        });
                    }

                    var itemSubtotal = itemRequest.Quantity * unitPrice;
                    subtotal += itemSubtotal;

                    var previousQuantity = stock.Quantity;
                    var previousReservedQuantity = stock.ReservedQuantity;
                    var newQuantity = previousQuantity - itemRequest.Quantity;
                    var newReservedQuantity = previousReservedQuantity;

                    stock.Quantity = newQuantity;
                    stock.UpdatedAt = now;

                    saleItems.Add(new SaleItem
                    {
                        Id = Guid.NewGuid(),
                        SaleId = saleId,
                        ProductId = product.Id,
                        Quantity = itemRequest.Quantity,
                        UnitPrice = unitPrice,
                        Subtotal = itemSubtotal,
                        CreatedAt = now
                    });

                    inventoryMovements.Add(new InventoryMovement
                    {
                        Id = Guid.NewGuid(),
                        ProductId = product.Id,
                        WarehouseId = request.WarehouseId,
                        MovementType = "SALE",
                        Qty = -itemRequest.Quantity,
                        PreviousQuantity = previousQuantity,
                        NewQuantity = newQuantity,
                        PreviousReservedQuantity = previousReservedQuantity,
                        NewReservedQuantity = newReservedQuantity,
                        Reason = $"Venta POS {saleId}",
                        ReferenceId = saleId,
                        CreatedAt = now
                    });
                }

                var discountTotal = request.DiscountTotal ?? 0;
                var taxTotal = request.TaxTotal ?? 0;
                var total = subtotal - discountTotal + taxTotal;

                if (discountTotal < 0 || taxTotal < 0 || total < 0)
                {
                    return Results.BadRequest(new
                    {
                        message = "Los totales no pueden ser negativos."
                    });
                }

                var paidTotal = request.Payments.Sum(payment => payment.Amount);

                if (paidTotal != total)
                {
                    return Results.BadRequest(new
                    {
                        message = $"El total pagado debe ser igual al total de la venta. Total: {total}, Pagado: {paidTotal}."
                    });
                }

                var sale = new Sale
                {
                    Id = saleId,
                    CustomerId = request.CustomerId,
                    BranchId = request.BranchId,
                    WarehouseId = request.WarehouseId,
                    Status = "PAID",
                    Subtotal = subtotal,
                    DiscountTotal = discountTotal,
                    TaxTotal = taxTotal,
                    Total = total,
                    CreatedAt = now
                };

                var payments = request.Payments.Select(paymentRequest => new Payment
                {
                    Id = Guid.NewGuid(),
                    SaleId = saleId,
                    PaymentMethod = paymentRequest.PaymentMethod.Trim().ToUpperInvariant(),
                    Amount = paymentRequest.Amount,
                    Status = "CONFIRMED",
                    Reference = string.IsNullOrWhiteSpace(paymentRequest.Reference) ? null : paymentRequest.Reference.Trim(),
                    CreatedAt = now
                }).ToList();

                if (payments.Any(payment => payment.Amount <= 0))
                {
                    return Results.BadRequest(new
                    {
                        message = "Todos los pagos deben ser mayores a 0."
                    });
                }

                dbContext.Sales.Add(sale);
                dbContext.SaleItems.AddRange(saleItems);
                dbContext.Payments.AddRange(payments);
                dbContext.InventoryMovements.AddRange(inventoryMovements);

                await dbContext.SaveChangesAsync();
                await transaction.CommitAsync();

                return Results.Created($"/api/sales/{sale.Id}", new SaleResponse(
                    sale.Id,
                    sale.CustomerId,
                    sale.BranchId,
                    sale.WarehouseId,
                    sale.Status,
                    sale.Subtotal,
                    sale.DiscountTotal,
                    sale.TaxTotal,
                    sale.Total,
                    sale.CreatedAt,
                    sale.UpdatedAt
                ));
            }
            catch
            {
                await transaction.RollbackAsync();

                return Results.Problem(
                    title: "Error al registrar la venta.",
                    detail: "La venta fue revertida. No se guardaron cambios parciales.");
            }
        })
        .WithName("CreateSale");

        group.MapGet("/", async (
            string? status,
            Guid? branchId,
            Guid? warehouseId,
            PhoneStoreDbContext dbContext) =>
        {
            var query = dbContext.Sales.AsQueryable();

            if (!string.IsNullOrWhiteSpace(status))
            {
                var normalizedStatus = status.Trim().ToUpperInvariant();

                query = query.Where(sale => sale.Status == normalizedStatus);
            }

            if (branchId is not null)
            {
                query = query.Where(sale => sale.BranchId == branchId);
            }

            if (warehouseId is not null)
            {
                query = query.Where(sale => sale.WarehouseId == warehouseId);
            }

            var sales = await query
                .OrderByDescending(sale => sale.CreatedAt)
                .Select(sale => new SaleResponse(
                    sale.Id,
                    sale.CustomerId,
                    sale.BranchId,
                    sale.WarehouseId,
                    sale.Status,
                    sale.Subtotal,
                    sale.DiscountTotal,
                    sale.TaxTotal,
                    sale.Total,
                    sale.CreatedAt,
                    sale.UpdatedAt
                ))
                .ToListAsync();

            return Results.Ok(sales);
        })
        .WithName("GetSales");

        group.MapGet("/{id:guid}", async (
            Guid id,
            PhoneStoreDbContext dbContext) =>
        {
            var sale = await dbContext.Sales
                .FirstOrDefaultAsync(sale => sale.Id == id);

            if (sale is null)
            {
                return Results.NotFound(new
                {
                    message = "Venta no encontrada."
                });
            }

            var items = await dbContext.SaleItems
                .Where(item => item.SaleId == id)
                .Select(item => new SaleItemResponse(
                    item.Id,
                    item.SaleId,
                    item.ProductId,
                    item.Quantity,
                    item.UnitPrice,
                    item.Subtotal,
                    item.CreatedAt,
                    item.UpdatedAt
                ))
                .ToListAsync();

            var payments = await dbContext.Payments
                .Where(payment => payment.SaleId == id)
                .Select(payment => new PaymentResponse(
                    payment.Id,
                    payment.SaleId,
                    payment.PaymentMethod,
                    payment.Amount,
                    payment.Status,
                    payment.Reference,
                    payment.CreatedAt,
                    payment.UpdatedAt
                ))
                .ToListAsync();

            var response = new SaleDetailResponse(
                sale.Id,
                sale.CustomerId,
                sale.BranchId,
                sale.WarehouseId,
                sale.Status,
                sale.Subtotal,
                sale.DiscountTotal,
                sale.TaxTotal,
                sale.Total,
                sale.CreatedAt,
                sale.UpdatedAt,
                items,
                payments
            );

            return Results.Ok(response);
        })
        .WithName("GetSaleById");

        group.MapPost("/{id:guid}/cancel", async (
            Guid id,
            CancelSaleRequest request,
            PhoneStoreDbContext dbContext) =>
        {
            if (string.IsNullOrWhiteSpace(request.Reason))
            {
                return Results.BadRequest(new
                {
                    message = "El motivo de cancelación es obligatorio."
                });
            }

            await using var transaction = await dbContext.Database.BeginTransactionAsync();

            try
            {
                var sale = await dbContext.Sales
                    .FirstOrDefaultAsync(sale => sale.Id == id);

                if (sale is null)
                {
                    return Results.NotFound(new
                    {
                        message = "Venta no encontrada."
                    });
                }

                if (sale.Status != "PAID")
                {
                    return Results.BadRequest(new
                    {
                        message = "Solo se pueden cancelar ventas con status PAID."
                    });
                }

                var saleItems = await dbContext.SaleItems
                    .Where(item => item.SaleId == id)
                    .ToListAsync();

                if (saleItems.Count == 0)
                {
                    return Results.BadRequest(new
                    {
                        message = "La venta no tiene productos para revertir."
                    });
                }

                var payments = await dbContext.Payments
                    .Where(payment => payment.SaleId == id)
                    .ToListAsync();

                var now = DateTimeOffset.UtcNow;
                var inventoryMovements = new List<InventoryMovement>();

                foreach (var item in saleItems)
                {
                    var stock = await dbContext.InventoryStocks
                        .FirstOrDefaultAsync(stock =>
                            stock.ProductId == item.ProductId &&
                            stock.WarehouseId == sale.WarehouseId);

                    if (stock is null)
                    {
                        return Results.BadRequest(new
                        {
                            message = $"No existe stock para revertir el producto {item.ProductId}."
                        });
                    }

                    var previousQuantity = stock.Quantity;
                    var previousReservedQuantity = stock.ReservedQuantity;
                    var newQuantity = previousQuantity + item.Quantity;
                    var newReservedQuantity = previousReservedQuantity;

                    stock.Quantity = newQuantity;
                    stock.UpdatedAt = now;

                    inventoryMovements.Add(new InventoryMovement
                    {
                        Id = Guid.NewGuid(),
                        ProductId = item.ProductId,
                        WarehouseId = sale.WarehouseId,
                        MovementType = "SALE_CANCELLED",
                        Qty = item.Quantity,
                        PreviousQuantity = previousQuantity,
                        NewQuantity = newQuantity,
                        PreviousReservedQuantity = previousReservedQuantity,
                        NewReservedQuantity = newReservedQuantity,
                        Reason = request.Reason.Trim(),
                        ReferenceId = sale.Id,
                        CreatedAt = now
                    });
                }

                sale.Status = "CANCELLED";
                sale.UpdatedAt = now;

                foreach (var payment in payments)
                {
                    payment.Status = "CANCELLED";
                    payment.UpdatedAt = now;
                }

                dbContext.InventoryMovements.AddRange(inventoryMovements);

                await dbContext.SaveChangesAsync();
                await transaction.CommitAsync();

                return Results.Ok(new
                {
                    message = "Venta cancelada correctamente.",
                    sale.Id,
                    sale.Status,
                    sale.UpdatedAt
                });
            }
            catch
            {
                await transaction.RollbackAsync();

                return Results.Problem(
                    title: "Error al cancelar la venta.",
                    detail: "La cancelación fue revertida. No se guardaron cambios parciales.");
            }
        })
        .WithName("CancelSale");

        return app;
    }
}

public sealed record CreateSaleRequest(
    Guid? CustomerId,
    Guid BranchId,
    Guid WarehouseId,
    decimal? DiscountTotal,
    decimal? TaxTotal,
    List<CreateSaleItemRequest> Items,
    List<CreatePaymentRequest> Payments
);

public sealed record CreateSaleItemRequest(
    Guid ProductId,
    int Quantity,
    decimal? UnitPrice
);

public sealed record CreatePaymentRequest(
    string PaymentMethod,
    decimal Amount,
    string? Reference
);

public sealed record CancelSaleRequest(
    string Reason
);

public sealed record SaleResponse(
    Guid Id,
    Guid? CustomerId,
    Guid BranchId,
    Guid WarehouseId,
    string Status,
    decimal Subtotal,
    decimal DiscountTotal,
    decimal TaxTotal,
    decimal Total,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt
);

public sealed record SaleDetailResponse(
    Guid Id,
    Guid? CustomerId,
    Guid BranchId,
    Guid WarehouseId,
    string Status,
    decimal Subtotal,
    decimal DiscountTotal,
    decimal TaxTotal,
    decimal Total,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    List<SaleItemResponse> Items,
    List<PaymentResponse> Payments
);

public sealed record SaleItemResponse(
    Guid Id,
    Guid SaleId,
    Guid ProductId,
    int Quantity,
    decimal UnitPrice,
    decimal Subtotal,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt
);

public sealed record PaymentResponse(
    Guid Id,
    Guid SaleId,
    string PaymentMethod,
    decimal Amount,
    string Status,
    string? Reference,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt
);