namespace PhoneStore.Api.Services.Sales;

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

public sealed record CancelSaleResponse(
    string Message,
    Guid Id,
    string Status,
    DateTimeOffset? UpdatedAt
);
