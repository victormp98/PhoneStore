namespace PhoneStore.Api.Services.Sales;

public enum SalesResultStatus
{
    Success,
    BadRequest,
    NotFound,
    Problem
}

public sealed record SalesResult<T>(
    SalesResultStatus Status,
    T? Value,
    string? Message,
    string? ProblemTitle,
    string? ProblemDetail,
    string? CreatedLocation
)
{
    public static SalesResult<T> Success(T value)
    {
        return new SalesResult<T>(SalesResultStatus.Success, value, null, null, null, null);
    }

    public static SalesResult<T> Created(T value, string location)
    {
        return new SalesResult<T>(SalesResultStatus.Success, value, null, null, null, location);
    }

    public static SalesResult<T> BadRequest(string message)
    {
        return new SalesResult<T>(SalesResultStatus.BadRequest, default, message, null, null, null);
    }

    public static SalesResult<T> NotFound(string message)
    {
        return new SalesResult<T>(SalesResultStatus.NotFound, default, message, null, null, null);
    }

    public static SalesResult<T> Problem(string title, string detail)
    {
        return new SalesResult<T>(SalesResultStatus.Problem, default, null, title, detail, null);
    }
}
