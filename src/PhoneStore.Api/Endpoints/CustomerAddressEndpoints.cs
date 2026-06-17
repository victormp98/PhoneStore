using Microsoft.EntityFrameworkCore;
using PhoneStore.Api.Security;
using PhoneStore.Domain.Customers;
using PhoneStore.Infrastructure.Persistence;

namespace PhoneStore.Api.Endpoints;

public static class CustomerAddressEndpoints
{
    public static IEndpointRouteBuilder MapCustomerAddressEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/customers/{customerId:guid}/addresses", async (
            Guid customerId,
            PhoneStoreDbContext dbContext) =>
        {
            var customerExists = await dbContext.Customers
                .AnyAsync(customer => customer.Id == customerId);

            if (!customerExists)
            {
                return Results.NotFound(new
                {
                    message = "Cliente no encontrado."
                });
            }

            var addresses = await dbContext.CustomerAddresses
                .Where(address => address.CustomerId == customerId)
                .OrderByDescending(address => address.IsDefault)
                .ThenBy(address => address.Label)
                .Select(address => new CustomerAddressResponse(
                    address.Id,
                    address.CustomerId,
                    address.Label,
                    address.Address,
                    address.City,
                    address.GeoLat,
                    address.GeoLng,
                    address.IsDefault,
                    address.IsActive,
                    address.CreatedAt,
                    address.UpdatedAt
                ))
                .ToListAsync();

            return Results.Ok(addresses);
        })
        .WithTags("Customer Addresses")
        .WithName("GetCustomerAddresses")
        .RequireAuthorization(PermissionConstants.CustomersRead);

        app.MapPost("/api/customers/{customerId:guid}/addresses", async (
            Guid customerId,
            CreateCustomerAddressRequest request,
            PhoneStoreDbContext dbContext) =>
        {
            var customerExists = await dbContext.Customers
                .AnyAsync(customer => customer.Id == customerId && customer.Status != "INACTIVE");

            if (!customerExists)
            {
                return Results.BadRequest(new
                {
                    message = "El cliente no existe o está inactivo."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Label))
            {
                return Results.BadRequest(new
                {
                    message = "La etiqueta de la dirección es obligatoria."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Address))
            {
                return Results.BadRequest(new
                {
                    message = "La dirección es obligatoria."
                });
            }

            if (string.IsNullOrWhiteSpace(request.City))
            {
                return Results.BadRequest(new
                {
                    message = "La ciudad es obligatoria."
                });
            }

            if (request.IsDefault)
            {
                var currentDefaultAddresses = await dbContext.CustomerAddresses
                    .Where(address =>
                        address.CustomerId == customerId &&
                        address.IsDefault &&
                        address.IsActive)
                    .ToListAsync();

                foreach (var currentDefaultAddress in currentDefaultAddresses)
                {
                    currentDefaultAddress.IsDefault = false;
                    currentDefaultAddress.UpdatedAt = DateTimeOffset.UtcNow;
                }
            }

            var address = new CustomerAddress
            {
                Id = Guid.NewGuid(),
                CustomerId = customerId,
                Label = request.Label.Trim(),
                Address = request.Address.Trim(),
                City = request.City.Trim(),
                GeoLat = request.GeoLat,
                GeoLng = request.GeoLng,
                IsDefault = request.IsDefault,
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow
            };

            dbContext.CustomerAddresses.Add(address);
            await dbContext.SaveChangesAsync();

            var response = new CustomerAddressResponse(
                address.Id,
                address.CustomerId,
                address.Label,
                address.Address,
                address.City,
                address.GeoLat,
                address.GeoLng,
                address.IsDefault,
                address.IsActive,
                address.CreatedAt,
                address.UpdatedAt
            );

            return Results.Created($"/api/customer-addresses/{address.Id}", response);
        })
        .WithTags("Customer Addresses")
        .WithName("CreateCustomerAddress")
        .RequireAuthorization(PermissionConstants.CustomersCreate);

        app.MapPut("/api/customer-addresses/{id:guid}", async (
            Guid id,
            UpdateCustomerAddressRequest request,
            PhoneStoreDbContext dbContext) =>
        {
            var address = await dbContext.CustomerAddresses
                .FirstOrDefaultAsync(address => address.Id == id);

            if (address is null)
            {
                return Results.NotFound(new
                {
                    message = "Dirección no encontrada."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Label))
            {
                return Results.BadRequest(new
                {
                    message = "La etiqueta de la dirección es obligatoria."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Address))
            {
                return Results.BadRequest(new
                {
                    message = "La dirección es obligatoria."
                });
            }

            if (string.IsNullOrWhiteSpace(request.City))
            {
                return Results.BadRequest(new
                {
                    message = "La ciudad es obligatoria."
                });
            }

            if (request.IsDefault && address.IsActive)
            {
                var currentDefaultAddresses = await dbContext.CustomerAddresses
                    .Where(existingAddress =>
                        existingAddress.CustomerId == address.CustomerId &&
                        existingAddress.Id != id &&
                        existingAddress.IsDefault &&
                        existingAddress.IsActive)
                    .ToListAsync();

                foreach (var currentDefaultAddress in currentDefaultAddresses)
                {
                    currentDefaultAddress.IsDefault = false;
                    currentDefaultAddress.UpdatedAt = DateTimeOffset.UtcNow;
                }
            }

            address.Label = request.Label.Trim();
            address.Address = request.Address.Trim();
            address.City = request.City.Trim();
            address.GeoLat = request.GeoLat;
            address.GeoLng = request.GeoLng;
            address.IsDefault = request.IsDefault;
            address.IsActive = request.IsActive;
            address.UpdatedAt = DateTimeOffset.UtcNow;

            if (!address.IsActive)
            {
                address.IsDefault = false;
            }

            await dbContext.SaveChangesAsync();

            var response = new CustomerAddressResponse(
                address.Id,
                address.CustomerId,
                address.Label,
                address.Address,
                address.City,
                address.GeoLat,
                address.GeoLng,
                address.IsDefault,
                address.IsActive,
                address.CreatedAt,
                address.UpdatedAt
            );

            return Results.Ok(response);
        })
        .WithTags("Customer Addresses")
        .WithName("UpdateCustomerAddress")
        .RequireAuthorization(PermissionConstants.CustomersUpdate);

        app.MapDelete("/api/customer-addresses/{id:guid}", async (
            Guid id,
            PhoneStoreDbContext dbContext) =>
        {
            var address = await dbContext.CustomerAddresses
                .FirstOrDefaultAsync(address => address.Id == id);

            if (address is null)
            {
                return Results.NotFound(new
                {
                    message = "Dirección no encontrada."
                });
            }

            address.IsActive = false;
            address.IsDefault = false;
            address.UpdatedAt = DateTimeOffset.UtcNow;

            await dbContext.SaveChangesAsync();

            return Results.Ok(new
            {
                message = "Dirección desactivada correctamente.",
                address.Id,
                address.CustomerId,
                address.Label,
                address.IsActive,
                address.IsDefault,
                address.UpdatedAt
            });
        })
        .WithTags("Customer Addresses")
        .WithName("DeactivateCustomerAddress")
        .RequireAuthorization(PermissionConstants.CustomersDelete);

        return app;
    }
}

public sealed record CreateCustomerAddressRequest(
    string Label,
    string Address,
    string City,
    decimal? GeoLat,
    decimal? GeoLng,
    bool IsDefault
);

public sealed record UpdateCustomerAddressRequest(
    string Label,
    string Address,
    string City,
    decimal? GeoLat,
    decimal? GeoLng,
    bool IsDefault,
    bool IsActive
);

public sealed record CustomerAddressResponse(
    Guid Id,
    Guid CustomerId,
    string Label,
    string Address,
    string City,
    decimal? GeoLat,
    decimal? GeoLng,
    bool IsDefault,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt
);