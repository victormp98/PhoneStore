namespace PhoneStore.Domain.Auth;

public sealed class UserRole
{
    public Guid UserId { get; set; }

    public Guid RoleId { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}