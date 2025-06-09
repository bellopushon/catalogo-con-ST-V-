/*
  # Sistema de Logs para Superadministrador

  1. Nueva Tabla
    - `system_logs` para registrar acciones del superadministrador
    - Campos: admin_id, action, object_type, object_id, details, ip_address, created_at

  2. Seguridad
    - Habilitar RLS en la tabla system_logs
    - Política para que solo el superadministrador (the.genio27@gmail.com) pueda acceder

  3. Índices
    - Índices para mejorar el rendimiento de consultas
*/

-- Crear tabla de logs del sistema si no existe
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

-- Habilitar RLS si no está habilitado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'system_logs' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Eliminar política existente si existe y recrearla
DROP POLICY IF EXISTS "Super admin can manage system logs" ON system_logs;

-- Crear política para que solo el superadministrador pueda acceder
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

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_system_logs_admin_id ON system_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);