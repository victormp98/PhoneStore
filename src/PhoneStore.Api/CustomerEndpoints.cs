using Microsoft.EntityFrameworkCore;
using PhoneStore.Domain.Customers;
using PhoneStore.Infrastructure.Persistence;

namespace PhoneStore.Api.Endpoints;

public static class CustomerEndpoints
{
    public static IEndpointRouteBuilder MapCustomerEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/customers")
            .WithTags("Customers");

        group.MapGet("/", async (
            string? search,
            PhoneStoreDbContext dbContext) =>
        {
            var query = dbContext.Customers.AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var normalizedSearch = search.Trim();

                query = query.Where(customer =>
                    customer.Name.Contains(normalizedSearch) ||
                    customer.Phone.Contains(normalizedSearch) ||
                    (customer.Email != null && customer.Email.Contains(normalizedSearch)));
            }

            var customers = await query
                .OrderBy(customer => customer.Name)
                .Select(customer => new CustomerResponse(
                    customer.Id,
                    customer.Name,
                    customer.Phone,
                    customer.Email,
                    customer.Status,
                    customer.CreatedAt,
                    customer.UpdatedAt
                ))
                .ToListAsync();

            return Results.Ok(customers);
        })
        .WithName("GetCustomers");

        group.MapGet("/{id:guid}", async (
            Guid id,
            PhoneStoreDbContext dbContext) =>
        {
            var customer = await dbContext.Customers
                .Where(customer => customer.Id == id)
                .Select(customer => new CustomerResponse(
                    customer.Id,
                    customer.Name,
                    customer.Phone,
                    customer.Email,
                    customer.Status,
                    customer.CreatedAt,
                    customer.UpdatedAt
                ))
                .FirstOrDefaultAsync();

            if (customer is null)
            {
                return Results.NotFound(new
                {
                    message = "Cliente no encontrado."
                });
            }

            return Results.Ok(customer);
        })
        .WithName("GetCustomerById");

        group.MapPost("/", async (
            CreateCustomerRequest request,
            PhoneStoreDbContext dbContext) =>
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return Results.BadRequest(new
                {
                    message = "El nombre del cliente es obligatorio."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Phone))
            {
                return Results.BadRequest(new
                {
                    message = "El teléfono del cliente es obligatorio."
                });
            }

            var customer = new Customer
            {
                Id = Guid.NewGuid(),
                Name = request.Name.Trim(),
                Phone = request.Phone.Trim(),
                Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim(),
                Status = "ACTIVE",
                CreatedAt = DateTimeOffset.UtcNow
            };

            dbContext.Customers.Add(customer);
            await dbContext.SaveChangesAsync();

            var response = new CustomerResponse(
                customer.Id,
                customer.Name,
                customer.Phone,
                customer.Email,
                customer.Status,
                customer.CreatedAt,
                customer.UpdatedAt
            );

            return Results.Created($"/api/customers/{customer.Id}", response);
        })
        .WithName("CreateCustomer");

        group.MapPut("/{id:guid}", async (
            Guid id,
            UpdateCustomerRequest request,
            PhoneStoreDbContext dbContext) =>
        {
            var customer = await dbContext.Customers
                .FirstOrDefaultAsync(customer => customer.Id == id);

            if (customer is null)
            {
                return Results.NotFound(new
                {
                    message = "Cliente no encontrado."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return Results.BadRequest(new
                {
                    message = "El nombre del cliente es obligatorio."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Phone))
            {
                return Results.BadRequest(new
                {
                    message = "El teléfono del cliente es obligatorio."
                });
            }

            var allowedStatuses = new[] { "ACTIVE", "INACTIVE", "BLOCKED" };
            var normalizedStatus = request.Status.Trim().ToUpperInvariant();

            if (!allowedStatuses.Contains(normalizedStatus))
            {
                return Results.BadRequest(new
                {
                    message = "Status inválido. Usa ACTIVE, INACTIVE o BLOCKED."
                });
            }

            customer.Name = request.Name.Trim();
            customer.Phone = request.Phone.Trim();
            customer.Email = string.IsNullOrWhiteSpace(request.Email) ? null : request.Email.Trim();
            customer.Status = normalizedStatus;
            customer.UpdatedAt = DateTimeOffset.UtcNow;

            await dbContext.SaveChangesAsync();

            var response = new CustomerResponse(
                customer.Id,
                customer.Name,
                customer.Phone,
                customer.Email,
                customer.Status,
                customer.CreatedAt,
                customer.UpdatedAt
            );

            return Results.Ok(response);
        })
        .WithName("UpdateCustomer");

        group.MapDelete("/{id:guid}", async (
            Guid id,
            PhoneStoreDbContext dbContext) =>
        {
            var customer = await dbContext.Customers
                .FirstOrDefaultAsync(customer => customer.Id == id);

            if (customer is null)
            {
                return Results.NotFound(new
                {
                    message = "Cliente no encontrado."
                });
            }

            customer.Status = "INACTIVE";
            customer.UpdatedAt = DateTimeOffset.UtcNow;

            await dbContext.SaveChangesAsync();

            return Results.Ok(new
            {
                message = "Cliente desactivado correctamente.",
                customer.Id,
                customer.Name,
                customer.Phone,
                customer.Status,
                customer.UpdatedAt
            });
        })
        .WithName("DeactivateCustomer");

        return app;
    }
}

public sealed record CreateCustomerRequest(
    string Name,
    string Phone,
    string? Email
);

public sealed record UpdateCustomerRequest(
    string Name,
    string Phone,
    string? Email,
    string Status
);

public sealed record CustomerResponse(
    Guid Id,
    string Name,
    string Phone,
    string? Email,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt
);