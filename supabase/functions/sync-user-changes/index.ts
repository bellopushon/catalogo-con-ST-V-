import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SyncRequest {
  action: 'update_user_plan' | 'update_user_status' | 'delete_user';
  userId: string;
  newPlan?: 'gratuito' | 'emprendedor' | 'profesional';
  subscriptionStatus?: 'active' | 'canceled' | 'expired';
  subscriptionEndDate?: string;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar autorización
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Crear cliente Supabase con service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parsear request body
    const syncData: SyncRequest = await req.json()
    
    console.log('🔄 Sync request received:', syncData)

    // Validar datos requeridos
    if (!syncData.action || !syncData.userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: action, userId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Procesar según el tipo de acción
    switch (syncData.action) {
      case 'update_user_plan':
        if (!syncData.newPlan) {
          return new Response(
            JSON.stringify({ error: 'newPlan is required for update_user_plan action' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
        
        updateData.plan = syncData.newPlan
        
        // Si es un plan de pago, activar suscripción
        if (syncData.newPlan !== 'gratuito') {
          updateData.subscription_status = 'active'
          updateData.subscription_start_date = new Date().toISOString()
          
          // Calcular fecha de fin (30 días)
          const endDate = new Date()
          endDate.setDate(endDate.getDate() + 30)
          updateData.subscription_end_date = endDate.toISOString()
        } else {
          // Si es plan gratuito, cancelar suscripción
          updateData.subscription_status = 'canceled'
          updateData.subscription_canceled_at = new Date().toISOString()
        }
        break

      case 'update_user_status':
        if (syncData.subscriptionStatus) {
          updateData.subscription_status = syncData.subscriptionStatus
        }
        if (syncData.subscriptionEndDate) {
          updateData.subscription_end_date = syncData.subscriptionEndDate
        }
        break

      case 'delete_user':
        // Para eliminar usuario, primero eliminar sus tiendas
        const { error: deleteStoresError } = await supabase
          .from('stores')
          .delete()
          .eq('user_id', syncData.userId)

        if (deleteStoresError) {
          console.error('Error deleting user stores:', deleteStoresError)
        }

        // Luego eliminar el usuario
        const { error: deleteUserError } = await supabase
          .from('users')
          .delete()
          .eq('id', syncData.userId)

        if (deleteUserError) {
          throw deleteUserError
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'User deleted successfully',
            timestamp: new Date().toISOString()
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${syncData.action}` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

    // Actualizar usuario en la base de datos
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', syncData.userId)
      .select()
      .single()

    if (error) {
      console.error('Database update error:', error)
      throw error
    }

    console.log('✅ User updated successfully:', data)

    // Respuesta exitosa
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User ${syncData.action} completed successfully`,
        updatedUser: data,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Sync function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})