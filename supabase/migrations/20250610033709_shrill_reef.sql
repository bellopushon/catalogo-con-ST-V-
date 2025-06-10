/*
  # Corrección de visualización de planes y límites

  1. Cambios
    - Mejora la función get_plan_limits para manejar correctamente los tipos UUID y TEXT
    - Crea una vista user_plan_details para facilitar consultas de planes
    - Normaliza los planes de usuarios existentes
    - Mejora las funciones de validación de límites
  
  2. Seguridad
    - Maneja de forma segura las conversiones entre UUID y TEXT
    - Previene errores de tipo en las comparaciones
*/

-- Función para obtener límites de plan de forma segura
CREATE OR REPLACE FUNCTION get_plan_limits(user_plan_id text)
RETURNS TABLE(max_stores int, max_products int, max_categories int) AS $$
DECLARE
  plan_record RECORD;
BEGIN
  -- Intentar encontrar el plan por ID directo primero
  BEGIN
    -- Intentar con conversión segura a UUID si es posible
    SELECT p.max_stores, p.max_products, p.max_categories
    INTO plan_record
    FROM plans p
    WHERE 
      (
        -- Intentar comparar como texto primero
        p.id::text = user_plan_id
        -- O comparar por nombre
        OR LOWER(p.name) = LOWER(user_plan_id)
      )
    LIMIT 1;
  EXCEPTION WHEN others THEN
    -- Si hay error de conversión, intentar solo con nombre
    SELECT p.max_stores, p.max_products, p.max_categories
    INTO plan_record
    FROM plans p
    WHERE LOWER(p.name) = LOWER(user_plan_id)
    LIMIT 1;
  END;
  
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

-- Crear vista para facilitar consultas de planes
CREATE OR REPLACE VIEW user_plan_details AS
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
FROM users u
LEFT JOIN plans p ON (
  -- Intentar comparar como texto
  p.id::text = u.plan
  -- O comparar por nombre
  OR LOWER(p.name) = LOWER(u.plan)
);

-- Normalizar planes de usuarios existentes
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
    BEGIN
      SELECT id::text INTO matching_plan_id
      FROM plans p
      WHERE 
        p.id::text = user_record.plan
        OR LOWER(p.name) = LOWER(user_record.plan)
        OR (LOWER(user_record.plan) LIKE '%empren%' AND LOWER(p.name) LIKE '%empren%')
        OR (LOWER(user_record.plan) LIKE '%profesional%' AND LOWER(p.name) LIKE '%profesional%')
        OR (LOWER(user_record.plan) LIKE '%gratu%' AND p.is_free = true)
      LIMIT 1;
    EXCEPTION WHEN others THEN
      -- Si hay error, intentar solo con nombre
      SELECT id::text INTO matching_plan_id
      FROM plans p
      WHERE 
        LOWER(p.name) = LOWER(user_record.plan)
        OR (LOWER(user_record.plan) LIKE '%empren%' AND LOWER(p.name) LIKE '%empren%')
        OR (LOWER(user_record.plan) LIKE '%profesional%' AND LOWER(p.name) LIKE '%profesional%')
        OR (LOWER(user_record.plan) LIKE '%gratu%' AND p.is_free = true)
      LIMIT 1;
    END;
    
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
COMMENT ON VIEW user_plan_details IS 'Vista que combina información de usuarios y sus planes';