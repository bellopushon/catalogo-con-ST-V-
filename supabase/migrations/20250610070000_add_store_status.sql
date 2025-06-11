-- Add status column to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived'));

-- Create index for status column
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);

-- Update existing stores to have active status
UPDATE stores SET status = 'active' WHERE status IS NULL;

-- Add comment to status column
COMMENT ON COLUMN stores.status IS 'Current status of the store: active, suspended, or archived'; 