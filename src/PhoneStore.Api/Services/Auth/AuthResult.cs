namespace PhoneStore.Api.Services.Auth;

public sealed record AuthResult<T>(
    bool Succeeded,
    T? Value,
    string? ErrorMessage
)
{
    public static AuthResult<T> Success(T value)
    {
        return new AuthResult<T>(true, value, null);
    }

    public static AuthResult<T> Failure(string errorMessage)
    {
        return new AuthResult<T>(false, default, errorMessage);
    }
}
