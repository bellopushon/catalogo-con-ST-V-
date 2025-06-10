/*
  # Fix User Plan Assignment

  1. Changes
     - Adds a function to ensure users always have a valid plan
     - Updates existing users with invalid plans to use the free plan
     - Adds a trigger to ensure new users always have a valid plan
     - Fixes plan ID handling to use string IDs consistently

  2. Security
     - Functions run with SECURITY DEFINER to ensure proper access
*/

-- Create a function to get the default free plan ID
CREATE OR REPLACE FUNCTION get_default_plan_id()
RETURNS text AS $$
DECLARE
  free_plan_id text;
BEGIN
  -- First try to get a plan that is explicitly marked as free
  SELECT id::text INTO free_plan_id
  FROM plans
  WHERE is_free = true AND is_active = true
  ORDER BY level ASC
  LIMIT 1;
  
  -- If no free plan found, get the lowest level plan
  IF free_plan_id IS NULL THEN
    SELECT id::text INTO free_plan_id
    FROM plans
    WHERE is_active = true
    ORDER BY level ASC
    LIMIT 1;
  END IF;
  
  -- If still no plan found, use 'gratuito' as fallback
  RETURN COALESCE(free_plan_id, 'gratuito');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to ensure a user has a valid plan
CREATE OR REPLACE FUNCTION ensure_valid_user_plan()
RETURNS TRIGGER AS $$
DECLARE
  valid_plan boolean;
  default_plan_id text;
BEGIN
  -- Check if the plan exists and is active
  SELECT EXISTS(
    SELECT 1 FROM plans WHERE id::text = NEW.plan::text AND is_active = true
  ) INTO valid_plan;
  
  -- If plan is not valid, assign the default free plan
  IF NOT valid_plan OR NEW.plan IS NULL OR NEW.plan = '' THEN
    default_plan_id := get_default_plan_id();
    NEW.plan := default_plan_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to ensure users always have a valid plan
DROP TRIGGER IF EXISTS ensure_valid_user_plan_trigger ON users;
CREATE TRIGGER ensure_valid_user_plan_trigger
BEFORE INSERT OR UPDATE OF plan ON users
FOR EACH ROW
EXECUTE FUNCTION ensure_valid_user_plan();

-- Update existing users with invalid plans
DO $$
DECLARE
  default_plan_id text;
BEGIN
  default_plan_id := get_default_plan_id();
  
  -- Update users with invalid plans
  UPDATE users
  SET plan = default_plan_id
  WHERE NOT EXISTS (
    SELECT 1 FROM plans WHERE id::text = users.plan::text AND is_active = true
  ) OR plan IS NULL OR plan = '';
  
  RAISE NOTICE 'Updated users to default plan: %', default_plan_id;
END;
$$;

-- Ensure the free plan exists
DO $$
DECLARE
  free_plan_exists boolean;
  default_plan_id text;
BEGIN
  -- Check if a free plan exists
  SELECT EXISTS(
    SELECT 1 FROM plans WHERE is_free = true AND is_active = true
  ) INTO free_plan_exists;
  
  -- If no free plan exists, create one
  IF NOT free_plan_exists THEN
    -- First check if there's a plan named 'Gratuito'
    SELECT EXISTS(
      SELECT 1 FROM plans WHERE name = 'Gratuito'
    ) INTO free_plan_exists;
    
    IF NOT free_plan_exists THEN
      INSERT INTO plans (
        id, name, description, price, max_stores, max_products, max_categories,
        features, is_active, is_free, level
      ) VALUES (
        'gratuito', 'Gratuito', 'Plan básico gratuito', 0, 1, 10, 3,
        '["1 tienda", "10 productos", "3 categorías"]', true, true, 1
      );
      RAISE NOTICE 'Created default free plan';
    ELSE
      -- Update the existing Gratuito plan to be free
      UPDATE plans
      SET is_free = true, is_active = true
      WHERE name = 'Gratuito';
      RAISE NOTICE 'Updated existing Gratuito plan to be free';
    END IF;
  END IF;
  
  -- Get the default plan ID for logging
  default_plan_id := get_default_plan_id();
  RAISE NOTICE 'Default plan ID: %', default_plan_id;
END;
$$;