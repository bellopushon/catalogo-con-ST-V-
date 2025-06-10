/*
  # Sistema de logs para superadministrador

  1. Nueva tabla
    - `system_logs` - Para registrar acciones del superadministrador
      - `id` (uuid, primary key)
      - `admin_id` (uuid, foreign key to users)
      - `action` (text) - Tipo de acción realizada
      - `object_type` (text) - Tipo de objeto afectado (user, store, etc.)
      - `object_id` (text) - ID del objeto afectado
      - `details` (jsonb) - Detalles adicionales de la acción
      - `ip_address` (text) - Dirección IP del administrador
      - `created_at` (timestamp)

  2. Seguridad
    - Enable RLS en `system_logs`
    - Solo el superadministrador puede acceder a los logs
*/

-- Crear tabla de logs del sistema
CREATE TABLE IF NOT EXISTS system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action text NOT NULL,
  object_type text NOT NULL,
  object_id text,
  details jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Política para que solo el superadministrador pueda acceder
CREATE POLICY "Super admin can manage system logs"
  ON system_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email = 'the.genio27@gmail.com'
    )
  );

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_system_logs_admin_id ON system_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);