using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using PhoneStore.Domain.Auth;

namespace PhoneStore.Api.Services.Auth;

public sealed class TokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public AccessTokenResult CreateAccessToken(
        Guid userId,
        string name,
        string email,
        List<string> roles)
    {
        var issuer = _configuration["Jwt:Issuer"];
        var audience = _configuration["Jwt:Audience"];
        var secretKey = _configuration["Jwt:SecretKey"];
        var accessTokenMinutesText = _configuration["Jwt:AccessTokenMinutes"];

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

    public RefreshTokenCreateResult CreateRefreshToken(Guid userId)
    {
        var refreshTokenDaysText = _configuration["Jwt:RefreshTokenDays"];

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

    public string HashToken(string token)
    {
        var tokenBytes = Encoding.UTF8.GetBytes(token);
        var hashBytes = SHA256.HashData(tokenBytes);

        return Convert.ToHexString(hashBytes);
    }
}
