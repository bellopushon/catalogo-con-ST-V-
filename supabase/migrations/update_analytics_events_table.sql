-- Actualizar la tabla analytics_events
ALTER TABLE analytics_events
ADD COLUMN IF NOT EXISTS event_type analytics_event_type,
ADD COLUMN IF NOT EXISTS session_id text,
ADD COLUMN IF NOT EXISTS product_id uuid,
ADD COLUMN IF NOT EXISTS order_value numeric,
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS order_items jsonb,
ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Crear un tipo enum para event_type si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analytics_event_type') THEN
    CREATE TYPE analytics_event_type AS ENUM ('visit', 'order', 'product_view');
  END IF;
END$$;

-- Actualizar la columna event_type para usar el nuevo tipo
ALTER TABLE analytics_events
ALTER COLUMN event_type TYPE analytics_event_type USING event_type::analytics_event_type;

-- Añadir índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_store_id_timestamp ON analytics_events(store_id, timestamp);