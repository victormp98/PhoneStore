using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Scalar.AspNetCore;
using PhoneStore.Infrastructure.DependencyInjection;
using PhoneStore.Api.Endpoints;
using PhoneStore.Api.Security;
using PhoneStore.Api.Services.Auth;
using PhoneStore.Api.Services.Sales;

var builder = WebApplication.CreateBuilder(args);

// OpenAPI / documentación de la API
builder.Services.AddOpenApi(options =>
{
    const string bearerSchemeName = "Bearer";

    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
        document.Components.SecuritySchemes[bearerSchemeName] = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description = "JWT Authorization header using the Bearer scheme."
        };

        return Task.CompletedTask;
    });

    options.AddOperationTransformer((operation, context, cancellationToken) =>
    {
        var metadata = context.Description.ActionDescriptor.EndpointMetadata;
        var requiresAuthorization = metadata.OfType<IAuthorizeData>().Any();
        var allowsAnonymous = metadata.OfType<IAllowAnonymous>().Any();

        if (requiresAuthorization && !allowsAnonymous)
        {
            operation.Security ??= [];
            operation.Security.Add(new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference(bearerSchemeName, null, null)] = []
            });
        }

        return Task.CompletedTask;
    });
});

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

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(PermissionConstants.UsersRead, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.UsersRead));
    options.AddPolicy(PermissionConstants.UsersCreate, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.UsersCreate));
    options.AddPolicy(PermissionConstants.UsersUpdate, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.UsersUpdate));
    options.AddPolicy(PermissionConstants.UsersDelete, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.UsersDelete));

    options.AddPolicy(PermissionConstants.RolesRead, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.RolesRead));
    options.AddPolicy(PermissionConstants.RolesCreate, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.RolesCreate));
    options.AddPolicy(PermissionConstants.RolesUpdate, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.RolesUpdate));
    options.AddPolicy(PermissionConstants.RolesDelete, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.RolesDelete));

    options.AddPolicy(PermissionConstants.PermissionsRead, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.PermissionsRead));
    options.AddPolicy(PermissionConstants.PermissionsAssign, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.PermissionsAssign));

    options.AddPolicy(PermissionConstants.BranchesRead, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.BranchesRead));
    options.AddPolicy(PermissionConstants.BranchesCreate, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.BranchesCreate));
    options.AddPolicy(PermissionConstants.BranchesUpdate, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.BranchesUpdate));
    options.AddPolicy(PermissionConstants.BranchesDelete, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.BranchesDelete));

    options.AddPolicy(PermissionConstants.WarehousesRead, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.WarehousesRead));
    options.AddPolicy(PermissionConstants.WarehousesCreate, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.WarehousesCreate));
    options.AddPolicy(PermissionConstants.WarehousesUpdate, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.WarehousesUpdate));
    options.AddPolicy(PermissionConstants.WarehousesDelete, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.WarehousesDelete));

    options.AddPolicy(PermissionConstants.CatalogRead, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.CatalogRead));
    options.AddPolicy(PermissionConstants.CatalogCreate, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.CatalogCreate));
    options.AddPolicy(PermissionConstants.CatalogUpdate, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.CatalogUpdate));
    options.AddPolicy(PermissionConstants.CatalogDelete, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.CatalogDelete));

    options.AddPolicy(PermissionConstants.InventoryRead, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.InventoryRead));
    options.AddPolicy(PermissionConstants.InventoryAdjust, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.InventoryAdjust));
    options.AddPolicy(PermissionConstants.InventoryMove, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.InventoryMove));

    options.AddPolicy(PermissionConstants.CustomersRead, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.CustomersRead));
    options.AddPolicy(PermissionConstants.CustomersCreate, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.CustomersCreate));
    options.AddPolicy(PermissionConstants.CustomersUpdate, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.CustomersUpdate));
    options.AddPolicy(PermissionConstants.CustomersDelete, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.CustomersDelete));

    options.AddPolicy(PermissionConstants.SalesRead, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.SalesRead));
    options.AddPolicy(PermissionConstants.SalesCreate, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.SalesCreate));
    options.AddPolicy(PermissionConstants.SalesCancel, AuthorizationPolicyExtensions.RequirePermission(PermissionConstants.SalesCancel));
});

builder.Services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<SalesService>();

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
app.MapPermissionSeedEndpoints();

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
