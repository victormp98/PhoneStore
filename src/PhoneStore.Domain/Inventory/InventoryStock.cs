using System;
using System.Collections.Generic;
using System.Text;
namespace PhoneStore.Domain.Inventory;

public sealed class InventoryStock
{
    public Guid Id { get; set; }

    public Guid ProductId { get; set; }

    public Guid WarehouseId { get; set; }

    public int Quantity { get; set; }

    public int ReservedQuantity { get; set; }

    public int MinStock { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? UpdatedAt { get; set; }
}