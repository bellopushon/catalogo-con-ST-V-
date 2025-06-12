/*
  # Fix Plan Type Mismatch

  1. Changes
    - Adds explicit type casting in functions and triggers
    - Ensures proper handling of UUID vs text comparisons
    - Fixes the "operator does not exist: uuid = text" error
  
  2. Security
    - No changes to security policies
*/

-- Update the get_plan_limits function to handle type casting properly
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
  WHERE p.id::text = plan_id AND p.is_active = true
  UNION ALL
  SELECT 
    1 as max_stores,
    10 as max_products,
    3 as max_categories
  WHERE NOT EXISTS (
    SELECT 1 FROM plans p WHERE p.id::text = plan_id AND p.is_active = true
  )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the user_plan_details view with explicit type casting
DROP VIEW IF EXISTS user_plan_details;
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
  plans p ON u.plan::text = p.id::text
WHERE
  p.is_active = true OR p.id IS NULL;

-- Fix the handle_plan_downgrade function to use explicit type casting
CREATE OR REPLACE FUNCTION handle_plan_downgrade()
RETURNS TRIGGER AS $$
DECLARE
    old_plan_id text;
    new_plan_id text;
    max_stores integer;
    store_count integer;
    store_record record;
BEGIN
    -- Get the old and new plan IDs
    old_plan_id := OLD.plan::text;
    new_plan_id := NEW.plan::text;
    
    -- Only proceed if this is a downgrade
    IF old_plan_id = new_plan_id THEN
        RETURN NEW;
    END IF;
    
    -- Get the maximum stores allowed for the new plan
    SELECT p.max_stores INTO max_stores
    FROM plans p
    WHERE p.id::text = new_plan_id;
    
    -- Count current stores
    SELECT COUNT(*) INTO store_count
    FROM stores
    WHERE user_id = NEW.id;
    
    -- If we're under the limit, no action needed
    IF store_count <= max_stores THEN
        RETURN NEW;
    END IF;
    
    -- Get all stores ordered by creation date (oldest first)
    FOR store_record IN 
        SELECT id, status
        FROM stores
        WHERE user_id = NEW.id
        ORDER BY created_at ASC
    LOOP
        -- If we're still over the limit, suspend the store
        IF store_count > max_stores THEN
            UPDATE stores
            SET status = 'suspended'
            WHERE id = store_record.id;
            
            store_count := store_count - 1;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix the handle_plan_upgrade function to use explicit type casting
CREATE OR REPLACE FUNCTION handle_plan_upgrade()
RETURNS TRIGGER AS $$
DECLARE
    old_plan_id text;
    new_plan_id text;
    max_stores integer;
    store_count integer;
    store_record record;
BEGIN
    -- Get the old and new plan IDs
    old_plan_id := OLD.plan::text;
    new_plan_id := NEW.plan::text;
    
    -- Only proceed if this is an upgrade
    IF old_plan_id = new_plan_id THEN
        RETURN NEW;
    END IF;
    
    -- Get the maximum stores allowed for the new plan
    SELECT p.max_stores INTO max_stores
    FROM plans p
    WHERE p.id::text = new_plan_id;
    
    -- Count current active stores
    SELECT COUNT(*) INTO store_count
    FROM stores
    WHERE user_id = NEW.id AND status = 'active';
    
    -- If we're under the limit, reactivate suspended stores
    IF store_count < max_stores THEN
        -- Get suspended stores ordered by creation date (oldest first)
        FOR store_record IN 
            SELECT id
            FROM stores
            WHERE user_id = NEW.id AND status = 'suspended'
            ORDER BY created_at ASC
        LOOP
            -- If we're still under the limit, reactivate the store
            IF store_count < max_stores THEN
                UPDATE stores
                SET status = 'active'
                WHERE id = store_record.id;
                
                store_count := store_count + 1;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update a user's plan safely
CREATE OR REPLACE FUNCTION update_user_plan(
  p_user_id UUID,
  p_plan_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the user's plan with explicit type casting
  UPDATE users
  SET 
    plan = p_plan_id::text,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error validating user plan: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_user_plan(UUID, TEXT) TO service_role;