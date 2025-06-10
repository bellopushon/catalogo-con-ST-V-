/*
  # Sistema de Planes Dinámico

  1. Nuevas Tablas
    - `plans`
      - `id` (text, primary key)
      - `name` (text, nombre del plan)
      - `description` (text, descripción)
      - `price` (numeric, precio mensual)
      - `max_stores` (integer, máximo de tiendas)
      - `max_products` (integer, máximo de productos por tienda)
      - `max_categories` (integer, máximo de categorías por tienda)
      - `features` (jsonb, características del plan)
      - `is_active` (boolean, si el plan está activo)
      - `is_free` (boolean, si es el plan gratuito)
      - `level` (integer, nivel del plan para jerarquía)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Seguridad
    - Enable RLS en `plans`
    - Política para que usuarios autenticados y anónimos puedan leer planes activos
    - Política para que solo el super admin pueda gestionar planes

  3. Índices
    - Índices para optimizar consultas por estado, tipo y nivel
    - Índice único para garantizar solo un plan gratuito

  4. Datos Iniciales
    - Insertar planes predeterminados (Gratis, Emprendedor, Profesional)
*/

-- Crear tabla de planes
CREATE TABLE IF NOT EXISTS plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  price numeric(10,2) DEFAULT 0 NOT NULL,
  max_stores integer DEFAULT 1 NOT NULL CHECK (max_stores >= 1),
  max_products integer DEFAULT 10 NOT NULL CHECK (max_products >= 1),
  max_categories integer DEFAULT 3 NOT NULL CHECK (max_categories >= 1),
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  is_free boolean DEFAULT false,
  level integer DEFAULT 1 NOT NULL CHECK (level >= 1),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Public can read active plans" ON plans;
DROP POLICY IF EXISTS "Super admin can manage plans" ON plans;

-- Políticas para plans
CREATE POLICY "Public can read active plans"
  ON plans
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Super admin can manage plans"
  ON plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email = 'the.genio27@gmail.com'
    )
  );

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON plans(is_active);
CREATE INDEX IF NOT EXISTS idx_plans_is_free ON plans(is_free);
CREATE INDEX IF NOT EXISTS idx_plans_level ON plans(level);
CREATE INDEX IF NOT EXISTS idx_plans_price ON plans(price);

-- Eliminar índice único existente si existe
DROP INDEX IF EXISTS idx_plans_single_free;

-- Índice único para asegurar solo un plan gratuito
CREATE UNIQUE INDEX idx_plans_single_free 
  ON plans(is_free) 
  WHERE is_free = true;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_plans_updated_at ON plans;
CREATE TRIGGER update_plans_updated_at 
  BEFORE UPDATE ON plans 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Primero, eliminar cualquier plan gratuito existente para evitar conflictos
DELETE FROM plans WHERE is_free = true;

-- Insertar planes predeterminados
INSERT INTO plans (id, name, description, price, max_stores, max_products, max_categories, features, is_active, is_free, level) VALUES
  (
    'gratuito',
    'Gratis',
    'Ideal para empezar y probar la plataforma',
    0.00,
    1,
    10,
    3,
    '["Analíticas básicas", "Soporte por email", "Catálogo público"]'::jsonb,
    true,
    true,
    1
  ),
  (
    'emprendedor',
    'Emprendedor',
    'Perfecto para negocios en crecimiento',
    4.99,
    2,
    30,
    999999,
    '["Analíticas avanzadas", "Soporte prioritario", "Filtros de estadísticas", "Instagram en catálogo", "Colores personalizados", "Sin marca de agua"]'::jsonb,
    true,
    false,
    2
  ),
  (
    'profesional',
    'Profesional',
    'Todas las herramientas para escalar tu negocio',
    9.99,
    5,
    50,
    999999,
    '["Analíticas completas", "Soporte prioritario", "Filtros de estadísticas", "Instagram en catálogo", "Colores personalizados", "Sin marca de agua", "API acceso"]'::jsonb,
    true,
    false,
    3
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  max_stores = EXCLUDED.max_stores,
  max_products = EXCLUDED.max_products,
  max_categories = EXCLUDED.max_categories,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  is_free = EXCLUDED.is_free,
  level = EXCLUDED.level,
  updated_at = now();