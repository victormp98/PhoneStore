using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using PhoneStore.Infrastructure.DependencyInjection;
using PhoneStore.Api.Endpoints;

var builder = WebApplication.CreateBuilder(args);

// OpenAPI / documentación de la API
builder.Services.AddOpenApi();

// Infraestructura: PostgreSQL, DbContext, repositorios y servicios técnicos
builder.Services.AddInfrastructure(builder.Configuration);

// JWT / Autenticación
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];
var jwtSecretKey = builder.Configuration["Jwt:SecretKey"];

if (string.IsNullOrWhiteSpace(jwtIssuer) ||
    string.IsNullOrWhiteSpace(jwtAudience) ||
    string.IsNullOrWhiteSpace(jwtSecretKey))
{
    throw new InvalidOperationException("La configuración JWT está incompleta.");
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,

            ValidateAudience = true,
            ValidAudience = jwtAudience,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSecretKey)
            ),

            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// Documentación visual solo en desarrollo
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseAuthentication();
app.UseAuthorization();

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
app.MapRoleEndpoints();
app.MapUserEndpoints();
app.MapAuthEndpoints();

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