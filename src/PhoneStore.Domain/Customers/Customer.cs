using System;
using System.Collections.Generic;
using System.Text;

namespace PhoneStore.Domain.Customers;

public sealed class Customer
{
    
    public Guid Id { get; set; }

    
    public string Name { get; set; } = string.Empty;

    
    public string Phone { get; set; } = string.Empty;

    public string? Email { get; set; }

    public string Status { get; set; } = "ACTIVE";

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? UpdatedAt { get; set; }
}