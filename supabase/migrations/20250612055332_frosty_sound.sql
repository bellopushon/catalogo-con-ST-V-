/*
  # Configuración de tablas de suscripción y planes

  1. Nuevas Tablas
    - `plans`: Almacena información sobre los planes disponibles
    - `subscriptions`: Almacena las suscripciones de los usuarios
  
  2. Seguridad
    - Habilita RLS en ambas tablas
    - Crea políticas para acceso seguro
  
  3. Datos Iniciales
    - Crea plan gratuito por defecto
    - Crea planes de pago (Emprendedor y Profesional)
*/

-- Primero, crear la tabla plans si no existe
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  interval VARCHAR(20) NOT NULL,
  features JSONB DEFAULT '{}',
  stripe_product_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255) UNIQUE,
  paypal_plan_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  is_free BOOLEAN DEFAULT false,
  level INTEGER DEFAULT 1 CHECK (level >= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Luego, crear la tabla subscriptions si no existe
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  paypal_subscription_id VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies - Corregido para usar pg_catalog.pg_policy correctamente
DO $$
BEGIN
  -- Eliminar políticas existentes si existen para evitar errores
  DROP POLICY IF EXISTS "Plans are viewable by everyone" ON public.plans;
  DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
  
  -- Crear nuevas políticas
  CREATE POLICY "Plans are viewable by everyone" ON public.plans
    FOR SELECT USING (is_active = true);
  
  CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);
END
$$;

-- Create indexes after tables and columns exist
CREATE INDEX IF NOT EXISTS idx_plans_stripe_price_id ON public.plans(stripe_price_id);
CREATE INDEX IF NOT EXISTS idx_plans_is_active ON public.plans(is_active);
CREATE INDEX IF NOT EXISTS idx_plans_is_free ON public.plans(is_free);
CREATE INDEX IF NOT EXISTS idx_plans_level ON public.plans(level);
CREATE INDEX IF NOT EXISTS idx_plans_price ON public.plans(price);
CREATE INDEX IF NOT EXISTS idx_plans_interval ON public.plans(interval);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);

-- Insertar un plan de ejemplo con Stripe solo si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.plans 
    WHERE stripe_product_id = 'prod_JIFBgiPTr0hXoW'
  ) THEN
    INSERT INTO public.plans (
      name, description, price, currency, interval, features, 
      stripe_product_id, stripe_price_id, is_active, is_free, level
    ) VALUES (
      'Emprendedor',
      'Para pequeños negocios en crecimiento',
      5.99,
      'usd',
      'month',
      '["2 tiendas", "30 productos por tienda", "Categorías ilimitadas", "Personalización avanzada", "Soporte prioritario"]',
      'prod_JIFBgiPTr0hXoW',
      'price_1IfegiGi8mNpOIVuk2U8wmwK',
      true,
      false,
      2
    );
  END IF;
END
$$;

-- Crear un plan gratuito si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.plans 
    WHERE is_free = true
  ) THEN
    INSERT INTO public.plans (
      name, description, price, currency, interval, features, 
      is_active, is_free, level
    ) VALUES (
      'Gratuito',
      'Para comenzar tu negocio online',
      0,
      'usd',
      'month',
      '["1 tienda", "10 productos", "3 categorías", "Diseño básico"]',
      true,
      true,
      1
    );
  END IF;
END
$$;

-- Crear un plan profesional si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.plans 
    WHERE name = 'Profesional'
  ) THEN
    INSERT INTO public.plans (
      name, description, price, currency, interval, features, 
      is_active, is_free, level
    ) VALUES (
      'Profesional',
      'Para negocios establecidos con múltiples líneas de productos',
      9.99,
      'usd',
      'month',
      '["5 tiendas", "50 productos por tienda", "Categorías ilimitadas", "Personalización completa", "Analíticas avanzadas", "Soporte prioritario 24/7"]',
      true,
      false,
      3
    );
  END IF;
END
$$;

-- Crear un índice único para asegurar que solo haya un plan gratuito
CREATE UNIQUE INDEX IF NOT EXISTS idx_plans_single_free ON public.plans(is_free) WHERE is_free = true;

-- Crear una función para actualizar el campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para actualizar el campo updated_at
DO $$
BEGIN
  -- Eliminar triggers existentes si existen
  DROP TRIGGER IF EXISTS update_plans_updated_at ON public.plans;
  DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
  
  -- Crear nuevos triggers
  CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
  
  CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
END
$$;