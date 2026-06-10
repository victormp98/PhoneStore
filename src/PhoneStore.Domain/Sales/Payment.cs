using System;
using System.Collections.Generic;
using System.Text;
namespace PhoneStore.Domain.Sales;

public sealed class Payment
{
    public Guid Id { get; set; }
    public Guid SaleId { get; set; }

    public string PaymentMethod { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string Status { get; set; } = "CONFIRMED";

    public string? Reference { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? UpdatedAt { get; set; }
}