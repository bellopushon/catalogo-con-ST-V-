import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SyncRequest {
  action: 'update_user_plan' | 'update_user_status' | 'delete_user' | 'create_plan' | 'update_plan' | 'delete_plan';
  userId?: string;
  newPlan?: 'gratuito' | 'emprendedor' | 'profesional';
  subscriptionStatus?: 'active' | 'canceled' | 'expired';
  subscriptionEndDate?: string;
  planData?: {
    id?: string;
    name: string;
    price: number;
    features: string[];
    limits: {
      stores: number;
      products: number;
      categories: number;
    };
  };
  adminId?: string;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Sync function called:', req.method, req.url)

    // Verificar autorización
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid authorization header')
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Crear cliente Supabase con service role para bypasear RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Parsear request body
    const syncData: SyncRequest = await req.json()
    
    console.log('🔄 Sync request received:', {
      action: syncData.action,
      userId: syncData.userId,
      adminId: syncData.adminId,
      timestamp: syncData.timestamp
    })

    // Validar datos requeridos
    if (!syncData.action || !syncData.timestamp) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: action, timestamp' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let result: any = {}
    let logDetails: any = {}

    // Procesar según el tipo de acción
    switch (syncData.action) {
      case 'update_user_plan':
        if (!syncData.userId || !syncData.newPlan) {
          return new Response(
            JSON.stringify({ error: 'userId and newPlan are required for update_user_plan action' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Verificar que el usuario existe
        const { data: existingUser, error: userCheckError } = await supabase
          .from('users')
          .select('id, email, plan')
          .eq('id', syncData.userId)
          .single()

        if (userCheckError || !existingUser) {
          console.error('❌ User not found:', userCheckError)
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        let updateData: any = {
          plan: syncData.newPlan,
          updated_at: new Date().toISOString()
        }
        
        // Si es un plan de pago, activar suscripción
        if (syncData.newPlan !== 'gratuito') {
          updateData.subscription_status = 'active'
          updateData.subscription_start_date = new Date().toISOString()
          
          // Calcular fecha de fin (30 días)
          const endDate = new Date()
          endDate.setDate(endDate.getDate() + 30)
          updateData.subscription_end_date = endDate.toISOString()
          updateData.subscription_canceled_at = null
        } else {
          // Si es plan gratuito, cancelar suscripción
          updateData.subscription_status = 'canceled'
          updateData.subscription_canceled_at = new Date().toISOString()
        }

        // Actualizar usuario
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', syncData.userId)
          .select()
          .single()

        if (updateError) {
          console.error('❌ Error updating user:', updateError)
          throw updateError
        }

        result = { updatedUser }
        logDetails = {
          oldPlan: existingUser.plan,
          newPlan: syncData.newPlan,
          userEmail: existingUser.email
        }

        console.log('✅ User plan updated successfully:', {
          userId: syncData.userId,
          oldPlan: existingUser.plan,
          newPlan: syncData.newPlan
        })
        break

      case 'update_user_status':
        if (!syncData.userId) {
          return new Response(
            JSON.stringify({ error: 'userId is required for update_user_status action' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        let statusUpdateData: any = {
          updated_at: new Date().toISOString()
        }

        if (syncData.subscriptionStatus) {
          statusUpdateData.subscription_status = syncData.subscriptionStatus
        }
        if (syncData.subscriptionEndDate) {
          statusUpdateData.subscription_end_date = syncData.subscriptionEndDate
        }

        const { data: updatedStatusUser, error: statusUpdateError } = await supabase
          .from('users')
          .update(statusUpdateData)
          .eq('id', syncData.userId)
          .select()
          .single()

        if (statusUpdateError) {
          console.error('❌ Error updating user status:', statusUpdateError)
          throw statusUpdateError
        }

        result = { updatedUser: updatedStatusUser }
        logDetails = {
          subscriptionStatus: syncData.subscriptionStatus,
          subscriptionEndDate: syncData.subscriptionEndDate
        }

        console.log('✅ User status updated successfully')
        break

      case 'delete_user':
        if (!syncData.userId) {
          return new Response(
            JSON.stringify({ error: 'userId is required for delete_user action' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Obtener información del usuario antes de eliminarlo
        const { data: userToDelete } = await supabase
          .from('users')
          .select('email, plan')
          .eq('id', syncData.userId)
          .single()

        // Eliminar tiendas del usuario primero (cascada)
        const { error: deleteStoresError } = await supabase
          .from('stores')
          .delete()
          .eq('user_id', syncData.userId)

        if (deleteStoresError) {
          console.error('❌ Error deleting user stores:', deleteStoresError)
        }

        // Eliminar el usuario
        const { error: deleteUserError } = await supabase
          .from('users')
          .delete()
          .eq('id', syncData.userId)

        if (deleteUserError) {
          console.error('❌ Error deleting user:', deleteUserError)
          throw deleteUserError
        }

        result = { deletedUserId: syncData.userId }
        logDetails = {
          deletedUserEmail: userToDelete?.email,
          deletedUserPlan: userToDelete?.plan
        }

        console.log('✅ User deleted successfully')
        break

      case 'create_plan':
        if (!syncData.planData) {
          return new Response(
            JSON.stringify({ error: 'planData is required for create_plan action' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Para crear planes, podrías necesitar una tabla de planes personalizada
        // Por ahora, solo registramos en logs
        result = { message: 'Plan creation logged (no plans table implemented)' }
        logDetails = syncData.planData

        console.log('ℹ️ Plan creation logged (feature not fully implemented)')
        break

      case 'update_plan':
        if (!syncData.planData || !syncData.planData.id) {
          return new Response(
            JSON.stringify({ error: 'planData with id is required for update_plan action' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        result = { message: 'Plan update logged (no plans table implemented)' }
        logDetails = syncData.planData

        console.log('ℹ️ Plan update logged (feature not fully implemented)')
        break

      case 'delete_plan':
        if (!syncData.planData || !syncData.planData.id) {
          return new Response(
            JSON.stringify({ error: 'planData with id is required for delete_plan action' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        result = { message: 'Plan deletion logged (no plans table implemented)' }
        logDetails = { deletedPlanId: syncData.planData.id }

        console.log('ℹ️ Plan deletion logged (feature not fully implemented)')
        break

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${syncData.action}` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

    // Registrar en system_logs si se proporciona adminId
    if (syncData.adminId) {
      try {
        const { error: logError } = await supabase
          .from('system_logs')
          .insert({
            admin_id: syncData.adminId,
            action: syncData.action,
            object_type: syncData.action.includes('user') ? 'user' : 'plan',
            object_id: syncData.userId || syncData.planData?.id,
            details: {
              ...logDetails,
              timestamp: syncData.timestamp,
              source: 'super_admin_sync'
            },
            ip_address: req.headers.get('x-forwarded-for') || 'unknown'
          })

        if (logError) {
          console.error('⚠️ Error logging to system_logs:', logError)
          // No fallar la operación principal por un error de log
        } else {
          console.log('📝 Action logged to system_logs')
        }
      } catch (logError) {
        console.error('⚠️ Exception logging to system_logs:', logError)
      }
    }

    // Respuesta exitosa
    const response = {
      success: true,
      action: syncData.action,
      message: `${syncData.action} completed successfully`,
      result,
      timestamp: new Date().toISOString()
    }

    console.log('✅ Sync operation completed successfully:', response)

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Sync function error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false,
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