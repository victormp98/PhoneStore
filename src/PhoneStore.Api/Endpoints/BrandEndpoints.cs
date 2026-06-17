using Microsoft.EntityFrameworkCore;
using PhoneStore.Api.Security;
using PhoneStore.Domain.Catalog;
using PhoneStore.Infrastructure.Persistence;

namespace PhoneStore.Api.Endpoints;

public static class BrandEndpoints
{
    public static IEndpointRouteBuilder MapBrandEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/brands")
            .WithTags("Brands");

        group.MapGet("/", async (PhoneStoreDbContext dbContext) =>
        {
            var brands = await dbContext.Brands
                .OrderBy(brand => brand.Name)
                .Select(brand => new BrandResponse(
                    brand.Id,
                    brand.Code,
                    brand.Name,
                    brand.Description,
                    brand.IsActive,
                    brand.CreatedAt,
                    brand.UpdatedAt
                ))
                .ToListAsync();

            return Results.Ok(brands);
        })
        .WithName("GetBrands")
        .RequireAuthorization(PermissionConstants.CatalogRead);

        group.MapGet("/{id:guid}", async (
            Guid id,
            PhoneStoreDbContext dbContext) =>
        {
            var brand = await dbContext.Brands
                .Where(brand => brand.Id == id)
                .Select(brand => new BrandResponse(
                    brand.Id,
                    brand.Code,
                    brand.Name,
                    brand.Description,
                    brand.IsActive,
                    brand.CreatedAt,
                    brand.UpdatedAt
                ))
                .FirstOrDefaultAsync();

            if (brand is null)
            {
                return Results.NotFound(new
                {
                    message = "Marca no encontrada."
                });
            }

            return Results.Ok(brand);
        })
        .WithName("GetBrandById")
        .RequireAuthorization(PermissionConstants.CatalogRead);

        group.MapPost("/", async (
            CreateBrandRequest request,
            PhoneStoreDbContext dbContext) =>
        {
            var normalizedCode = request.Code.Trim().ToUpperInvariant();

            var codeExists = await dbContext.Brands
                .AnyAsync(brand => brand.Code == normalizedCode);

            if (codeExists)
            {
                return Results.BadRequest(new
                {
                    message = "Ya existe una marca con ese código."
                });
            }

            var brand = new Brand
            {
                Id = Guid.NewGuid(),
                Code = normalizedCode,
                Name = request.Name.Trim(),
                Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow
            };

            dbContext.Brands.Add(brand);
            await dbContext.SaveChangesAsync();

            var response = new BrandResponse(
                brand.Id,
                brand.Code,
                brand.Name,
                brand.Description,
                brand.IsActive,
                brand.CreatedAt,
                brand.UpdatedAt
            );

            return Results.Created($"/api/brands/{brand.Id}", response);
        })
        .WithName("CreateBrand")
        .RequireAuthorization(PermissionConstants.CatalogCreate);

        group.MapPut("/{id:guid}", async (
            Guid id,
            UpdateBrandRequest request,
            PhoneStoreDbContext dbContext) =>
        {
            var brand = await dbContext.Brands
                .FirstOrDefaultAsync(brand => brand.Id == id);

            if (brand is null)
            {
                return Results.NotFound(new
                {
                    message = "Marca no encontrada."
                });
            }

            var normalizedCode = request.Code.Trim().ToUpperInvariant();

            var codeExists = await dbContext.Brands
                .AnyAsync(existingBrand =>
                    existingBrand.Id != id &&
                    existingBrand.Code == normalizedCode);

            if (codeExists)
            {
                return Results.BadRequest(new
                {
                    message = "Ya existe otra marca con ese código."
                });
            }

            brand.Code = normalizedCode;
            brand.Name = request.Name.Trim();
            brand.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
            brand.IsActive = request.IsActive;
            brand.UpdatedAt = DateTimeOffset.UtcNow;

            await dbContext.SaveChangesAsync();

            var response = new BrandResponse(
                brand.Id,
                brand.Code,
                brand.Name,
                brand.Description,
                brand.IsActive,
                brand.CreatedAt,
                brand.UpdatedAt
            );

            return Results.Ok(response);
        })
        .WithName("UpdateBrand")
        .RequireAuthorization(PermissionConstants.CatalogUpdate);

        group.MapDelete("/{id:guid}", async (
            Guid id,
            PhoneStoreDbContext dbContext) =>
        {
            var brand = await dbContext.Brands
                .FirstOrDefaultAsync(brand => brand.Id == id);

            if (brand is null)
            {
                return Results.NotFound(new
                {
                    message = "Marca no encontrada."
                });
            }

            brand.IsActive = false;
            brand.UpdatedAt = DateTimeOffset.UtcNow;

            await dbContext.SaveChangesAsync();

            return Results.Ok(new
            {
                message = "Marca desactivada correctamente.",
                brand.Id,
                brand.Code,
                brand.Name,
                brand.IsActive,
                brand.UpdatedAt
            });
        })
        .WithName("DeactivateBrand")
        .RequireAuthorization(PermissionConstants.CatalogDelete);

        return app;
    }
}

public sealed record CreateBrandRequest(
    string Code,
    string Name,
    string? Description
);

public sealed record UpdateBrandRequest(
    string Code,
    string Name,
    string? Description,
    bool IsActive
);

public sealed record BrandResponse(
    Guid Id,
    string Code,
    string Name,
    string? Description,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt
);
