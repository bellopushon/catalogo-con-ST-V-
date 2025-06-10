/*
  # Sistema de Planes Dinámico

  1. Nueva Tabla
    - `plans` - Tabla de planes con características configurables
      - `id` (text, primary key) - ID del plan (ej: 'gratuito', 'emprendedor')
      - `name` (text) - Nombre mostrado del plan
      - `description` (text) - Descripción del plan
      - `price` (numeric) - Precio mensual
      - `max_stores` (integer) - Máximo número de tiendas
      - `max_products` (integer) - Máximo productos por tienda
      - `max_categories` (integer) - Máximo categorías por tienda
      - `features` (jsonb) - Características adicionales
      - `is_active` (boolean) - Si el plan está disponible
      - `is_free` (boolean) - Si es el plan gratuito
      - `level` (integer) - Nivel del plan para jerarquía

  2. Seguridad
    - RLS habilitado
    - Políticas para lectura pública y gestión por super admin
    
  3. Datos Iniciales
    - Planes predeterminados: Gratis, Emprendedor, Profesional
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

-- Índice único para asegurar solo un plan gratuito
CREATE UNIQUE INDEX IF NOT EXISTS idx_plans_single_free 
  ON plans(is_free) 
  WHERE is_free = true;

-- Trigger para updated_at
CREATE TRIGGER update_plans_updated_at 
  BEFORE UPDATE ON plans 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

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
  level = EXCLUDED.level,
  updated_at = now();