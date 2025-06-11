-- Function to validate store status
CREATE OR REPLACE FUNCTION validate_store_status()
RETURNS TRIGGER AS $$
DECLARE
    store_status text;
BEGIN
    -- Get the store status
    SELECT status INTO store_status
    FROM stores
    WHERE id = NEW.store_id;
    
    -- If store is suspended or archived, prevent product creation/update
    IF store_status IN ('suspended', 'archived') THEN
        RAISE EXCEPTION 'Cannot create or update products for a % store', store_status;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product validation
DROP TRIGGER IF EXISTS validate_store_status_trigger ON products;
CREATE TRIGGER validate_store_status_trigger
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION validate_store_status(); 