using System;
using System.Collections.Generic;
using System.Text;

namespace PhoneStore.Domain.Inventory;

public sealed class InventoryMovement
{

    public Guid Id { get; set; }

    public Guid ProductId { get; set; }

    public Guid WarehouseId { get; set; }

    public string MovementType { get; set; } = string.Empty;


    public int Qty { get; set; }

    public int PreviousQuantity { get; set; }

    public int NewQuantity { get; set; }

    public int PreviousReservedQuantity { get; set; }


    public int NewReservedQuantity { get; set; }

    public string Reason { get; set; } = string.Empty;

    public Guid? ReferenceId { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? UpdatedAt { get; set; }
}