using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
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
            PhoneStoreDbContext dbContext,
            IConfiguration configuration) =>
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
                .Distinct()
                .OrderBy(roleName => roleName)
                .ToListAsync();

            var token = CreateAccessToken(
                user.Id,
                user.Name,
                user.Email,
                roles,
                configuration
            );

            return Results.Ok(new LoginResponse(
                user.Id,
                user.Name,
                user.Email,
                user.Phone,
                user.Status,
                roles,
                token.AccessToken,
                token.ExpiresAt
            ));
        })
        .WithName("Login");

        group.MapGet("/me", [Authorize] (ClaimsPrincipal user) =>
        {
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var name = user.FindFirst(ClaimTypes.Name)?.Value;
            var email = user.FindFirst(ClaimTypes.Email)?.Value;

            var roles = user.FindAll(ClaimTypes.Role)
                .Select(role => role.Value)
                .Distinct()
                .OrderBy(role => role)
                .ToList();

            return Results.Ok(new
            {
                id = userId,
                name,
                email,
                roles
            });
        })
        .WithName("GetCurrentUser");

        return app;
    }

    private static AccessTokenResult CreateAccessToken(
        Guid userId,
        string name,
        string email,
        List<string> roles,
        IConfiguration configuration)
    {
        var issuer = configuration["Jwt:Issuer"];
        var audience = configuration["Jwt:Audience"];
        var secretKey = configuration["Jwt:SecretKey"];
        var accessTokenMinutesText = configuration["Jwt:AccessTokenMinutes"];

        if (string.IsNullOrWhiteSpace(issuer) ||
            string.IsNullOrWhiteSpace(audience) ||
            string.IsNullOrWhiteSpace(secretKey))
        {
            throw new InvalidOperationException("La configuración JWT está incompleta.");
        }

        var accessTokenMinutes = int.TryParse(accessTokenMinutesText, out var minutes)
            ? minutes
            : 60;

        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(accessTokenMinutes);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Name, name),
            new(ClaimTypes.Email, email)
        };

        foreach (var role in roles.Distinct())
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var signingKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(secretKey)
        );

        var signingCredentials = new SigningCredentials(
            signingKey,
            SecurityAlgorithms.HmacSha256
        );

        var jwtToken = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expiresAt.UtcDateTime,
            signingCredentials: signingCredentials
        );

        var accessToken = new JwtSecurityTokenHandler()
            .WriteToken(jwtToken);

        return new AccessTokenResult(
            accessToken,
            expiresAt
        );
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
    List<string> RoleNames,
    string AccessToken,
    DateTimeOffset ExpiresAt
);

public sealed record AccessTokenResult(
    string AccessToken,
    DateTimeOffset ExpiresAt
);