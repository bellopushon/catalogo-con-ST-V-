-- Agrega la columna stripe_customer_id a la tabla users si no existe
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Crea un índice para búsquedas rápidas por stripe_customer_id
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id); 