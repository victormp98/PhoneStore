using Microsoft.EntityFrameworkCore;
using PhoneStore.Domain.Auth;
using PhoneStore.Infrastructure.Persistence;

namespace PhoneStore.Api.Endpoints;

public static class RoleEndpoints
{
    public static IEndpointRouteBuilder MapRoleEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/roles")
            .WithTags("Roles");

        group.MapGet("/", async (PhoneStoreDbContext dbContext) =>
        {
            var roles = await dbContext.Roles
                .OrderBy(role => role.Name)
                .Select(role => new RoleResponse(
                    role.Id,
                    role.Name,
                    role.Description,
                    role.CreatedAt,
                    role.UpdatedAt
                ))
                .ToListAsync();

            return Results.Ok(roles);
        })
        .WithName("GetRoles");

        group.MapPost("/", async (
            CreateRoleRequest request,
            PhoneStoreDbContext dbContext) =>
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return Results.BadRequest(new
                {
                    message = "El nombre del rol es obligatorio."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Description))
            {
                return Results.BadRequest(new
                {
                    message = "La descripción del rol es obligatoria."
                });
            }

            var name = request.Name.Trim().ToUpperInvariant();

            var roleExists = await dbContext.Roles
                .AnyAsync(role => role.Name == name);

            if (roleExists)
            {
                return Results.BadRequest(new
                {
                    message = "Ya existe un rol con ese nombre."
                });
            }

            var now = DateTimeOffset.UtcNow;

            var role = new Role
            {
                Id = Guid.NewGuid(),
                Name = name,
                Description = request.Description.Trim(),
                CreatedAt = now
            };

            dbContext.Roles.Add(role);

            await dbContext.SaveChangesAsync();

            return Results.Created($"/api/roles/{role.Id}", new RoleResponse(
                role.Id,
                role.Name,
                role.Description,
                role.CreatedAt,
                role.UpdatedAt
            ));
        })
        .WithName("CreateRole");

        return app;
    }
}

public sealed record CreateRoleRequest(
    string Name,
    string Description
);

public sealed record RoleResponse(
    Guid Id,
    string Name,
    string Description,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt
);