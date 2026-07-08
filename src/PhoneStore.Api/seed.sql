DO $$
DECLARE
  v_branch_id uuid;
  v_warehouse_id uuid;
  v_cat_cel_id uuid;
  v_cat_acc_id uuid;
  v_brand_apl_id uuid;
  v_brand_sam_id uuid;
  v_prod_ip14_id uuid;
  v_prod_gs23_id uuid;
  v_prod_pods_id uuid;
BEGIN
  v_branch_id := '11111111-1111-1111-1111-111111111111';
  v_warehouse_id := '22222222-2222-2222-2222-222222222222';
  v_cat_cel_id := '33333333-3333-3333-3333-333333333333';
  v_cat_acc_id := '44444444-4444-4444-4444-444444444444';
  v_brand_apl_id := '55555555-5555-5555-5555-555555555555';
  v_brand_sam_id := '66666666-6666-6666-6666-666666666666';
  v_prod_ip14_id := '77777777-7777-7777-7777-777777777777';
  v_prod_gs23_id := '88888888-8888-8888-8888-888888888888';
  v_prod_pods_id := '99999999-9999-9999-9999-999999999999';

  INSERT INTO branches ("Id", "Code", "Name", "IsActive", "CreatedAt")
  VALUES (v_branch_id, 'SUC-CEN', 'Sucursal Centro', true, now())
  ON CONFLICT ("Id") DO NOTHING;

  INSERT INTO warehouses ("Id", "BranchId", "Code", "Name", "IsActive", "CreatedAt")
  VALUES (v_warehouse_id, v_branch_id, 'ALM-PRIN', 'Almacén Principal', true, now())
  ON CONFLICT ("Id") DO NOTHING;

  INSERT INTO product_categories ("Id", "Code", "Name", "IsActive", "CreatedAt")
  VALUES 
    (v_cat_cel_id, 'CAT-CEL', 'Celulares', true, now()),
    (v_cat_acc_id, 'CAT-ACC', 'Accesorios', true, now())
  ON CONFLICT ("Id") DO NOTHING;

  INSERT INTO brands ("Id", "Code", "Name", "IsActive", "CreatedAt")
  VALUES 
    (v_brand_apl_id, 'BRN-APL', 'Apple', true, now()),
    (v_brand_sam_id, 'BRN-SAM', 'Samsung', true, now())
  ON CONFLICT ("Id") DO NOTHING;

  INSERT INTO products ("Id", "CategoryId", "BrandId", "Sku", "Name", "Description", "CostPrice", "SalePrice", "IsActive", "CreatedAt")
  VALUES 
    (v_prod_ip14_id, v_cat_cel_id, v_brand_apl_id, 'APL-IP14P-128', 'iPhone 14 Pro 128GB', 'Apple smartphone', 600000, 829990, true, now()),
    (v_prod_gs23_id, v_cat_cel_id, v_brand_sam_id, 'SAM-GS23-256', 'Samsung Galaxy S23 256GB', 'Samsung smartphone', 500000, 699990, true, now()),
    (v_prod_pods_id, v_cat_acc_id, v_brand_apl_id, 'APL-APS-PRO2', 'AirPods Pro 2da Gen', 'Apple wireless earbuds', 150000, 299990, true, now())
  ON CONFLICT ("Id") DO NOTHING;

  INSERT INTO inventory_stocks ("Id", "ProductId", "WarehouseId", "Quantity", "ReservedQuantity", "MinStock", "CreatedAt")
  VALUES 
    (gen_random_uuid(), v_prod_ip14_id, v_warehouse_id, 15, 0, 5, now()),
    (gen_random_uuid(), v_prod_gs23_id, v_warehouse_id, 20, 0, 5, now()),
    (gen_random_uuid(), v_prod_pods_id, v_warehouse_id, 45, 0, 10, now())
  ON CONFLICT DO NOTHING;

END $$;
