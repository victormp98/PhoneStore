using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PhoneStore.Domain.Auth;
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
                return Results.BadRequest(new { message = "El email es obligatorio." });
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return Results.BadRequest(new { message = "La contraseña es obligatoria." });
            }

            var email = request.Email.Trim().ToLowerInvariant();

            var user = await dbContext.Users
                .FirstOrDefaultAsync(user => user.Email == email);

            if (user is null)
            {
                return Results.BadRequest(new { message = "Credenciales inválidas." });
            }

            if (user.Status != "ACTIVE")
            {
                return Results.BadRequest(new { message = "El usuario no está activo." });
            }

            var passwordIsValid = BCrypt.Net.BCrypt.Verify(
                request.Password,
                user.PasswordHash
            );

            if (!passwordIsValid)
            {
                return Results.BadRequest(new { message = "Credenciales inválidas." });
            }

            var roles = await GetUserRolesAsync(dbContext, user.Id);

            var accessToken = CreateAccessToken(
                user.Id,
                user.Name,
                user.Email,
                roles,
                configuration
            );

            var refreshToken = CreateRefreshToken(
                user.Id,
                configuration
            );

            dbContext.RefreshTokens.Add(refreshToken.Entity);

            await dbContext.SaveChangesAsync();

            return Results.Ok(new LoginResponse(
                user.Id,
                user.Name,
                user.Email,
                user.Phone,
                user.Status,
                roles,
                accessToken.AccessToken,
                accessToken.ExpiresAt,
                refreshToken.PlainToken,
                refreshToken.ExpiresAt
            ));
        })
        .WithName("Login");

        group.MapPost("/refresh", async (
            RefreshTokenRequest request,
            PhoneStoreDbContext dbContext,
            IConfiguration configuration) =>
        {
            if (string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                return Results.BadRequest(new { message = "El refresh token es obligatorio." });
            }

            var refreshTokenHash = HashToken(request.RefreshToken);

            var storedRefreshToken = await dbContext.RefreshTokens
                .FirstOrDefaultAsync(token => token.TokenHash == refreshTokenHash);

            if (storedRefreshToken is null)
            {
                return Results.BadRequest(new { message = "Refresh token inválido." });
            }

            if (storedRefreshToken.RevokedAt is not null)
            {
                return Results.BadRequest(new { message = "Refresh token revocado." });
            }

            if (storedRefreshToken.ExpiresAt <= DateTimeOffset.UtcNow)
            {
                return Results.BadRequest(new { message = "Refresh token expirado." });
            }

            var user = await dbContext.Users
                .FirstOrDefaultAsync(user => user.Id == storedRefreshToken.UserId);

            if (user is null)
            {
                return Results.BadRequest(new { message = "Usuario no encontrado." });
            }

            if (user.Status != "ACTIVE")
            {
                return Results.BadRequest(new { message = "El usuario no está activo." });
            }

            var roles = await GetUserRolesAsync(dbContext, user.Id);

            var accessToken = CreateAccessToken(
                user.Id,
                user.Name,
                user.Email,
                roles,
                configuration
            );

            storedRefreshToken.RevokedAt = DateTimeOffset.UtcNow;

            var newRefreshToken = CreateRefreshToken(
                user.Id,
                configuration
            );

            dbContext.RefreshTokens.Add(newRefreshToken.Entity);

            await dbContext.SaveChangesAsync();

            return Results.Ok(new RefreshTokenResponse(
                accessToken.AccessToken,
                accessToken.ExpiresAt,
                newRefreshToken.PlainToken,
                newRefreshToken.ExpiresAt
            ));
        })
        .WithName("RefreshToken");

        group.MapPost("/logout", async (
            RefreshTokenRequest request,
            PhoneStoreDbContext dbContext) =>
        {
            if (string.IsNullOrWhiteSpace(request.RefreshToken))
            {
                return Results.BadRequest(new { message = "El refresh token es obligatorio." });
            }

            var refreshTokenHash = HashToken(request.RefreshToken);

            var storedRefreshToken = await dbContext.RefreshTokens
                .FirstOrDefaultAsync(token => token.TokenHash == refreshTokenHash);

            if (storedRefreshToken is null)
            {
                return Results.BadRequest(new { message = "Refresh token inválido." });
            }

            if (storedRefreshToken.RevokedAt is not null)
            {
                return Results.BadRequest(new { message = "Refresh token revocado." });
            }

            if (storedRefreshToken.ExpiresAt <= DateTimeOffset.UtcNow)
            {
                return Results.BadRequest(new { message = "Refresh token expirado." });
            }

            storedRefreshToken.RevokedAt = DateTimeOffset.UtcNow;

            await dbContext.SaveChangesAsync();

            return Results.Ok(new
            {
                message = "Sesión cerrada correctamente."
            });
        })
        .WithName("Logout");

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

    private static async Task<List<string>> GetUserRolesAsync(
        PhoneStoreDbContext dbContext,
        Guid userId)
    {
        return await dbContext.UserRoles
            .Where(userRole => userRole.UserId == userId)
            .Join(
                dbContext.Roles,
                userRole => userRole.RoleId,
                role => role.Id,
                (userRole, role) => role.Name
            )
            .Distinct()
            .OrderBy(roleName => roleName)
            .ToListAsync();
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

    private static RefreshTokenCreateResult CreateRefreshToken(
        Guid userId,
        IConfiguration configuration)
    {
        var refreshTokenDaysText = configuration["Jwt:RefreshTokenDays"];

        var refreshTokenDays = int.TryParse(refreshTokenDaysText, out var days)
            ? days
            : 7;

        var plainToken = Convert.ToBase64String(
            RandomNumberGenerator.GetBytes(64)
        );

        var expiresAt = DateTimeOffset.UtcNow.AddDays(refreshTokenDays);

        var entity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TokenHash = HashToken(plainToken),
            ExpiresAt = expiresAt,
            RevokedAt = null,
            CreatedAt = DateTimeOffset.UtcNow
        };

        return new RefreshTokenCreateResult(
            plainToken,
            expiresAt,
            entity
        );
    }

    private static string HashToken(string token)
    {
        var tokenBytes = Encoding.UTF8.GetBytes(token);
        var hashBytes = SHA256.HashData(tokenBytes);

        return Convert.ToHexString(hashBytes);
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
    DateTimeOffset AccessTokenExpiresAt,
    string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAt
);

public sealed record RefreshTokenRequest(
    string RefreshToken
);

public sealed record RefreshTokenResponse(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAt,
    string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAt
);

public sealed record AccessTokenResult(
    string AccessToken,
    DateTimeOffset ExpiresAt
);

public sealed record RefreshTokenCreateResult(
    string PlainToken,
    DateTimeOffset ExpiresAt,
    RefreshToken Entity
);