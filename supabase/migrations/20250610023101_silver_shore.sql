/*
  # Mejoras en sistema de planes y sincronización

  1. Actualización de estructura
    - Asegura que la tabla plans tenga la estructura correcta
    - Añade campos para mejor gestión de planes
  
  2. Función para validar límites de planes
    - Mejora las funciones de validación para usar planes dinámicos
  
  3. Trigger para sincronización
    - Añade trigger para notificar cambios en planes
*/

-- Asegurar que la tabla plans tiene la estructura correcta
DO $$ 
BEGIN
  -- Añadir columna uuid si no existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'plans' AND column_name = 'uuid') THEN
    ALTER TABLE plans ADD COLUMN uuid uuid DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Mejorar función de validación de límites de tiendas
CREATE OR REPLACE FUNCTION validate_store_limit()
RETURNS TRIGGER AS $$
DECLARE
  user_plan_id TEXT;
  user_store_count INTEGER;
  max_stores INTEGER;
BEGIN
  -- Obtener el plan del usuario
  SELECT plan INTO user_plan_id FROM users WHERE id = NEW.user_id;
  
  -- Obtener el número de tiendas que ya tiene el usuario
  SELECT COUNT(*) INTO user_store_count FROM stores WHERE user_id = NEW.user_id;
  
  -- Obtener el límite máximo de tiendas para el plan del usuario
  SELECT max_stores INTO max_stores FROM plans WHERE id = user_plan_id;
  
  -- Si no se encuentra el plan, usar valor por defecto
  IF max_stores IS NULL THEN
    max_stores := 1; -- Plan gratuito por defecto
  END IF;
  
  -- Verificar si excede el límite
  IF user_store_count >= max_stores THEN
    RAISE EXCEPTION 'Has alcanzado el límite de % tienda(s) para tu plan. Actualiza tu plan para crear más tiendas.', max_stores;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Mejorar función de validación de límites de productos
CREATE OR REPLACE FUNCTION validate_product_limit()
RETURNS TRIGGER AS $$
DECLARE
  store_user_id UUID;
  user_plan_id TEXT;
  store_product_count INTEGER;
  max_products INTEGER;
BEGIN
  -- Obtener el usuario propietario de la tienda
  SELECT user_id INTO store_user_id FROM stores WHERE id = NEW.store_id;
  
  -- Obtener el plan del usuario
  SELECT plan INTO user_plan_id FROM users WHERE id = store_user_id;
  
  -- Obtener el número de productos que ya tiene la tienda
  SELECT COUNT(*) INTO store_product_count FROM products WHERE store_id = NEW.store_id;
  
  -- Obtener el límite máximo de productos para el plan del usuario
  SELECT max_products INTO max_products FROM plans WHERE id = user_plan_id;
  
  -- Si no se encuentra el plan, usar valor por defecto
  IF max_products IS NULL THEN
    max_products := 10; -- Plan gratuito por defecto
  END IF;
  
  -- Verificar si excede el límite
  IF store_product_count >= max_products THEN
    RAISE EXCEPTION 'Has alcanzado el límite de % producto(s) para tu plan. Actualiza tu plan para añadir más productos.', max_products;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Mejorar función de validación de límites de categorías
CREATE OR REPLACE FUNCTION validate_category_limit()
RETURNS TRIGGER AS $$
DECLARE
  store_user_id UUID;
  user_plan_id TEXT;
  store_category_count INTEGER;
  max_categories INTEGER;
BEGIN
  -- Obtener el usuario propietario de la tienda
  SELECT user_id INTO store_user_id FROM stores WHERE id = NEW.store_id;
  
  -- Obtener el plan del usuario
  SELECT plan INTO user_plan_id FROM users WHERE id = store_user_id;
  
  -- Obtener el número de categorías que ya tiene la tienda
  SELECT COUNT(*) INTO store_category_count FROM categories WHERE store_id = NEW.store_id;
  
  -- Obtener el límite máximo de categorías para el plan del usuario
  SELECT max_categories INTO max_categories FROM plans WHERE id = user_plan_id;
  
  -- Si no se encuentra el plan, usar valor por defecto
  IF max_categories IS NULL THEN
    max_categories := 3; -- Plan gratuito por defecto
  END IF;
  
  -- Verificar si excede el límite
  IF store_category_count >= max_categories THEN
    RAISE EXCEPTION 'Has alcanzado el límite de % categoría(s) para tu plan. Actualiza tu plan para añadir más categorías.', max_categories;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear función para notificar cambios en planes
CREATE OR REPLACE FUNCTION notify_plan_changes()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
BEGIN
  payload := jsonb_build_object(
    'event', TG_OP,
    'schema', TG_TABLE_SCHEMA,
    'table', TG_TABLE_NAME,
    'id', NEW.id,
    'record', row_to_json(NEW)
  );
  
  -- Notificar cambios a través de canal de Supabase
  PERFORM pg_notify('plan_changes', payload::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para notificar cambios en planes
DROP TRIGGER IF EXISTS notify_plan_changes_trigger ON plans;
CREATE TRIGGER notify_plan_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON plans
FOR EACH ROW EXECUTE FUNCTION notify_plan_changes();

-- Crear función para notificar cambios en usuarios
CREATE OR REPLACE FUNCTION notify_user_plan_changes()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
BEGIN
  -- Solo notificar si el plan cambió
  IF OLD.plan IS DISTINCT FROM NEW.plan OR 
     OLD.subscription_status IS DISTINCT FROM NEW.subscription_status THEN
    
    payload := jsonb_build_object(
      'event', 'UPDATE',
      'schema', TG_TABLE_SCHEMA,
      'table', TG_TABLE_NAME,
      'id', NEW.id,
      'changes', jsonb_build_object(
        'old_plan', OLD.plan,
        'new_plan', NEW.plan,
        'old_status', OLD.subscription_status,
        'new_status', NEW.subscription_status
      )
    );
    
    -- Notificar cambios a través de canal de Supabase
    PERFORM pg_notify('user_plan_changes', payload::text);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para notificar cambios en planes de usuarios
DROP TRIGGER IF EXISTS notify_user_plan_changes_trigger ON users;
CREATE TRIGGER notify_user_plan_changes_trigger
AFTER UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION notify_user_plan_changes();

-- Asegurar que todos los planes tienen IDs consistentes
UPDATE plans SET id = LOWER(REPLACE(name, ' ', '_')) WHERE id IS NULL OR id = '';

-- Asegurar que todos los usuarios tienen planes válidos
UPDATE users u
SET plan = p.id
FROM plans p
WHERE u.plan IS NULL OR NOT EXISTS (SELECT 1 FROM plans WHERE id = u.plan)
AND p.is_free = true;