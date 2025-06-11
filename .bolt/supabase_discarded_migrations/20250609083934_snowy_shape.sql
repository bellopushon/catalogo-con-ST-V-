/*
  # Crear esquema completo de la base de datos

  1. Nuevas Tablas
    - `users` - Información de usuarios y suscripciones
    - `stores` - Configuración de tiendas
    - `categories` - Categorías de productos
    - `products` - Productos de cada tienda
    - `analytics_events` - Eventos de analíticas
    - `user_preferences` - Preferencias de usuario

  2. Tipos Enum
    - `user_plan` - Planes de usuario
    - `subscription_status` - Estados de suscripción
    - `analytics_event_type` - Tipos de eventos de analítica
    - `theme_mode` - Modos de tema

  3. Seguridad
    - Habilitar RLS en todas las tablas
    - Añadir políticas de acceso granulares
*/

-- Crear tipos enum
CREATE TYPE user_plan AS ENUM ('gratuito', 'emprendedor', 'profesional');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'expired');
CREATE TYPE analytics_event_type AS ENUM ('visit', 'order', 'product_view');
CREATE TYPE theme_mode AS ENUM ('light', 'dark', 'system');

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text,
  bio text,
  avatar text,
  company text,
  location text,
  plan user_plan DEFAULT 'gratuito',
  subscription_id text,
  subscription_status subscription_status,
  subscription_start_date timestamptz,
  subscription_end_date timestamptz,
  subscription_canceled_at timestamptz,
  payment_method text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de tiendas
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  logo text,
  whatsapp text,
  currency text DEFAULT 'USD',
  heading_font text DEFAULT 'Inter',
  body_font text DEFAULT 'Inter',
  color_palette text DEFAULT 'predeterminado',
  border_radius integer DEFAULT 8,
  products_per_page integer DEFAULT 12,
  facebook_url text,
  instagram_url text,
  tiktok_url text,
  twitter_url text,
  show_social_in_catalog boolean DEFAULT true,
  accept_cash boolean DEFAULT true,
  accept_bank_transfer boolean DEFAULT false,
  bank_details text,
  allow_pickup boolean DEFAULT true,
  allow_delivery boolean DEFAULT false,
  delivery_cost numeric DEFAULT 0,
  delivery_zone text,
  message_greeting text DEFAULT '¡Hola {storeName}!',
  message_introduction text DEFAULT 'Soy {customerName}.\nMe gustaría hacer el siguiente pedido:',
  message_closing text DEFAULT '¡Muchas gracias!',
  include_phone_in_message boolean DEFAULT true,
  include_comments_in_message boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  short_description text,
  long_description text,
  price numeric NOT NULL,
  main_image text,
  gallery text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de eventos de analítica
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type analytics_event_type NOT NULL,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now(),
  data jsonb
);

-- Tabla de preferencias de usuario
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_store_id uuid REFERENCES stores(id) ON DELETE SET NULL,
  theme_mode theme_mode DEFAULT 'system',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Políticas para stores
CREATE POLICY "Users can read own stores" ON stores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own stores" ON stores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stores" ON stores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own stores" ON stores FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Public can read stores for catalog" ON stores FOR SELECT USING (true);

-- Políticas para categories
CREATE POLICY "Users can read own categories" ON categories FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM stores WHERE id = categories.store_id)
);
CREATE POLICY "Users can create categories for own stores" ON categories FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM stores WHERE id = categories.store_id)
);
CREATE POLICY "Users can update own categories" ON categories FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM stores WHERE id = categories.store_id)
);
CREATE POLICY "Users can delete own categories" ON categories FOR DELETE USING (
  auth.uid() IN (SELECT user_id FROM stores WHERE id = categories.store_id)
);
CREATE POLICY "Public can read categories for catalog" ON categories FOR SELECT USING (true);

-- Políticas para products
CREATE POLICY "Users can read own products" ON products FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM stores WHERE id = products.store_id)
);
CREATE POLICY "Users can create products for own stores" ON products FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM stores WHERE id = products.store_id)
);
CREATE POLICY "Users can update own products" ON products FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM stores WHERE id = products.store_id)
);
CREATE POLICY "Users can delete own products" ON products FOR DELETE USING (
  auth.uid() IN (SELECT user_id FROM stores WHERE id = products.store_id)
);
CREATE POLICY "Public can read active products for catalog" ON products FOR SELECT USING (is_active = true);

-- Políticas para analytics_events
CREATE POLICY "Users can read own analytics" ON analytics_events FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM stores WHERE id = analytics_events.store_id)
);
CREATE POLICY "Anyone can insert analytics events" ON analytics_events FOR INSERT WITH CHECK (true);

-- Políticas para user_preferences
CREATE POLICY "Users can read own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug);
CREATE INDEX IF NOT EXISTS idx_categories_store_id ON categories(store_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_analytics_events_store_id ON analytics_events(store_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Actualizar productos sin categoría
UPDATE products SET category_id = NULL WHERE category_id = 'default';