using Scalar.AspNetCore;
using PhoneStore.Infrastructure.DependencyInjection;
using PhoneStore.Api.Endpoints;


var builder = WebApplication.CreateBuilder(args);

// OpenAPI / documentación de la API
builder.Services.AddOpenApi();

// Infraestructura: PostgreSQL, DbContext, repositorios y servicios técnicos
builder.Services.AddInfrastructure(builder.Configuration);

var app = builder.Build();

// Documentación visual solo en desarrollo
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// Endpoint básico para verificar que la API está viva
app.MapDatabaseHealthEndpoints();
app.MapBranchEndpoints();
app.MapWarehouseEndpoints();
app.MapProductCategoryEndpoints();
app.MapBrandEndpoints();
app.MapProductEndpoints();
app.MapInventoryStockEndpoints();
app.MapInventoryMovementEndpoints();
app.MapCustomerEndpoints();
app.MapCustomerAddressEndpoints();
app.MapSaleEndpoints();

app.MapGet("/api/health", () =>
{
    return Results.Ok(new
    {
        status = "Healthy",
        service = "PhoneStore.Api",
        environment = app.Environment.EnvironmentName,
        timestamp = DateTimeOffset.UtcNow
    });
})
.WithName("GetHealth")
.WithTags("Health");

app.Run();








