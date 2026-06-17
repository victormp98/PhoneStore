using Microsoft.EntityFrameworkCore;
using PhoneStore.Domain.Catalog;
using PhoneStore.Infrastructure.Persistence;

namespace PhoneStore.Api.Endpoints;

public static class ProductEndpoints
{
    public static IEndpointRouteBuilder MapProductEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/products")
            .WithTags("Products");

        group.MapGet("/", async (PhoneStoreDbContext dbContext) =>
        {
            var products = await dbContext.Products
                .OrderBy(product => product.Name)
                .Select(product => new ProductResponse(
                    product.Id,
                    product.CategoryId,
                    product.BrandId,
                    product.Sku,
                    product.Name,
                    product.Description,
                    product.CostPrice,
                    product.SalePrice,
                    product.IsActive,
                    product.CreatedAt,
                    product.UpdatedAt
                ))
                .ToListAsync();

            return Results.Ok(products);
        })
        .WithName("GetProducts");

        group.MapGet("/{id:guid}", async (
            Guid id,
            PhoneStoreDbContext dbContext) =>
        {
            var product = await dbContext.Products
                .Where(product => product.Id == id)
                .Select(product => new ProductResponse(
                    product.Id,
                    product.CategoryId,
                    product.BrandId,
                    product.Sku,
                    product.Name,
                    product.Description,
                    product.CostPrice,
                    product.SalePrice,
                    product.IsActive,
                    product.CreatedAt,
                    product.UpdatedAt
                ))
                .FirstOrDefaultAsync();

            if (product is null)
            {
                return Results.NotFound(new
                {
                    message = "Producto no encontrado."
                });
            }

            return Results.Ok(product);
        })
        .WithName("GetProductById");

        group.MapPost("/", async (
            CreateProductRequest request,
            PhoneStoreDbContext dbContext) =>
        {
            var categoryExists = await dbContext.ProductCategories
                .AnyAsync(category => category.Id == request.CategoryId && category.IsActive);

            if (!categoryExists)
            {
                return Results.BadRequest(new
                {
                    message = "La categoría no existe o está inactiva."
                });
            }

            var brandExists = await dbContext.Brands
                .AnyAsync(brand => brand.Id == request.BrandId && brand.IsActive);

            if (!brandExists)
            {
                return Results.BadRequest(new
                {
                    message = "La marca no existe o está inactiva."
                });
            }

            var normalizedSku = request.Sku.Trim().ToUpperInvariant();

            var skuExists = await dbContext.Products
                .AnyAsync(product => product.Sku == normalizedSku);

            if (skuExists)
            {
                return Results.BadRequest(new
                {
                    message = "Ya existe un producto con ese SKU."
                });
            }

            if (request.CostPrice < 0 || request.SalePrice < 0)
            {
                return Results.BadRequest(new
                {
                    message = "Los precios no pueden ser negativos."
                });
            }

            var product = new Product
            {
                Id = Guid.NewGuid(),
                CategoryId = request.CategoryId,
                BrandId = request.BrandId,
                Sku = normalizedSku,
                Name = request.Name.Trim(),
                Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
                CostPrice = request.CostPrice,
                SalePrice = request.SalePrice,
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow
            };

            dbContext.Products.Add(product);
            await dbContext.SaveChangesAsync();

            var response = new ProductResponse(
                product.Id,
                product.CategoryId,
                product.BrandId,
                product.Sku,
                product.Name,
                product.Description,
                product.CostPrice,
                product.SalePrice,
                product.IsActive,
                product.CreatedAt,
                product.UpdatedAt
            );

            return Results.Created($"/api/products/{product.Id}", response);
        })
        .WithName("CreateProduct");

        group.MapPut("/{id:guid}", async (
            Guid id,
            UpdateProductRequest request,
            PhoneStoreDbContext dbContext) =>
        {
            var product = await dbContext.Products
                .FirstOrDefaultAsync(product => product.Id == id);

            if (product is null)
            {
                return Results.NotFound(new
                {
                    message = "Producto no encontrado."
                });
            }

            var categoryExists = await dbContext.ProductCategories
                .AnyAsync(category => category.Id == request.CategoryId && category.IsActive);

            if (!categoryExists)
            {
                return Results.BadRequest(new
                {
                    message = "La categoría no existe o está inactiva."
                });
            }

            var brandExists = await dbContext.Brands
                .AnyAsync(brand => brand.Id == request.BrandId && brand.IsActive);

            if (!brandExists)
            {
                return Results.BadRequest(new
                {
                    message = "La marca no existe o está inactiva."
                });
            }

            var normalizedSku = request.Sku.Trim().ToUpperInvariant();

            var skuExists = await dbContext.Products
                .AnyAsync(existingProduct =>
                    existingProduct.Id != id &&
                    existingProduct.Sku == normalizedSku);

            if (skuExists)
            {
                return Results.BadRequest(new
                {
                    message = "Ya existe otro producto con ese SKU."
                });
            }

            if (request.CostPrice < 0 || request.SalePrice < 0)
            {
                return Results.BadRequest(new
                {
                    message = "Los precios no pueden ser negativos."
                });
            }

            product.CategoryId = request.CategoryId;
            product.BrandId = request.BrandId;
            product.Sku = normalizedSku;
            product.Name = request.Name.Trim();
            product.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
            product.CostPrice = request.CostPrice;
            product.SalePrice = request.SalePrice;
            product.IsActive = request.IsActive;
            product.UpdatedAt = DateTimeOffset.UtcNow;

            await dbContext.SaveChangesAsync();

            var response = new ProductResponse(
                product.Id,
                product.CategoryId,
                product.BrandId,
                product.Sku,
                product.Name,
                product.Description,
                product.CostPrice,
                product.SalePrice,
                product.IsActive,
                product.CreatedAt,
                product.UpdatedAt
            );

            return Results.Ok(response);
        })
        .WithName("UpdateProduct");

        group.MapDelete("/{id:guid}", async (
            Guid id,
            PhoneStoreDbContext dbContext) =>
        {
            var product = await dbContext.Products
                .FirstOrDefaultAsync(product => product.Id == id);

            if (product is null)
            {
                return Results.NotFound(new
                {
                    message = "Producto no encontrado."
                });
            }

            product.IsActive = false;
            product.UpdatedAt = DateTimeOffset.UtcNow;

            await dbContext.SaveChangesAsync();

            return Results.Ok(new
            {
                message = "Producto desactivado correctamente.",
                product.Id,
                product.Sku,
                product.Name,
                product.IsActive,
                product.UpdatedAt
            });
        })
        .WithName("DeactivateProduct");

        return app;
    }
}

public sealed record CreateProductRequest(
    Guid CategoryId,
    Guid BrandId,
    string Sku,
    string Name,
    string? Description,
    decimal CostPrice,
    decimal SalePrice
);

public sealed record UpdateProductRequest(
    Guid CategoryId,
    Guid BrandId,
    string Sku,
    string Name,
    string? Description,
    decimal CostPrice,
    decimal SalePrice,
    bool IsActive
);

public sealed record ProductResponse(
    Guid Id,
    Guid CategoryId,
    Guid BrandId,
    string Sku,
    string Name,
    string? Description,
    decimal CostPrice,
    decimal SalePrice,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt
);
