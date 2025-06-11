-- Function to handle plan upgrade
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
    old_plan_id := OLD.plan;
    new_plan_id := NEW.plan;
    
    -- Only proceed if this is an upgrade
    IF old_plan_id = new_plan_id THEN
        RETURN NEW;
    END IF;
    
    -- Get the maximum stores allowed for the new plan
    SELECT max_stores INTO max_stores
    FROM plans
    WHERE id = new_plan_id;
    
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

-- Create trigger for plan upgrade
DROP TRIGGER IF EXISTS handle_plan_upgrade_trigger ON users;
CREATE TRIGGER handle_plan_upgrade_trigger
    AFTER UPDATE OF plan ON users
    FOR EACH ROW
    EXECUTE FUNCTION handle_plan_upgrade(); 