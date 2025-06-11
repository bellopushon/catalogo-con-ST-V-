-- Function to validate store status for categories
CREATE OR REPLACE FUNCTION validate_store_status_categories()
RETURNS TRIGGER AS $$
DECLARE
    store_status text;
BEGIN
    -- Get the store status
    SELECT status INTO store_status
    FROM stores
    WHERE id = NEW.store_id;
    
    -- If store is suspended or archived, prevent category creation/update
    IF store_status IN ('suspended', 'archived') THEN
        RAISE EXCEPTION 'Cannot create or update categories for a % store', store_status;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for category validation
DROP TRIGGER IF EXISTS validate_store_status_categories_trigger ON categories;
CREATE TRIGGER validate_store_status_categories_trigger
    BEFORE INSERT OR UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION validate_store_status_categories(); 