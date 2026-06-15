using Microsoft.AspNetCore.Authorization;

namespace PhoneStore.Api.Security;

public static class AuthorizationPolicyExtensions
{
    public static AuthorizationPolicy RequirePermission(string permissionCode)
    {
        return new AuthorizationPolicyBuilder()
            .RequireAuthenticatedUser()
            .AddRequirements(new PermissionRequirement(permissionCode))
            .Build();
    }
}
