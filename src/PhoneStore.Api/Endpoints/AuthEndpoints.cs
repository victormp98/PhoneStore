using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using PhoneStore.Api.Services.Auth;

namespace PhoneStore.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth")
            .WithTags("Auth");

        group.MapPost("/login", async (
            LoginRequest request,
            AuthService authService) =>
        {
            var result = await authService.LoginAsync(request);

            return result.Succeeded
                ? Results.Ok(result.Value)
                : Results.BadRequest(new { message = result.ErrorMessage });
        })
        .WithName("Login");

        group.MapPost("/refresh", async (
            RefreshTokenRequest request,
            AuthService authService) =>
        {
            var result = await authService.RefreshAsync(request);

            return result.Succeeded
                ? Results.Ok(result.Value)
                : Results.BadRequest(new { message = result.ErrorMessage });
        })
        .WithName("RefreshToken");

        group.MapPost("/logout", async (
            RefreshTokenRequest request,
            AuthService authService) =>
        {
            var result = await authService.LogoutAsync(request);

            return result.Succeeded
                ? Results.Ok(new { message = result.Value })
                : Results.BadRequest(new { message = result.ErrorMessage });
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
}
