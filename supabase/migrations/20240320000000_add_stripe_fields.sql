-- Agregar campos de Stripe a la tabla de usuarios
ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'expired',
ADD COLUMN IF NOT EXISTS subscription_start_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS subscription_canceled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS stripe_customer_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS paypal_subscriber_id text DEFAULT NULL;

-- Crear índices para mejorar el rendimiento de las búsquedas
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_paypal_subscriber_id ON users(paypal_subscriber_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Agregar restricciones
ALTER TABLE users
ADD CONSTRAINT valid_subscription_status 
CHECK (subscription_status IN ('active', 'canceled', 'expired')),
ADD CONSTRAINT valid_payment_provider 
CHECK (payment_provider IN ('stripe', 'paypal', NULL)); 