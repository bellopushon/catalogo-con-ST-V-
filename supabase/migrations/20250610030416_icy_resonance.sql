-- Función para obtener límites de plan de forma segura
CREATE OR REPLACE FUNCTION get_plan_limits(user_plan_id text)
RETURNS TABLE(max_stores int, max_products int, max_categories int) AS $$
DECLARE
  plan_record RECORD;
BEGIN
  -- Intentar encontrar el plan por ID directo primero
  SELECT p.max_stores, p.max_products, p.max_categories
  INTO plan_record
  FROM plans p
  WHERE p.id::text = user_plan_id
     OR p.name = user_plan_id
     OR LOWER(p.name) = LOWER(user_plan_id)
  LIMIT 1;
  
  -- Si no se encuentra, usar plan gratuito por defecto
  IF NOT FOUND THEN
    SELECT p.max_stores, p.max_products, p.max_categories
    INTO plan_record
    FROM plans p
    WHERE p.is_free = true
    LIMIT 1;
    
    -- Si tampoco hay plan gratuito, usar valores hardcodeados
    IF NOT FOUND THEN
      plan_record.max_stores := 1;
      plan_record.max_products := 10;
      plan_record.max_categories := 3;
    END IF;
  END IF;
  
  RETURN QUERY SELECT plan_record.max_stores, plan_record.max_products, plan_record.max_categories;
END;
$$ LANGUAGE plpgsql;

-- Función de validación de límites de tiendas
CREATE OR REPLACE FUNCTION validate_store_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_plan_id TEXT;
  user_store_count INTEGER;
  plan_limits RECORD;
BEGIN
  -- Obtener el plan del usuario
  SELECT plan INTO user_plan_id FROM users WHERE id = NEW.user_id;
  
  -- Obtener el número de tiendas que ya tiene el usuario
  SELECT COUNT(*) INTO user_store_count FROM stores WHERE user_id = NEW.user_id;
  
  -- Obtener los límites del plan
  SELECT * INTO plan_limits FROM get_plan_limits(user_plan_id);
  
  -- Verificar si excede el límite
  IF user_store_count >= plan_limits.max_stores THEN
    RAISE EXCEPTION 'Has alcanzado el límite de % tienda(s) para tu plan. Actualiza tu plan para crear más tiendas.', plan_limits.max_stores;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función de validación de límites de productos
CREATE OR REPLACE FUNCTION validate_product_limit()
RETURNS TRIGGER AS $$
DECLARE
  store_user_id UUID;
  user_plan_id TEXT;
  store_product_count INTEGER;
  plan_limits RECORD;
BEGIN
  -- Obtener el usuario propietario de la tienda
  SELECT user_id INTO store_user_id FROM stores WHERE id = NEW.store_id;
  
  -- Obtener el plan del usuario
  SELECT plan INTO user_plan_id FROM users WHERE id = store_user_id;
  
  -- Obtener el número de productos que ya tiene la tienda
  SELECT COUNT(*) INTO store_product_count FROM products WHERE store_id = NEW.store_id;
  
  -- Obtener los límites del plan
  SELECT * INTO plan_limits FROM get_plan_limits(user_plan_id);
  
  -- Verificar si excede el límite
  IF store_product_count >= plan_limits.max_products THEN
    RAISE EXCEPTION 'Has alcanzado el límite de % producto(s) para tu plan. Actualiza tu plan para añadir más productos.', plan_limits.max_products;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función de validación de límites de categorías
CREATE OR REPLACE FUNCTION validate_category_limit()
RETURNS TRIGGER AS $$
DECLARE
  store_user_id UUID;
  user_plan_id TEXT;
  store_category_count INTEGER;
  plan_limits RECORD;
BEGIN
  -- Obtener el usuario propietario de la tienda
  SELECT user_id INTO store_user_id FROM stores WHERE id = NEW.store_id;
  
  -- Obtener el plan del usuario
  SELECT plan INTO user_plan_id FROM users WHERE id = store_user_id;
  
  -- Obtener el número de categorías que ya tiene la tienda
  SELECT COUNT(*) INTO store_category_count FROM categories WHERE store_id = NEW.store_id;
  
  -- Obtener los límites del plan
  SELECT * INTO plan_limits FROM get_plan_limits(user_plan_id);
  
  -- Verificar si excede el límite (999999 significa ilimitado)
  IF plan_limits.max_categories < 999999 AND store_category_count >= plan_limits.max_categories THEN
    RAISE EXCEPTION 'Has alcanzado el límite de % categoría(s) para tu plan. Actualiza tu plan para añadir más categorías.', plan_limits.max_categories;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para validar límites
DROP TRIGGER IF EXISTS validate_store_limit_trigger ON stores;
CREATE TRIGGER validate_store_limit_trigger
  BEFORE INSERT ON stores
  FOR EACH ROW EXECUTE FUNCTION validate_store_limit();

DROP TRIGGER IF EXISTS validate_product_limit_trigger ON products;
CREATE TRIGGER validate_product_limit_trigger
  BEFORE INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION validate_product_limit();

DROP TRIGGER IF EXISTS validate_category_limit_trigger ON categories;
CREATE TRIGGER validate_category_limit_trigger
  BEFORE INSERT ON categories
  FOR EACH ROW EXECUTE FUNCTION validate_category_limit();

-- Normalizar planes de usuarios existentes de forma simple
DO $$
DECLARE
  user_record RECORD;
  matching_plan_id TEXT;
  default_plan_id TEXT;
BEGIN
  -- Obtener el ID del plan gratuito por defecto
  SELECT id::text INTO default_plan_id 
  FROM plans 
  WHERE is_free = true 
  LIMIT 1;
  
  -- Si no hay plan gratuito, usar 'gratuito'
  IF default_plan_id IS NULL THEN
    default_plan_id := 'gratuito';
  END IF;
  
  -- Procesar cada usuario
  FOR user_record IN 
    SELECT id, plan 
    FROM users 
    WHERE plan IS NOT NULL AND plan != ''
  LOOP
    matching_plan_id := NULL;
    
    -- Buscar plan coincidente
    SELECT id::text INTO matching_plan_id
    FROM plans p
    WHERE p.id::text = user_record.plan
       OR LOWER(p.name) = LOWER(user_record.plan)
       OR (LOWER(user_record.plan) LIKE '%empren%' AND LOWER(p.name) LIKE '%empren%')
       OR (LOWER(user_record.plan) LIKE '%profesional%' AND LOWER(p.name) LIKE '%profesional%')
       OR (LOWER(user_record.plan) LIKE '%gratu%' AND p.is_free = true)
    LIMIT 1;
    
    -- Actualizar usuario con el plan correcto o el plan por defecto
    IF matching_plan_id IS NOT NULL THEN
      UPDATE users 
      SET plan = matching_plan_id 
      WHERE id = user_record.id;
    ELSE
      UPDATE users 
      SET plan = default_plan_id 
      WHERE id = user_record.id;
    END IF;
  END LOOP;
  
  -- Asegurar que todos los usuarios sin plan válido tengan el plan gratuito
  UPDATE users 
  SET plan = default_plan_id
  WHERE plan IS NULL OR plan = '';
END $$;

-- Comentarios para documentar los cambios
COMMENT ON FUNCTION get_plan_limits(text) IS 'Obtiene los límites de un plan por ID o nombre de forma segura';
COMMENT ON FUNCTION validate_store_limit() IS 'Valida que el usuario no exceda el límite de tiendas de su plan';
COMMENT ON FUNCTION validate_product_limit() IS 'Valida que el usuario no exceda el límite de productos de su plan';
COMMENT ON FUNCTION validate_category_limit() IS 'Valida que el usuario no exceda el límite de categorías de su plan';