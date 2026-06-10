namespace PhoneStore.Domain.Catalog;

public sealed class Product
{
    public Guid Id { get; set; }

    public Guid CategoryId { get; set; }

    public Guid BrandId { get; set; }

    public string Sku { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public decimal CostPrice { get; set; }

    public decimal SalePrice { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? UpdatedAt { get; set; }
}
