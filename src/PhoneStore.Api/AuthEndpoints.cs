using Microsoft.EntityFrameworkCore;
using PhoneStore.Infrastructure.Persistence;

namespace PhoneStore.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth")
            .WithTags("Auth");

        group.MapPost("/login", async (
            LoginRequest request,
            PhoneStoreDbContext dbContext) =>
        {
            if (string.IsNullOrWhiteSpace(request.Email))
            {
                return Results.BadRequest(new
                {
                    message = "El email es obligatorio."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return Results.BadRequest(new
                {
                    message = "La contraseña es obligatoria."
                });
            }

            var email = request.Email.Trim().ToLowerInvariant();

            var user = await dbContext.Users
                .FirstOrDefaultAsync(user => user.Email == email);

            if (user is null)
            {
                return Results.BadRequest(new
                {
                    message = "Credenciales inválidas."
                });
            }

            if (user.Status != "ACTIVE")
            {
                return Results.BadRequest(new
                {
                    message = "El usuario no está activo."
                });
            }

            var passwordIsValid = BCrypt.Net.BCrypt.Verify(
                request.Password,
                user.PasswordHash
            );

            if (!passwordIsValid)
            {
                return Results.BadRequest(new
                {
                    message = "Credenciales inválidas."
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
                .OrderBy(roleName => roleName)
                .ToListAsync();

            var response = new LoginResponse(
                user.Id,
                user.Name,
                user.Email,
                user.Phone,
                user.Status,
                roles
            );

            return Results.Ok(response);
        })
        .WithName("Login");

        return app;
    }
}

public sealed record LoginRequest(
    string Email,
    string Password
);

public sealed record LoginResponse(
    Guid Id,
    string Name,
    string Email,
    string? Phone,
    string Status,
    List<string> RoleNames
);