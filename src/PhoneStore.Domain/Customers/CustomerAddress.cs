using System;
using System.Collections.Generic;
using System.Text;

namespace PhoneStore.Domain.Customers;

public sealed class CustomerAddress
{
    public Guid Id { get; set; }

    public Guid CustomerId { get; set; }

    public string Label { get; set; } = string.Empty;

    public string Address { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;

    public decimal? GeoLat { get; set; }

    public decimal? GeoLng { get; set; }

    public bool IsDefault { get; set; }
    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? UpdatedAt { get; set; }
}