using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using PhoneStore.Infrastructure.Persistence;

namespace PhoneStore.Api.Security;

public sealed class PermissionAuthorizationHandler
    : AuthorizationHandler<PermissionRequirement>
{
    private readonly PhoneStoreDbContext _dbContext;

    public PermissionAuthorizationHandler(PhoneStoreDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        var roleNames = context.User
            .FindAll(ClaimTypes.Role)
            .Select(role => role.Value)
            .Distinct()
            .ToList();

        if (roleNames.Count == 0)
        {
            return;
        }

        var hasPermission = await _dbContext.RolePermissions
            .Join(
                _dbContext.Roles,
                rolePermission => rolePermission.RoleId,
                role => role.Id,
                (rolePermission, role) => new
                {
                    RolePermission = rolePermission,
                    Role = role
                }
            )
            .Join(
                _dbContext.Permissions,
                joined => joined.RolePermission.PermissionId,
                permission => permission.Id,
                (joined, permission) => new
                {
                    RoleName = joined.Role.Name,
                    PermissionCode = permission.Code
                }
            )
            .AnyAsync(item =>
                roleNames.Contains(item.RoleName) &&
                item.PermissionCode == requirement.PermissionCode
            );

        if (hasPermission)
        {
            context.Succeed(requirement);
        }
    }
}
