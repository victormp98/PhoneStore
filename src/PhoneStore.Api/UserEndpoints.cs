using Microsoft.EntityFrameworkCore;
using PhoneStore.Api.Security;
using PhoneStore.Domain.Auth;
using PhoneStore.Infrastructure.Persistence;

namespace PhoneStore.Api.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/users")
            .WithTags("Users");

        group.MapGet("/", async (PhoneStoreDbContext dbContext) =>
        {
            var users = await dbContext.Users
                .OrderBy(user => user.Name)
                .Select(user => new UserResponse(
                    user.Id,
                    user.Name,
                    user.Email,
                    user.Phone,
                    user.Status,
                    user.CreatedAt,
                    user.UpdatedAt,
                    new List<string>()
                ))
                .ToListAsync();

            foreach (var user in users)
            {
                var roles = await dbContext.UserRoles
                    .Where(userRole => userRole.UserId == user.Id)
                    .Join(
                        dbContext.Roles,
                        userRole => userRole.RoleId,
                        role => role.Id,
                        (userRole, role) => role.Name
                    )
                    .Distinct()
                    .OrderBy(roleName => roleName)
                    .ToListAsync();

                user.RoleNames.AddRange(roles);
            }

            return Results.Ok(users);
        })
        .WithName("GetUsers")
        .RequireAuthorization(PermissionConstants.UsersRead);

        group.MapGet("/{id:guid}", async (
            Guid id,
            PhoneStoreDbContext dbContext) =>
        {
            var user = await dbContext.Users
                .FirstOrDefaultAsync(user => user.Id == id);

            if (user is null)
            {
                return Results.NotFound(new
                {
                    message = "Usuario no encontrado."
                });
            }

            var roles = await dbContext.UserRoles
                .Where(userRole => userRole.UserId == user.Id)
                .Join(
                    dbContext.Roles,
                    userRole => userRole.RoleId,
                    role => role.Id,
                    (userRole, role) => role.Name
                )
                .Distinct()
                .OrderBy(roleName => roleName)
                .ToListAsync();

            return Results.Ok(new UserResponse(
                user.Id,
                user.Name,
                user.Email,
                user.Phone,
                user.Status,
                user.CreatedAt,
                user.UpdatedAt,
                roles
            ));
        })
        .WithName("GetUserById")
        .RequireAuthorization(PermissionConstants.UsersRead);

        group.MapPost("/", async (
            CreateUserRequest request,
            PhoneStoreDbContext dbContext) =>
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return Results.BadRequest(new
                {
                    message = "El nombre del usuario es obligatorio."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return Results.BadRequest(new
                {
                    message = "El email del usuario es obligatorio."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
            {
                return Results.BadRequest(new
                {
                    message = "La contraseña debe tener al menos 8 caracteres."
                });
            }

            if (request.RoleNames is null || request.RoleNames.Count == 0)
            {
                return Results.BadRequest(new
                {
                    message = "El usuario debe tener al menos un rol."
                });
            }

            var email = request.Email.Trim().ToLowerInvariant();

            var emailExists = await dbContext.Users
                .AnyAsync(user => user.Email == email);

            if (emailExists)
            {
                return Results.BadRequest(new
                {
                    message = "Ya existe un usuario con ese email."
                });
            }

            var requestedRoleNames = request.RoleNames
                .Select(roleName => roleName.Trim().ToUpperInvariant())
                .Where(roleName => !string.IsNullOrWhiteSpace(roleName))
                .Distinct()
                .ToList();

            var roles = await dbContext.Roles
                .Where(role => requestedRoleNames.Contains(role.Name))
                .ToListAsync();

            if (roles.Count != requestedRoleNames.Count)
            {
                var foundRoleNames = roles.Select(role => role.Name).ToList();

                var missingRoleNames = requestedRoleNames
                    .Where(roleName => !foundRoleNames.Contains(roleName))
                    .ToList();

                return Results.BadRequest(new
                {
                    message = "Uno o más roles no existen.",
                    missingRoles = missingRoleNames
                });
            }

            await using var transaction = await dbContext.Database.BeginTransactionAsync();

            try
            {
                var now = DateTimeOffset.UtcNow;
                var userId = Guid.NewGuid();

                var user = new User
                {
                    Id = userId,
                    Name = request.Name.Trim(),
                    Email = email,
                    Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                    Status = "ACTIVE",
                    CreatedAt = now,
                    UpdatedAt = null
                };

                var userRoles = roles.Select(role => new UserRole
                {
                    UserId = userId,
                    RoleId = role.Id,
                    CreatedAt = now
                }).ToList();

                dbContext.Users.Add(user);
                dbContext.UserRoles.AddRange(userRoles);

                await dbContext.SaveChangesAsync();
                await transaction.CommitAsync();

                return Results.Created($"/api/users/{user.Id}", new UserResponse(
                    user.Id,
                    user.Name,
                    user.Email,
                    user.Phone,
                    user.Status,
                    user.CreatedAt,
                    user.UpdatedAt,
                    roles.Select(role => role.Name).Distinct().OrderBy(roleName => roleName).ToList()
                ));
            }
            catch
            {
                await transaction.RollbackAsync();

                return Results.Problem(
                    title: "Error al crear usuario.",
                    detail: "La creación fue revertida. No se guardaron cambios parciales.");
            }
        })
        .WithName("CreateUser")
        .RequireAuthorization(PermissionConstants.UsersCreate);

        group.MapPut("/{id:guid}", async (
            Guid id,
            UpdateUserRequest request,
            PhoneStoreDbContext dbContext) =>
        {
            var user = await dbContext.Users
                .FirstOrDefaultAsync(user => user.Id == id);

            if (user is null)
            {
                return Results.NotFound(new
                {
                    message = "Usuario no encontrado."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return Results.BadRequest(new
                {
                    message = "El nombre del usuario es obligatorio."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Phone))
            {
                user.Phone = null;
            }
            else
            {
                user.Phone = request.Phone.Trim();
            }

            user.Name = request.Name.Trim();
            user.UpdatedAt = DateTimeOffset.UtcNow;

            await dbContext.SaveChangesAsync();

            return Results.Ok(new
            {
                message = "Usuario actualizado correctamente.",
                user.Id,
                user.Name,
                user.Phone,
                user.UpdatedAt
            });
        })
        .WithName("UpdateUser")
        .RequireAuthorization(PermissionConstants.UsersUpdate);

        group.MapDelete("/{id:guid}", async (
            Guid id,
            PhoneStoreDbContext dbContext) =>
        {
            var user = await dbContext.Users
                .FirstOrDefaultAsync(user => user.Id == id);

            if (user is null)
            {
                return Results.NotFound(new
                {
                    message = "Usuario no encontrado."
                });
            }

            if (user.Status == "INACTIVE")
            {
                return Results.BadRequest(new
                {
                    message = "El usuario ya está inactivo."
                });
            }

            user.Status = "INACTIVE";
            user.UpdatedAt = DateTimeOffset.UtcNow;

            await dbContext.SaveChangesAsync();

            return Results.Ok(new
            {
                message = "Usuario desactivado correctamente.",
                user.Id,
                user.Status,
                user.UpdatedAt
            });
        })
        .WithName("DeactivateUser")
        .RequireAuthorization(PermissionConstants.UsersDelete);

        return app;
    }
}

public sealed record CreateUserRequest(
    string Name,
    string Email,
    string? Phone,
    string Password,
    List<string> RoleNames
);

public sealed record UpdateUserRequest(
    string Name,
    string? Phone
);

public sealed record UserResponse(
    Guid Id,
    string Name,
    string Email,
    string? Phone,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    List<string> RoleNames
);