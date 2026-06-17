using PhoneStore.Domain.Auth;

namespace PhoneStore.Api.Services.Auth;

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
