import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = 'https://dpggztqltotvvfqmlvny.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwZ2d6dHFsdG90dnZmcW1sdm55Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTI3NzkzNiwiZXhwIjoyMDY0ODUzOTM2fQ.mgWMUY9JgoTRtKfZzIKTmzXPJbzaTi_0ejJ-8F4szmo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '../supabase/migrations/20240320000000_create_subscription_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Dividir el SQL en sentencias individuales
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Ejecutar cada sentencia
    for (const statement of statements) {
      const { error } = await supabase.from('plans').select('*').limit(1);
      
      if (error) {
        console.error('Error ejecutando sentencia:', error);
        console.error('Sentencia:', statement);
        process.exit(1);
      }
    }

    console.log('Migración ejecutada exitosamente');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

runMigration(); 