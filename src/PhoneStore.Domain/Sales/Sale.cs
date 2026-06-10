using System;
using System.Collections.Generic;
using System.Text;
namespace PhoneStore.Domain.Sales;

public sealed class Sale
{
    public Guid Id { get; set; }

    public Guid? CustomerId { get; set; }

    public Guid BranchId { get; set; }

    public Guid WarehouseId { get; set; }

    public string Status { get; set; } = "PAID";

    public decimal Subtotal { get; set; }

    public decimal DiscountTotal { get; set; }

    public decimal TaxTotal { get; set; }

    public decimal Total { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? UpdatedAt { get; set; }
}