using PhoneStore.Api.Security;
using PhoneStore.Api.Services.Sales;

namespace PhoneStore.Api.Endpoints;

public static class SaleEndpoints
{
    public static IEndpointRouteBuilder MapSaleEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/sales")
            .WithTags("Sales");

        group.MapPost("/", async (
            CreateSaleRequest request,
            SalesService salesService) =>
        {
            var result = await salesService.CreateSaleAsync(request);

            return ToHttpResult(result);
        })
        .WithName("CreateSale")
        .RequireAuthorization(PermissionConstants.SalesCreate);

        group.MapGet("/", async (
            string? status,
            Guid? branchId,
            Guid? warehouseId,
            SalesService salesService) =>
        {
            var sales = await salesService.GetSalesAsync(status, branchId, warehouseId);

            return Results.Ok(sales);
        })
        .WithName("GetSales")
        .RequireAuthorization(PermissionConstants.SalesRead);

        group.MapGet("/{id:guid}", async (
            Guid id,
            SalesService salesService) =>
        {
            var result = await salesService.GetSaleByIdAsync(id);

            return ToHttpResult(result);
        })
        .WithName("GetSaleById")
        .RequireAuthorization(PermissionConstants.SalesRead);

        group.MapPost("/{id:guid}/cancel", async (
            Guid id,
            CancelSaleRequest request,
            SalesService salesService) =>
        {
            var result = await salesService.CancelSaleAsync(id, request);

            return ToHttpResult(result);
        })
        .WithName("CancelSale")
        .RequireAuthorization(PermissionConstants.SalesCancel);

        return app;
    }

    private static IResult ToHttpResult<T>(SalesResult<T> result)
    {
        return result.Status switch
        {
            SalesResultStatus.Success when result.CreatedLocation is not null =>
                Results.Created(result.CreatedLocation, result.Value),

            SalesResultStatus.Success =>
                Results.Ok(result.Value),

            SalesResultStatus.BadRequest =>
                Results.BadRequest(new { message = result.Message }),

            SalesResultStatus.NotFound =>
                Results.NotFound(new { message = result.Message }),

            SalesResultStatus.Problem =>
                Results.Problem(
                    title: result.ProblemTitle,
                    detail: result.ProblemDetail),

            _ => Results.Problem()
        };
    }
}
