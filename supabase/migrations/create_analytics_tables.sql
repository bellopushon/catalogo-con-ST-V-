/*
  # Crear tablas para analítica

  1. Nuevas Tablas
    - `analytics_events`
      - `id` (uuid, clave primaria)
      - `type` (text, tipo de evento)
      - `store_id` (uuid, ID de la tienda)
      - `timestamp` (timestamptz, momento del evento)
      - `data` (jsonb, datos adicionales del evento)

  2. Seguridad
    - Habilitar RLS en la tabla `analytics_events`
    - Añadir política para que los usuarios autenticados puedan leer sus propios datos
    - Añadir política para que los usuarios autenticados puedan insertar nuevos eventos
*/

-- Crear tabla de eventos de analítica
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  store_id uuid NOT NULL,
  timestamp timestamptz DEFAULT now(),
  data jsonb
);

-- Habilitar Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Política para leer datos propios
CREATE POLICY "Users can read own store analytics" 
ON analytics_events FOR SELECT 
USING (
  auth.uid() IN (
    SELECT owner_id FROM stores WHERE id = analytics_events.store_id
  )
);

-- Política para insertar nuevos eventos
CREATE POLICY "Users can insert analytics for own store" 
ON analytics_events FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT owner_id FROM stores WHERE id = analytics_events.store_id
  )
);

-- Índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_analytics_events_store_id ON analytics_events(store_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);