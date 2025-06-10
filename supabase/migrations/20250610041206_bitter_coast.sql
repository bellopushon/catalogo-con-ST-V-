-- Drop existing function first to avoid parameter name conflict
DROP FUNCTION IF EXISTS get_plan_limits(text);

-- Create a function to get plan limits safely
CREATE OR REPLACE FUNCTION get_plan_limits(plan_id text)
RETURNS TABLE (
  max_stores integer,
  max_products integer,
  max_categories integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p.max_stores, 1) as max_stores,
    COALESCE(p.max_products, 10) as max_products,
    COALESCE(p.max_categories, 3) as max_categories
  FROM plans p
  WHERE p.id = plan_id AND p.is_active = true
  UNION ALL
  SELECT 
    1 as max_stores,
    10 as max_products,
    3 as max_categories
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update validate_store_limit function to use the new function
CREATE OR REPLACE FUNCTION validate_store_limit()
RETURNS TRIGGER AS $$
DECLARE
  store_count INTEGER;
  user_plan TEXT;
  max_stores INTEGER;
BEGIN
  -- Get the user's plan
  SELECT plan INTO user_plan FROM users WHERE id = NEW.user_id;
  
  -- Get the max stores for this plan
  SELECT p.max_stores INTO max_stores FROM get_plan_limits(user_plan) p;
  
  -- Count existing stores
  SELECT COUNT(*) INTO store_count FROM stores WHERE user_id = NEW.user_id;
  
  -- Check if limit is reached
  IF store_count >= max_stores THEN
    RAISE EXCEPTION 'Has alcanzado el límite de % tienda(s) para tu plan. Actualiza tu plan para crear más tiendas.', max_stores;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update validate_product_limit function to use the new function
CREATE OR REPLACE FUNCTION validate_product_limit()
RETURNS TRIGGER AS $$
DECLARE
  product_count INTEGER;
  user_id UUID;
  user_plan TEXT;
  max_products INTEGER;
BEGIN
  -- Get the user ID from the store
  SELECT s.user_id INTO user_id FROM stores s WHERE s.id = NEW.store_id;
  
  -- Get the user's plan
  SELECT plan INTO user_plan FROM users WHERE id = user_id;
  
  -- Get the max products for this plan
  SELECT p.max_products INTO max_products FROM get_plan_limits(user_plan) p;
  
  -- Count existing products
  SELECT COUNT(*) INTO product_count FROM products WHERE store_id = NEW.store_id;
  
  -- Check if limit is reached
  IF product_count >= max_products THEN
    RAISE EXCEPTION 'Has alcanzado el límite de % producto(s) para tu plan. Actualiza tu plan para añadir más productos.', max_products;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update validate_category_limit function to use the new function
CREATE OR REPLACE FUNCTION validate_category_limit()
RETURNS TRIGGER AS $$
DECLARE
  category_count INTEGER;
  user_id UUID;
  user_plan TEXT;
  max_categories INTEGER;
BEGIN
  -- Get the user ID from the store
  SELECT s.user_id INTO user_id FROM stores s WHERE s.id = NEW.store_id;
  
  -- Get the user's plan
  SELECT plan INTO user_plan FROM users WHERE id = user_id;
  
  -- Get the max categories for this plan
  SELECT p.max_categories INTO max_categories FROM get_plan_limits(user_plan) p;
  
  -- Count existing categories
  SELECT COUNT(*) INTO category_count FROM categories WHERE store_id = NEW.store_id;
  
  -- Check if limit is reached
  IF category_count >= max_categories THEN
    RAISE EXCEPTION 'Has alcanzado el límite de % categoría(s) para tu plan. Actualiza tu plan para añadir más categorías.', max_categories;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Normalize plan IDs in user records
DO $$
BEGIN
  -- Update users with UUID plan IDs to use string IDs
  UPDATE users
  SET plan = 'gratuito'
  WHERE plan LIKE '%-%-%-%-%' AND plan NOT IN ('gratuito', 'emprendedor', 'profesional');
  
  -- Ensure all users have a valid plan
  UPDATE users
  SET plan = 'gratuito'
  WHERE plan IS NULL OR plan = '';
END;
$$;

-- Drop existing view if it exists
DROP VIEW IF EXISTS user_plan_details;

-- Create a view to join users with their plan details
CREATE VIEW user_plan_details AS
SELECT
  u.id as user_id,
  u.email,
  u.name,
  u.plan as plan_id,
  p.name as plan_name,
  p.level as plan_level,
  p.max_stores,
  p.max_products,
  p.max_categories,
  p.price as plan_price,
  p.is_free,
  u.subscription_status,
  u.subscription_start_date,
  u.subscription_end_date
FROM
  users u
LEFT JOIN
  plans p ON u.plan = p.id::text
WHERE
  p.is_active = true OR p.id IS NULL;

COMMENT ON VIEW user_plan_details IS 'Vista que combina información de usuarios y sus planes';