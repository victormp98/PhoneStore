using Microsoft.EntityFrameworkCore;
using PhoneStore.Api.Security;
using PhoneStore.Domain.Branches;
using PhoneStore.Infrastructure.Persistence;

namespace PhoneStore.Api.Endpoints;

public static class BranchEndpoints
{
    public static IEndpointRouteBuilder MapBranchEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/branches")
            .WithTags("Branches");

        group.MapGet("/", async (PhoneStoreDbContext dbContext) =>
        {
            var branches = await dbContext.Branches
                .OrderBy(branch => branch.Name)
                .Select(branch => new BranchResponse(
                    branch.Id,
                    branch.Code,
                    branch.Name,
                    branch.Phone,
                    branch.Address,
                    branch.IsActive,
                    branch.CreatedAt,
                    branch.UpdatedAt
                ))
                .ToListAsync();

            return Results.Ok(branches);
        })
        .WithName("GetBranches")
        .RequireAuthorization(PermissionConstants.BranchesRead);

        group.MapGet("/{id:guid}", async (
            Guid id,
            PhoneStoreDbContext dbContext) =>
        {
            var branch = await dbContext.Branches
                .Where(branch => branch.Id == id)
                .Select(branch => new BranchResponse(
                    branch.Id,
                    branch.Code,
                    branch.Name,
                    branch.Phone,
                    branch.Address,
                    branch.IsActive,
                    branch.CreatedAt,
                    branch.UpdatedAt
                ))
                .FirstOrDefaultAsync();

            if (branch is null)
            {
                return Results.NotFound(new
                {
                    message = "Sucursal no encontrada."
                });
            }

            return Results.Ok(branch);
        })
        .WithName("GetBranchById")
        .RequireAuthorization(PermissionConstants.BranchesRead);

        group.MapPost("/", async (
            CreateBranchRequest request,
            PhoneStoreDbContext dbContext) =>
        {
            var normalizedCode = request.Code.Trim().ToUpperInvariant();

            var codeExists = await dbContext.Branches
                .AnyAsync(branch => branch.Code == normalizedCode);

            if (codeExists)
            {
                return Results.BadRequest(new
                {
                    message = "Ya existe una sucursal con ese código."
                });
            }

            var branch = new Branch
            {
                Id = Guid.NewGuid(),
                Code = normalizedCode,
                Name = request.Name.Trim(),
                Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
                Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim(),
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow
            };

            dbContext.Branches.Add(branch);
            await dbContext.SaveChangesAsync();

            var response = new BranchResponse(
                branch.Id,
                branch.Code,
                branch.Name,
                branch.Phone,
                branch.Address,
                branch.IsActive,
                branch.CreatedAt,
                branch.UpdatedAt
            );

            return Results.Created($"/api/branches/{branch.Id}", response);
        })
        .WithName("CreateBranch")
        .RequireAuthorization(PermissionConstants.BranchesCreate);

        group.MapPut("/{id:guid}", async (
            Guid id,
            UpdateBranchRequest request,
            PhoneStoreDbContext dbContext) =>
        {
            var branch = await dbContext.Branches
                .FirstOrDefaultAsync(branch => branch.Id == id);

            if (branch is null)
            {
                return Results.NotFound(new
                {
                    message = "Sucursal no encontrada."
                });
            }

            var normalizedCode = request.Code.Trim().ToUpperInvariant();

            var codeExists = await dbContext.Branches
                .AnyAsync(existingBranch =>
                    existingBranch.Id != id &&
                    existingBranch.Code == normalizedCode);

            if (codeExists)
            {
                return Results.BadRequest(new
                {
                    message = "Ya existe otra sucursal con ese código."
                });
            }

            branch.Code = normalizedCode;
            branch.Name = request.Name.Trim();
            branch.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
            branch.Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim();
            branch.IsActive = request.IsActive;
            branch.UpdatedAt = DateTimeOffset.UtcNow;

            await dbContext.SaveChangesAsync();

            var response = new BranchResponse(
                branch.Id,
                branch.Code,
                branch.Name,
                branch.Phone,
                branch.Address,
                branch.IsActive,
                branch.CreatedAt,
                branch.UpdatedAt
            );

            return Results.Ok(response);
        })
        .WithName("UpdateBranch")
        .RequireAuthorization(PermissionConstants.BranchesUpdate);

        group.MapDelete("/{id:guid}", async (
            Guid id,
            PhoneStoreDbContext dbContext) =>
        {
            var branch = await dbContext.Branches
                .FirstOrDefaultAsync(branch => branch.Id == id);

            if (branch is null)
            {
                return Results.NotFound(new
                {
                    message = "Sucursal no encontrada."
                });
            }

            branch.IsActive = false;
            branch.UpdatedAt = DateTimeOffset.UtcNow;

            await dbContext.SaveChangesAsync();

            return Results.Ok(new
            {
                message = "Sucursal desactivada correctamente.",
                branch.Id,
                branch.Code,
                branch.Name,
                branch.IsActive,
                branch.UpdatedAt
            });
        })
        .WithName("DeactivateBranch")
        .RequireAuthorization(PermissionConstants.BranchesDelete);

        return app;
    }
}

public sealed record CreateBranchRequest(
    string Code,
    string Name,
    string? Phone,
    string? Address
);

public sealed record UpdateBranchRequest(
    string Code,
    string Name,
    string? Phone,
    string? Address,
    bool IsActive
);

public sealed record BranchResponse(
    Guid Id,
    string Code,
    string Name,
    string? Phone,
    string? Address,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt
);
