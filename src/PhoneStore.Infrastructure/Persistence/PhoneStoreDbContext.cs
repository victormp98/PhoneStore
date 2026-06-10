using Microsoft.EntityFrameworkCore;
using PhoneStore.Domain.Branches;
using PhoneStore.Domain.Catalog;
using PhoneStore.Domain.Warehouses;
using PhoneStore.Domain.Inventory;
using PhoneStore.Domain.Customers;
namespace PhoneStore.Infrastructure.Persistence;
using PhoneStore.Domain.Sales;
using PhoneStore.Domain.Auth;

public sealed class PhoneStoreDbContext : DbContext
{
    public PhoneStoreDbContext(DbContextOptions<PhoneStoreDbContext> options)
        : base(options)
    {
    }

    public DbSet<Branch> Branches => Set<Branch>();

    public DbSet<Warehouse> Warehouses => Set<Warehouse>();

    public DbSet<ProductCategory> ProductCategories => Set<ProductCategory>();

    public DbSet<Brand> Brands => Set<Brand>();

    public DbSet<Product> Products => Set<Product>();
    public DbSet<InventoryStock> InventoryStocks => Set<InventoryStock>();

    public DbSet<InventoryMovement> InventoryMovements => Set<InventoryMovement>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<CustomerAddress> CustomerAddresses => Set<CustomerAddress>();
    public DbSet<Sale> Sales => Set<Sale>();

    public DbSet<SaleItem> SaleItems => Set<SaleItem>();

    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<User> Users => Set<User>();

    public DbSet<Role> Roles => Set<Role>();

    public DbSet<Permission> Permissions => Set<Permission>();

    public DbSet<UserRole> UserRoles => Set<UserRole>();

    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Branch>(entity =>
        {
            entity.ToTable("branches");

            entity.HasKey(branch => branch.Id);

            entity.Property(branch => branch.Code)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(branch => branch.Name)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(branch => branch.Phone)
                .HasMaxLength(30);

            entity.Property(branch => branch.Address)
                .HasMaxLength(300);

            entity.Property(branch => branch.IsActive)
                .IsRequired();

            entity.Property(branch => branch.CreatedAt)
                .IsRequired();

            entity.Property(branch => branch.UpdatedAt);

            entity.HasIndex(branch => branch.Code)
                .IsUnique();
        });

        modelBuilder.Entity<Warehouse>(entity =>
        {
            entity.ToTable("warehouses");

            entity.HasKey(warehouse => warehouse.Id);

            entity.Property(warehouse => warehouse.BranchId)
                .IsRequired();

            entity.Property(warehouse => warehouse.Code)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(warehouse => warehouse.Name)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(warehouse => warehouse.IsActive)
                .IsRequired();

            entity.Property(warehouse => warehouse.CreatedAt)
                .IsRequired();

            entity.Property(warehouse => warehouse.UpdatedAt);

            entity.HasIndex(warehouse => new { warehouse.BranchId, warehouse.Code })
                .IsUnique();

            entity.HasOne<Branch>()
                .WithMany()
                .HasForeignKey(warehouse => warehouse.BranchId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProductCategory>(entity =>
        {
            entity.ToTable("product_categories");

            entity.HasKey(category => category.Id);

            entity.Property(category => category.Code)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(category => category.Name)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(category => category.Description)
                .HasMaxLength(500);

            entity.Property(category => category.IsActive)
                .IsRequired();

            entity.Property(category => category.CreatedAt)
                .IsRequired();

            entity.Property(category => category.UpdatedAt);

            entity.HasIndex(category => category.Code)
                .IsUnique();
        });

        modelBuilder.Entity<Brand>(entity =>
        {
            entity.ToTable("brands");

            entity.HasKey(brand => brand.Id);

            entity.Property(brand => brand.Code)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(brand => brand.Name)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(brand => brand.Description)
                .HasMaxLength(500);

            entity.Property(brand => brand.IsActive)
                .IsRequired();

            entity.Property(brand => brand.CreatedAt)
                .IsRequired();

            entity.Property(brand => brand.UpdatedAt);

            entity.HasIndex(brand => brand.Code)
                .IsUnique();
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("products");

            entity.HasKey(product => product.Id);

            entity.Property(product => product.CategoryId)
                .IsRequired();

            entity.Property(product => product.BrandId)
                .IsRequired();

            entity.Property(product => product.Sku)
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(product => product.Name)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(product => product.Description)
                .HasMaxLength(1000);

            entity.Property(product => product.CostPrice)
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(product => product.SalePrice)
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(product => product.IsActive)
                .IsRequired();

            entity.Property(product => product.CreatedAt)
                .IsRequired();

            entity.Property(product => product.UpdatedAt);

            entity.HasIndex(product => product.Sku)
                .IsUnique();

            entity.HasOne<ProductCategory>()
                .WithMany()
                .HasForeignKey(product => product.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Brand>()
                .WithMany()
                .HasForeignKey(product => product.BrandId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<InventoryStock>(entity =>
        {
            entity.ToTable("inventory_stocks");

            entity.HasKey(stock => stock.Id);

            entity.Property(stock => stock.ProductId)
                .IsRequired();

            entity.Property(stock => stock.WarehouseId)
                .IsRequired();

            entity.Property(stock => stock.Quantity)
                .IsRequired();

            entity.Property(stock => stock.ReservedQuantity)
                .IsRequired();

            entity.Property(stock => stock.MinStock)
                .IsRequired();

            entity.Property(stock => stock.CreatedAt)
                .IsRequired();

            entity.Property(stock => stock.UpdatedAt);

            entity.HasIndex(stock => new { stock.ProductId, stock.WarehouseId })
                .IsUnique();

            entity.HasOne<Product>()
                .WithMany()
                .HasForeignKey(stock => stock.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Warehouse>()
                .WithMany()
                .HasForeignKey(stock => stock.WarehouseId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<InventoryMovement>(entity =>
        {
            entity.ToTable("inventory_movements");

            entity.HasKey(movement => movement.Id);

            entity.Property(movement => movement.ProductId)
                .IsRequired();

            entity.Property(movement => movement.WarehouseId)
                .IsRequired();

            entity.Property(movement => movement.MovementType)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(movement => movement.Qty)
                .IsRequired();

            entity.Property(movement => movement.PreviousQuantity)
                .IsRequired();

            entity.Property(movement => movement.NewQuantity)
                .IsRequired();

            entity.Property(movement => movement.PreviousReservedQuantity)
                .IsRequired();

            entity.Property(movement => movement.NewReservedQuantity)
                .IsRequired();

            entity.Property(movement => movement.Reason)
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(movement => movement.ReferenceId);

            entity.Property(movement => movement.CreatedAt)
                .IsRequired();

            entity.Property(movement => movement.UpdatedAt);

            entity.HasOne<Product>()
                .WithMany()
                .HasForeignKey(movement => movement.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Warehouse>()
                .WithMany()
                .HasForeignKey(movement => movement.WarehouseId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<Customer>(entity =>
        {
            entity.ToTable("customers");

            entity.HasKey(customer => customer.Id);

            entity.Property(customer => customer.Name)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(customer => customer.Phone)
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(customer => customer.Email)
                .HasMaxLength(150);

            entity.Property(customer => customer.Status)
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(customer => customer.CreatedAt)
                .IsRequired();

            entity.Property(customer => customer.UpdatedAt);

            entity.HasIndex(customer => customer.Phone);

            entity.HasIndex(customer => customer.Email);
        });

        modelBuilder.Entity<CustomerAddress>(entity =>
        {
            entity.ToTable("customer_addresses");

            entity.HasKey(address => address.Id);

            entity.Property(address => address.CustomerId)
                .IsRequired();

            entity.Property(address => address.Label)
                .HasMaxLength(80)
                .IsRequired();

            entity.Property(address => address.Address)
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(address => address.City)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(address => address.GeoLat)
                .HasPrecision(9, 6);

            entity.Property(address => address.GeoLng)
                .HasPrecision(9, 6);

            entity.Property(address => address.IsDefault)
                .IsRequired();

            entity.Property(address => address.IsActive)
                .IsRequired();

            entity.Property(address => address.CreatedAt)
                .IsRequired();

            entity.Property(address => address.UpdatedAt);

            entity.HasIndex(address => address.CustomerId);

            entity.HasOne<Customer>()
                .WithMany()
                .HasForeignKey(address => address.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<Sale>(entity =>
        {
            entity.ToTable("sales");

            entity.HasKey(sale => sale.Id);

            entity.Property(sale => sale.CustomerId);

            entity.Property(sale => sale.BranchId)
                .IsRequired();

            entity.Property(sale => sale.WarehouseId)
                .IsRequired();

            entity.Property(sale => sale.Status)
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(sale => sale.Subtotal)
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(sale => sale.DiscountTotal)
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(sale => sale.TaxTotal)
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(sale => sale.Total)
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(sale => sale.CreatedAt)
                .IsRequired();

            entity.Property(sale => sale.UpdatedAt);

            entity.HasIndex(sale => sale.CustomerId);

            entity.HasIndex(sale => sale.BranchId);

            entity.HasIndex(sale => sale.WarehouseId);

            entity.HasOne<Customer>()
                .WithMany()
                .HasForeignKey(sale => sale.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Branch>()
                .WithMany()
                .HasForeignKey(sale => sale.BranchId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Warehouse>()
                .WithMany()
                .HasForeignKey(sale => sale.WarehouseId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<SaleItem>(entity =>
        {
            entity.ToTable("sale_items");

            entity.HasKey(item => item.Id);

            entity.Property(item => item.SaleId)
                .IsRequired();

            entity.Property(item => item.ProductId)
                .IsRequired();

            entity.Property(item => item.Quantity)
                .IsRequired();

            entity.Property(item => item.UnitPrice)
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(item => item.Subtotal)
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(item => item.CreatedAt)
                .IsRequired();

            entity.Property(item => item.UpdatedAt);

            entity.HasIndex(item => item.SaleId);

            entity.HasIndex(item => item.ProductId);

            entity.HasOne<Sale>()
                .WithMany()
                .HasForeignKey(item => item.SaleId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Product>()
                .WithMany()
                .HasForeignKey(item => item.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.ToTable("payments");

            entity.HasKey(payment => payment.Id);

            entity.Property(payment => payment.SaleId)
                .IsRequired();

            entity.Property(payment => payment.PaymentMethod)
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(payment => payment.Amount)
                .HasPrecision(18, 2)
                .IsRequired();

            entity.Property(payment => payment.Status)
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(payment => payment.Reference)
                .HasMaxLength(150);

            entity.Property(payment => payment.CreatedAt)
                .IsRequired();

            entity.Property(payment => payment.UpdatedAt);

            entity.HasIndex(payment => payment.SaleId);

            entity.HasOne<Sale>()
                .WithMany()
                .HasForeignKey(payment => payment.SaleId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");

            entity.HasKey(user => user.Id);

            entity.Property(user => user.Name)
                .HasColumnName("name")
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(user => user.Email)
                .HasColumnName("email")
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(user => user.Phone)
                .HasColumnName("phone")
                .HasMaxLength(30);

            entity.Property(user => user.PasswordHash)
                .HasColumnName("password_hash")
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(user => user.Status)
                .HasColumnName("status")
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(user => user.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.Property(user => user.UpdatedAt)
                .HasColumnName("updated_at");

            entity.HasIndex(user => user.Email)
                .IsUnique();
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("roles");

            entity.HasKey(role => role.Id);

            entity.Property(role => role.Name)
                .HasColumnName("name")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(role => role.Description)
                .HasColumnName("description")
                .HasMaxLength(250)
                .IsRequired();

            entity.Property(role => role.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.Property(role => role.UpdatedAt)
                .HasColumnName("updated_at");

            entity.HasIndex(role => role.Name)
                .IsUnique();
        });

        modelBuilder.Entity<Permission>(entity =>
        {
            entity.ToTable("permissions");

            entity.HasKey(permission => permission.Id);

            entity.Property(permission => permission.Code)
                .HasColumnName("code")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(permission => permission.Description)
                .HasColumnName("description")
                .HasMaxLength(250)
                .IsRequired();

            entity.Property(permission => permission.Module)
                .HasColumnName("module")
                .HasMaxLength(100)
                .IsRequired();
            entity.Property(permission => permission.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.Property(permission => permission.UpdatedAt)
                .HasColumnName("updated_at");

            entity.HasIndex(permission => permission.Code)
                .IsUnique();
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.ToTable("user_roles");

            entity.HasKey(userRole => new
            {
                userRole.UserId,
                userRole.RoleId
            });

            entity.Property(userRole => userRole.UserId)
                .HasColumnName("user_id")
                .IsRequired();

            entity.Property(userRole => userRole.RoleId)
                .HasColumnName("role_id")
                .IsRequired();

            entity.Property(userRole => userRole.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(userRole => userRole.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Role>()
                .WithMany()
                .HasForeignKey(userRole => userRole.RoleId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.ToTable("role_permissions");

            entity.HasKey(rolePermission => new
            {
                rolePermission.RoleId,
                rolePermission.PermissionId
            });

            entity.Property(rolePermission => rolePermission.RoleId)
                .HasColumnName("role_id")
                .IsRequired();

            entity.Property(rolePermission => rolePermission.PermissionId)
                .HasColumnName("permission_id")
                .IsRequired();

            entity.Property(rolePermission => rolePermission.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.HasOne<Role>()
                .WithMany()
                .HasForeignKey(rolePermission => rolePermission.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Permission>()
                .WithMany()
                .HasForeignKey(rolePermission => rolePermission.PermissionId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.ToTable("refresh_tokens");

            entity.HasKey(refreshToken => refreshToken.Id);

            entity.Property(refreshToken => refreshToken.UserId)
                .HasColumnName("user_id")
                .IsRequired();

            entity.Property(refreshToken => refreshToken.TokenHash)
                .HasColumnName("token_hash")
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(refreshToken => refreshToken.ExpiresAt)
                .HasColumnName("expires_at")
                .IsRequired();

            entity.Property(refreshToken => refreshToken.RevokedAt)
                .HasColumnName("revoked_at");

            entity.Property(refreshToken => refreshToken.CreatedAt)
                .HasColumnName("created_at")
                .IsRequired();

            entity.HasOne<User>()
                .WithMany()
                .HasForeignKey(refreshToken => refreshToken.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(refreshToken => refreshToken.TokenHash)
                .IsUnique();
        });
    }
}
