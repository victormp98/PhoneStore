using Microsoft.EntityFrameworkCore;
using PhoneStore.Infrastructure.Persistence;

namespace PhoneStore.Api.Services.Auth;

public sealed class AuthService
{
    private readonly PhoneStoreDbContext _dbContext;
    private readonly TokenService _tokenService;

    public AuthService(
        PhoneStoreDbContext dbContext,
        TokenService tokenService)
    {
        _dbContext = dbContext;
        _tokenService = tokenService;
    }

    public async Task<AuthResult<LoginResponse>> LoginAsync(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return AuthResult<LoginResponse>.Failure("El email es obligatorio.");
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return AuthResult<LoginResponse>.Failure("La contraseña es obligatoria.");
        }

        var email = request.Email.Trim().ToLowerInvariant();

        var user = await _dbContext.Users
            .FirstOrDefaultAsync(user => user.Email == email);

        if (user is null)
        {
            return AuthResult<LoginResponse>.Failure("Credenciales inválidas.");
        }

        if (user.Status != "ACTIVE")
        {
            return AuthResult<LoginResponse>.Failure("El usuario no está activo.");
        }

        var passwordIsValid = BCrypt.Net.BCrypt.Verify(
            request.Password,
            user.PasswordHash
        );

        if (!passwordIsValid)
        {
            return AuthResult<LoginResponse>.Failure("Credenciales inválidas.");
        }

        var roles = await GetUserRolesAsync(user.Id);

        var accessToken = _tokenService.CreateAccessToken(
            user.Id,
            user.Name,
            user.Email,
            roles
        );

        var refreshToken = _tokenService.CreateRefreshToken(user.Id);

        _dbContext.RefreshTokens.Add(refreshToken.Entity);

        await _dbContext.SaveChangesAsync();

        return AuthResult<LoginResponse>.Success(new LoginResponse(
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
    }

    public async Task<AuthResult<RefreshTokenResponse>> RefreshAsync(RefreshTokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return AuthResult<RefreshTokenResponse>.Failure("El refresh token es obligatorio.");
        }

        var refreshTokenHash = _tokenService.HashToken(request.RefreshToken);

        var storedRefreshToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(token => token.TokenHash == refreshTokenHash);

        if (storedRefreshToken is null)
        {
            return AuthResult<RefreshTokenResponse>.Failure("Refresh token inválido.");
        }

        if (storedRefreshToken.RevokedAt is not null)
        {
            return AuthResult<RefreshTokenResponse>.Failure("Refresh token revocado.");
        }

        if (storedRefreshToken.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            return AuthResult<RefreshTokenResponse>.Failure("Refresh token expirado.");
        }

        var user = await _dbContext.Users
            .FirstOrDefaultAsync(user => user.Id == storedRefreshToken.UserId);

        if (user is null)
        {
            return AuthResult<RefreshTokenResponse>.Failure("Usuario no encontrado.");
        }

        if (user.Status != "ACTIVE")
        {
            return AuthResult<RefreshTokenResponse>.Failure("El usuario no está activo.");
        }

        var roles = await GetUserRolesAsync(user.Id);

        var accessToken = _tokenService.CreateAccessToken(
            user.Id,
            user.Name,
            user.Email,
            roles
        );

        storedRefreshToken.RevokedAt = DateTimeOffset.UtcNow;

        var newRefreshToken = _tokenService.CreateRefreshToken(user.Id);

        _dbContext.RefreshTokens.Add(newRefreshToken.Entity);

        await _dbContext.SaveChangesAsync();

        return AuthResult<RefreshTokenResponse>.Success(new RefreshTokenResponse(
            accessToken.AccessToken,
            accessToken.ExpiresAt,
            newRefreshToken.PlainToken,
            newRefreshToken.ExpiresAt
        ));
    }

    public async Task<AuthResult<string>> LogoutAsync(RefreshTokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
        {
            return AuthResult<string>.Failure("El refresh token es obligatorio.");
        }

        var refreshTokenHash = _tokenService.HashToken(request.RefreshToken);

        var storedRefreshToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(token => token.TokenHash == refreshTokenHash);

        if (storedRefreshToken is null)
        {
            return AuthResult<string>.Failure("Refresh token inválido.");
        }

        if (storedRefreshToken.RevokedAt is not null)
        {
            return AuthResult<string>.Failure("Refresh token revocado.");
        }

        if (storedRefreshToken.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            return AuthResult<string>.Failure("Refresh token expirado.");
        }

        storedRefreshToken.RevokedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync();

        return AuthResult<string>.Success("Sesión cerrada correctamente.");
    }

    private async Task<List<string>> GetUserRolesAsync(Guid userId)
    {
        return await _dbContext.UserRoles
            .Where(userRole => userRole.UserId == userId)
            .Join(
                _dbContext.Roles,
                userRole => userRole.RoleId,
                role => role.Id,
                (userRole, role) => role.Name
            )
            .Distinct()
            .OrderBy(roleName => roleName)
            .ToListAsync();
    }
}
