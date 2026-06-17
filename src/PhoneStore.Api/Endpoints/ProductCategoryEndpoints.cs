using Microsoft.EntityFrameworkCore;
using PhoneStore.Domain.Catalog;
using PhoneStore.Infrastructure.Persistence;

namespace PhoneStore.Api.Endpoints;

public static class ProductCategoryEndpoints
{
    public static IEndpointRouteBuilder MapProductCategoryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/product-categories")
            .WithTags("Product Categories");

        group.MapGet("/", async (PhoneStoreDbContext dbContext) =>
        {
            var categories = await dbContext.ProductCategories
                .OrderBy(category => category.Name)
                .Select(category => new ProductCategoryResponse(
                    category.Id,
                    category.Code,
                    category.Name,
                    category.Description,
                    category.IsActive,
                    category.CreatedAt,
                    category.UpdatedAt
                ))
                .ToListAsync();

            return Results.Ok(categories);
        })
        .WithName("GetProductCategories");

        group.MapGet("/{id:guid}", async (
            Guid id,
            PhoneStoreDbContext dbContext) =>
        {
            var category = await dbContext.ProductCategories
                .Where(category => category.Id == id)
                .Select(category => new ProductCategoryResponse(
                    category.Id,
                    category.Code,
                    category.Name,
                    category.Description,
                    category.IsActive,
                    category.CreatedAt,
                    category.UpdatedAt
                ))
                .FirstOrDefaultAsync();

            if (category is null)
            {
                return Results.NotFound(new
                {
                    message = "Categoría no encontrada."
                });
            }

            return Results.Ok(category);
        })
        .WithName("GetProductCategoryById");

        group.MapPost("/", async (
            CreateProductCategoryRequest request,
            PhoneStoreDbContext dbContext) =>
        {
            var normalizedCode = request.Code.Trim().ToUpperInvariant();

            var codeExists = await dbContext.ProductCategories
                .AnyAsync(category => category.Code == normalizedCode);

            if (codeExists)
            {
                return Results.BadRequest(new
                {
                    message = "Ya existe una categoría con ese código."
                });
            }

            var category = new ProductCategory
            {
                Id = Guid.NewGuid(),
                Code = normalizedCode,
                Name = request.Name.Trim(),
                Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow
            };

            dbContext.ProductCategories.Add(category);
            await dbContext.SaveChangesAsync();

            var response = new ProductCategoryResponse(
                category.Id,
                category.Code,
                category.Name,
                category.Description,
                category.IsActive,
                category.CreatedAt,
                category.UpdatedAt
            );

            return Results.Created($"/api/product-categories/{category.Id}", response);
        })
        .WithName("CreateProductCategory");

        group.MapPut("/{id:guid}", async (
            Guid id,
            UpdateProductCategoryRequest request,
            PhoneStoreDbContext dbContext) =>
        {
            var category = await dbContext.ProductCategories
                .FirstOrDefaultAsync(category => category.Id == id);

            if (category is null)
            {
                return Results.NotFound(new
                {
                    message = "Categoría no encontrada."
                });
            }

            var normalizedCode = request.Code.Trim().ToUpperInvariant();

            var codeExists = await dbContext.ProductCategories
                .AnyAsync(existingCategory =>
                    existingCategory.Id != id &&
                    existingCategory.Code == normalizedCode);

            if (codeExists)
            {
                return Results.BadRequest(new
                {
                    message = "Ya existe otra categoría con ese código."
                });
            }

            category.Code = normalizedCode;
            category.Name = request.Name.Trim();
            category.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
            category.IsActive = request.IsActive;
            category.UpdatedAt = DateTimeOffset.UtcNow;

            await dbContext.SaveChangesAsync();

            var response = new ProductCategoryResponse(
                category.Id,
                category.Code,
                category.Name,
                category.Description,
                category.IsActive,
                category.CreatedAt,
                category.UpdatedAt
            );

            return Results.Ok(response);
        })
        .WithName("UpdateProductCategory");

        group.MapDelete("/{id:guid}", async (
            Guid id,
            PhoneStoreDbContext dbContext) =>
        {
            var category = await dbContext.ProductCategories
                .FirstOrDefaultAsync(category => category.Id == id);

            if (category is null)
            {
                return Results.NotFound(new
                {
                    message = "Categoría no encontrada."
                });
            }

            category.IsActive = false;
            category.UpdatedAt = DateTimeOffset.UtcNow;

            await dbContext.SaveChangesAsync();

            return Results.Ok(new
            {
                message = "Categoría desactivada correctamente.",
                category.Id,
                category.Code,
                category.Name,
                category.IsActive,
                category.UpdatedAt
            });
        })
        .WithName("DeactivateProductCategory");

        return app;
    }
}

public sealed record CreateProductCategoryRequest(
    string Code,
    string Name,
    string? Description
);

public sealed record UpdateProductCategoryRequest(
    string Code,
    string Name,
    string? Description,
    bool IsActive
);

public sealed record ProductCategoryResponse(
    Guid Id,
    string Code,
    string Name,
    string? Description,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt
);
