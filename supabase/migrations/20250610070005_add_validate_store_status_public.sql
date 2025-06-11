-- Function to validate store status for public access
CREATE OR REPLACE FUNCTION validate_store_status_public()
RETURNS TRIGGER AS $$
BEGIN
    -- If store is not active, prevent public access
    IF NEW.status != 'active' THEN
        RAISE EXCEPTION 'Store is not available for public access';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for public access validation
DROP TRIGGER IF EXISTS validate_store_status_public_trigger ON stores;
CREATE TRIGGER validate_store_status_public_trigger
    BEFORE UPDATE OF status ON stores
    FOR EACH ROW
    EXECUTE FUNCTION validate_store_status_public(); 