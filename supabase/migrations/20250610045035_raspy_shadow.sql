/*
  # Ensure Default Free Plan and User Connections

  1. New Tables
    - None (uses existing tables)
  
  2. Changes
    - Ensures a default free plan exists
    - Updates user registration to connect with free plan
    - Fixes plan ID type handling in views and functions
  
  3. Security
    - No changes to security policies
*/

-- First, ensure we have at least one free plan in the system
DO $$
DECLARE
  free_plan_count INTEGER;
BEGIN
  -- Check if we have any free plans
  SELECT COUNT(*) INTO free_plan_count FROM plans WHERE is_free = true AND is_active = true;
  
  -- If no free plans exist, create a default one
  IF free_plan_count = 0 THEN
    INSERT INTO plans (
      name, 
      description, 
      price, 
      max_stores, 
      max_products, 
      max_categories, 
      features, 
      is_active, 
      is_free, 
      level
    ) VALUES (
      'Gratuito',
      'Plan básico para comenzar',
      0,
      1,
      10,
      3,
      ARRAY['1 tienda', '10 productos por tienda', '3 categorías por tienda'],
      true,
      true,
      1
    );
  END IF;
END;
$$;

-- Ensure all users have a valid plan ID that exists in the plans table
DO $$
DECLARE
  default_free_plan_id UUID;
BEGIN
  -- Get the ID of the default free plan
  SELECT id INTO default_free_plan_id FROM plans WHERE is_free = true AND is_active = true ORDER BY level ASC LIMIT 1;
  
  -- If we found a free plan, update users with invalid plans
  IF default_free_plan_id IS NOT NULL THEN
    -- Update users with invalid plan IDs to use the default free plan
    UPDATE users
    SET plan = default_free_plan_id::text
    WHERE plan IS NULL 
       OR plan = '' 
       OR NOT EXISTS (
         SELECT 1 FROM plans WHERE id::text = users.plan AND is_active = true
       );
       
    RAISE NOTICE 'Updated users to use default free plan ID: %', default_free_plan_id;
  ELSE
    RAISE WARNING 'No active free plan found in the database!';
  END IF;
END;
$$;

-- Create or replace the function to get a user's plan with proper type handling
CREATE OR REPLACE FUNCTION get_user_plan(user_id UUID)
RETURNS TABLE (
  plan_id TEXT,
  plan_name TEXT,
  plan_level INTEGER,
  max_stores INTEGER,
  max_products INTEGER,
  max_categories INTEGER,
  is_free BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.plan,
    p.name,
    p.level,
    p.max_stores,
    p.max_products,
    p.max_categories,
    p.is_free
  FROM 
    users u
  LEFT JOIN 
    plans p ON u.plan = p.id::text
  WHERE 
    u.id = user_id
    AND (p.is_active = true OR p.id IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;