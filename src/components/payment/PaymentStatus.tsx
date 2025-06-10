import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowLeft, Loader } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { supabase } from '../../lib/supabase';

export default function PaymentStatus() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const [status, setStatus] = useState<'success' | 'error' | 'loading'>('loading');
  const [message, setMessage] = useState('Verificando el estado de tu pago...');
  
  const isSuccess = searchParams.has('plan');
  const planId = searchParams.get('plan');

  useEffect(() => {
    const updateUserPlan = async () => {
      try {
        if (isSuccess && planId) {
          // Obtener el plan de la base de datos
          const { data: planData, error: planError } = await supabase
            .from('plans')
            .select('*')
            .eq('id', planId)
            .single();
            
          if (planError || !planData) {
            console.error('Error fetching plan:', planError);
            setStatus('error');
            setMessage('No se pudo encontrar el plan seleccionado.');
            return;
          }
          
          // Obtener usuario actual
          const { data: { user } } = await supabase.auth.getUser();
          
          if (!user) {
            setStatus('error');
            setMessage('No se pudo verificar tu sesión. Por favor inicia sesión nuevamente.');
            return;
          }
          
          // Calcular fecha de fin de suscripción (30 días)
          const subscriptionEndDate = new Date();
          subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);
          
          // Actualizar usuario en la base de datos
          const { error: updateError } = await supabase
            .from('users')
            .update({
              plan: planId,
              subscription_status: 'active',
              subscription_start_date: new Date().toISOString(),
              subscription_end_date: subscriptionEndDate.toISOString(),
              payment_method: 'stripe',
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
            
          if (updateError) {
            console.error('Error updating user plan:', updateError);
            setStatus('error');
            setMessage('Hubo un problema al actualizar tu plan. Por favor contacta a soporte.');
            return;
          }
          
          // Actualizar estado local
          if (state.user) {
            const updatedUser = {
              ...state.user,
              plan: planId,
              subscriptionStatus: 'active',
              subscriptionStartDate: new Date().toISOString(),
              subscriptionEndDate: subscriptionEndDate.toISOString(),
              paymentMethod: 'stripe',
              updatedAt: new Date().toISOString()
            };
            
            dispatch({ type: 'SET_USER', payload: updatedUser });
          }
          
          setStatus('success');
          setMessage(`¡Felicidades! Tu suscripción al plan ${planData.name} ha sido activada correctamente.`);
          
          // Redirigir al dashboard después de 3 segundos
          setTimeout(() => {
            navigate('/admin');
          }, 3000);
        } else {
          setStatus('error');
          setMessage('El pago fue cancelado o no se completó correctamente.');
        }
      } catch (error) {
        console.error('Error in payment verification:', error);
        setStatus('error');
        setMessage('Ocurrió un error al procesar tu pago. Por favor contacta a soporte.');
      }
    };
    
    updateUserPlan();
  }, [isSuccess, planId, dispatch, navigate, state.user]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        {status === 'loading' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Procesando</h2>
            <p className="text-gray-600 mb-6">{message}</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Pago Exitoso!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link 
              to="/admin" 
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Ir al Dashboard
            </Link>
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error en el Pago</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                to="/subscription" 
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Intentar de Nuevo
              </Link>
              <Link 
                to="/admin" 
                className="inline-flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Volver al Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}