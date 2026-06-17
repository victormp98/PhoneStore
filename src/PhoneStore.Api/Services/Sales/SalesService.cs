using Microsoft.EntityFrameworkCore;
using PhoneStore.Domain.Inventory;
using PhoneStore.Domain.Sales;
using PhoneStore.Infrastructure.Persistence;

namespace PhoneStore.Api.Services.Sales;

public sealed class SalesService
{
    private readonly PhoneStoreDbContext _dbContext;

    public SalesService(PhoneStoreDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<SalesResult<SaleResponse>> CreateSaleAsync(CreateSaleRequest request)
    {
        if (request.Items.Count == 0)
        {
            return SalesResult<SaleResponse>.BadRequest("La venta debe tener al menos un producto.");
        }

        if (request.Payments.Count == 0)
        {
            return SalesResult<SaleResponse>.BadRequest("La venta debe tener al menos un pago.");
        }

        var branchExists = await _dbContext.Branches
            .AnyAsync(branch => branch.Id == request.BranchId && branch.IsActive);

        if (!branchExists)
        {
            return SalesResult<SaleResponse>.BadRequest("La sucursal no existe o está inactiva.");
        }

        var warehouseExists = await _dbContext.Warehouses
            .AnyAsync(warehouse =>
                warehouse.Id == request.WarehouseId &&
                warehouse.BranchId == request.BranchId &&
                warehouse.IsActive);

        if (!warehouseExists)
        {
            return SalesResult<SaleResponse>.BadRequest("El almacén no existe, está inactivo o no pertenece a la sucursal.");
        }

        if (request.CustomerId is not null)
        {
            var customerExists = await _dbContext.Customers
                .AnyAsync(customer =>
                    customer.Id == request.CustomerId &&
                    customer.Status == "ACTIVE");

            if (!customerExists)
            {
                return SalesResult<SaleResponse>.BadRequest("El cliente no existe o no está activo.");
            }
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync();

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
                    return SalesResult<SaleResponse>.BadRequest("La cantidad vendida debe ser mayor a 0.");
                }

                var product = await _dbContext.Products
                    .FirstOrDefaultAsync(product =>
                        product.Id == itemRequest.ProductId &&
                        product.IsActive);

                if (product is null)
                {
                    return SalesResult<SaleResponse>.BadRequest($"El producto {itemRequest.ProductId} no existe o está inactivo.");
                }

                var stock = await _dbContext.InventoryStocks
                    .FirstOrDefaultAsync(stock =>
                        stock.ProductId == itemRequest.ProductId &&
                        stock.WarehouseId == request.WarehouseId);

                if (stock is null)
                {
                    return SalesResult<SaleResponse>.BadRequest($"No existe stock para el producto {product.Name} en este almacén.");
                }

                var availableQuantity = stock.Quantity - stock.ReservedQuantity;

                if (availableQuantity < itemRequest.Quantity)
                {
                    return SalesResult<SaleResponse>.BadRequest($"Stock insuficiente para {product.Name}. Disponible: {availableQuantity}.");
                }

                var unitPrice = itemRequest.UnitPrice ?? product.SalePrice;

                if (unitPrice < 0)
                {
                    return SalesResult<SaleResponse>.BadRequest("El precio unitario no puede ser negativo.");
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
                return SalesResult<SaleResponse>.BadRequest("Los totales no pueden ser negativos.");
            }

            var paidTotal = request.Payments.Sum(payment => payment.Amount);

            if (paidTotal != total)
            {
                return SalesResult<SaleResponse>.BadRequest($"El total pagado debe ser igual al total de la venta. Total: {total}, Pagado: {paidTotal}.");
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
                return SalesResult<SaleResponse>.BadRequest("Todos los pagos deben ser mayores a 0.");
            }

            _dbContext.Sales.Add(sale);
            _dbContext.SaleItems.AddRange(saleItems);
            _dbContext.Payments.AddRange(payments);
            _dbContext.InventoryMovements.AddRange(inventoryMovements);

            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();

            var response = new SaleResponse(
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
            );

            return SalesResult<SaleResponse>.Created(response, $"/api/sales/{sale.Id}");
        }
        catch
        {
            await transaction.RollbackAsync();

            return SalesResult<SaleResponse>.Problem(
                "Error al registrar la venta.",
                "La venta fue revertida. No se guardaron cambios parciales.");
        }
    }

    public async Task<List<SaleResponse>> GetSalesAsync(
        string? status,
        Guid? branchId,
        Guid? warehouseId)
    {
        var query = _dbContext.Sales.AsQueryable();

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

        return await query
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
    }

    public async Task<SalesResult<SaleDetailResponse>> GetSaleByIdAsync(Guid id)
    {
        var sale = await _dbContext.Sales
            .FirstOrDefaultAsync(sale => sale.Id == id);

        if (sale is null)
        {
            return SalesResult<SaleDetailResponse>.NotFound("Venta no encontrada.");
        }

        var items = await _dbContext.SaleItems
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

        var payments = await _dbContext.Payments
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

        return SalesResult<SaleDetailResponse>.Success(response);
    }

    public async Task<SalesResult<CancelSaleResponse>> CancelSaleAsync(
        Guid id,
        CancelSaleRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            return SalesResult<CancelSaleResponse>.BadRequest("El motivo de cancelación es obligatorio.");
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync();

        try
        {
            var sale = await _dbContext.Sales
                .FirstOrDefaultAsync(sale => sale.Id == id);

            if (sale is null)
            {
                return SalesResult<CancelSaleResponse>.NotFound("Venta no encontrada.");
            }

            if (sale.Status != "PAID")
            {
                return SalesResult<CancelSaleResponse>.BadRequest("Solo se pueden cancelar ventas con status PAID.");
            }

            var saleItems = await _dbContext.SaleItems
                .Where(item => item.SaleId == id)
                .ToListAsync();

            if (saleItems.Count == 0)
            {
                return SalesResult<CancelSaleResponse>.BadRequest("La venta no tiene productos para revertir.");
            }

            var payments = await _dbContext.Payments
                .Where(payment => payment.SaleId == id)
                .ToListAsync();

            var now = DateTimeOffset.UtcNow;
            var inventoryMovements = new List<InventoryMovement>();

            foreach (var item in saleItems)
            {
                var stock = await _dbContext.InventoryStocks
                    .FirstOrDefaultAsync(stock =>
                        stock.ProductId == item.ProductId &&
                        stock.WarehouseId == sale.WarehouseId);

                if (stock is null)
                {
                    return SalesResult<CancelSaleResponse>.BadRequest($"No existe stock para revertir el producto {item.ProductId}.");
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

            _dbContext.InventoryMovements.AddRange(inventoryMovements);

            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();

            return SalesResult<CancelSaleResponse>.Success(new CancelSaleResponse(
                "Venta cancelada correctamente.",
                sale.Id,
                sale.Status,
                sale.UpdatedAt
            ));
        }
        catch
        {
            await transaction.RollbackAsync();

            return SalesResult<CancelSaleResponse>.Problem(
                "Error al cancelar la venta.",
                "La cancelación fue revertida. No se guardaron cambios parciales.");
        }
    }
}
